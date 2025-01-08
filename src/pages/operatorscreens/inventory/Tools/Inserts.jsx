import React, { useState } from 'react';
import { Card, Table, Button, message, Modal, Row, Col , InputNumber, Alert } from 'antd';


const Inserts = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [requestStock, setRequestStock] = useState(1);
  const [stockError, setStockError] = useState(false);

  const [InsertsData, setInsertsData] = useState([
    {
      key: '1',
      bel_part_number: '3105 120 201 59',
      bel_part_description: 'High precision end mill',
      configuration: 'new', // Added new field
      type: 'type1', // Added new field
      size: '4', // Added new field
      no_of_edges: 4, // Added new field
      thickness: 7, // Added new field
      corner_radius: 2, // Added new field
      suitable_for: 'Aluminum',
      tool_material: 'Carbide',
      project: 'Milling',
      stock: 10,
      status: 'Available',
    },
    // ... other existing data ...
  ]);


const columns = [
    {
      title: 'SL. No',
      dataIndex: 'key',
      key: 'key',
      sorter: (a, b) => a.key - b.key,
    },
    {
      title: 'BEL Part Number',
      dataIndex: 'bel_part_number',
      key: 'bel_part_number',
      sorter: (a, b) => a.bel_part_number.localeCompare(b.bel_part_number),
    },
    {
      title: 'BEL Part Description',
      dataIndex: 'bel_part_description',
      key: 'bel_part_description',
      sorter: (a, b) => a.bel_part_description.localeCompare(b.bel_part_description),
    },
    {
      title: 'Configuration', // Added new column
      dataIndex: 'configuration',
      key: 'configuration',
      sorter: (a, b) => a.configuration.localeCompare(b.configuration),
    },
    {
      title: 'Type', // Added new column
      dataIndex: 'type',
      key: 'type',
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: 'Size', // Added new column
      dataIndex: 'size',
      key: 'size',
      sorter: (a, b) => a.size.localeCompare(b.size),
    },
    {
      title: 'No. of Edges', // Added new column
      dataIndex: 'no_of_edges',
      key: 'no_of_edges',
      sorter: (a, b) => a.no_of_edges - b.no_of_edges,
    },
    {
      title: 'Thickness', // Added new column
      dataIndex: 'thickness',
      key: 'thickness',
      sorter: (a, b) => a.thickness - b.thickness,
    },
    {
      title: 'Corner Radius', // Added new column
      dataIndex: 'corner_radius',
      key: 'corner_radius',
      sorter: (a, b) => a.corner_radius - b.corner_radius,
    },
    {
      title: 'Suitable For',
      dataIndex: 'suitable_for',
      key: 'suitable_for',
      filterSearch: true,
      filters: [...new Set(InsertsData.map(item => item.suitable_for))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.suitable_for.includes(value),
    },
    {
      title: 'Tool Material',
      dataIndex: 'tool_material',
      key: 'tool_material',
      filterSearch: true,
      filters: [...new Set(InsertsData.map(item => item.tool_material))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.tool_material.includes(value),
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      filterSearch: true,
      filters: [...new Set(InsertsData.map(item => item.project))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.project.includes(value),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a, b) => a.stock - b.stock,
      filterSearch: true,
      filters: [...new Set(InsertsData.map(item => item.stock))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.stock === value,
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

  const handleRequest = (record) => {
    setSelectedTool(record);
    setRequestStock(1);
    setStockError(false);
    setIsModalVisible(true);
  };

    // Update the handleStockChange function
    const handleStockChange = (value) => {
      if (value === null || value === undefined) {
        setRequestStock('');
        setStockError(false);
        return;
      }
      
      setRequestStock(value);
      if (value > selectedTool.stock) {
        setStockError(true);
      } else {
        setStockError(false);
      }
    };

    // Update the handleSubmit function
    const handleSubmit = () => {
      if (!requestStock || requestStock <= 0) {
        message.error('Please enter a valid quantity');
        return;
      }
      
      if (requestStock > selectedTool.stock) {
        message.error('Please enter a lower quantity');
        return;
      }

      console.log('Submitted request:', {
        tool: selectedTool,
        requestedStock: requestStock
      });
      
      message.success(`Successfully requested ${requestStock} ${requestStock === 1 ? 'stock' : 'stocks'}`);
      setIsModalVisible(false);
      setSelectedTool(null);
      setRequestStock('');
      setStockError(false);
    };

  return (
    <div>
      <Card 
        title="Inserts Data"
      >
        <Table 
          columns={columns} 
          dataSource={InsertsData}
          pagination={{ 
            pageSize: 8,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

 {/* Request Tool Modal */}
 <Modal
      title={<div className="border-b border-gray-200 py-2">Request Inserts Tool</div>}
      open={isModalVisible}
      onOk={handleSubmit}
      onCancel={() => {
        setIsModalVisible(false);
        setStockError(false);
      }}
      okText="Submit Request"
      okButtonProps={{ 
        disabled: stockError,
        className: 'bg-sky-500'
      }}
      width={800}
    >
      {selectedTool && (
        <div className="py-4">
          {/* Tool Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="m-0 mb-4">Tool Information</h3>
            <Row gutter={[16, 16]}>
          <Col span={8}>
            <div className="mb-3">
              <div className="text-gray-500">BEL Part Number</div>
              <div className="font-medium">{selectedTool.bel_part_number}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Configuration</div>
              <div className="font-medium">{selectedTool.configuration}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Type</div>
              <div className="font-medium">{selectedTool.type}</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="mb-3">
              <div className="text-gray-500">BEL Part Description</div>
              <div className="font-medium">{selectedTool.bel_part_description}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Size</div>
              <div className="font-medium">{selectedTool.size}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">No. of Edges</div>
              <div className="font-medium">{selectedTool.no_of_edges}</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="mb-3">
              <div className="text-gray-500">Thickness</div>
              <div className="font-medium">{selectedTool.thickness}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Corner Radius</div>
              <div className="font-medium">{selectedTool.corner_radius}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Available Stock</div>
              <div className="font-medium">{selectedTool.stock}</div>
            </div>
          </Col>
        </Row>
          </div>

      {/* Request Stock Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="m-0 mb-4">Request Details</h3>
          <div>
            <Row gutter={[0, 16]}>
              <Col span={24}>
                <div className="text-gray-500 mb-2">
                  Enter Stock Quantity
                </div>
                <InputNumber
                  placeholder="Enter quantity"
                  value={requestStock}
                  onChange={handleStockChange}
                  className="w-full"
                  status={stockError ? 'error' : ''}
                />
              </Col>
              
              <Col span={24}>
                {stockError && (
                  <Alert
                    message="Please Enter Lower Stock Quantity"
                    description={`Maximum available stock is ${selectedTool.stock}. Please enter a lower quantity.`}
                    type="error"
                    showIcon
                  />
                )}
              </Col>
            </Row>
          </div>
        </div>
        </div>
          )}
        </Modal>
    </div>
  );
};

export default Inserts;