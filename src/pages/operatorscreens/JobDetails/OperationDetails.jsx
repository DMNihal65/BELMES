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
  CheckCircle2, Image as ImageIcon, Clock
} from 'lucide-react';

const { Title, Text } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;

const OperationDetails = ({ jobData }) => {
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

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

  const operations = [
    {
      key: '1',
      operationNumber: '10',
      operation: 'CUTTING',
      // description: 'Initial machine setup and calibration',
      startTime: '08:00 AM',
      endTime: '09:00 AM',
      status: 'completed',
    },
    {
      key: '2',
      operationNumber: '20',
      operation: 'Stud milling',
      // description: 'CNC machining operation',
      startTime: '09:15 AM',
      endTime: null,
      status: 'in progress',
    },
    {
      key: '3',
      operationNumber: '30',
      operation: 'Top Ruf',
      // description: 'Dimensional inspection',
      status: 'pending',
    },
    // Add more operations as needed
  ];

  const columns = [
    {
      title: 'Op. No',
      dataIndex: 'operationNumber',
      key: 'operationNumber',
      width: 80,
      render: (text) => (
        <Text strong className="text-gray-700">
          {text}
        </Text>
      ),
    },
    {
      title: 'Operation',
      dataIndex: 'operation',
      key: 'operation',
      render: (text) => (
        <div className="font-medium">{text}</div>
      ),
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (text) => (
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gray-400" />
          <span>{text || 'Not started'}</span>
        </div>
      ),
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (text) => (
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gray-400" />
          <span>{text || 'Pending'}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const { color, bg, text } = getStatusColor(status);
        return (
          <Tag color={color} className={`${bg} ${text} border-0 font-medium`}>
            {status === 'in progress' && <Timer size={14} className="mr-1 inline-block" />}
            {status === 'completed' && <CheckCircle2 size={14} className="mr-1 inline-block" />}
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="text"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedOperation(record);
            setShowDrawer(true);
          }}
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
          className="operation-table"
          pagination={false}
          rowClassName={(record) => 
            `operation-row ${record.status === 'in progress' ? 'bg-blue-50' : ''}`
          }
        />
      </Card>

     {/* Operation Details Drawer */}
     <Drawer
        title={
          <div className="flex items-center gap-2">
            <Settings className="text-blue-500" />
            <span>Operation Details</span>
          </div>
        }
        placement="right"
        onClose={() => setShowDrawer(false)}
        open={showDrawer}
        width={500}
        className="operation-drawer"
      >
        {selectedOperation && (
          <div className="space-y-6">
            {/* Fixture and IPID Information */}
            <Descriptions title="Fixture & IPID Details" column={1} bordered>
              <Descriptions.Item label="Fixture No with Rev.">
                <Text strong>Fx-62805080AA-70.80-Rev.01</Text>
              </Descriptions.Item>
              <Descriptions.Item label="IPID No with Rev.">
                <Text strong>IPID-62805080AA-80-Rev.01</Text>
              </Descriptions.Item>
            </Descriptions>

            {/* Datum Information */}
            <Descriptions title="Datum Information" column={1} bordered>
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

            {/* Work Holding Instructions */}
            <Collapse defaultActiveKey={['1']}>
              <Panel header="Work Holding Instructions" key="1">
                <List
                  size="small"
                  bordered
                  dataSource={[
                    "1. Clean the fixture and job before loading",
                    "2. Ensure proper clamping pressure",
                    "3. Check for any debris or chips",
                    "4. Verify datum alignment"
                  ]}
                  renderItem={(item) => <List.Item>{item}</List.Item>}
                />
              </Panel>
            </Collapse>

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