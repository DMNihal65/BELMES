import React, { useState } from 'react';
import { Card, Table, Button, Row, Col, Space, Modal, InputNumber } from 'antd';
import { ToolOutlined, CheckCircleOutlined, ArrowUpOutlined } from '@ant-design/icons';

function Inventory() {
    // Add new state variables
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTool, setSelectedTool] = useState(null);
    const [requestQuantity, setRequestQuantity] = useState(1);
    const [quantityError, setQuantityError] = useState(false);
    
  // Sample data for cards
  const summaryData = {
    totalTools: 4689,
    totalToolsChange: 8.5,
    totalToolsPeriod: 'Up from past week',
    availableTools: 293,
    availableToolsChange: 1.3,
    availableToolsPeriod: 'Up from yesterday',
  };

  // Sample data for table
  const toolsData = [
    {
      key: '1',
      toolId: 'T001',
      toolName: 'Power Drill',
      partNumber: 'PN-001',
      category: 'Cutting Tools',
      quantity: 5,
      location: 'Warehouse A',
      lastUpdated: '2024-03-15',
      status: 'Available',
    },
    {
      key: '2',
      toolId: 'T002',
      toolName: 'Circular Saw',
      partNumber: 'PN-002',
      category: 'Cutting Tools',
      quantity: 3,
      location: 'Warehouse B',
      lastUpdated: '2024-03-14',
      status: 'In Use',
    },
    {
      key: '3',
      toolId: 'T003',
      toolName: 'Wrench Set',
      partNumber: 'PN-003',
      category: 'Tool Holders',
      quantity: 8,
      location: 'Warehouse A',
      lastUpdated: '2024-03-13',
      status: 'Available',
    },
    {
      key: '4',
      toolId: 'T004',
      toolName: 'Safety Goggles',
      partNumber: 'PN-004',
      category: 'Consumables',
      quantity: 0,
      location: 'Warehouse C',
      lastUpdated: '2024-03-12',
      status: 'In Use',
    },
    {
      key: '5',
      toolId: 'T005',
      toolName: 'Hammer',
      partNumber: 'PN-005',
      category: 'Raw Materials',
      quantity: 12,
      location: 'Warehouse B',
      lastUpdated: '2024-03-11',
      status: 'Available',
    },
    {
      key: '6',
      toolId: 'T006',
      toolName: 'Screwdriver Set',
      partNumber: 'PN-006',
      category: 'Tool Holders',
      quantity: 4,
      location: 'Warehouse A',
      lastUpdated: '2024-03-10',
      status: 'In Use',
    },
    {
      key: '7',
      toolId: 'T007',
      toolName: 'Level Tool',
      partNumber: 'PN-007',
      category: 'Measuring Instruments',
      quantity: 6,
      location: 'Warehouse C',
      lastUpdated: '2024-03-09',
      status: 'Available',
    },
    {
      key: '8',
      toolId: 'T008',
      toolName: 'Measuring Tape',
      partNumber: 'PN-008',
      category: 'Measuring Instruments',
      quantity: 15,
      location: 'Warehouse B',
      lastUpdated: '2024-03-08',
      status: 'Available',
    },
    {
      key: '9',
      toolId: 'T009',
      toolName: 'Machine Oil',
      partNumber: 'PN-009',
      category: 'Consumables',
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
      title: 'Part Number',
      dataIndex: 'partNumber',
      key: 'partNumber',
      sorter: (a, b) => a.partNumber.localeCompare(b.partNumber),
      filterSearch: true,
      filters: [...new Set(toolsData.map(item => ({
        text: item.partNumber,
        value: item.partNumber,
      })))],
      onFilter: (value, record) => record.partNumber.indexOf(value) === 0,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
      
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      filters: [
        { text: 'Raw Materials', value: 'Raw Materials' },
        { text: 'Cutting Tools', value: 'Cutting Tools' },
        { text: 'Consumables', value: 'Consumables' },
        { text: 'Spares', value: 'Spares' },
        { text: 'Tool Holders', value: 'Tool Holders' },
        { text: 'Jigs & Fixtures', value: 'Jigs & Fixtures' },
        { text: 'Measuring Instruments', value: 'Measuring Instruments' },
      ],
      onFilter: (value, record) => record.category === value,
      sorter: (a, b) => a.category.localeCompare(b.category),
      filterSearch: true,
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
      filterSearch: true,
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
      filterSearch: true,
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
          className="bg-sky-400 text-white hover:bg-sky-500"
          disabled={record.status === 'In Use'}
          onClick={() => handleRequest(record)}
        >
          Request
        </Button>
      ),
    },
  ];

  // Update handleRequest function
  const handleRequest = (record) => {
    setSelectedTool(record);
    setRequestQuantity(1);
    setQuantityError(false);
    setIsModalVisible(true);
  };

    // Update quantity change handler
    const handleQuantityChange = (value) => {
      setRequestQuantity(value);
      setQuantityError(value > selectedTool.quantity);
    };
  
    // Update submit handler
    const handleSubmit = () => {
      if (requestQuantity > selectedTool.quantity) {
        setQuantityError(true);
        return;
      }
  
      console.log('Submitted request:', {
        tool: selectedTool,
        requestedQuantity: requestQuantity
      });
      setIsModalVisible(false);
      setSelectedTool(null);
      setRequestQuantity(1);
      setQuantityError(false);
    };

  return (
    <div style={{ padding: '24px' }}>
      {/* Tools Table */}
      <Card 
        title="Tools Inventory" 
        className="mt-6"
      >
        <Table 
          columns={columns} 
          dataSource={toolsData}
          pagination={{ 
            pageSize: 8,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          // scroll={{ x: 1000 }}
           className="overflow-x-auto"
        />
      </Card>

      {/* Request Tool Modal */}
      <Modal
         title={<div className="border-b border-gray-200 py-2">Request Tool</div>}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setQuantityError(false);
        }}
        okText="Submit Request"
        okButtonProps={{ 
          disabled: quantityError,
          className: 'bg-sky-500'
        }}
        width={500}
      >
        {selectedTool && (
         <div className="py-4">
            {/* Tool Information Section */}
            <div className="bg-pale-sky-50 p-4 rounded-lg mb-5">
            <h3 className="m-0 mb-4">Tool Information</h3>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div>
                  <div className="text-pale-sky-600">Tool ID</div>
                  <div className="font-medium">{selectedTool.toolId}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <div className="text-pale-sky-600">Tool Name</div>
                    <div className="font-medium">{selectedTool.toolName}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <div className="text-pale-sky-600">Available Quantity</div>
                    <div className="font-medium">{selectedTool.quantity}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <div className="text-pale-sky-600">Location</div>
                    <div className="font-medium">{selectedTool.location}</div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Request Quantity Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="m-0 mb-4">Request Details</h3>
              <div>
              <div className="text-gray-500 mb-2">Request Quantity</div>
                <InputNumber
                  min={1}
                  max={selectedTool.quantity}
                  value={requestQuantity}
                  onChange={handleQuantityChange}
                  className="w-full"
                  status={quantityError ? 'error' : ''}
                />
               {quantityError && (
                <div className="text-red-500 text-sm mt-2">
                  Please enter a quantity less than or equal to {selectedTool.quantity}
                </div>
              )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Inventory;