import React, { useState } from 'react';
import { 
  Card, 
  Table, 
  Space, 
  Button,
  Select,
  Row,
  Col,
  DatePicker,
  Radio,
  Tree,
  Input,
  message
} from 'antd';
import { 
  SearchOutlined,
  UploadOutlined,
  StarOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FolderOutlined,
  FileTextOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

const InspectionReport = () => {
  const [selectedReportType, setSelectedReportType] = useState('all');
  const [searchText, setSearchText] = useState('');

  // Tree data structure matching the image
  const treeData = [
    {
      title: 'Quality Reports',
      key: 'quality',
      icon: <FolderOutlined />,
      children: [
        {
          title: 'IPID Reports',
          key: 'ipid',
          children: [
            { title: 'January 2024', key: 'ipid-jan', icon: <FileTextOutlined /> },
            { title: 'February 2024', key: 'ipid-feb', icon: <FileTextOutlined /> },
          ],
        },
        {
          title: 'VMS Reports',
          key: 'vms',
          children: [
            { title: 'Machine Performance', key: 'vms-perf', icon: <FileTextOutlined /> },
            { title: 'Calibration Reports', key: 'vms-cal', icon: <FileTextOutlined /> },
          ],
        },
        {
          title: 'CMM Reports',
          key: 'cmm',
          children: [
            { title: 'Measurement Reports', key: 'cmm-meas', icon: <FileTextOutlined /> },
            { title: 'Analysis Reports', key: 'cmm-analysis', icon: <FileTextOutlined /> },
          ],
        },
      ],
    },
  ];

  // Table columns matching the image
  const columns = [
    {
      title: 'Report Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <a>{text}</a>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <div className="px-2 py-1 bg-blue-100 text-blue-600 rounded inline-block">
          {type}
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<StarOutlined />} type="text" />
          <Button icon={<DeleteOutlined />} type="text" danger />
          <Button type="link" icon={<FilePdfOutlined />}>PDF</Button>
          <Button type="link" icon={<FileExcelOutlined />}>Excel</Button>
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      name: 'Quality Metrics Report Q1',
      type: 'METRICS',
      date: '2024-01-15',
      status: 'Completed',
    },
  ];

  const handleLaunchQMS = () => {
    try {
      // Using registered protocol to launch QMS
      window.location.href = "myapp://launch-qms";
      message.success('Launching QMS application...');
    } catch (error) {
      console.error('Failed to launch QMS application:', error);
      message.error('Failed to launch QMS. Please ensure the application is properly installed.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      {/* Filters Section */}
      <Row gutter={[24, 24]} className="mb-6">
        <Col span={8}>
          <div className="font-medium mb-2">Date Range</div>
          <DatePicker.RangePicker 
            className="w-full"
            placeholder={['Start date', 'End date']}
          />
        </Col>
        <Col span={8}>
          <div className="font-medium mb-2">Report Type</div>
          <Select
            className="w-full"
            defaultValue="all"
            onChange={setSelectedReportType}
            options={[
              { value: 'all', label: 'All Reports' },
              { value: 'metrics', label: 'Quality Metrics' },
              { value: 'nonconformance', label: 'Non-conformance' },
            ]}
          />
        </Col>
        <Col span={8}>
          <Space direction="vertical" className="w-full">
            <div className="font-medium mb-2">Actions</div>
            <Space>
              <Radio.Group defaultValue="pdf">
                <Radio.Button value="pdf">PDF</Radio.Button>
                <Radio.Button value="excel">Excel</Radio.Button>
                <Radio.Button value="csv">CSV</Radio.Button>
              </Radio.Group>
              <Button 
                type="primary"
                icon={<AppstoreOutlined />}
                onClick={handleLaunchQMS}
              >
                Launch QMS
              </Button>
            </Space>
          </Space>
        </Col>
      </Row>

      {/* Content Section */}
      <Row gutter={24}>
        {/* Left Side - Tree */}
        <Col span={6}>
          <Card title="Report Categories" bordered={false}>
            <Tree
              treeData={treeData}
              defaultExpandAll
              showIcon
            />
          </Card>
        </Col>

        {/* Right Side - Table */}
        <Col span={18}>
          <Card 
            title="Reports List"
            bordered={false}
            extra={
              <Space>
                <Input
                  placeholder="Search files..."
                  prefix={<SearchOutlined />}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Button 
                  type="primary"
                  icon={<UploadOutlined />}
                >
                  Upload
                </Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={data}
              pagination={{
                current: 1,
                pageSize: 10,
                total: 1,
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InspectionReport;