import React, { useState, useEffect } from 'react';
import { 
  Drawer, Tabs, List, Card, Button, Empty, Spin, Tag, 
  Radio, Select, Space, Alert, Modal, Tooltip, message
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

  const [activeTab, setActiveTab] = useState('custom');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterPriority, setFilterPriority] = useState(null);
  const [filterProductionOrder, setFilterProductionOrder] = useState(null);



useEffect(() => {
  setActiveTab('custom'); // Always open on custom jobs tab
  setFilteredJobs(availableJobs); // Still update available jobs filter
}, [availableJobs]);

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
  
  // Apply production order filter
  if (filterProductionOrder !== null) {
    filtered = filtered.filter(job => 
      job.production_order === filterProductionOrder
    );
  }
  
  setFilteredJobs(filtered);
}, [filterKeyword, filterPriority, filterProductionOrder, availableJobs]);

  // Handle operation selection
  const handleSelectOperation = (operation) => {
    selectOperation(operation);
  };

  // Handle job activation
  const handleActivateJob = () => {
    if (!selectedOperation) {
      message.warning('Please select an operation first');
      return;
    }
    
    if (inProgressJobs && inProgressJobs.length > 0) {
      message.warning('Please deactivate the current job first');
      return;
    }

    setShowConfirmationModal(true);
    setConfirmationAction('activate');
  };

  // Handle job deactivation
  const handleDeactivateJob = () => {

    setShowConfirmationModal(true);
    setConfirmationAction('deactivate');
  };

  // Confirm action
  const handleConfirmAction = async () => {
    try {
      if (confirmationAction === 'activate' && selectedOperation) {
        const operationId = selectedOperation.operation_id || selectedOperation.id;
        const result = await activateJob(operationId);
        if (result.success) {
          message.success('Job activated successfully');
          onClose();
        }
      } else if (confirmationAction === 'deactivate') {
        const result = await deactivateJob();
        if (result.success) {
          message.success('Job deactivated successfully');
          onClose();
        }
      }
    } catch (error) {
      message.error(error.message || 'Operation failed');
    } finally {
      setShowConfirmationModal(false);
    }
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
    <div className="flex flex-col items-center justify-center py-10">
      <Empty 
        description="No jobs found for selected filters"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
      <Button 
        onClick={() => {
          setFilterKeyword('');
          setFilterPriority(null); 
          setFilterProductionOrder(null);
        }}
        type="link"
        className="mt-4"
      >
        Back to all jobs
      </Button>
    </div>
  );
}

  
    // Create a Set of production_order values from scheduledJobs
    const scheduledProductionOrders = new Set(scheduledJobs.map(job => job.production_order));
  
    // Sort filteredJobs to show scheduled jobs first
    const sortedJobs = [...filteredJobs].sort((a, b) => {
      const aIsScheduled = scheduledProductionOrders.has(a.production_order);
      const bIsScheduled = scheduledProductionOrders.has(b.production_order);
      return bIsScheduled - aIsScheduled; // true (1) comes before false (0)
    });

    const isJobSelectionDisabled = !!localStorage.getItem('currentJobData');

      const handleJobSelection = (job) => {
        if (isJobSelectionDisabled) {
          message.warning('Cannot select a job while another job is active. Please deactivate the current job first.');
          return;
        }

        // Select the job in the store
        selectJob(job);

        // Store the latest selected job details in localStorage
        const userSelectedJobData = {
          production_order: job.production_order,
          part_number: job.part_number
        };
        localStorage.setItem('user-selected-job', JSON.stringify(userSelectedJobData));

        // Fetch job details if production order is available
        if (job.production_order) {
          fetchJobDetails(job.production_order);
        }
      };
  
    return (
      <>
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm font-medium">
            {sortedJobs.length} jobs available
          </div>
          {/* <Button 
            icon={<ListFilter size={16} />} 
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            type={showFilterPanel ? 'primary' : 'default'}
            size="small"
          >
            Filter
          </Button> */}
        </div>
  
        {showFilterPanel && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Part Number</div>
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
                  value={filterPriority || undefined}
                >
                  {Array.from(
                    new Set(availableJobs.map(job => job.project?.priority).filter(p => p != null))
                  )
                    .sort((a, b) => a - b)
                    .map(priority => (
                      <Option key={priority} value={priority}>
                        Priority {priority}
                      </Option>
                    ))}
                </Select>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Production Order</div>
                <Select
                  placeholder="Filter by production order"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => setFilterProductionOrder(value)}
                  value={filterProductionOrder || undefined}
                  showSearch
                >
                  {Array.from(
                    new Set(availableJobs.map(job => job.production_order).filter(po => po != null))
                  )
                    .sort()
                    .map(productionOrder => (
                      <Option key={productionOrder} value={productionOrder}>
                        {productionOrder}
                      </Option>
                    ))}
                </Select>
              </div>
            </div>
          </div>
        )}
        <div className="mt-3 text-right">
      <Button
        onClick={() => {
          setFilterKeyword('');
          setFilterPriority(null);
          setFilterProductionOrder(null);
        }}
        size="small"
        type="default"
        style={{marginBottom:'10px'}}
      >
        Reset Filters
      </Button>
        </div>
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={sortedJobs}
          renderItem={(job) => {
            // Check if the job's production_order is in scheduledJobs
            const isScheduled = scheduledProductionOrders.has(job.production_order);
  
            return (
              <List.Item>
                  <Card 
                  className={`w-full ${isJobSelectionDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-md transition-all'}`}
                  // onClick={() => {
                  //   if (isJobSelectionDisabled) {
                  //     message.warning('Cannot select a job while another job is active. Please deactivate the current job first.');
                  //     return;
                  //   }
                  //   selectJob(job);
                  //   if (job.production_order) {
                  //     fetchJobDetails(job.production_order);
                  //   }
                  // }}
                  onClick={() => handleJobSelection(job)}
                  style={{
                    borderLeft: selectedJob?.id === job.id
                      ? '4px solid #1890ff'
                      : isScheduled
                        ? '4px solid #52c41a' // Green border for scheduled jobs
                        : 'none',
                    backgroundColor: isScheduled ? '#f6ffed' : 'white' // Light green background for scheduled jobs
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-lg font-semibold">{job.part_number}</div>
                      <div className="text-gray-500">{job.part_description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isScheduled && (
                        <Tag color="green" className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>Scheduled</span>
                        </Tag>
                      )}
                      <Tag color={job.project?.priority <= 2 ? 'error' : 'blue'} className="flex items-center gap-1">
                        <Bookmark size={12} />
                        <span>Priority {job.project?.priority || 'N/A'}</span>
                      </Tag>
                    </div>
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
            );
          }}
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
              
              <Button 
                type="primary" 
                danger
                onClick={handleDeactivateJob}
                loading={isDeactivatingJob}
                disabled={!localStorage.getItem('currentJobData')} // disable if localStorage item is not present
                style={{ display: 'inline-flex' }}
              >
                Deactivate Job
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
                <LayoutGrid size={16} />
                Jobs
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
                  {/* {inProgressJobs && inProgressJobs.length > 0 && (
                    <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                      <div>
                        <span className="font-medium">Part:</span> {inProgressJobs[0].part_number} - {inProgressJobs[0].part_description}
                      </div>
                      <div>
                        <span className="font-medium">Operation:</span> OP{inProgressJobs[0].operation_number} - {inProgressJobs[0].description}
                      </div>
                    </div>
                  )} */}
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