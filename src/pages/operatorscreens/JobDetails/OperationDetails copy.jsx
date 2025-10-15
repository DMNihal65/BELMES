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
import useWebSocketStore from '../../../store/websocket-store';
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

  useEffect(() => {
    if (currentMachine?.id) {
      fetchMachineOperations(currentMachine.id);
    }
  }, [currentMachine?.id, fetchMachineOperations, currentActiveOrder]);

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
    // First check if we have operations in jobOrderData (from selected job)
    if (jobOrderData?.operations) {
      return [...jobOrderData.operations].sort((a, b) => 
        a.operation_number - b.operation_number
      );
    }
    
    // Then check if we have operations from WebSocket store
    if (machineOperations) {
      const operations = [
        ...(machineOperations.completed || []),
        ...(machineOperations.inprogress || []),
        ...(machineOperations.scheduled || [])
      ];
      
      return operations.sort((a, b) => a.operation_number - b.operation_number);
    }
    
    // Lastly, check if we have operations from currentActiveOrder
    if (currentActiveOrder?.operations) {
      return [...currentActiveOrder.operations].sort((a, b) => 
        a.operation_number - b.operation_number
      );
    }
    
    // If no operations found, return empty array
    return [];
  }, [jobOrderData, machineOperations, currentActiveOrder]);

  if (loading) {
    return <Spin />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Active Order Alert */}
      {(jobOrderData || currentActiveOrder) && (
        <Alert
          message={
            <div className="flex items-center justify-between">
              <span>Active Order: {jobOrderData?.production_order || currentActiveOrder?.production_order}</span>
              <Tag color="green">ACTIVE</Tag>
            </div>
          }
          description={
            <div>
              <p>Part Number: {jobOrderData?.part_number || currentActiveOrder?.part_number}</p>
              <p>Description: {jobOrderData?.part_description || currentActiveOrder?.part_description}</p>
              <p>Total Operations: {jobOrderData?.total_operations || currentActiveOrder?.total_operations}</p>
            </div>
          }
          type="info"
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
          </div>
        }
      >
        {allOperations.length > 0 ? (
          <Table 
            columns={columns} 
            dataSource={allOperations}
            className="operation-table"
            pagination={false}
            rowClassName={(record) => 
              `operation-row ${record.status === 'in progress' ? 'bg-blue-50' : ''}`
            }
            rowKey={(record) => record.operation_number}
          />
        ) : (
          <div className="p-6 text-center">
            <div className="text-gray-400 mb-3">No operations found</div>
            <div className="text-sm text-gray-500">
              Select a job to view operations or check if a job is active.
            </div>
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
      `}</style>
    </div>
  );
};

export default memo(OperationDetails);