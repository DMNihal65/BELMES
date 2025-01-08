import React, { useState } from 'react';
import { Card, Table, Button, message, Modal, Row, Col , InputNumber, Alert } from 'antd';
import dayjs from 'dayjs';

const Fixtures = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [requestStock, setRequestStock] = useState(1);
  const [stockError, setStockError] = useState(false);

  const [FixturesData, setFixturesData] = useState([
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
    filters: [...new Set(FixturesData.map(item => item.type))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.type.includes(value),
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    sorter: (a, b) => a.description.localeCompare(b.description),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.description))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.description.includes(value),
  },
  {
    title: 'Instrument Code',
    dataIndex: 'instrument_code',
    key: 'instrument_code',
    sorter: (a, b) => a.instrument_code.localeCompare(b.instrument_code),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.instrument_code))].map(item => ({ text: item, value: item })),
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
    sorter: (a, b) => a.equipment_number.localeCompare(b.equipment_number),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.equipment_number))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.equipment_number.includes(value),
  },
  {
    title: 'Maintenance Plan',
    dataIndex: 'maintenance_plan',
    key: 'maintenance_plan',
    sorter: (a, b) => a.maintenance_plan.localeCompare(b.maintenance_plan),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.maintenance_plan))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.maintenance_plan.includes(value),
  },
  {
    title: 'Notification Number',
    dataIndex: 'notification_number',
    key: 'notification_number',
    sorter: (a, b) => a.notification_number.localeCompare(b.notification_number),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.notification_number))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.notification_number.includes(value),
  },
  {
    title: 'Calibration Date',
    dataIndex: 'calibration_date',
    key: 'calibration_date',
    sorter: (a, b) => a.calibration_date.localeCompare(b.calibration_date),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.calibration_date))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.calibration_date.includes(value),
  },
  {
    title: 'Calibration Due Date',
    dataIndex: 'calibration_due_date',
    key: 'calibration_due_date',
    sorter: (a, b) => a.calibration_due_date.localeCompare(b.calibration_due_date),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.calibration_due_date))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.calibration_due_date.includes(value),
  },
  {
    title: 'Location',
    dataIndex: 'location',
    key: 'location',
    sorter: (a, b) => a.location.localeCompare(b.location),
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.location))].map(item => ({ text: item, value: item })),
    onFilter: (value, record) => record.location.includes(value),
  },
  {
    title: 'Stock',
    dataIndex: 'stock',
    key: 'stock',
    sorter: (a, b) => a.stock - b.stock,
    filterSearch: true,
    filters: [...new Set(FixturesData.map(item => item.stock))].map(item => ({ text: item, value: item })),
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
        title="Fixtures Data"
      >
        <Table 
          columns={columns} 
          dataSource={FixturesData}
          pagination={{ 
            pageSize: 8,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
 {/* Request Tool Modal */}
 <Modal
      title={<div className="border-b border-gray-200 py-2">Request Fixtures</div>}
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
            <div className="mb-3">
              <div className="text-gray-500">Instrument Code</div>
              <div className="font-medium">{selectedTool.instrument_code}</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="mb-3">
              <div className="text-gray-500">Size</div>
              <div className="font-medium">{selectedTool.size}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Equipment Number</div>
              <div className="font-medium">{selectedTool.equipment_number}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Maintenance Plan</div>
              <div className="font-medium">{selectedTool.maintenance_plan}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Notification Number</div>
              <div className="font-medium">{selectedTool.notification_number}</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="mb-3">
              <div className="text-gray-500">Calibration Date</div>
              <div className="font-medium">{selectedTool.calibration_date}</div>
            </div>
            <div className="mb-3">
              <div className="text-gray-500">Calibration Due Date</div>
              <div className="font-medium">{selectedTool.calibration_due_date}</div>
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

export default Fixtures;