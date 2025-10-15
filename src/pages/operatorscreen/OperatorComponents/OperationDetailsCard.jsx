import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Empty, Tooltip, Space, Modal, Spin, Row, Col, message } from 'antd';
import { 
  ClipboardList, 
  Zap, 
  Clock, 
  Info, 
  Eye, 
  AlertCircle, 
  FileText, 
  Download,
  CheckCircle2
} from 'lucide-react';
import useOperatorStore from '../../../store/operator-store';

const OperationDetailsCard = () => {
  const {
    availableOperations,
    selectedOperation,
    selectedJob,
    selectOperation,
    activateJob,
    isLoadingOperations,
    jobSource,
    fetchOperationMpp,
    downloadDocument,
    isLoadingMppData,
    scheduledJobs,
    fetchJobDetails,
    selectJob,
    machineStatus,
  } = useOperatorStore();

  const [activateModalVisible, setActivateModalVisible] = useState(false);
  const [operationToActivate, setOperationToActivate] = useState(null);
  const [mppModalVisible, setMppModalVisible] = useState(false);
  const [mppData, setMppData] = useState(null);
  const [currentOperationForMpp, setCurrentOperationForMpp] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [localActiveOperation, setLocalActiveOperation] = useState(null);

  // Hydrate selectedJob from localStorage on mount if not set
  useEffect(() => {
    const hydrateSelectedJob = () => {
      if (!selectedJob) {
        const currentJobData = localStorage.getItem('currentJobData');
        if (currentJobData) {
          try {
            const parsedJobData = JSON.parse(currentJobData);
            selectJob(parsedJobData); // Use selectJob to set selectedJob in the store
          } catch (error) {
            console.error('Error parsing currentJobData from localStorage:', error);
            message.error('Failed to parse job data from storage');
          }
        } else {
          const userSelectedJob = localStorage.getItem('user-selected-job');
          if (userSelectedJob) {  
            try {
              const parsedUserSelected = JSON.parse(userSelectedJob);
              const minimalJob = {
                production_order: parsedUserSelected.production_order,
                part_number: parsedUserSelected.part_number
              };
              selectJob(minimalJob); // Set minimal selectedJob and trigger fetches
            } catch (error) {
              console.error('Error parsing user-selected-job from localStorage:', error);
              message.error('Failed to parse user-selected job from storage');
            }
          }
        }
      }
    };
    hydrateSelectedJob();
  }, [selectedJob, selectJob]);

  // Fetch job details when selectedJob changes
  useEffect(() => {
    const fetchDetails = async () => {
      if (selectedJob?.production_order && (!availableOperations || availableOperations.length === 0)) {
        try {
          const result = await fetchJobDetails(selectedJob.production_order);
          if (!result.success) {
            console.error('Failed to fetch job details:', result.error);
            message.error(`Failed to load operations: ${result.error}`);
          }
        } catch (error) {
          console.error('Error fetching job details:', error);
          message.error('Failed to fetch job details');
        }
      }
    };
    fetchDetails();
  }, [selectedJob, fetchJobDetails, availableOperations]);

  // Fetch active operation from localStorage
  useEffect(() => {
    const storedActiveOperation = localStorage.getItem('activeOperation');
    if (storedActiveOperation) {
      try {
        const parsedActiveOperation = JSON.parse(storedActiveOperation);
        setLocalActiveOperation(parsedActiveOperation);
      } catch (error) {
        console.error('Error parsing activeOperation from localStorage:', error);
        setLocalActiveOperation(null);
      }
    } else {
      setLocalActiveOperation(null);
    }
  }, []);

  // Fetch jobSource and scheduledJobs from localStorage if not in store
  useEffect(() => {
    const updateFromLocalStorage = () => {
      const storedJobSource = localStorage.getItem('jobSource');
      const storedScheduledJobs = localStorage.getItem('scheduledJobs');
      if (!jobSource && storedJobSource) {
        // Update jobSource if not in store
      }
      if (!scheduledJobs?.length && storedScheduledJobs) {
        try {
          const parsedScheduledJobs = JSON.parse(storedScheduledJobs);
          // Update scheduledJobs if needed
        } catch (error) {
          console.error('Error parsing scheduledJobs from localStorage:', error);
        }
      }
    };
    updateFromLocalStorage();

    const handleStorageChange = (event) => {
      if (event.key === 'currentJobData' || event.key === 'user-selected-job' || event.key === 'jobSource' || event.key === 'scheduledJobs' || event.key === 'activeOperation' || event.key === null) {
        updateFromLocalStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [jobSource, scheduledJobs]);

  // Determine which data to use (store or local)
  const effectiveSelectedJob = selectedJob;
  const effectiveSelectedOperation = selectedOperation;
  const effectiveAvailableOperations = availableOperations;
  const effectiveJobSource = jobSource;
  const effectiveScheduledJobs = scheduledJobs?.length > 0 ? scheduledJobs : [];

  const isJobScheduled = effectiveSelectedJob
    ? effectiveScheduledJobs?.some(
        (job) => job.production_order === effectiveSelectedJob.production_order
      )
    : false;

  // Show confirmation modal before activating
  const showActivateConfirmation = (operation) => {
    if (!isJobScheduled) {
      message.warning('Cannot activate operation: Job is not scheduled.');
      return;
    }
    setOperationToActivate(operation);
    setActivateModalVisible(true);
  };

  // Handle activation confirmation
// Handle activation confirmation
const handleActivate = async () => {
  if (!operationToActivate) return;
  const operationId = operationToActivate.operation_id || operationToActivate.id;
  if (!operationId) {
    console.error('No valid operation ID found for activation');
    return;
  }

  // Fetch machine status from API
  try {
    const response = await fetch('http://172.19.224.1:8002/api/v1/maintainance/machine-status/', {
      headers: { 'Accept': 'application/json' }
    });
    const data = await response.json();
    const currentMachine = JSON.parse(localStorage.getItem('currentMachine') || '{}');
    const machineId = currentMachine?.id;
    const machine = data.statuses.find(m => m.machine_id === machineId);

    if (!machine) {
      message.error('Failed to activate operation: Machine information not found.');
      return;
    }

    const currentDate = new Date();
    const availableFrom = machine.available_from ? new Date(machine.available_from) : null;
    const availableTo = machine.available_to ? new Date(machine.available_to) : null;

    if (machine.status_name === 'OFF' && availableFrom && availableTo) {
      if (currentDate >= availableFrom && currentDate <= availableTo) {
        message.error('Failed to activate operation: Machine is unavailable during this period.');
        return;
      }
    } else if (machine.status_name === 'OFF') {
      message.error('Failed to activate operation: Machine is currently OFF.');
      return;
    }

    setIsActivating(true);
    try {
      const result = await activateJob(operationId);
      if (result.success) {
        setActivateModalVisible(false);
      }
    } catch (error) {
      console.error('Error activating job:', error);
      message.error(`Failed to activate operation: ${error.message}`);
    } finally {
      setIsActivating(false);
    }
  } catch (error) {
    console.error('Error fetching machine status:', error);
    message.error('Failed to fetch machine status.');
    return;
  }
};

  // Handle viewing MPP for an operation
  const handleViewMpp = async (operation) => {
    if (!effectiveSelectedJob || !effectiveSelectedJob.part_number || !operation) return;
    setMppModalVisible(true);
    setCurrentOperationForMpp(operation);
    setMppData(null);
    try {
      const result = await fetchOperationMpp(effectiveSelectedJob.part_number, operation.operation_number);
      if (result.success) {
        setMppData(result.data);
      } else {
        setMppData({ error: result.error });
      }
    } catch (error) {
      console.error('Error fetching MPP data:', error);
      setMppData({ error: 'Failed to load MPP data' });
    }
  };

  // Handle document download
  const handleDownloadDocument = (documentId) => {
    if (!documentId) return;
    downloadDocument(documentId);
  };

  // Get operation status tag
  const getOperationStatusTag = (record) => {
    const recordId = record.operation_id || record.id;
    if (localActiveOperation && recordId === localActiveOperation.operation_id) {
      return <Tag color="success" className="px-2 py-1 text-base font-medium">Active</Tag>;
    }
    const selectedOpId = effectiveSelectedOperation ? (effectiveSelectedOperation.operation_id || effectiveSelectedOperation.id) : null;
    if (selectedOpId && recordId === selectedOpId) {
      if (effectiveJobSource === 'inprogress') {
        return <Tag color="success" className="px-2 py-1 text-base font-medium">Active</Tag>;
      }
      return <Tag color="blue" className="px-2 py-1 text-base font-medium">Selected</Tag>;
    }
    if (record.can_log === false) {
      return <Tag color="warning" className="px-2 py-1 text-base font-medium">Cannot Log</Tag>;
    }
    return null;
  };

  // Get row class name
  const getRowClassName = (record) => {
    const recordId = record.operation_id || record.id;
    if (localActiveOperation && recordId === localActiveOperation.operation_id) {
      return 'operation-row bg-sky-50 border-l-4 border-sky-500';
    }
    const selectedOpId = effectiveSelectedOperation ? (effectiveSelectedOperation.operation_id || effectiveSelectedOperation.id) : null;
    if (selectedOpId && recordId === selectedOpId) {
      return 'operation-row bg-sky-50 border-l-4 border-sky-500';
    }
    return 'operation-row';
  };

  // Define table columns
  const columns = [
    {
      title: 'OP',
      dataIndex: 'operation_number',
      key: 'operation_number',
      width: 70,
      render: (text) => <div className="text-lg font-bold">{text}</div>,
      sorter: (a, b) => a.operation_number - b.operation_number,
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Description',
      dataIndex: 'operation_description',
      key: 'description',
      render: (text, record) => (
        <div className="flex flex-col">
          <div className="font-medium text-base">
            {text || record.description}
          </div>
          <div className="text-sm text-gray-500 mt-1">{record.work_center || record.work_center_name}</div>
        </div>
      )
    },
    {
      title: 'Parts',
      key: 'parts',
      width: 150,
      render: (_, record) => (
        <div className="grid grid-cols-1 gap-1 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-green-600">Completed: {record.completed_quantity || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-orange-500">Remaining: {record.remaining_quantity || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Total: {record.required_quantity || 0}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Time',
      key: 'time',
      width: 150,
      render: (_, record) => (
        <div className="grid grid-cols-1 gap-1 text-sm">
          <div className="flex items-center gap-1">
            <Clock size={16} className="text-gray-400" />
            <span>Setup: {record.setup_time} hrs</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={16} className="text-gray-400" />
            <span>Cycle: {record.ideal_cycle_time} hrs</span>
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => getOperationStatusTag(record)
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      render: (_, record) => {
        const recordId = record.operation_id || record.id;
        const selectedOpId = effectiveSelectedOperation ? (effectiveSelectedOperation.operation_id || effectiveSelectedOperation.id) : null;
        const isCurrentlyActive = localActiveOperation && recordId === localActiveOperation.operation_id;
        const isSelectable = !(
          record.completed_quantity === record.required_quantity ||
          record.can_log === false
        );
        return (
          <Space size="middle" wrap>
            
            <Button
              type="primary"
              icon={<Zap size={16} />}
              onClick={() => showActivateConfirmation(record)}
              disabled={!isJobScheduled || !isSelectable || isCurrentlyActive}
              size="middle"
              className={isCurrentlyActive ? "bg-green-500" : "bg-sky-500"}
            >
              {isCurrentlyActive ? "Active" : "Activate"}
            </Button>
          </Space>
        );
      },
    }
  ];

  // Render MPP content based on data type
  const renderMppContent = () => {
    if (isLoadingMppData) {
      return (
        <div className="p-8 text-center">
          <Spin size="large" />
          <div className="mt-4">Loading MPP data...</div>
        </div>
      );
    }
    if (!mppData) {
      return (
        <div className="p-8 text-center">
          <div className="text-gray-400">
            <FileText size={48} className="mx-auto mb-4" />
            <p>MPP data will appear here</p>
          </div>
        </div>
      );
    }
    if (mppData.error) {
      return (
        <div className="p-8 text-center">
          <div className="text-red-500">
            <AlertCircle size={48} className="mx-auto mb-4" />
            <p>{mppData.error}</p>
          </div>
        </div>
      );
    }
    if (mppData.type === 'pdf') {
      return (
        <div className="p-8 text-center">
          <div className="mb-6">
            <FileText size={48} className="mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-medium">MPP Document Available</h3>
            <p className="text-gray-500">
              {mppData.document.name} (v{mppData.document.latest_version?.version_number})
            </p>
          </div>
          <Button 
            type="primary" 
            size="large"
            icon={<Download size={16} />} 
            onClick={() => handleDownloadDocument(mppData.documentId)}
            className="bg-blue-500"
          >
            Download MPP Document
          </Button>
          <p className="mt-4 text-xs text-gray-400">
            Click the button above to download or view the MPP document
          </p>
        </div>
      );
    }
    if (mppData.type === 'instructions' && mppData.instructions) {
      const instructions = mppData.instructions;
      return (
        <div className="p-4">
          <h3 className="text-lg font-medium mb-4">Operation Work Instructions</h3>
          {instructions.operation_description && (
            <div className="mb-4">
              <div className="font-medium text-gray-700">Description</div>
              <div className="p-2 bg-gray-50 rounded-md">{instructions.operation_description}</div>
            </div>
          )}
          {instructions.steps && instructions.steps.length > 0 && (
            <div className="mb-4">
              <div className="font-medium text-gray-700 mb-2">Steps</div>
              <div className="border rounded-md overflow-hidden">
                {instructions.steps.map((step, index) => (
                  <div key={index} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="bg-sky-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                        {index + 1}
                      </div>
                      <div>
                        {step.description}
                        {step.image_url && (
                          <div className="mt-2">
                            <img 
                              src={step.image_url} 
                              alt={`Step ${index + 1}`} 
                              className="max-w-full h-auto rounded-md border border-gray-200"
                              style={{ maxHeight: '200px' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {instructions.notes && (
            <div className="mb-4">
              <div className="font-medium text-gray-700">Notes</div>
              <div className="p-2 bg-gray-50 rounded-md whitespace-pre-wrap">{instructions.notes}</div>
            </div>
          )}
          {instructions.tools && instructions.tools.length > 0 && (
            <div className="mb-4">
              <div className="font-medium text-gray-700 mb-2">Tools Required</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {instructions.tools.map((tool, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded-md">
                    {tool.name} {tool.specification && `(${tool.specification})`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400">
          <Info size={48} className="mx-auto mb-4" />
          <p>No detailed MPP information available</p>
        </div>
      </div>
    );
  };

  const isLoading = isLoadingOperations;

  return (
    <>
      <div className="p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spin size="large" />
            <span className="ml-2 text-gray-500">Loading operation sequence...</span>
          </div>
        ) : !effectiveAvailableOperations || effectiveAvailableOperations.length === 0 ? (
          <Empty 
            description={
              <div>
                <p className="text-gray-600">No operations available</p>
                <p className="text-xs text-gray-400">Select a job to view operations</p>
              </div>
            }
          />
        ) : (
          <>
            {effectiveSelectedOperation && (
              <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-sky-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      {effectiveSelectedOperation.operation_number}
                    </div>
                    <div className="text-lg font-bold text-sky-900">
                      {effectiveSelectedOperation.operation_description || effectiveSelectedOperation.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {effectiveJobSource === 'inprogress' ? (
                      <Tag color="success" className="px-3 py-1 text-base">Active</Tag>
                    ) : (
                      <Tag color="processing" className="px-3 py-1 text-base">Selected</Tag>
                    )}
                    {effectiveSelectedOperation.can_log === false && (
                      <Tooltip title={effectiveSelectedOperation.validation_reason || "Cannot log production"}>
                        <Tag color="warning" className="px-3 py-1 text-base">Cannot Log</Tag>
                      </Tooltip>
                    )}
                  </div>
                </div>
                <Row gutter={16} className="mt-4">
                  <Col span={8}>
                    <div className="flex flex-col gap-2 p-3 bg-white rounded-md shadow-sm">
                      <div className="text-xs text-gray-500">Parts Information</div>
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Required:</span>
                          <span className="font-medium">{effectiveSelectedOperation.required_quantity || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="flex flex-col gap-2 p-3 bg-white rounded-md shadow-sm">
                      <div className="text-xs text-gray-500">Setup Time</div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-sky-500" />
                        <div className="font-medium">{effectiveSelectedOperation.setup_time} hrs</div>
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="flex flex-col gap-2 p-3 bg-white rounded-md shadow-sm">
                      <div className="text-xs text-gray-500">Cycle Time</div>
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-sky-500" />
                        <div className="font-medium">{effectiveSelectedOperation.ideal_cycle_time} hrs</div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            )}
            <div className="mb-2 flex justify-between items-center">
              <div className="text-lg font-semibold text-sky-800">Operation Sequence</div>
              <div className="text-sm text-gray-500">
                {effectiveAvailableOperations.length} operations
              </div>
            </div>
            <Table 
              columns={columns}
              dataSource={effectiveAvailableOperations}
              rowClassName={getRowClassName}
              pagination={false}
              rowKey={(record) => record.operation_id || record.id}
              className="operations-table"
              size="large"
              scroll={{ y: 350 }}
              onRow={(record) => {
                const isSelectable = !(
                  record.completed_quantity === record.required_quantity ||
                  record.can_log === false
                );
                return {
                  onClick: () => {
                    if (!isJobScheduled) {
                      message.warning('Cannot select operation: Job is not scheduled.');
                      return;
                    }
                    if (isSelectable) {
                      selectOperation(record);
                    }
                  },
                  className: isJobScheduled && isSelectable
                    ? 'cursor-pointer hover:bg-gray-50'
                    : 'cursor-not-allowed bg-gray-100',
                };
              }}
            />
          </>
        )}
      </div>
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Zap className="text-sky-500" size={20} />
            <span>Activate Operation</span>
          </div>
        }
        open={activateModalVisible}
        onOk={handleActivate}
        onCancel={() => setActivateModalVisible(false)}
        okText="Activate"
        loading={isActivating}
        cancelText="Cancel"
        okButtonProps={{
          className: 'bg-sky-500',
          size: 'large',
          icon: <CheckCircle2 size={16} />,
          disabled: !isJobScheduled,
        }}
        cancelButtonProps={{ size: 'large' }}
      >
        <div className="py-4">
          <p>Are you sure you want to activate the following operation?</p>
          {!isJobScheduled && (
            <p className="text-red-500 mt-2">This job is not scheduled and cannot be activated.</p>
          )}
          {operationToActivate && (
            <div className="bg-sky-50 p-3 rounded-lg border border-sky-100 mt-4">
              <div className="font-bold text-lg">
                Operation {operationToActivate.operation_number}
              </div>
              <div className="text-gray-600">
                {operationToActivate.operation_description || operationToActivate.description}
              </div>
            </div>
          )}
        </div>
      </Modal>
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileText className="text-sky-500" size={20} />
            <span>
              MPP for Operation {currentOperationForMpp?.operation_number}
            </span>
          </div>
        }
        open={mppModalVisible}
        onCancel={() => setMppModalVisible(false)}
        footer={null}
        width={800}
      >
        {renderMppContent()}
      </Modal>
      <style jsx global>{`
        .operations-table .ant-table-cell {
          padding: 16px 12px;
        }
        .operations-table .operation-row {
          transition: all 0.3s ease;
        }
        .operations-table .operation-row.bg-sky-50 {
          background-color: #f0f9ff;
        }
        .operations-table .operation-row.cursor-not-allowed {
          background-color: #f5f5f5 !important;
          opacity: 0.7;
        }
        .operations-table .operation-row.cursor-not-allowed:hover {
          background-color: #f5f5f5 !important;
        }
        .operations-table .ant-table-row:hover {
          background-color: #f5f5f5;
        }
      `}</style>
    </>
  );
};

export default OperationDetailsCard;