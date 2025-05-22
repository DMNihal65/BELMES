import React from 'react';
import { Card, Tag, Tooltip, Progress, Divider, Spin, Empty, Row, Col, Badge } from 'antd';
import { Package, Info, Clock, AlertOctagon, Layers, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
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
        return 'border-sky-200';
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
      <Card 
        className="status-card h-full shadow-sm"
        bodyStyle={{ padding: '12px' }}
        title={
          <div className="flex items-center gap-2">
            <Package className="text-sky-500" size={18} />
            <span className="font-semibold">Current Job</span>
          </div>
        }
      >
        <div className="h-full flex items-center justify-center py-8">
          <Spin tip="Loading job details..." size="large" />
        </div>
      </Card>
    );
  }

  if (!selectedJob && !jobDetails) {
    return (
      <Card 
        className="status-card h-full shadow-sm"
        bodyStyle={{ padding: '12px' }}
        title={
          <div className="flex items-center gap-2">
            <Package className="text-sky-500" size={18} />
            <span className="font-semibold">Current Job</span>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Empty 
            description={null}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <p className="text-gray-500 mt-4 mb-2">No job selected</p>
          <p className="text-xs text-gray-400">Click "Select Job" button to choose a job</p>
        </div>
      </Card>
    );
  }

  // Use jobDetails as primary source if available, otherwise use selectedJob
  const job = jobDetails || selectedJob;
  const operation = selectedOperation;

  return (
    <Card 
      className={`status-card h-full shadow-sm ${getCardBorderClass()}`}
      bodyStyle={{ padding: '12px' }}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="text-sky-500" size={18} />
            <span className="font-semibold">Current Job</span>
          </div>
          {getJobSourceTag()}
        </div>
      }
    >
      <div className="space-y-3">
        {/* Part Number & Order */}
        <Row gutter={8}>
          <Col span={14}>
            <div className="bg-sky-50 p-3 rounded-lg h-full border border-sky-100">
              <div className="text-xs text-sky-800 mb-1 font-medium">Part Number</div>
              <div className="font-bold text-base text-sky-900">{job.part_number}</div>
              <div className="mt-1 text-xs text-gray-500 truncate">
                {job.part_description || job.material_description || 'No description'}
              </div>
            </div>
          </Col>
          <Col span={10}>
            <div className="bg-sky-50 p-3 rounded-lg h-full border border-sky-100">
              <div className="text-xs text-sky-800 mb-1 font-medium">Order</div>
              <div className="font-bold text-base text-sky-900">{job.production_order}</div>
              <div className="mt-1 text-xs">
                <Badge status="processing" text={job.project?.priority ? `Priority ${job.project.priority}` : 'Standard'} />
              </div>
            </div>
          </Col>
        </Row>

        

        {/* Current Operation with References */}
        <div className="bg-sky-50 p-3 rounded-lg border border-sky-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-sky-800 font-medium">Current Operation</div>
            {operation ? (
              <Tag color="processing" className="text-xs">OP{operation.operation_number}</Tag>
            ) : (
              <Tag color="warning" className="text-xs">Not Selected</Tag>
            )}
          </div>
          
          {operation ? (
            <>
              <div className="font-bold text-base text-sky-900">
                {operation.operation_description || operation.description}
              </div>

              {operation.work_center && (
                <div className="mt-1 text-xs text-gray-500">
                  <Badge status="default" text={`${operation.work_center}`} />
                </div>
              )}
              
              {operation.schedule_info && (
                <div className="mt-2 text-xs grid grid-cols-2 gap-1">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock size={10} />
                    <span>
                      Start: {new Date(operation.schedule_info.planned_start_time).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock size={10} />
                    <span>
                      End: {new Date(operation.schedule_info.planned_end_time).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
              
              {/* References integrated into Operation section */}
              <Divider className="my-2" />
              <div className="text-xs grid grid-cols-2 gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Sales Order:</span>
                  <span className="font-medium text-sky-900">{job.sale_order || job.sales_order || 'N/A'}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Project:</span>
                  <span className="font-medium text-sky-900">{job.project?.name || 'N/A'}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Plant ID:</span>
                  <span className="font-medium text-sky-900">{job.plant_id || 'N/A'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-center text-gray-500">
                <div className="mb-2">No operation selected</div>
                <p className="text-xs text-gray-400">Select an operation from the Operations tab</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CurrentJobCard; 