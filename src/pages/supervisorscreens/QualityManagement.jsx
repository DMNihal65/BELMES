import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Select, 
  Table, 
  Tabs, 
  Progress, 
  Button, 
  Space, 
  Badge,
  Statistic,
  Upload,
  Dropdown,
  Menu
} from 'antd';
import {
  FileTextOutlined,
  UploadOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
  PieChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;

const QualityManagementDashboard = () => {
  const [selectedParts, setSelectedParts] = useState([]);
  const [activeTab, setActiveTab] = useState('1');

  // Sample data - replace with actual API calls
  const partOptions = [
    { value: 'PART-001', label: 'Motor Casing (PART-001)' },
    { value: 'PART-002', label: 'Top Cover (PART-002)' },
    { value: 'PART-003', label: 'Housing Assembly (PART-003)' }
  ];

  const operationColumns = [
    {
      title: 'Operation',
      dataIndex: 'operation',
      key: 'operation',
    },
    {
      title: 'Stage/Machine',
      dataIndex: 'stage',
      key: 'stage',
      render: (text, record) => (
        <Badge status={record.status === 'completed' ? 'success' : 'processing'} text={text} />
      )
    },
    {
      title: 'Operator',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: 'IPID Status',
      dataIndex: 'ipidStatus',
      key: 'ipidStatus',
      render: (status) => {
        const statusConfig = {
          completed: { icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />, text: 'Completed' },
          pending: { icon: <WarningOutlined style={{ color: '#faad14' }} />, text: 'Pending' },
          failed: { icon: <CloseCircleOutlined style={{ color: '#f5222d' }} />, text: 'Failed' }
        };
        return (
          <Space>
            {statusConfig[status].icon}
            {statusConfig[status].text}
          </Space>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<FileTextOutlined />}>View IPID</Button>
          <Button type="link" icon={<DownloadOutlined />}>Download Report</Button>
        </Space>
      )
    }
  ];

  const operationData = [
    {
      key: '1',
      operation: 'Milling',
      stage: 'DMG DMU 60 eVo',
      operator: 'John Doe',
      ipidStatus: 'completed',
    },
    {
      key: '2',
      operation: 'Turning',
      stage: 'DMG CTX BETA',
      operator: 'Jane Smith',
      ipidStatus: 'pending',
    }
  ];

  const handlePartSelect = (values) => {
    setSelectedParts(values);
  };

  const qualityMetrics = {
    totalParts: 100,
    goodParts: 85,
    badParts: 10,
    nonConformance: 5,
    yield: 85,
    deviations: 8
  };

  const reportMenu = (
    <Menu>
      <Menu.Item key="1">Final Inspection Report</Menu.Item>
      <Menu.Item key="2">CMM Report</Menu.Item>
      <Menu.Item key="3">VMS Report</Menu.Item>
      <Menu.Item key="4">Custom Report</Menu.Item>
    </Menu>
  );

  return (
    <div className="p-6">
      {/* Header Section */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={16}>
          <Card title="Part Selection">
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Select parts for quality analysis"
              onChange={handlePartSelect}
              options={partOptions}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Dropdown overlay={reportMenu} placement="bottomRight">
              <Button type="primary" icon={<FileTextOutlined />} block>
                Generate Reports
              </Button>
            </Dropdown>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Quality Overview" key="1">
          <Row gutter={[16, 16]}>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Total Parts"
                  value={qualityMetrics.totalParts}
                  prefix={<PieChartOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Good Parts"
                  value={qualityMetrics.goodParts}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Bad Parts"
                  value={qualityMetrics.badParts}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Yield (%)"
                  value={qualityMetrics.yield}
                  suffix="%"
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Deviations"
                  value={qualityMetrics.deviations}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Non-Conformance"
                  value={qualityMetrics.nonConformance}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Operation Status" className="mt-4">
            <Table 
              columns={operationColumns} 
              dataSource={operationData}
              expandable={{
                expandedRowRender: (record) => (
                  <p style={{ margin: 0 }}>
                    Detailed inspection parameters and measurements...
                  </p>
                ),
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="IPID Management" key="2">
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card title="IPID Templates">
                <Upload>
                  <Button icon={<UploadOutlined />}>Upload Template</Button>
                </Upload>
                <div className="mt-4">
                  <h4>Available Templates</h4>
                  {/* List of templates */}
                </div>
              </Card>
            </Col>
            <Col span={18}>
              <Card title="IPID Documents" 
                extra={
                  <Space>
                    <Button icon={<FolderOpenOutlined />}>Browse</Button>
                    <Button type="primary" icon={<FileTextOutlined />}>Create New</Button>
                  </Space>
                }
              >
                {/* IPID document management interface */}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Quality Reports" key="3">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="Generated Reports"
                extra={
                  <Space>
                    <Select defaultValue="all" style={{ width: 120 }}>
                      <Option value="all">All Reports</Option>
                      <Option value="cmm">CMM Reports</Option>
                      <Option value="vms">VMS Reports</Option>
                      <Option value="final">Final Inspection</Option>
                    </Select>
                    <Button type="primary">Generate New</Button>
                  </Space>
                }
              >
                {/* Report listing and management interface */}
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default QualityManagementDashboard;