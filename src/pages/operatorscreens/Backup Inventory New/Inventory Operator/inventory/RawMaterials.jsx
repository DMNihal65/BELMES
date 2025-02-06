import React, { useState } from 'react';
import { Card, Table, Button, message, Modal, Row, Col , InputNumber, Alert,  Input as AntInput, Select  } from 'antd';
import dayjs from 'dayjs';

const RawMaterials = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [requestStock, setRequestStock] = useState(1);
  const [stockError, setStockError] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderNumbers] = useState([
    'ORD-001', 'ORD-002', 'ORD-003', 'ORD-004', 'ORD-005'  // Add your order numbers here
  ]);
  const [partNumbers] = useState([
    'PART-001', 'PART-002', 'PART-003', 'PART-004', 'PART-005'  // Add your order numbers here
  ]);
  const [partNumber, setPartNumber] = useState('');
  const [RawMaterialsData, setRawMaterialsData] = useState([
    {
      key: '1',
      id: '001',
      order_id: 'ORD001', // Added order_id
      part_number: 'PART001', // Added part_number
      description: 'High precision end mill',
      stock: 10,
      unit_id: 'UNIT001', // Added unit_id
      available_from: dayjs().subtract(1, 'month').format('YYYY-MM-DD'), 
      status: 'Available',
    },
    {
      key: '2',
      id: '001',
      order_id: 'ORD001', // Added order_id
      part_number: 'PART001', // Added part_number
      description: 'low precision end mill',
      unit_id: 'UNIT001', 
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
    if (!searchText) return RawMaterialsData;

    return RawMaterialsData.filter(item => {
      return Object.keys(item).some(key => {
        const value = item[key]?.toString().toLowerCase();
        return value?.includes(searchText.toLowerCase());
      });
    });
  };

  const handlePartNumberSelect = (value) => {
    setPartNumber(value || '');
  };

  const handleOrderNumberSelect = (value) => {
    setOrderNumber(value || '');
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

      if (!orderNumber) {
        message.error('Please enter an order number');
        return;
      }
  
      if (!partNumber) {
        message.error('Please enter a part number');
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
      setOrderNumber('');
      setPartNumber('');
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
    title: 'Order ID',
    dataIndex: 'order_id',
    key: 'order_id',
    sorter: (a, b) => a.order_id.localeCompare(b.description),
    filterSearch: true,
    filters: [...new Set(RawMaterialsData.map(item => item.order_id))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.order_id.includes(value),
  },
  {
    title: 'Part Number',
    dataIndex: 'part_number',
    key: 'part_number',
    sorter: (a, b) => a.part_number.localeCompare(b.description),
    filterSearch: true,
    filters: [...new Set(RawMaterialsData.map(item => item.part_number))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.part_number.includes(value),
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    sorter: (a, b) => a.description.localeCompare(b.description),
    filterSearch: true,
    filters: [...new Set(RawMaterialsData.map(item => item.description))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.description.includes(value),
  },
  {
    title: 'Unit ID',
    dataIndex: 'unit_id',
    key: 'unit_id',
    sorter: (a, b) => a.unit_id.localeCompare(b.description),
    filterSearch: true,
    filters: [...new Set(RawMaterialsData.map(item => item.unit_id))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.unit_id.includes(value),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    sorter: (a, b) => a.status.localeCompare(b.description),
    filterSearch: true,
    filters: [...new Set(RawMaterialsData.map(item => item.status))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.status.includes(value),
  },
  {
    title: 'Available From',
    dataIndex: 'available_from',
    key: 'available_from',
    sorter: (a, b) => a.available_from.localeCompare(b.description),
    filterSearch: true,
    filters: [...new Set(RawMaterialsData.map(item => item.available_from))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.available_from.includes(value),
  },
  {
    title: 'Stock',
    dataIndex: 'stock',
    key: 'stock',
    sorter: (a, b) => a.stock - b.stock,
    filterSearch: true,
    filters: [...new Set(RawMaterialsData.map(item => item.stock))].map(item => ({ text: item, value: item })),
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
        type="primary"
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
        title="RawMaterials Data"
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
      title={<div className="border-b border-gray-200 py-2">Request Raw Materials Tool</div>}
      open={isModalVisible}
      onOk={handleSubmit}
      onCancel={() => {
        setIsModalVisible(false);
        setStockError(false);
      }}
      okText="Submit Request"
      okButtonProps={{ 
        disabled: stockError,
        className: 'bg-blue-500'
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
                  <div className="text-gray-500">ID</div>
                  <div className="font-medium">{selectedTool.id}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Order ID</div>
                  <div className="font-medium">{selectedTool.order_id}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Part Number</div>
                  <div className="font-medium">{selectedTool.part_number}</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="mb-3">
                  <div className="text-gray-500">Description</div>
                  <div className="font-medium">{selectedTool.description}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Unit ID</div>
                  <div className="font-medium">{selectedTool.unit_id}</div>
                </div>
                <div className="mb-3">
                  <div className="text-gray-500">Available From</div>
                  <div className="font-medium">{selectedTool.available_from}</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="mb-3">
                  <div className="text-gray-500">Status</div>
                  <div className="font-medium">{selectedTool.status}</div>
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
              <div className="text-gray-500 mb-2">Order Number</div>
              <Select
                id="orderNumberSelect"
                showSearch
                placeholder="Select or search order number"
                value={orderNumber || undefined}
                onChange={handleOrderNumberSelect}
                style={{ width: '100%' }}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                onSelect={() => document.getElementById('partNumberSelect').focus()}
              >
                {orderNumbers.map(order => (
                  <Select.Option key={order} value={order}>
                    {order}
                  </Select.Option>
                ))}
              </Select>
            </Col> 

              <Col span={24}>
                <div className="text-gray-500 mb-2">Part Number</div>
                <Select
                  id="partNumberSelect"
                  showSearch
                  placeholder="Select part number"
                  value={partNumber || undefined} 
                  onChange={handlePartNumberSelect}
                  style={{ width: '100%' }}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  onSelect={() => document.getElementById('stockInput').focus()}
                >
                  {partNumbers.map(partNum => (  /* Changed mapping logic */
                    <Select.Option key={partNum} value={partNum}>
                      {partNum}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              
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

export default RawMaterials;