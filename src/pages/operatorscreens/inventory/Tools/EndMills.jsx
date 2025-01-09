import React, { useState } from 'react';
import { Card, Table, Button, message, Modal, Form, Input, Row, Col, InputNumber, Alert, Input as AntInput   } from 'antd';


const EndMills = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [requestStock, setRequestStock] = useState(1);
  const [stockError, setStockError] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [EndMillsData, setEndMillsData] = useState([
    {
      key: '1',
      bel_part_number: '3105 120 201 59',
      bel_part_description: 'High precision end mill',
      tool_diameter: 8,
      shank_diameter: 6,
      no_of_flutes: 4,
      flute_length: 50,
      clearance_length: 50,
      total_length: 100,
      corner_radius: 0.5,
      suitable_for: 'Aluminum',
      type_project: 'Milling',
      stock: 10,
      status: 'Available',
      // status: 'In Use',
    },
    {
      key: '2',
      bel_part_number: '3105 120 201 59',
      bel_part_description: 'low precision end mill',
      tool_diameter: 8,
      shank_diameter: 6,
      no_of_flutes: 4,
      flute_length: 50,
      clearance_length: 50,
      total_length: 100,
      corner_radius: 0.5,
      suitable_for: 'Aluminum',
      type_project: 'Milling',
      stock: 10,
      status: 'In Use',
    },
    // ... other existing data ...
  ]);

  const columns = [
    {
      title: 'Sl No',
      dataIndex: 'key',
      key: 'key',
      sorter: (a, b) => a.key - b.key,
      onFilter: (value, record) => record.key === value,
    },
    {
        title: 'BEL Part Number',
        dataIndex: 'bel_part_number',
        key: 'bel_part_number',
        sorter: (a, b) => a.bel_part_number.localeCompare(b.bel_part_number),
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.bel_part_number))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.bel_part_number.includes(value),
    },
    {
        title: 'BEL Part Description',
        dataIndex: 'bel_part_description',
        key: 'bel_part_description',
        sorter: (a, b) => a.bel_part_description.localeCompare(b.bel_part_description),
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.bel_part_description))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.bel_part_description.includes(value),
    },
    {
        title: 'Tool Diameter',
        dataIndex: 'tool_diameter',
        key: 'tool_diameter',
        sorter: (a, b) => a.tool_diameter - b.tool_diameter,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.tool_diameter))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.tool_diameter === value,
    },
    {
        title: 'Shank Diameter',
        dataIndex: 'shank_diameter',
        key: 'shank_diameter',
        sorter: (a, b) => a.shank_diameter - b.shank_diameter,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.shank_diameter))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.shank_diameter === value,
    },
    {
        title: 'No. of Flutes',
        dataIndex: 'no_of_flutes',
        key: 'no_of_flutes',
        sorter: (a, b) => a.no_of_flutes - b.no_of_flutes,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.no_of_flutes))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.no_of_flutes === value,
    },
    {
        title: 'Flute Length',
        dataIndex: 'flute_length',
        key: 'flute_length',
        sorter: (a, b) => a.flute_length - b.flute_length,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.flute_length))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.flute_length === value,
    },
    {
        title: 'Clearance Length',
        dataIndex: 'clearance_length',
        key: 'clearance_length',
        sorter: (a, b) => a.clearance_length - b.clearance_length,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.clearance_length))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.clearance_length === value,
    },
    {
        title: 'Total Length',
        dataIndex: 'total_length',
        key: 'total_length',
        sorter: (a, b) => a.total_length - b.total_length,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.total_length))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.total_length === value,
    },
    {
        title: 'Corner Radius',
        dataIndex: 'corner_radius',
        key: 'corner_radius',
        sorter: (a, b) => a.corner_radius - b.corner_radius,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.corner_radius))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.corner_radius === value,
    },
    {
        title: 'Suitable For',
        dataIndex: 'suitable_for',
        key: 'suitable_for',
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.suitable_for))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.suitable_for.includes(value),
    },
    {
        title: 'Type Project',
        dataIndex: 'type_project',
        key: 'type_project',
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.type_project))].map(item => ({ text: item, value: item })),
        onFilter: (value, record) => record.type_project.includes(value),
    },
    {
        title: 'Stock',
        dataIndex: 'stock',
        key: 'stock',
        sorter: (a, b) => a.stock - b.stock,
        filterSearch: true,
        filters: [...new Set(EndMillsData.map(item => item.stock))].map(item => ({ text: item, value: item })),
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

  const handleGlobalSearch = (value) => {
    setSearchText(value);
  };

  // Modify the columns array to work with global search
  const getFilteredData = () => {
    if (!searchText) return EndMillsData;

    return EndMillsData.filter(item => {
      return Object.keys(item).some(key => {
        const value = item[key]?.toString().toLowerCase();
        return value?.includes(searchText.toLowerCase());
      });
    });
  };

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
        title="EndMills Data"
        extra={
          <AntInput.Search
            placeholder="Search across all columns..."
            onChange={(e) => handleGlobalSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        }
      >
        <Table 
          columns={columns} 
          dataSource={getFilteredData()}
          pagination={{ 
            pageSize: 8,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

       {/* Request Tool Modal */}
       <Modal
      title={<div className="border-b border-gray-200 py-2">Request EndMill Tool</div>}
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
                  <div className="text-gray-500">Tool Diameter</div>
                  <div className="font-medium">{selectedTool.tool_diameter}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">No. of Flutes</div>
                  <div className="font-medium">{selectedTool.no_of_flutes}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Clearance Length</div>
                  <div className="font-medium">{selectedTool.clearance_length}</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="mb-3">
                  <div className="text-gray-500">BEL Part Description</div>
                  <div className="font-medium">{selectedTool.bel_part_description}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Shank Diameter</div>
                  <div className="font-medium">{selectedTool.shank_diameter}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Flute Length</div>
                  <div className="font-medium">{selectedTool.flute_length}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Total Length</div>
                  <div className="font-medium">{selectedTool.total_length}</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="mb-3">
                  <div className="text-gray-500">Corner Radius</div>
                  <div className="font-medium">{selectedTool.corner_radius}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Suitable For</div>
                  <div className="font-medium">{selectedTool.suitable_for}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Type Project</div>
                  <div className="font-medium">{selectedTool.type_project}</div>
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

export default EndMills;