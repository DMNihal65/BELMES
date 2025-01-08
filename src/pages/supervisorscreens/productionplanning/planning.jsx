import React, { useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Upload, 
  message, 
  Tooltip, 
  DatePicker, 
  Input,
  Tag 
} from 'antd';
import { 
  UploadOutlined, 
  DownloadOutlined, 
  SearchOutlined, 
  FilterOutlined 
} from '@ant-design/icons';

const Planning = () => {
  const [filteredInfo, setFilteredInfo] = useState({});
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  // File upload props
  const uploadProps = {
    name: 'file',
    action: 'your-upload-endpoint',
    headers: {
      authorization: 'authorization-text',
    },
    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Order No',
      dataIndex: 'orderNo',
      key: 'orderNo',
      sorter: (a, b) => a.orderNo.localeCompare(b.orderNo),
      filteredValue: filteredInfo.orderNo || null,
      onFilter: (value, record) => record.orderNo.includes(value),
    },
    {
      title: 'Part No',
      dataIndex: 'partNo',
      key: 'partNo',
      sorter: (a, b) => a.partNo.localeCompare(b.partNo),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Planned', value: 'planned' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Completed', value: 'completed' },
      ],
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const colors = {
          planned: 'blue',
          in_progress: 'orange',
          completed: 'green',
        };
        return (
          <Tag color={colors[status]}>
            {status.replace('_', ' ').toUpperCase()}
          </Tag>
        );
      },
    },
  ];

  // Sample data
  const data = [
    {
      key: '1',
      orderNo: 'ORD001',
      partNo: 'PT001',
      description: 'Component A',
      quantity: 100,
      startDate: '2024-03-15',
      endDate: '2024-03-20',
      status: 'planned',
    },
    // Add more sample data as needed
  ];

  return (
    <div className="p-6">
      <Card title="Production Planning" className="shadow-sm">
        <div className="mb-4 flex justify-between items-center">
          <Space>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Upload Plan</Button>
            </Upload>
            <Button icon={<DownloadOutlined />}>
              Download Template
            </Button>
          </Space>
          
          <Space>
            <DatePicker.RangePicker 
              className="w-64"
              onChange={(dates) => {
                // Handle date range filter
                console.log('Selected dates:', dates);
              }}
            />
            <Input
              placeholder="Search orders..."
              prefix={<SearchOutlined />}
              className="w-64"
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Tooltip title="Reset Filters">
              <Button 
                icon={<FilterOutlined />}
                onClick={() => {
                  setFilteredInfo({});
                  setSearchText('');
                }}
              >
                Reset
              </Button>
            </Tooltip>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          onChange={(pagination, filters) => {
            setFilteredInfo(filters);
          }}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </Card>
    </div>
  );
};

export default Planning; 