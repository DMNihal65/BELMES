import React, { useState } from 'react';
import { Card, Table, Button, message, Modal, Row, Col , InputNumber, Alert,  Input as AntInput, Select  } from 'antd';
import dayjs from 'dayjs';

const GaugesAndInstruments = () => {
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
  const [GaugesAndInstrumentsData, setGaugesAndInstrumentsData] = useState([
    {
      key: '1',
      id: '001',
      type: 'Type A',
      description: 'High precision end mill',
      instrument_code: 'INST001',
      size: '8mm',
      equipment_number: 'EQ001',
      maintenance_plan: 'Monthly',
      notification_number: 'NOTIF001',
      calibration_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
      calibration_due_date: dayjs().add(1, 'month').format('YYYY-MM-DD'),
      location: 'Warehouse 1',
      stock: 10,
      status: 'Available',
    },
    {
      key: '2',
      id: '001',
      type: 'Type A',
      description: 'low precision end mill',
      instrument_code: 'INST001',
      size: '8mm',
      equipment_number: 'EQ001',
      maintenance_plan: 'Monthly',
      notification_number: 'NOTIF001',
      calibration_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
      calibration_due_date: dayjs().add(1, 'month').format('YYYY-MM-DD'),
      location: 'Warehouse 1',
      stock: 10,
      status: 'In Use',
    },
    // ... other existing data ...
  ]);


  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id.localeCompare(b.id),
      onFilter: (value, record) => record.key === value,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a, b) => a.type.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.type))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.type.includes(value),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      sorter: (a, b) => a.description.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.description))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.description.includes(value),
    },
    {
      title: 'Instrument Code',
      dataIndex: 'instrument_code',
      key: 'instrument_code',
      sorter: (a, b) => a.instrument_code.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.instrument_code))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.instrument_code.includes(value),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      sorter: (a, b) => a.size.localeCompare(b.size),
    },
    {
      title: 'Equipment Number',
      dataIndex: 'equipment_number',
      key: 'equipment_number',
      sorter: (a, b) => a.equipment_number.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.equipment_number))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.equipment_number.includes(value),
    },
    {
      title: 'Maintenance Plan',
      dataIndex: 'maintenance_plan',
      key: 'maintenance_plan',
      sorter: (a, b) => a.maintenance_plan.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.maintenance_plan))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.maintenance_plan.includes(value),
    },
    {
      title: 'Notification Number',
      dataIndex: 'notification_number',
      key: 'notification_number',
      sorter: (a, b) => a.notification_number.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.notification_number))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.notification_number.includes(value),
    },
    {
      title: 'Calibration Date',
      dataIndex: 'calibration_date',
      key: 'calibration_date',
      sorter: (a, b) => a.calibration_date.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.calibration_date))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.calibration_date.includes(value),
    },
    {
      title: 'Calibration Due Date',
      dataIndex: 'calibration_due_date',
      key: 'calibration_due_date',
      sorter: (a, b) => a.calibration_due_date.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.calibration_due_date))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.calibration_due_date.includes(value),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      sorter: (a, b) => a.location.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.location))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.location.includes(value),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a, b) => a.stock.localeCompare(b.type),
      filterSearch: true,
      filters: [...new Set(GaugesAndInstrumentsData.map(item => item.stock))].map(item => ({ text: item, value: item })),
      onFilter: (value, record) => record.stock.includes(value),
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

  const handleGlobalSearch = (value) => {
    setSearchText(value);
  };

  // Modify the columns array to work with global search
  const getFilteredData = () => {
    if (!searchText) return GaugesAndInstrumentsData;

    return GaugesAndInstrumentsData.filter(item => {
      return Object.keys(item).some(key => {
        const value = item[key]?.toString().toLowerCase();
        return value?.includes(searchText.toLowerCase());
      });
    });
  };

  const handlePartNumberSelect = (value) => {
    setPartNumber(value || '');
  };

  // Add this function to handle order number input
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
      setStockError(false);
    };

  return (
    <div>
      <Card 
        title="GaugesAndInstruments Data"
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
        title={<div className="border-b border-gray-200 py-2">Request Gauges and Instruments Tool</div>}
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
              <div className="text-gray-500">Type</div>
              <div className="font-medium">{selectedTool.type}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Description</div>
              <div className="font-medium">{selectedTool.description}</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="mb-3">
              <div className="text-gray-500">Instrument Code</div>
              <div className="font-medium">{selectedTool.instrument_code}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Size</div>
              <div className="font-medium">{selectedTool.size}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Equipment Number</div>
              <div className="font-medium">{selectedTool.equipment_number}</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="mb-3">
              <div className="text-gray-500">Maintenance Plan</div>
              <div className="font-medium">{selectedTool.maintenance_plan}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Location</div>
              <div className="font-medium">{selectedTool.location}</div>
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
                    Enter Stock Stock
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
                      message="Please Enter Lower Stock"
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

export default GaugesAndInstruments;