import React from 'react';
import { Card, Table, Button, Row, Col, Space } from 'antd';
import { ToolOutlined, CheckCircleOutlined } from '@ant-design/icons';

function Inventory() {
  // Sample data for cards
  const summaryData = {
    totalTools: 156,
    availableTools: 98,
    inUseTools: 58,
  };

  // Sample data for table
  const toolsData = [
    {
      key: '1',
      toolId: 'T001',
      toolName: 'Power Drill',
      quantity: 5,
      location: 'Warehouse A',
      lastUpdated: '2024-03-15',
      status: 'Available',
    },
    {
      key: '2',
      toolId: 'T002',
      toolName: 'Circular Saw',
      quantity: 3,
      location: 'Warehouse B',
      lastUpdated: '2024-03-14',
      status: 'In Use',
    },
    {
      key: '3',
      toolId: 'T003',
      toolName: 'Wrench Set',
      quantity: 8,
      location: 'Warehouse A',
      lastUpdated: '2024-03-13',
      status: 'Available',
    },
    {
      key: '4',
      toolId: 'T004',
      toolName: 'Safety Goggles',
      quantity: 0,
      location: 'Warehouse C',
      lastUpdated: '2024-03-12',
      status: 'In Use',
    },
    {
      key: '5',
      toolId: 'T005',
      toolName: 'Hammer',
      quantity: 12,
      location: 'Warehouse B',
      lastUpdated: '2024-03-11',
      status: 'Available',
    },
    {
      key: '6',
      toolId: 'T006',
      toolName: 'Screwdriver Set',
      quantity: 4,
      location: 'Warehouse A',
      lastUpdated: '2024-03-10',
      status: 'In Use',
    },
    {
      key: '7',
      toolId: 'T007',
      toolName: 'Level Tool',
      quantity: 6,
      location: 'Warehouse C',
      lastUpdated: '2024-03-09',
      status: 'Available',
    },
    {
      key: '8',
      toolId: 'T008',
      toolName: 'Measuring Tape',
      quantity: 15,
      location: 'Warehouse B',
      lastUpdated: '2024-03-08',
      status: 'Available',
    },
    {
      key: '9',
      toolId: 'T009',
      toolName: 'Measuring Tape',
      quantity: 15,
      location: 'Warehouse D',
      lastUpdated: '2024-03-09',
      status: 'Available',
    },
    
  ];

  const columns = [
    {
      title: 'Tool ID',
      dataIndex: 'toolId',
      key: 'toolId',
      sorter: (a, b) => a.toolId.localeCompare(b.toolId),
      filterSearch: true,
      filters: [...new Set(toolsData.map(item => ({
        text: item.toolId,
        value: item.toolId,
      })))],
      onFilter: (value, record) => record.toolId.indexOf(value) === 0,
    },
    {
      title: 'Tool Name',
      dataIndex: 'toolName',
      key: 'toolName',
      sorter: (a, b) => a.toolName.localeCompare(b.toolName),
      filterSearch: true,
      filters: [...new Set(toolsData.map(item => ({
        text: item.toolName,
        value: item.toolName,
      })))],
      onFilter: (value, record) => record.toolName.indexOf(value) === 0,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      filters: [...new Set(toolsData.map(item => ({
        text: item.location,
        value: item.location,
      })))],
      onFilter: (value, record) => record.location === value,
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      sorter: (a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Available', value: 'Available' },
        { text: 'In Use', value: 'In Use' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <span style={{ color: status === 'Available' ? '#52c41a' : '#faad14' }}>
          {status}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          disabled={record.status === 'In Use'}
          onClick={() => handleRequest(record)}
        >
          Request
        </Button>
      ),
    },
  ];

  // Handler for request button
  const handleRequest = (record) => {
    console.log('Requesting tool:', record);
    // Add your request logic here
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card hoverable>
            <Space align="center">
              <ToolOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <div>
                <h3 style={{ margin: 0, color: '#8c8c8c' }}>Total Tools</h3>
                <h2 style={{ margin: '8px 0 0 0' }}>{summaryData.totalTools}</h2>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card hoverable>
            <Space align="center">
              <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
              <div>
                <h3 style={{ margin: 0, color: '#8c8c8c' }}>Available Tools</h3>
                <h2 style={{ margin: '8px 0 0 0' }}>{summaryData.availableTools}</h2>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
      
      {/* Tools Table */}
      <Card 
        title="Tools Inventory" 
        style={{ marginTop: '24px' }}
        extra={
          <Space>
            <Button type="primary">Add New Tool</Button>
            <Button>Export</Button>
          </Space>
        }
      >
        <Table 
          columns={columns} 
          dataSource={toolsData}
          pagination={{ 
            pageSize: 8,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}

export default Inventory;