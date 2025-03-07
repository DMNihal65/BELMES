import React, { useState } from 'react';
import { 
  Table, Card, Button, Space, Drawer, Upload, 
  Tabs, Typography, Tag, Image, Tooltip, Steps,
  Divider, Row, Col, Progress, Badge, Descriptions,Collapse,List
} from 'antd';
import { 
  FileTextOutlined, EyeOutlined, UploadOutlined,
  InfoCircleOutlined, ToolOutlined, 
  ClockCircleOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import {
  Timer,  Settings, AlertTriangle,
  CheckCircle2, Image as ImageIcon
} from 'lucide-react';

const { Title, Text } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;

const OperationDetails = ({ jobData }) => {
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const operations = [
    {
      id: 1,
      opNo: 'OP10',
      description: 'Face Milling',
      machine: 'VMC-001',
      cycleTime: '5:30',
      tools: ['T101', 'T102'],
      fixtures: ['F-123'],
      status: 'completed',
      parameters: {
        speed: '1200 RPM',
        feed: '300 mm/min',
        doc: '0.5 mm'
      },
      images: ['/images/op10-setup.jpg'],
      notes: 'Ensure perpendicularity within 0.01mm',
      progress: 100
    },
    {
      id: 2,
      opNo: 'OP20',
      description: 'Drilling Operation',
      machine: 'VMC-002',
      cycleTime: '3:45',
      tools: ['T201'],
      fixtures: ['F-124'],
      status: 'in-progress',
      parameters: {
        speed: '800 RPM',
        feed: '200 mm/min',
        doc: '2 mm'
      },
      images: ['/images/op20-setup.jpg'],
      notes: 'Check hole position tolerance',
      progress: 65
    },
    // Add more operations...
  ];

  const columns = [
    {
      title: 'Op. No',
      dataIndex: 'opNo',
      width: 80,
      fixed: 'left',
      render: (text) => (
        <Text strong className="text-blue-600">{text}</Text>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: 200,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div className="mt-1">
            <Progress 
              percent={record.progress} 
              size="small" 
              status={record.status === 'completed' ? 'success' : 'active'}
              className="mb-0"
            />
          </div>
        </div>
      )
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      width: 120,
      render: (text) => (
        <Tag 
          icon={<ToolOutlined size={14} />}
          color="blue"
          className="px-3 py-1"
        >
          {text}
        </Tag>
      )
    },
    {
      title: 'Time',
      dataIndex: 'cycleTime',
      width: 100,
      render: (text) => (
        <Tag 
          icon={<Timer size={14} />}
          className="px-3 py-1"
        >
          {text}
        </Tag>
      )
    },
    {
      title: 'Status',
      width: 120,
      render: (_, record) => {
        const statusConfig = {
          completed: { color: 'success', icon: <CheckCircle2 size={14} /> },
          'in-progress': { color: 'processing', icon: <Timer size={14} /> },
          pending: { color: 'default', icon: <AlertTriangle size={14} /> }
        };
        const config = statusConfig[record.status];
        
        return (
          <Badge 
            status={config.color}
            text={
              <Space>
                {config.icon}
                <span className="capitalize">{record.status}</span>
              </Space>
            }
          />
        );
      }
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
          onClick={() => {
            setSelectedOperation(record);
            setShowDrawer(true);
          }}
          className="hover:scale-105 transition-transform"
        >
          Details
        </Button>
      ),
    },
  ];

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
                {/* <Button icon={<UploadOutlined />}>
                  Upload MPP
                </Button> */}
              </Upload>
            </Space>
          </div>
        }
      >
        <Table 
          columns={columns} 
          dataSource={operations}
          rowKey="id"
          pagination={false}
          className="operation-table"
          rowClassName={(record) => 
            `operation-row ${record.status === 'completed' ? 'bg-green-50' : ''}`
          }
        />
      </Card>

     {/* Operation Details Drawer */}
     <Drawer
        title={
          <Space>
            <Text strong className="text-lg">
              Operation {selectedOperation?.opNo}
            </Text>
            <Tag color="blue">{selectedOperation?.description}</Tag>
          </Space>
        }
        placement="right"
        width={720}
        onClose={() => setShowDrawer(false)}
        open={showDrawer}
        className="operation-drawer"
      >
        {selectedOperation && (
          <div className="space-y-6">
            {/* Fixture and IPID Information */}
            <Card title="Fixture & IPID Details" className="shadow-sm">
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
            <Card title="Datum Information" className="shadow-sm">
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
            <Card title="Work Holding Instructions" className="shadow-sm">
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
                <Panel header="Job Preparation" key="2">
                  <List>
                    <List.Item>
                      <Text>Ensure that the job surface butting to the fixture is burr free.</Text>
                    </List.Item>
                    <List.Item>
                      <Text>Ensure guide holes to be maintained to required tolerance as per program.</Text>
                    </List.Item>
                  </List>
                </Panel>
                <Panel header="Post-Machining Steps" key="3">
                  <List>
                    <List.Item>
                      <Text>Blow off any chips, coolant, foreign materials with compressed air after completion of job.</Text>
                    </List.Item>
                    <List.Item>
                      <Text>Perform necessary stage inspections as per IPID.</Text>
                    </List.Item>
                    <List.Item>
                      <Text>Wrap the job in bubble sheet to prevent any damage and store it in a plastic cover.</Text>
                    </List.Item>
                    <List.Item>
                      <Text>Attach the existing job card to the batch after completion of machining.</Text>
                    </List.Item>
                  </List>
                </Panel>
              </Collapse>
            </Card>

            {/* Reference Images */}
            <Card title="Reference Images" className="shadow-sm">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Image
                    src="/images/job_loading.png"
                    alt="Job Loading"
                    className="rounded-lg shadow-sm hover:shadow-md transition-transform"
                  />
                  <Text className="block mt-2 text-center">Job Loading</Text>
                </Col>
                <Col span={12}>
                  <Image
                    src="/images/post_machine.png"
                    alt="Post Machining"
                    className="rounded-lg shadow-sm hover:shadow-md transition-transform"
                  />
                  <Text className="block mt-2 text-center">Post Machining</Text>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Drawer>

      <style jsx global>{`
        .operation-table .ant-table-cell {
          padding: 12px 16px;
        }

        .operation-row {
          cursor: pointer;
          transition: all 0.2s;
        }

        .operation-row:hover {
          background-color: #f5f5f5;
          transform: translateX(4px);
        }

        .operation-drawer .ant-drawer-header {
          padding: 16px 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .operation-drawer .ant-drawer-body {
          padding: 24px;
        }

        .ant-card {
          border-radius: 8px;
        }

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

        /* Add subtle animations */
        .ant-card, .ant-btn, .ant-tag {
          transition: all 0.2s ease-in-out;
        }

        .ant-card:hover {
          transform: translateY(-2px);
        }

        .ant-btn:hover {
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default OperationDetails;