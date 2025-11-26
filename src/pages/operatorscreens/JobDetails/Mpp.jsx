import React, { useState } from 'react';
import { 
  Tabs, Table, Card, Space, Button, Tag, Typography, 
  Tooltip, Image, Divider, Steps, Row, Col, Alert 
} from 'antd';
import { 
  FileTextOutlined, ToolOutlined, ClockCircleOutlined,
  InfoCircleOutlined, PictureOutlined, WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import belImage from '../../../assets/bel.png';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Step } = Steps;

const MPP = () => {
  const [activeTab, setActiveTab] = useState('process');
  const [selectedOperation, setSelectedOperation] = useState(null);

  // Enhanced process data with more details
  const processData = [
    {
      opNo: '10',
      description: 'Verification of documents as per OARC',
      shtInd: 'N',
      workCenter: 'FABC-PC',
      machine: '',
      cycleTime: 'N/A',
      tools: [],
      fixtures: [],
      parameters: {},
      qualityChecks: ['Document verification', 'Material certification'],
      images: [],
      status: 'completed'
    },
    {
      opNo: '20',
      description: 'Cutting',
      shtInd: 'Y',
      workCenter: 'MMC1',
      machine: 'Any',
      cycleTime: '15:00',
      tools: ['T101', 'T102'],
      fixtures: ['F-201'],
      parameters: {
        speed: '800 RPM',
        feed: '200 mm/min',
        doc: '2mm'
      },
      qualityChecks: ['Length: 100±0.1mm', 'Width: 50±0.1mm'],
      images: ['/images/cutting-setup.jpg'],
      status: 'in-progress'
    },
    // ... other operations
  ];

  const columns = [
    {
      title: 'Op No',
      dataIndex: 'opNo',
      width: 80,
      fixed: 'left',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: 250,
    },
    {
      title: 'work centre',
      dataIndex: 'workCenter',
      width: 120,
      render: (text) => text ? <Tag color="blue">{text}</Tag> : '-'
    },
    {
      title: 'Machine',
      dataIndex: 'machine',
      width: 120,
      render: (text) => text ? <Tag color="green">{text}</Tag> : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (status) => (
        <Tag 
          icon={status === 'completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          color={status === 'completed' ? 'success' : 'processing'}
        >
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button 
          type="link" 
          onClick={() => setSelectedOperation(record)}
        >
          Details
        </Button>
      )
    }
  ];

  // Operation Details Modal Content
  const renderOperationDetails = () => (
    <Card className="mt-4">
      <Tabs>
        <TabPane 
          tab={
            <span>
              <ToolOutlined />
              Setup Details
            </span>
          } 
          key="setup"
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Tools Required" size="small">
                {selectedOperation?.tools.map(tool => (
                  <Tag key={tool} icon={<ToolOutlined />}>{tool}</Tag>
                ))}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Fixtures Required" size="small">
                {selectedOperation?.fixtures.map(fixture => (
                  <Tag key={fixture}>{fixture}</Tag>
                ))}
              </Card>
            </Col>
          </Row>
        </TabPane>
        <TabPane 
          tab={
            <span>
              <InfoCircleOutlined />
              Parameters
            </span>
          } 
          key="parameters"
        >
          <Table 
            dataSource={Object.entries(selectedOperation?.parameters || {}).map(([key, value]) => ({
              key,
              parameter: key,
              value
            }))}
            columns={[
              { title: 'Parameter', dataIndex: 'parameter' },
              { title: 'Value', dataIndex: 'value' }
            ]}
            pagination={false}
          />
        </TabPane>
        <TabPane 
          tab={
            <span>
              <PictureOutlined />
              Images
            </span>
          } 
          key="images"
        >
          <div className="grid grid-cols-2 gap-4">
            {selectedOperation?.images.map((image, index) => (
              <Image 
                key={index}
                src={image}
                alt={`Setup ${index + 1}`}
                className="rounded-lg"
              />
            ))}
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <Image
            src={belImage}
            alt="BEL Logo"
            width={200}
            preview={false}
          />
          <div className="text-center">
            <Title level={3} className="m-0">Manufacturing Process Plan</Title>
            <Text type="secondary">MPP-62805080AA Rev.01</Text>
          </div>
          <Space>
            <Button icon={<FileTextOutlined />}>
              Export PDF
            </Button>
            <Button icon={<PictureOutlined />}>
              View Drawings
            </Button>
          </Space>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="Part Information">
              {/* Part details */}
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="Document Information">
              {/* Document details */}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Card className="shadow-sm">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                <ClockCircleOutlined />
                Process Sequence
              </span>
            } 
            key="process"
          >
            <Table 
              columns={columns} 
              dataSource={processData}
              scroll={{ x: 1000 }}
              pagination={false}
            />
            {selectedOperation && renderOperationDetails()}
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <ToolOutlined />
                Tools & Fixtures
              </span>
            } 
            key="tools"
          >
            {/* Tools and Fixtures content */}
          </TabPane>

          <TabPane 
            tab={
              <span>
                <InfoCircleOutlined />
                Quality Parameters
              </span>
            } 
            key="quality"
          >
            {/* Quality parameters content */}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default MPP;


