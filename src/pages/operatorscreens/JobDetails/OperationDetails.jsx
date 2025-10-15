import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Table, Card, Button, Space, Drawer, Upload, 
  Tabs, Typography, Tag, Image, Tooltip, Steps,
  Divider, Row, Col, Progress, Badge, Descriptions,Collapse,List, Spin, Input, message, Alert
} from 'antd';
import { 
  FileTextOutlined, EyeOutlined, UploadOutlined,
  InfoCircleOutlined, ToolOutlined, 
  ClockCircleOutlined, CheckCircleOutlined, DownloadOutlined
} from '@ant-design/icons';
import {
  Timer,  Settings, AlertTriangle,
  CheckCircle2, Image as ImageIcon, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import useAuthStore from '../../../store/auth-store';
import { memo } from 'react';
import useOperatorMppStore from '../../../store/operatormpp-store';

const { Title, Text } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;

const OperationDrawer = ({ selectedOperation, showDrawer, onClose }) => {
  const { 
    fetchOperationDocuments, 
    clearOperationDocuments,
    operationDocuments,
    documentLoading,
    documentError,
    downloadDocumentById,
    openDocumentUrl
  } = useWebSocketStore();
  const [fixtureNo, setFixtureNo] = useState('');
  const [ipidNo, setIpidNo] = useState('');
  const [datumX, setDatumX] = useState('');
  const [datumY, setDatumY] = useState('');
  const [datumZ, setDatumZ] = useState('');
  const [fixtureSetup, setFixtureSetup] = useState('');
  const [jobPreparation, setJobPreparation] = useState('');
  const [postMachining, setPostMachining] = useState('');
  
  const [hasMppData, setHasMppData] = useState(false);
  const { token } = useAuthStore();

  useEffect(() => {
    const loadDocuments = async () => {
      if (showDrawer && selectedOperation?.part_number) {
        console.log(`Fetching documents for part: ${selectedOperation.part_number}, operation: ${selectedOperation.operation_number}`);
        const result = await fetchOperationDocuments(
          selectedOperation.part_number,
          selectedOperation.operation_number
        );
        
        if (result.success) {
          console.log('Documents fetched successfully:', result.data);
          // Check if MPP document exists and download it
          if (result.data.mpp && result.data.mpp.id) {
            console.log('MPP document found with ID:', result.data.mpp.id);
            try {
              // Download the MPP document using the ID with authentication token
              // Use the downloadDocumentById function which now properly handles authentication
              const downloadResult = await downloadDocumentById(result.data.mpp.id);
              
              if (downloadResult.success) {
                message.success('MPP document opened successfully');
                // Close the drawer since we have the MPP document
                onClose();
              } else {
                throw new Error(downloadResult.error || 'Failed to open document');
              }
            } catch (downloadError) {
              console.error('Error downloading MPP document:', downloadError);
              message.error('Failed to open MPP document');
            }
          } else if (result.data.mppData) {
            setHasMppData(true);
            const mpp = result.data.mppData;
            
            setFixtureNo(mpp.fixture_number || '');
            setIpidNo(mpp.ipid_number || '');
            
            setDatumX(mpp.datum_x || '');
            setDatumY(mpp.datum_y || '');
            setDatumZ(mpp.datum_z || '');
            
            if (mpp.work_instructions && mpp.work_instructions.sections) {
              const sections = mpp.work_instructions.sections;
              
              const fixtureSetupSection = sections.find(s => s.title === 'Fixture Setup');
              const jobPrepSection = sections.find(s => s.title === 'Job Preparation');
              const postMachiningSection = sections.find(s => s.title === 'Post-Machining Steps');
              
              setFixtureSetup(fixtureSetupSection ? fixtureSetupSection.instructions : '');
              setJobPreparation(jobPrepSection ? jobPrepSection.instructions : '');
              setPostMachining(postMachiningSection ? postMachiningSection.instructions : '');
            }
            message.success('Operation data loaded successfully');
          } else if (!result.data.hasDocuments) {
            // If no documents exist, we should check the MPP endpoint directly
            try {
              const mppResponse = await fetch(
                `http://172.19.224.1:8002/api/v1/mpp/by-part/${selectedOperation.part_number}/${selectedOperation.operation_number}`,
                {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                  }
                }
              );
              
              if (mppResponse.ok) {
                const mppData = await mppResponse.json();
                if (mppData && mppData.length > 0) {
                  setHasMppData(true);
                  const mpp = mppData[0];
                  
                  setFixtureNo(mpp.fixture_number || '');
                  setIpidNo(mpp.ipid_number || '');
                  
                  setDatumX(mpp.datum_x || '');
                  setDatumY(mpp.datum_y || '');
                  setDatumZ(mpp.datum_z || '');
                  
                  if (mpp.work_instructions && mpp.work_instructions.sections) {
                    const sections = mpp.work_instructions.sections;
                    
                    const fixtureSetupSection = sections.find(s => s.title === 'Fixture Setup');
                    const jobPrepSection = sections.find(s => s.title === 'Job Preparation');
                    const postMachiningSection = sections.find(s => s.title === 'Post-Machining Steps');
                    
                    setFixtureSetup(fixtureSetupSection ? fixtureSetupSection.instructions : '');
                    setJobPreparation(jobPrepSection ? jobPrepSection.instructions : '');
                    setPostMachining(postMachiningSection ? postMachiningSection.instructions : '');
                  }
                  message.success('MPP data loaded directly');
                } else {
                  setDefaultNoDataValues();
                }
              } else {
                setDefaultNoDataValues();
              }
            } catch (mppError) {
              console.error('Error fetching MPP directly:', mppError);
              setDefaultNoDataValues();
            }
          }
        } else {
          setDefaultNoDataValues();
        }
      }
    };

    loadDocuments();

    return () => {
      clearOperationDocuments();
      resetFields();
    };
  }, [showDrawer, selectedOperation, fetchOperationDocuments, clearOperationDocuments, token, onClose, downloadDocumentById]);

  const setDefaultNoDataValues = () => {
    setFixtureNo('No Data');
    setIpidNo('No Data');
    setDatumX('No Data');
    setDatumY('No Data');
    setDatumZ('No Data');
    setFixtureSetup('No Data');
    setJobPreparation('No Data');
    setPostMachining('No Data');
    message.info('No operation data available');
  };

  const resetFields = () => {
    setFixtureNo('');
    setIpidNo('');
    setDatumX('');
    setDatumY('');
    setDatumZ('');
    setFixtureSetup('');
    setJobPreparation('');
    setPostMachining('');
    setHasMppData(false);
  };

  const renderHtml = (htmlContent) => {
    if (!htmlContent) return null;
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  return (
  <Drawer
    title={
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="text-lg font-semibold text-gray-800">
          Operation {selectedOperation?.operation_number}
            </div>
            <div className="text-sm text-gray-500">
              {selectedOperation?.description}
            </div>
          </div>
          <Tag color={selectedOperation?.status === 'completed' ? 'success' : 'processing'}>
            {selectedOperation?.status?.toUpperCase()}
          </Tag>
        </div>
    }
    placement="right"
    width={800}
    onClose={onClose}
    open={showDrawer}
    destroyOnClose={true}
    className="operation-details-drawer"
    >
      {documentLoading ? (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      ) : documentError ? (
        <Alert
          type="error"
          message="Error loading documents"
          description={documentError}
          className="mb-6"
        />
      ) : (
      <div className="space-y-6">
          {/* Operation Overview */}
          <Card className="shadow-sm border-0">
            <div>
              <Text type="secondary">Part Number</Text>
              <div className="text-lg font-medium">{selectedOperation?.part_number}</div>
            </div>
          </Card>

          {/* Fixture & IPID Details */}
          <Card 
            title={
              <div className="flex items-center space-x-2">
                <ToolOutlined className="text-blue-500" />
                <span>Fixture & IPID Details</span>
              </div>
            }
            className="shadow-sm border-0"
          >
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Text type="secondary">Fixture Number</Text>
                <div className="p-2 mt-2 bg-gray-50 border border-gray-200 rounded-md">
                  {fixtureNo || 'No Data'}
                </div>
              </div>
              <div>
                <Text type="secondary">IPID Number</Text>
                <div className="p-2 mt-2 bg-gray-50 border border-gray-200 rounded-md">
                  {ipidNo || 'No Data'}
                </div>
              </div>
            </div>
        </Card>

        {/* Datum Information */}
          <Card 
            title={
              <div className="flex items-center space-x-2">
                <InfoCircleOutlined className="text-blue-500" />
                <span>Datum Information</span>
              </div>
            }
            className="shadow-sm border-0"
          >
            <div className="grid grid-cols-3 gap-6">
              {['X', 'Y', 'Z'].map((axis) => (
                <div key={axis}>
                  <Text type="secondary">Datum {axis} Axis</Text>
                  <div className="p-2 mt-2 bg-gray-50 border border-gray-200 rounded-md">
                    {eval(`datum${axis}`) || 'No Data'}
                  </div>
                </div>
              ))}
            </div>
        </Card>

          {/* Work Instructions */}
          <Card 
            title={
              <div className="flex items-center space-x-2">
                <FileTextOutlined className="text-blue-500" />
                <span>Work Instructions</span>
              </div>
            }
            className="shadow-sm border-0"
          >
          <Collapse defaultActiveKey={['1']} ghost>
            <Panel header="Fixture Setup" key="1">
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  {renderHtml(fixtureSetup) || "No data available"}
                </div>
              </Panel>
              <Panel header="Job Preparation" key="2">
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  {renderHtml(jobPreparation) || "No data available"}
                </div>
              </Panel>
              <Panel header="Post-Machining Steps" key="3">
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  {renderHtml(postMachining) || "No data available"}
                </div>
            </Panel>
          </Collapse>
        </Card>
      </div>
    )}
  </Drawer>
);
};

// Create a new component for the Download MPP button
const DownloadMppButton = ({ record, machineOperations }) => {
  const { fetchOperationDocuments, downloadDocumentById } = useWebSocketStore();
  const { token } = useAuthStore();
  
  const handleDownload = (e) => {
    e.stopPropagation();
    const partNumber = record.part_number || machineOperations?.inprogress?.[0]?.part_number;
    
    if (partNumber) {
      message.loading('Fetching MPP document...');
      fetchOperationDocuments(partNumber, record.operation_number)
        .then(result => {
          if (result.success && result.data.mpp && result.data.mpp.id) {
            message.success('MPP document found, downloading...');
            return downloadDocumentById(result.data.mpp.id);
          } else {
            message.info('No MPP document available for this operation');
          }
        })
        .catch(error => {
          message.error('Failed to fetch document: ' + error.message);
          console.error('Error fetching documents:', error);
        });
    } else {
      message.error('No part number available');
    }
  };
  
  return (
    <Button
      type="default"
      size="small"
      icon={<DownloadOutlined />}
      onClick={handleDownload}
    >
      Download MPP
    </Button>
  );
};

const OperationDetails = ({ jobData, jobOrderData }) => {
  const { currentMachine } = useAuthStore();
  const { 
    fetchMachineOperations, 
    machineOperations, 
    loading, 
    fetchOperationDocuments, 
    downloadDocumentById
  } = useWebSocketStore();
  const { token } = useAuthStore();
  const { currentActiveOrder, set } = useOperatorMppStore();
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);

  const handleDrawerClose = useCallback(() => {
    setShowDrawer(false);
    setSelectedOperation(null);
  }, []);
  
  // Function to check for MPP document and show appropriate view
  const handleOperationClick = useCallback(async (record, partNumber) => {
    // First, setup the operation data
    const operationData = {
      ...record,
      part_number: partNumber
    };
    setSelectedOperation(operationData);
    
    // Show loading message
    message.loading('Checking for operation documents...');
    
    try {
      // Fetch documents to check if MPP is available
      const result = await fetchOperationDocuments(partNumber, record.operation_number);
      
      if (result.success && result.data.mpp && result.data.mpp.id) {
        // If MPP document exists, download it directly without showing drawer
        const downloadResult = await downloadDocumentById(result.data.mpp.id);
        if (downloadResult.success) {
          message.success('MPP document opened successfully');
        } else {
          message.error(downloadResult.error || 'Failed to open MPP document');
          // Show drawer as fallback
          setShowDrawer(true);
        }
      } else {
        // If no MPP document exists, show the drawer with available data
        setShowDrawer(true);
      }
    } catch (error) {
      console.error('Error checking for MPP document:', error);
      message.error('Failed to check for documents');
      // Show drawer anyway as fallback
      setShowDrawer(true);
    }
  }, [fetchOperationDocuments, downloadDocumentById]);

  // Add function to refresh data
  const refreshOperationsData = useCallback(async () => {
    if (!currentMachine?.id) return;
    
    setIsRefreshingData(true);
    try {
      await fetchMachineOperations(currentMachine.id);
      message.success('Operations data refreshed');
    } catch (error) {
      console.error('Error refreshing operations data:', error);
      message.error('Failed to refresh operations data');
    } finally {
      setIsRefreshingData(false);
    }
  }, [currentMachine?.id, fetchMachineOperations]);

  useEffect(() => {
    if (currentMachine?.id) {
      fetchMachineOperations(currentMachine.id);
    }
  }, [currentMachine?.id, fetchMachineOperations, currentActiveOrder]);

  // Listen for operation updates
  useEffect(() => {
    const handleOperationsUpdate = (event) => {
      if (event.detail) {
        // Refresh the operations data
        if (currentMachine?.id) {
          fetchMachineOperations(currentMachine.id);
        }
      }
    };

    window.addEventListener('operationsUpdated', handleOperationsUpdate);

    return () => {
      window.removeEventListener('operationsUpdated', handleOperationsUpdate);
    };
  }, [currentMachine?.id, fetchMachineOperations]);

  // Add listener for job activation events
  useEffect(() => {
    const handleJobActivation = (event) => {
      if (event.detail && event.detail.job) {
        // Load fresh operations data after job activation
        if (currentMachine?.id) {
          fetchMachineOperations(currentMachine.id);
        }
      }
    };

    window.addEventListener('jobActivated', handleJobActivation);
    window.addEventListener('jobDataUpdated', handleJobActivation);

    return () => {
      window.removeEventListener('jobActivated', handleJobActivation);
      window.removeEventListener('jobDataUpdated', handleJobActivation);
    };
  }, [currentMachine?.id, fetchMachineOperations]);

  // Add an effect to handle localStorage changes
  useEffect(() => {
    // Function to handle storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'operationsData' || e.key === 'currentJobData' || e.key === 'jobData') {
        refreshOperationsData();
      }
    };

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshOperationsData]);

  // Add listener for operations data update event
  useEffect(() => {
    const handleOperationsDataUpdate = (event) => {
      if (event.detail && event.detail.operations) {
        console.log('Operations data updated event received:', event.detail);
        // We don't need to call fetchMachineOperations here as the data is already in the event
        // Just update the store via the set function if needed
      }
    };

    window.addEventListener('operationsDataUpdated', handleOperationsDataUpdate);

    return () => {
      window.removeEventListener('operationsDataUpdated', handleOperationsDataUpdate);
    };
  }, []);

  const columns = useMemo(() => [
    {
      title: 'Op. No',
      dataIndex: 'operation_number',
      key: 'operation_number',
      width: '10%',
      sorter: (a, b) => a.operation_number - b.operation_number,
    },
    {
      title: 'Operation',
      dataIndex: 'operation_description',
      key: 'operation_description',
      width: '30%',
    },
    {
      title: 'work centre',
      dataIndex: 'work_center',
      key: 'work_center',
      width: '15%',
      render: (text) => (
        <Tag color="blue">{text}</Tag>
      ),
    },
    {
      title: 'Setup Time (hrs)',
      dataIndex: 'setup_time',
      key: 'setup_time',
      width: '15%',
      render: (time) => time?.toFixed(2) || '0.00',
    },
    {
      title: 'Cycle Time (hrs)',
      dataIndex: 'ideal_cycle_time',
      key: 'ideal_cycle_time',
      width: '15%',
      render: (time) => time?.toFixed(2) || '0.00',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '15%',
      render: (_, record) => {
        // Get part number either from the record or from jobData or jobOrderData
        const partNumber = record.part_number || jobOrderData?.part_number || jobData?.part_number;
        
        return (
          <Space>
            {/* Combined Details Button */}
            <Button 
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleOperationClick(record, partNumber);
              }}
            >
              Details
            </Button>
          </Space>
        );
      },
    }
  ], [jobData, jobOrderData, handleOperationClick]);

  // Get operations from different sources with priority
  const allOperations = useMemo(() => {
    // First check if we have operations in the current component props
    if (jobData?.operations && jobData.operations.length > 0) {
      return [...jobData.operations].sort((a, b) => 
        a.operation_number - b.operation_number
      );
    }
    
    // Then check if we have operations in jobOrderData (from selected job)
    if (jobOrderData?.operations && jobOrderData.operations.length > 0) {
      return [...jobOrderData.operations].sort((a, b) => 
        a.operation_number - b.operation_number
      );
    }
    
    // Then check if we have operations from WebSocket store
    if (machineOperations) {
      // Create a set of all operations
      const allOps = new Set();
      
      // Add operations from each category
      if (machineOperations.completed) {
        machineOperations.completed.forEach(op => allOps.add(JSON.stringify(op)));
      }
      
      if (machineOperations.inprogress) {
        machineOperations.inprogress.forEach(op => allOps.add(JSON.stringify(op)));
      }
      
      if (machineOperations.scheduled) {
        machineOperations.scheduled.forEach(op => allOps.add(JSON.stringify(op)));
      }
      
      // Convert back to objects and sort
      const operations = Array.from(allOps).map(op => JSON.parse(op));
      return operations.sort((a, b) => a.operation_number - b.operation_number);
    }
    
    // Lastly, check if we have operations from currentActiveOrder
    if (currentActiveOrder?.operations && currentActiveOrder.operations.length > 0) {
      return [...currentActiveOrder.operations].sort((a, b) => 
        a.operation_number - b.operation_number
      );
    }
    
    // Try to load from localStorage as last resort
    try {
      // Check if we have a user-selected job
      const jobSource = localStorage.getItem('jobSource');
      
      // If we have a user-selected job, prioritize that data
      if (jobSource === 'user-selected') {
        const storedJobData = localStorage.getItem('jobData');
        if (storedJobData) {
          const parsedJobData = JSON.parse(storedJobData);
          if (parsedJobData.operations && parsedJobData.operations.length > 0) {
            console.log('Using operations from user-selected job in localStorage');
            return parsedJobData.operations.sort((a, b) => 
              a.operation_number - b.operation_number
            );
          }
        }
        
        // Also check for activeOperation
        const storedActiveOp = localStorage.getItem('activeOperation');
        if (storedActiveOp) {
          try {
            const activeOp = JSON.parse(storedActiveOp);
            // If we have an active operation but no operations list,
            // return it as a single-item array
            return [activeOp];
          } catch (error) {
            console.error('Error parsing active operation:', error);
          }
        }
      }
      
      // First check for scheduled operations specifically
      const storedScheduledOps = localStorage.getItem('scheduledOperations');
      if (storedScheduledOps) {
        const scheduledOps = JSON.parse(storedScheduledOps);
        if (Array.isArray(scheduledOps) && scheduledOps.length > 0) {
          return scheduledOps.sort((a, b) => a.operation_number - b.operation_number);
        }
      }
      
      // Then check all operations
      const storedOperations = localStorage.getItem('operationsData');
      if (storedOperations) {
        const parsedOperations = JSON.parse(storedOperations);
        if (parsedOperations) {
          const allOps = new Set();
          
          if (parsedOperations.completed) {
            parsedOperations.completed.forEach(op => allOps.add(JSON.stringify(op)));
          }
          
          if (parsedOperations.inprogress) {
            parsedOperations.inprogress.forEach(op => allOps.add(JSON.stringify(op)));
          }
          
          if (parsedOperations.scheduled) {
            parsedOperations.scheduled.forEach(op => allOps.add(JSON.stringify(op)));
          }
          
          const operations = Array.from(allOps).map(op => JSON.parse(op));
          if (operations.length > 0) {
            return operations.sort((a, b) => a.operation_number - b.operation_number);
          }
        }
      }
    } catch (error) {
      console.error('Error loading operations from localStorage:', error);
    }
    
    // If no operations found, return empty array
    return [];
  }, [jobData, jobOrderData, machineOperations, currentActiveOrder]);

  // Get the current active operation, if any
  const activeOperation = useMemo(() => {
    if (machineOperations?.inprogress?.length > 0) {
      return machineOperations.inprogress[0];
    }
    
    if (jobData?.currentOperation) {
      return jobData.currentOperation;
    }
    
    // Try to load from localStorage
    try {
      const storedActiveOp = localStorage.getItem('activeOperation');
      if (storedActiveOp) {
        return JSON.parse(storedActiveOp);
      }
    } catch (error) {
      console.error('Error loading active operation from localStorage:', error);
    }
    
    return null;
  }, [machineOperations, jobData]);

  if (loading || isRefreshingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading operations..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Active Order Alert */}
      {(jobOrderData || currentActiveOrder || jobData) ? (
        <Alert
          message={
            <div className="flex items-center justify-between">
              <span>
                Active Order: {jobOrderData?.production_order || 
                              currentActiveOrder?.production_order || 
                              jobData?.production_order || 
                              'No active order'}
              </span>
              {(machineOperations?.inprogress?.length > 0 || activeOperation) ? (
                <Tag color="green">ACTIVE</Tag>
              ) : (
                <Tag color="orange">SCHEDULED</Tag>
              )}
            </div>
          }
          description={
            <div>
              <p>Part Number: {jobOrderData?.part_number || 
                             currentActiveOrder?.part_number || 
                             jobData?.part_number || 'N/A'}</p>
              <p>Description: {jobOrderData?.part_description || 
                              jobOrderData?.material_description || 
                              currentActiveOrder?.part_description || 
                              jobData?.part_description || 'N/A'}</p>
              <p>Total Operations: {jobOrderData?.total_operations || 
                                   currentActiveOrder?.total_operations || 
                                   jobData?.total_operations || 
                                   allOperations.length || 0}</p>
              
              {/* Show refresh button */}
              <div className="mt-2">
                <Button 
                  size="small" 
                  onClick={refreshOperationsData} 
                  loading={isRefreshingData}
                  icon={<InfoCircleOutlined />}
                >
                  Refresh Operations Data
                </Button>
              </div>
            </div>
          }
          type="info"
          showIcon
          className="mb-4"
        />
      ) : machineOperations?.scheduled?.length > 0 ? (
        <Alert
          message={
            <div className="flex items-center justify-between">
              <span>
                Scheduled Operations
              </span>
              <Tag color="orange">SCHEDULED</Tag>
            </div>
          }
          description={
            <div>
              <p>There are {machineOperations.scheduled.length} operations scheduled for this machine.</p>
              <p>You can view the details below or select a job to activate it.</p>
              
              {/* Show refresh button */}
              <div className="mt-2">
                <Button 
                  size="small" 
                  onClick={refreshOperationsData} 
                  loading={isRefreshingData}
                  icon={<InfoCircleOutlined />}
                >
                  Refresh Operations Data
                </Button>
              </div>
            </div>
          }
          type="info"
          showIcon
          className="mb-4"
        />
      ) : (
        <Alert
          message="No Active or Scheduled Jobs"
          description={
            <div>
              <p>There are no active or scheduled operations for this machine.</p>
              <p>Click the "Select Job" button to choose a job to activate.</p>
              
              {/* Show refresh button */}
              <div className="mt-2">
                <Button 
                  size="small" 
                  onClick={refreshOperationsData} 
                  loading={isRefreshingData}
                  icon={<InfoCircleOutlined />}
                >
                  Refresh Operations Data
                </Button>
              </div>
            </div>
          }
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      {/* Active Operation Alert - only show if there's an active operation */}
      {activeOperation && (
        <Alert
          message={
            <div className="flex items-center justify-between">
              <span>Active Operation: {activeOperation.operation_number} - {activeOperation.operation_description}</span>
              <Tag color="processing">IN PROGRESS</Tag>
            </div>
          }
          description={
            <div>
              <p>work centre: {activeOperation.work_center}</p>
              <p>Setup Time: {activeOperation.setup_time?.toFixed(2) || '0.00'} hrs</p>
              <p>Cycle Time: {activeOperation.ideal_cycle_time?.toFixed(2) || '0.00'} hrs</p>
            </div>
          }
          type="success"
          showIcon
          className="mb-4"
        />
      )}

      {/* Operation Sequence Card */}
      <Card 
        className="shadow-sm hover:shadow-md transition-shadow"
        title={
          <div className="flex items-center justify-between">
            <Space>
              <ToolOutlined className="text-blue-500" />
              <Title level={5} className="mb-0">Operation Sequence</Title>
            </Space>
            <span className="text-gray-500 text-sm">
              {allOperations.length} operations
            </span>
          </div>
        }
      >
        {allOperations.length > 0 ? (
          <Table 
            columns={columns} 
            dataSource={allOperations}
            className="operation-table"
            pagination={false}
            rowClassName={(record) => {
              // Mark the active operation row
              if (activeOperation && record.operation_number === activeOperation.operation_number) {
                return 'operation-row bg-blue-50 border-l-4 border-blue-500';
              }
              
              return 'operation-row';
            }}
            rowKey={(record) => record.operation_number + record.work_center}
          />
        ) : (
          <div className="p-6 text-center">
            <div className="text-gray-400 mb-3">No operations found</div>
            <div className="text-sm text-gray-500">
              Select a job to view operations or check if a job is active.
            </div>
            <Button 
              className="mt-4" 
              onClick={refreshOperationsData}
              loading={isRefreshingData}
            >
              Refresh Data
            </Button>
          </div>
        )}
      </Card>

      <OperationDrawer 
        selectedOperation={selectedOperation}
        showDrawer={showDrawer}
        onClose={handleDrawerClose}
      />

      <style jsx global>{`
        .operation-details-drawer .ant-drawer-content-wrapper {
          box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
        }

        .operation-details-drawer .ant-drawer-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .operation-details-drawer .ant-drawer-body {
          padding: 24px;
          background-color: #f5f5f5;
        }

        .operation-details-drawer .ant-card {
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .operation-details-drawer .ant-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .operation-details-drawer .ant-input {
          border-radius: 6px;
        }

        .operation-details-drawer .ant-collapse-header {
          padding: 12px 16px !important;
        }

        .operation-details-drawer .ant-collapse-content-box {
          padding: 0 !important;
        }

        .operation-details-drawer .ant-tag {
          border-radius: 4px;
          padding: 2px 8px;
        }

        /* Add styles for active operation row */
        .operation-row.bg-blue-50 {
          background-color: #eff6ff;
          transition: background-color 0.3s ease;
        }
        
        .operation-row.border-l-4 {
          padding-left: 12px;
        }
        
        .operation-row:hover {
          background-color: #f8fafc;
        }
        
        .operation-row.bg-blue-50:hover {
          background-color: #e0f2fe;
        }
      `}</style>
    </div>
  );
};

export default memo(OperationDetails);