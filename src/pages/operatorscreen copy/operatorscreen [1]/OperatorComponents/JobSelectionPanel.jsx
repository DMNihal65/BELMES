import React, { useState, useEffect } from 'react';
import { 
  Drawer, Tabs, List, Card, Button, Empty, Spin, Tag, 
  Radio, Select, Space, Alert, Modal, Tooltip 
} from 'antd';
import { 
  CheckCircle2,  Clock, Calendar, 
  Bookmark, AlertTriangle, PackageCheck, Info, 
  LayoutGrid, ListFilter
} from 'lucide-react';
import useOperatorStore from '../../../store/operator-store';
import { ClockCircleFilled } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;

const JobSelectionPanel = ({ visible, onClose }) => {
  const {
    inProgressJobs,
    scheduledJobs,
    availableJobs,
    selectedJob,
    selectedOperation,
    selectJob,
    selectOperation,
    activateJob,
    deactivateJob,
    isLoadingJobs,
    fetchJobDetails,
    isActivatingJob,
    isDeactivatingJob,
    jobActionType,
    machineId
  } = useOperatorStore();

  const [activeTab, setActiveTab] = useState('inprogress');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterPriority, setFilterPriority] = useState(null);

  // Initialize the component
  useEffect(() => {
    // Set inprogress tab as active if there are in-progress jobs
    if (inProgressJobs && inProgressJobs.length > 0) {
      setActiveTab('inprogress');
    } else if (scheduledJobs && scheduledJobs.length > 0) {
      setActiveTab('scheduled');
    }
    
    // Initialize filtered jobs list
    setFilteredJobs(availableJobs);
  }, [inProgressJobs, scheduledJobs, availableJobs]);

  // Filter jobs when filter criteria change
  useEffect(() => {
    if (!availableJobs) return;
    
    let filtered = [...availableJobs];
    
    // Apply keyword filter
    if (filterKeyword) {
      const keyword = filterKeyword.toLowerCase();
      filtered = filtered.filter(job => 
        job.part_number?.toLowerCase().includes(keyword) ||
        job.production_order?.toLowerCase().includes(keyword) ||
        job.part_description?.toLowerCase().includes(keyword)
      );
    }
    
    // Apply priority filter
    if (filterPriority !== null) {
      filtered = filtered.filter(job => 
        job.project?.priority === filterPriority
      );
    }
    
    setFilteredJobs(filtered);
  }, [filterKeyword, filterPriority, availableJobs]);

  // Handle operation selection
  const handleSelectOperation = (operation) => {
    selectOperation(operation);
  };

  // Handle job activation
  const handleActivateJob = () => {
    if (!selectedOperation) return;
    
    const operationId = selectedOperation.operation_id || selectedOperation.id;
    
    if (operationId) {
      setShowConfirmationModal(true);
      setConfirmationAction('activate');
    }
  };

  // Handle job deactivation
  const handleDeactivateJob = () => {
    setShowConfirmationModal(true);
    setConfirmationAction('deactivate');
  };

  // Confirm action
  const handleConfirmAction = async () => {
    if (confirmationAction === 'activate' && selectedOperation) {
      const operationId = selectedOperation.operation_id || selectedOperation.id;
      await activateJob(operationId);
    } else if (confirmationAction === 'deactivate') {
      await deactivateJob();
    }
    
    setShowConfirmationModal(false);
  };

  // Render in-progress jobs
  const renderInProgressJobs = () => {
    if (isLoadingJobs) {
      return (
        <div className="flex justify-center items-center py-12">
          <Spin size="large" tip="Loading in-progress jobs..." />
        </div>
      );
    }

    if (!inProgressJobs || inProgressJobs.length === 0) {
      return (
        <Empty 
          description="No jobs currently in progress" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <List
        dataSource={inProgressJobs}
        renderItem={(job) => (
          <List.Item>
            <Card 
              className="w-full cursor-pointer hover:shadow-md transition-all"
              onClick={() => {
                selectJob(job);
                if (job.operation_id) {
                  handleSelectOperation({
                    id: job.operation_id,
                    operation_number: job.operation_number,
                    operation_description: job.description,
                    work_center: job.work_center
                  });
                }
                if (job.production_order) {
                  fetchJobDetails(job.production_order);
                }
              }}
              style={{ borderLeft: selectedJob?.part_number === job.part_number ? '4px solid #1890ff' : 'none' }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-lg font-semibold">{job.part_number}</div>
                  <div className="text-gray-500">{job.part_description}</div>
                </div>
                <Tag color="success" className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>In Progress</span>
                </Tag>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <div className="text-xs text-gray-500">Production Order</div>
                  <div className="font-medium">{job.production_order}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Operation</div>
                  <div className="font-medium">OP{job.operation_number}</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mb-1">Operation Description</div>
              <div className="text-sm">{job.description}</div>
              
              {job.schedule_info && (
                <div className="mt-3 grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded">
                  <div>
                    <div className="text-xs text-gray-500">Start</div>
                    <div className="text-xs">
                      {new Date(job.schedule_info.planned_start_time).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">End</div>
                    <div className="text-xs">
                      {new Date(job.schedule_info.planned_end_time).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </List.Item>
        )}
      />
    );
  };

  // Render scheduled jobs
  const renderScheduledJobs = () => {
    if (isLoadingJobs) {
      return (
        <div className="flex justify-center items-center py-12">
          <Spin size="large" tip="Loading scheduled jobs..." />
        </div>
      );
    }

    if (!scheduledJobs || scheduledJobs.length === 0) {
      return (
        <Empty 
          description="No scheduled jobs found" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <List
        dataSource={scheduledJobs}
        renderItem={(job) => (
          <List.Item>
            <Card 
              className="w-full cursor-pointer hover:shadow-md transition-all"
              onClick={() => {
                selectJob(job);
                if (job.operation_id) {
                  handleSelectOperation({
                    id: job.operation_id,
                    operation_number: job.operation_number,
                    operation_description: job.description,
                    work_center: job.work_center
                  });
                }
                if (job.production_order) {
                  fetchJobDetails(job.production_order);
                }
              }}
              style={{ borderLeft: selectedJob?.part_number === job.part_number ? '4px solid #1890ff' : 'none' }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-lg font-semibold">{job.part_number}</div>
                  <div className="text-gray-500">{job.part_description}</div>
                </div>
                <Tag color="processing" className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>Scheduled</span>
                </Tag>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <div className="text-xs text-gray-500">Production Order</div>
                  <div className="font-medium">{job.production_order}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Operation</div>
                  <div className="font-medium">OP{job.operation_number}</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mb-1">Operation Description</div>
              <div className="text-sm">{job.description}</div>
              
              {job.schedule_info && (
                <div className="mt-3 grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded">
                  <div>
                    <div className="text-xs text-gray-500">Start</div>
                    <div className="text-xs">
                      {new Date(job.schedule_info.planned_start_time).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">End</div>
                    <div className="text-xs">
                      {new Date(job.schedule_info.planned_end_time).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </List.Item>
        )}
      />
    );
  };

  // Render custom jobs
  const renderCustomJobs = () => {
    if (isLoadingJobs) {
      return (
        <div className="flex justify-center items-center py-12">
          <Spin size="large" tip="Loading available jobs..." />
        </div>
      );
    }

    if (!filteredJobs || filteredJobs.length === 0) {
      return (
        <Empty 
          description="No custom jobs found" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <>
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm font-medium">
            {filteredJobs.length} jobs available
          </div>
          <Button 
            icon={<ListFilter size={16} />} 
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            type={showFilterPanel ? 'primary' : 'default'}
            size="small"
          >
            Filter
          </Button>
        </div>

        {showFilterPanel && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Keyword</div>
                <Select
                  placeholder="Search part number or order"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => setFilterKeyword(value || '')}
                  showSearch
                >
                  {availableJobs.map(job => (
                    <Option key={job.id} value={job.part_number}>
                      {job.part_number}
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Priority</div>
                <Select
                  placeholder="Filter by priority"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => setFilterPriority(value)}
                >
                  <Option value={1}>Priority 1</Option>
                  <Option value={2}>Priority 2</Option>
                  <Option value={3}>Priority 3</Option>
                  <Option value={4}>Priority 4</Option>
                </Select>
              </div>
            </div>
          </div>
        )}

        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={filteredJobs}
          renderItem={(job) => (
            <List.Item>
              <Card 
                className="w-full cursor-pointer hover:shadow-md transition-all"
                onClick={() => {
                  selectJob(job);
                  if (job.production_order) {
                    fetchJobDetails(job.production_order);
                  }
                }}
                style={{ borderLeft: selectedJob?.id === job.id ? '4px solid #1890ff' : 'none' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-lg font-semibold">{job.part_number}</div>
                    <div className="text-gray-500">{job.part_description}</div>
                  </div>
                  <Tag color={job.project?.priority <= 2 ? 'error' : 'blue'} className="flex items-center gap-1">
                    <Bookmark size={12} />
                    <span>Priority {job.project?.priority || 'N/A'}</span>
                  </Tag>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <div className="text-xs text-gray-500">Production Order</div>
                    <div className="font-medium">{job.production_order}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Total Operations</div>
                    <div className="font-medium">{job.total_operations}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <div className="text-xs text-gray-500">Required</div>
                    <div className="font-medium">{job.required_quantity}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Launched</div>
                    <div className="font-medium">{job.launched_quantity}</div>
                  </div>
                </div>
                
                {job.project?.delivery_date && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>Delivery: {new Date(job.project.delivery_date).toLocaleDateString()}</span>
                  </div>
                )}
              </Card>
            </List.Item>
          )}
        />
      </>
    );
  };

  // Render operation selection after a job is selected
  const renderOperationSelection = () => {
    if (!selectedJob) return null;
    
    const jobOperations = selectedJob.operations || [];
    
    if (jobOperations.length === 0) {
      return (
        <Alert
          message="Please Activate the Operation in the Operation Seqence also"
          // description="No operations are available for this job"
          type="warning"
          showIcon
          icon={<Info />}
        />
      );
    }
    
    return (
      <div className="mt-4 border-t pt-4">
        <div className="text-base font-medium mb-2">
          Select Operation
        </div>
        
        <List
          dataSource={jobOperations}
          renderItem={(operation) => (
            <List.Item key={operation.id}>
              <Card 
                className="w-full cursor-pointer hover:shadow-sm transition-all"
                onClick={() => handleSelectOperation(operation)}
                style={{ borderLeft: selectedOperation?.id === operation.id ? '4px solid #1890ff' : 'none' }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">OP{operation.operation_number}: {operation.operation_description}</div>
                    <div className="text-xs text-gray-500 mt-1">work centre: {operation.work_center}</div>
                  </div>
                  {selectedOperation?.id === operation.id && (
                    <Tag color="blue">Selected</Tag>
                  )}
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>
                    <div>Setup Time: {operation.setup_time} hrs</div>
                  </div>
                  <div>
                    <div>Cycle Time: {operation.ideal_cycle_time} hrs</div>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </div>
    );
  };

  return (
    <>
      <Drawer
        title="Job Selection"
        placement="right"
        onClose={onClose}
        open={visible}
        width={600}
        bodyStyle={{ padding: 0, overflow: 'auto' }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={onClose}>
                Cancel
              </Button>
              
              {inProgressJobs && inProgressJobs.length > 0 && (
                <Button 
                  type="primary" 
                  danger
                  onClick={handleDeactivateJob}
                  loading={isDeactivatingJob}
                  disabled={!inProgressJobs || inProgressJobs.length === 0}
                >
                  Deactivate Job
                </Button>
              )}
              
              <Button
                type="primary"
                onClick={handleActivateJob}
                disabled={!selectedOperation}
                loading={isActivatingJob}
              >
                Activate Job
              </Button>
            </Space>
          </div>
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="px-4 pt-4"
        >
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                In Progress
              </span>
            }
            key="inprogress"
          >
            <div className="p-4 pt-0">
              {renderInProgressJobs()}
            </div>
          </TabPane>
          
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <ClockCircleFilled size={16} />
                Scheduled
              </span>
            }
            key="scheduled"
          >
            <div className="p-4 pt-0">
              {renderScheduledJobs()}
            </div>
          </TabPane>
          
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <LayoutGrid size={16} />
                Custom Jobs
              </span>
            }
            key="custom"
          >
            <div className="p-4 pt-0">
              {renderCustomJobs()}
              {selectedJob && activeTab === 'custom' && renderOperationSelection()}
            </div>
          </TabPane>
        </Tabs>
      </Drawer>

      {/* Confirmation Modal */}
      <Modal
        title={
          confirmationAction === 'activate' 
            ? "Activate Job" 
            : "Deactivate Job"
        }
        open={showConfirmationModal}
        onCancel={() => setShowConfirmationModal(false)}
        confirmLoading={jobActionType !== null}
        onOk={handleConfirmAction}
        okButtonProps={{
          type: 'primary',
          className: confirmationAction === 'deactivate' ? 'bg-red-500' : 'bg-blue-500'
        }}
      >
        <div className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle 
              className={confirmationAction === 'activate' ? 'text-blue-500' : 'text-red-500'} 
              size={20} 
            />
            <div>
              {confirmationAction === 'activate' ? (
                <>
                  <p className="font-medium">
                    Are you sure you want to activate this job operation?
                  </p>
                  {selectedOperation && (
                    <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                      <div>
                        <span className="font-medium">Part:</span> {selectedJob?.part_number} - {selectedJob?.part_description}
                      </div>
                      <div>
                        <span className="font-medium">Operation:</span> OP{selectedOperation.operation_number} - {selectedOperation.operation_description}
                      </div>
                    </div>
                  )}
                  {inProgressJobs && inProgressJobs.length > 0 && (
                    <div className="mt-3 bg-yellow-50 border border-yellow-200 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-yellow-600" />
                        <span className="text-sm text-yellow-700">
                          This will deactivate the current active job first.
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="font-medium">
                    Are you sure you want to deactivate the current job?
                  </p>
                  {inProgressJobs && inProgressJobs.length > 0 && (
                    <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                      <div>
                        <span className="font-medium">Part:</span> {inProgressJobs[0].part_number} - {inProgressJobs[0].part_description}
                      </div>
                      <div>
                        <span className="font-medium">Operation:</span> OP{inProgressJobs[0].operation_number} - {inProgressJobs[0].description}
                      </div>
                    </div>
                  )}
                  <div className="mt-3 bg-red-50 border border-red-200 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-600" />
                      <span className="text-sm text-red-700">
                        This will stop the current job tracking.
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default JobSelectionPanel; 