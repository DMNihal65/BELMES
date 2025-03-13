import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Table, Card, Button, Space, Drawer, Upload, 
  Tabs, Typography, Tag, Image, Tooltip, Steps,
  Divider, Row, Col, Progress, Badge, Descriptions,Collapse,List, Spin
} from 'antd';
import { 
  FileTextOutlined, EyeOutlined, UploadOutlined,
  InfoCircleOutlined, ToolOutlined, 
  ClockCircleOutlined, CheckCircleOutlined
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

const OperationDrawer = ({ selectedOperation, showDrawer, onClose }) => (
  <Drawer
    title={
      <Space>
        <Text strong className="text-lg">
          Operation {selectedOperation?.operation_number}
        </Text>
        <Tag color="blue">{selectedOperation?.description}</Tag>
      </Space>
    }
    placement="right"
    width={720}
    onClose={onClose}
    open={showDrawer}
    destroyOnClose={true}
  >
    {selectedOperation && (
      <div className="space-y-6">
        {/* Fixture and IPID Information */}
        <Card title="Fixture & IPID Details">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Fixture No with Rev.">
              <Text strong>Fx-62805080AA-70.80-Rev.01</Text>
            </Descriptions.Item>
            <Descriptions.Item label="IPID No with Rev.">
              <Text strong>IPID-62805080AA-80-Rev.01</Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Datum Information */}
        <Card title="Datum Information">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Datum X Axis">
              <Text strong>0 at the job center</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Datum Y Axis">
              <Text strong>0 at the job center</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Datum Z Axis">
              <Text strong>+0.25mm at top of the job</Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Work Holding Instructions */}
        <Card title="Work Holding Instructions">
          <Collapse defaultActiveKey={['1']} ghost>
            <Panel header="Fixture Setup" key="1">
              <List>
                <List.Item>
                  <Text>Hold the fixture in vise with around 3 to 5 mm projection over jaws.</Text>
                </List.Item>
                <List.Item>
                  <Text>Clamp the job on fixture with (14X) MS screws while ensuring longest edge to be parallel to X axis within +/-0.1 mm through dialing.</Text>
                </List.Item>
              </List>
            </Panel>
          </Collapse>
        </Card>

        {/* Reference Images */}
        <Card title="Reference Images">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Image
                src="/images/job_loading.png"
                alt="Job Loading"
              />
              <Text className="block mt-2 text-center">Job Loading</Text>
            </Col>
            <Col span={12}>
              <Image
                src="/images/post_machine.png"
                alt="Post Machining"
              />
              <Text className="block mt-2 text-center">Post Machining</Text>
            </Col>
          </Row>
        </Card>
      </div>
    )}
  </Drawer>
);

const OperationDetails = () => {
  const { currentMachine } = useAuthStore();
  const { fetchMachineOperations, machineOperations, loading } = useWebSocketStore();
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
        <Button 
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedOperation(record);
            setShowDrawer(true);
          }}
        >
          Details
        </Button>
      ),
    }
  ], []);

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
        .operation-drawer .ant-drawer-header {
          padding: 16px 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .operation-drawer .ant-drawer-body {
          padding: 24px;
        }

        /* Remove hover and animation effects from cards inside drawer */
        .operation-drawer .ant-card {
          border-radius: 8px;
          transform: none !important;
          transition: none !important;
        }

        .operation-drawer .ant-card:hover {
          transform: none !important;
          box-shadow: none !important;
        }

        /* Keep other styles for main content */
        .ant-card-head {
          border-bottom: 1px solid #f0f0f0;
          padding: 16px 24px;
        }

        .ant-card-body {
          padding: 24px;
        }

        .ant-btn {
          border-radius: 6px;
        }

        .ant-tag {
          border-radius: 4px;
        }

        /* Keep animations only for main content */
        .operation-table .ant-card:hover {
          transform: translateY(-2px);
        }

        .operation-table .ant-btn:hover {
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default memo(OperationDetails);