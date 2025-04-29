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
    openDocumentInNewTab
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

  const handleDownloadDocument = async (documentType) => {
    if (!operationDocuments) return;
    
    let document = null;
    switch (documentType) {
      case 'mpp':
        document = operationDocuments.mpp;
        break;
      case 'ipid':
        document = operationDocuments.ipid;
        break;
      case 'engineering':
        document = operationDocuments.engineering;
        break;
      default:
        message.error('Document type not supported');
        return;
    }
    
    if (!document || !document.id) {
      message.error(`No ${documentType.toUpperCase()} document available`);
      return;
    }
    
    try {
      message.loading(`Downloading ${documentType.toUpperCase()} document...`);
      const result = await downloadDocumentById(document.id);
      
      if (result.success) {
        message.success(`${documentType.toUpperCase()} document downloaded successfully`);
      } else {
        message.error(result.error || 'Failed to download document');
      }
    } catch (error) {
      console.error(`Error downloading ${documentType} document:`, error);
      message.error('Failed to download document');
    }
  };

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
          if (result.data.mpp) {
            console.log('MPP document available:', result.data.mpp);
          }
          if (result.data.mppData) {
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
            setFixtureNo('No Data');
            setIpidNo('No Data');
            setDatumX('No Data');
            setDatumY('No Data');
            setDatumZ('No Data');
            setFixtureSetup('No Data');
            setJobPreparation('No Data');
            setPostMachining('No Data');
            message.info('No operation data available');
          }
        }
      }
    };

    loadDocuments();

    return () => {
      clearOperationDocuments();
      resetFields();
    };
  }, [showDrawer, selectedOperation]);

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

  const fieldsDisabled = !hasMppData && !(operationDocuments && operationDocuments.hasDocuments);

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
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Text type="secondary">Part Number</Text>
                <div className="text-lg font-medium">{selectedOperation?.part_number}</div>
              </div>
              <div>
                <Text type="secondary">Operation Type</Text>
                <div className="text-lg font-medium">{selectedOperation?.operation_type || 'N/A'}</div>
              </div>
            </div>
          </Card>

          {/* Document Information */}
          {operationDocuments && (
            <Card 
              title={
                <div className="flex items-center space-x-2">
                  <FileTextOutlined className="text-blue-500" />
                  <span>Documents</span>
                </div>
              }
              className="shadow-sm border-0"
            >
              <div className="space-y-4">
                {operationDocuments.mpp && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Tag color="blue" className="m-0">MPP</Tag>
                      <span className="text-sm">{operationDocuments.mpp.document_number || operationDocuments.mpp.name}</span>
                    </div>
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadDocument('mpp')}
                      size="small"
                    >
                      Download
                    </Button>
                  </div>
                )}
                {operationDocuments.ipid && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Tag color="green" className="m-0">IPID</Tag>
                      <span className="text-sm">{operationDocuments.ipid.document_number || operationDocuments.ipid.name}</span>
                    </div>
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadDocument('ipid')}
                      size="small"
                    >
                      Download
                    </Button>
                  </div>
                )}
                {operationDocuments.engineering && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Tag color="orange" className="m-0">Engineering</Tag>
                      <span className="text-sm">{operationDocuments.engineering.document_number || operationDocuments.engineering.name}</span>
                    </div>
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadDocument('engineering')}
                      size="small"
                    >
                      Download
                    </Button>
                  </div>
                )}
                {!operationDocuments.mpp && !operationDocuments.ipid && !operationDocuments.engineering && operationDocuments.mppData && (
                  <Alert
                    message="MPP Data Available"
                    description="The operation details are available in the sections below."
                    type="info"
                    showIcon
                  />
                )}
              </div>
            </Card>
          )}

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
                <Input 
                  value={fixtureNo}
                  onChange={(e) => setFixtureNo(e.target.value)}
                  placeholder="Enter fixture number"
                  disabled={fieldsDisabled}
                  className={`mt-2 ${fieldsDisabled ? "bg-gray-50" : ""}`}
                />
              </div>
              <div>
                <Text type="secondary">IPID Number</Text>
                <Input 
                  value={ipidNo}
                  onChange={(e) => setIpidNo(e.target.value)}
                  placeholder="Enter IPID number"
                  disabled={fieldsDisabled}
                  className={`mt-2 ${fieldsDisabled ? "bg-gray-50" : ""}`}
                />
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
                  <Input 
                    value={eval(`datum${axis}`)}
                    onChange={(e) => eval(`setDatum${axis}`)(e.target.value)}
                    placeholder={`Enter ${axis} axis datum`}
                    disabled={fieldsDisabled}
                    className={`mt-2 ${fieldsDisabled ? "bg-gray-50" : ""}`}
                  />
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
                <div className={`p-4 rounded-lg ${fieldsDisabled ? "bg-gray-50" : "border"}`}>
                  {renderHtml(fixtureSetup) || "No data available"}
                </div>
              </Panel>
              <Panel header="Job Preparation" key="2">
                <div className={`p-4 rounded-lg ${fieldsDisabled ? "bg-gray-50" : "border"}`}>
                  {renderHtml(jobPreparation) || "No data available"}
                </div>
              </Panel>
              <Panel header="Post-Machining Steps" key="3">
                <div className={`p-4 rounded-lg ${fieldsDisabled ? "bg-gray-50" : "border"}`}>
                  {renderHtml(postMachining) || "No data available"}
                </div>
            </Panel>
          </Collapse>
        </Card>

        {/* Reference Images */}
          <Card 
            title={
              <div className="flex items-center space-x-2">
                <ImageIcon className="text-blue-500" />
                <span>Reference Images</span>
              </div>
            }
            className="shadow-sm border-0"
          >
            <div className="grid grid-cols-2 gap-6">
              <div>
              <Image
                src="/images/job_loading.png"
                alt="Job Loading"
                  className="rounded-lg"
              />
              <Text className="block mt-2 text-center">Job Loading</Text>
              </div>
              <div>
              <Image
                src="/images/post_machine.png"
                alt="Post Machining"
                  className="rounded-lg"
              />
              <Text className="block mt-2 text-center">Post Machining</Text>
              </div>
            </div>
        </Card>
      </div>
    )}
  </Drawer>
);
};

// Create a new component for the Download MPP button
const DownloadMppButton = ({ record, machineOperations }) => {
  const { fetchOperationDocuments, downloadDocumentById } = useWebSocketStore();
  
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

const OperationDetails = () => {
  const { currentMachine } = useAuthStore();
  const { 
    fetchMachineOperations, 
    machineOperations, 
    loading, 
    fetchOperationDocuments, 
    downloadDocumentById,
    openDocumentInNewTab
  } = useWebSocketStore();
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const handleDrawerClose = useCallback(() => {
    setShowDrawer(false);
    setSelectedOperation(null);
  }, []);

  useEffect(() => {
    if (currentMachine?.id) {
      fetchMachineOperations(currentMachine.id);
    }
  }, [currentMachine?.id, fetchMachineOperations]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { color: 'green', bg: 'bg-green-50', text: 'text-green-700' };
      case 'in progress':
        return { color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700' };
      case 'pending':
        return { color: 'orange', bg: 'bg-orange-50', text: 'text-orange-700' };
      default:
        return { color: 'default', bg: 'bg-gray-50', text: 'text-gray-700' };
    }
  };

  const columns = useMemo(() => [
    {
      title: 'Op. No',
      dataIndex: 'operation_number',
      key: 'operation_number',
      width: '10%',
    },
    {
      title: 'Operation',
      dataIndex: 'description',
      key: 'description',
      width: '30%',
    },
    {
      title: 'Start Time',
      dataIndex: 'planned_start_time',
      key: 'planned_start_time',
      width: '20%',
      render: (date) => format(new Date(date), 'dd/MM/yyyy HH:mm'),
    },
    {
      title: 'End Time',
      dataIndex: 'planned_end_time',
      key: 'planned_end_time',
      width: '20%',
      render: (date) => format(new Date(date), 'dd/MM/yyyy HH:mm'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '20%',
      render: (status) => {
        const colors = {
          completed: 'success',
          inprogress: 'processing',
          scheduled: 'default'
        };
        return (
          <Tag color={colors[status]}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button 
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              const partNumber = record.part_number || machineOperations?.inprogress?.[0]?.part_number;
              
              if (partNumber) {
                fetchOperationDocuments(partNumber, record.operation_number)
                  .then(result => {
                    if (result.success && result.data.mpp && result.data.mpp.id) {
                      message.success('MPP document found, opening in new tab...');
                      return openDocumentInNewTab(result.data.mpp.id);
                    } else {
                      const operationData = {
                        ...record,
                        part_number: partNumber
                      };
                      setSelectedOperation(operationData);
                      setShowDrawer(true);
                      return { success: true };
                    }
                  })
                  .then(result => {
                    if (!result.success) {
                      message.error(result.error || 'Failed to open document');
                    }
                  })
                  .catch(error => {
                    console.error('Error handling operation:', error);
                    message.error('Failed to process operation');
                    
                    const operationData = {
                      ...record,
                      part_number: partNumber
                    };
                    setSelectedOperation(operationData);
                    setShowDrawer(true);
                  });
              } else {
                message.warning('Part number not available');
                
                const operationData = {
                  ...record
                };
                setSelectedOperation(operationData);
                setShowDrawer(true);
              }
            }}
          >
            Details
          </Button>
        </Space>
      ),
    }
  ], [machineOperations, fetchOperationDocuments, openDocumentInNewTab, setSelectedOperation, setShowDrawer]);

  const allOperations = useMemo(() => {
    return [
      ...(machineOperations?.completed || []),
      ...(machineOperations?.inprogress || []),
      ...(machineOperations?.scheduled || [])
    ].sort((a, b) => a.operation_number - b.operation_number);
  }, [machineOperations]);

  if (loading) {
    return <Spin />;
  }

  const partInfo = {
    partNumber: 'PT-001',
    revision: 'Rev.01',
    material: 'Aluminum 6061',
    weight: '2.5 kg',
    dimensions: '200x150x100mm',
    documents: {
      drawings: ['DWG-001.pdf', 'DWG-002.pdf'],
      instructions: ['INST-001.pdf'],
      quality: ['QC-001.pdf']
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Part & Document Information */}
      <div className="grid grid-cols-2 gap-6">
        {/* <Card 
          title={
            <Space>
              <FileTextOutlined className="text-blue-500" />
              <span>Part Information</span>
            </Space>
          }
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text type="secondary">Part Number</Text>
              <div className="font-medium text-lg">{partInfo.partNumber}</div>
            </div>
            <div>
              <Text type="secondary">Revision</Text>
              <div className="font-medium text-lg">{partInfo.revision}</div>
            </div>
            <div>
              <Text type="secondary">Material</Text>
              <div className="font-medium">{partInfo.material}</div>
            </div>
            <div>
              <Text type="secondary">Weight</Text>
              <div className="font-medium">{partInfo.weight}</div>
            </div>
            <div className="col-span-2">
              <Text type="secondary">Dimensions</Text>
              <div className="font-medium">{partInfo.dimensions}</div>
            </div>
          </div>
        </Card> */}

        {/* <Card 
          title={
            <Space>
              <FileTextOutlined className="text-blue-500" />
              <span>Documents</span>
            </Space>
          }
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="space-y-4">
            <div>
              <Text type="secondary">Drawings</Text>
              <div className="mt-2 flex gap-2">
                {partInfo.documents.drawings.map(doc => (
                  <Button 
                    key={doc}
                    size="small"
                    icon={<FileTextOutlined />}
                    className="hover:scale-105 transition-transform"
                  >
                    {doc}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Text type="secondary">Instructions</Text>
              <div className="mt-2 flex gap-2">
                {partInfo.documents.instructions.map(doc => (
                  <Button 
                    key={doc}
                    size="small"
                    type="primary"
                    ghost
                    icon={<FileTextOutlined />}
                    className="hover:scale-105 transition-transform"
                  >
                    {doc}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card> */}
      </div>

      {/* Operation Sequence Card */}
      <Card 
        className="shadow-sm hover:shadow-md transition-shadow"
        title={
          <div className="flex items-center justify-between">
            <Space>
              <ToolOutlined className="text-blue-500" />
              <Title level={5} className="mb-0">Operation Sequence</Title>
            </Space>
            <Space>
              <Upload 
                accept=".pdf" 
                showUploadList={false}
                className="hover:scale-105 transition-transform"
              >
               
              </Upload>
            </Space>
          </div>
        }
      >
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