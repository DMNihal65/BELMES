import React from 'react';
import { Card, Tag, Tooltip, Progress, Divider, Spin, Empty } from 'antd';
import { Package, Info, Clock, AlertOctagon } from 'lucide-react';
import useOperatorStore from '../../../store/operator-store';

const CurrentJobCard = () => {
  const {
    selectedJob,
    selectedOperation,
    jobDetails,
    isLoadingJobs,
    jobSource
  } = useOperatorStore();

  // Determine card border color based on job source
  const getCardBorderClass = () => {
    switch (jobSource) {
      case 'inprogress':
        return 'border-green-200';
      case 'scheduled':
        return 'border-blue-200';
      case 'custom':
        return 'border-purple-200';
      default:
        return 'border-gray-200';
    }
  };

  // Get job source tag
  const getJobSourceTag = () => {
    switch (jobSource) {
      case 'inprogress':
        return <Tag color="success">In Progress</Tag>;
      case 'scheduled':
        return <Tag color="processing">Scheduled</Tag>;
      case 'custom':
        return <Tag color="purple">Custom Selected</Tag>;
      default:
        return <Tag>Not Selected</Tag>;
    }
  };

  if (isLoadingJobs) {
    return (
      <Card className="status-card h-full">
        <div className="h-full flex items-center justify-center">
          <Spin tip="Loading job details..." />
        </div>
      </Card>
    );
  }

  if (!selectedJob && !jobDetails) {
    return (
      <Card 
        className="status-card h-full"
        title={
          <div className="flex items-center gap-2">
            <Package className="text-blue-500" size={18} />
            <span className="font-semibold">Current Job</span>
          </div>
        }
      >
        <Empty 
          description="No job selected" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  // Use jobDetails as primary source if available, otherwise use selectedJob
  const job = jobDetails || selectedJob;
  const operation = selectedOperation;

  return (
    <Card 
      className={`status-card h-full ${getCardBorderClass()}`}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="text-blue-500" size={18} />
            <span className="font-semibold">Current Job</span>
          </div>
          {getJobSourceTag()}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Part Information */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Part Number</div>
              <div className="font-medium">{job.part_number}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Production Order</div>
              <div className="font-medium">{job.production_order}</div>
            </div>
          </div>
        </div>

        {/* Part Description */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Part Description</div>
          <Tooltip title={job.part_description || job.material_description}>
            <div className="font-medium truncate">
              {job.part_description || job.material_description || 'N/A'}
            </div>
          </Tooltip>
        </div>

        {/* Quantity Information */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-gray-500">Quantity</div>
            <div className="flex items-center gap-1 text-xs">
              <Clock size={12} />
              <span>Total Operations: {job.total_operations || 'N/A'}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <div className="text-xs text-gray-500">Required</div>
              <div className="text-base font-semibold text-blue-600">
                {job.required_quantity || job.required_qty || 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Launched</div>
              <div className="text-base font-semibold text-green-600">
                {job.launched_quantity || job.launched_qty || 0}
              </div>
            </div>
          </div>

          <Progress 
            percent={Math.round(((job.launched_quantity || job.launched_qty || 0) / 
              (job.required_quantity || job.required_qty || 1)) * 100)}
            size="small"
            status="active"
            strokeColor={{
              '0%': '#60a5fa',
              '100%': '#2563eb',
            }}
          />
        </div>

        {/* Current Operation */}
        {operation && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-500">Current Operation</div>
              <Tag color="processing">OP{operation.operation_number}</Tag>
            </div>
            
            <div className="font-medium">
              {operation.operation_description || operation.description}
            </div>

            {operation.work_center && (
              <div className="mt-2 text-xs text-gray-500">
                Work Center: <span className="font-medium">{operation.work_center}</span>
              </div>
            )}
            
            {operation.schedule_info && (
              <div className="mt-2 text-xs">
                <div className="text-gray-500 mb-1">Schedule</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-gray-400">Start</div>
                    <div>{new Date(operation.schedule_info.planned_start_time).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">End</div>
                    <div>{new Date(operation.schedule_info.planned_end_time).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Information */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-500">Order Information</div>
            {job.project?.priority && (
              <Tag color={job.project.priority <= 2 ? 'error' : 'blue'}>
                Priority {job.project.priority}
              </Tag>
            )}
          </div>
          
          <div className="text-xs grid grid-cols-1 gap-2">
            <div>
              <div className="text-gray-500">Sales Order</div>
              <div className="font-medium">{job.sale_order || job.sales_order || 'N/A'}</div>
            </div>
            
            <Divider className="my-1" />
            
            <div>
              <div className="text-gray-500">WBS Element</div>
              <Tooltip title={job.wbs_element}>
                <div className="font-medium truncate">{job.wbs_element || 'N/A'}</div>
              </Tooltip>
            </div>
            
            {job.project && (
              <>
                <Divider className="my-1" />
                <div>
                  <div className="text-gray-500">Project</div>
                  <div className="font-medium">{job.project.name}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Plant Information */}
        {job.plant_id && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Info size={12} />
            <span>Plant ID: {job.plant_id}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CurrentJobCard; 