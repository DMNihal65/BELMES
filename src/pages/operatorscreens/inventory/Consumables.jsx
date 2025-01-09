import React, { useState } from 'react';
import { Card, Table, Button, message, Modal, Row, Col , InputNumber, Alert,  Input as AntInput  } from 'antd';
import dayjs from 'dayjs';


const Consumables = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [requestStock, setRequestStock] = useState(1);
  const [stockError, setStockError] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [ConsumablesData, setConsumablesData] = useState([
    {
      key: '1',
      id: '001',
      order_id: 'ORD001', // Added order_id
      part_number: 'PART001', // Added part_number
      description: 'High precision end mill',
      unit_id: 'UNIT001', // Added unit_id
      available_from: dayjs().subtract(1, 'month').format('YYYY-MM-DD'), 
      stock: 10,
      status: 'Available',
    },
    {
      key: '2',
      id: '001',
      order_id: 'ORD001', // Added order_id
      part_number: 'PART001', // Added part_number
      description: 'Low precision end mill',
      unit_id: 'UNIT001', // Added unit_id
      available_from: dayjs().subtract(1, 'month').format('YYYY-MM-DD'), // Added available_from
      stock: 10,
      status: 'In Use',
    },
    // ... other existing data ...
  ]);

  const handleGlobalSearch = (value) => {
    setSearchText(value);
  };

  // Modify the columns array to work with global search
  const getFilteredData = () => {
    if (!searchText) return ConsumablesData;

    return ConsumablesData.filter(item => {
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
        message.error('Please enter a valid stock');
        return;
      }
      
      if (requestStock > selectedTool.stock) {
        message.error('Please enter a lower stock');
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

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    sorter: (a, b) => a.id.localeCompare(b.id),
    onFilter: (value, record) => record.id.includes(value),
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    sorter: (a, b) => a.description.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(ConsumablesData.map(item => item.description))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.description.includes(value),
  },
  {
    title: 'Unit ID',
    dataIndex: 'unit_id',
    key: 'unit_id',
    sorter: (a, b) => a.unit_id.localeCompare(b.type),
    filterSearch: true,
    filters: [...new Set(ConsumablesData.map(item => item.unit_id))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.unit_id.includes(value),
  },
  {
    title: 'Stock',
    dataIndex: 'stock',
    key: 'stock',
    sorter: (a, b) => a.stock - b.stock,
    filterSearch: true,
    filters: [...new Set(ConsumablesData.map(item => item.stock))].map(item => ({ text: item, value: item })),
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

  return (
    <div>
      <Card 
        title="Consumables Data"
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
      title={<div className="border-b border-gray-200 py-2">Request Consumables</div>}
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
      width={500}
    >
      {selectedTool && (
        <div className="py-4">
          {/* Tool Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="m-0 mb-4">Tool Information</h3>
            <Row gutter={[16, 16]}>
          <Col span={24}>
            <div className="mb-3">
              <div className="text-gray-500">ID</div>
              <div className="font-medium">{selectedTool.id}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Description</div>
              <div className="font-medium">{selectedTool.description}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Unit ID</div>
              <div className="font-medium">{selectedTool.unit_id}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Stock</div>
              <div className="font-medium">{selectedTool.stock}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Status</div>
              <div className="font-medium" style={{ color: selectedTool.status === 'Available' ? '#52c41a' : '#faad14' }}>
                {selectedTool.status}
              </div>
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
                  Enter Stock
                </div>
                <InputNumber
                  placeholder="Enter stock"
                  value={requestStock}
                  onChange={handleStockChange}
                  className="w-full"
                  status={stockError ? 'error' : ''}
                />
              </Col>
              
              <Col span={24}>
                {stockError && (
                  <Alert
                    message="Please Enter Lower Stock "
                    description={`Maximum available stock is ${selectedTool.stock}. Please enter a lower stock.`}
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

export default Consumables;