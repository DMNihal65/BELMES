import React, { useState } from 'react';
import { Table, Tag, Button, Space, Tooltip, Modal, Input, message, Card, Form, Row, Col,   Input as AntInput  } from 'antd';
import { EyeOutlined, CheckOutlined } from '@ant-design/icons';
import 'tailwindcss/tailwind.css';

const RequestTable = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [itemInfoModalVisible, setItemInfoModalVisible] = useState(false);
  const [selectedItemInfo, setSelectedItemInfo] = useState(null);
  const [RequestData, setRequestData] = useState([
    {
      id: 1,
      inventory_item_id: 1,
      inventory_item_code: "b18f8976-f1b",
      actual_return_date: "2025-08-25T06:28:21.297253",
      approved_at: "2025-08-25T06:22:26.993645",
      approved_by: 8,
      approved_by_username: "admin",
      created_at: "2025-08-25T06:16:39.895714",
      expected_return_date: "2025-08-28T18:30:00",
      inventory_item_details: {
        id: 1,
        item_code: "b18f8976-f1b",
        dynamic_data: {Sno: 1, Name: "TESTITEM", Quanitty: 100},
        available_quantity: 91,
        quantity: 96,
        status: "Active",
        subcategory: {id: 1, name: "EndMills", description: "Test", category: {id: 1, name: "tools", description: "tools"}},
        category: {id: 1, name: "tools", description: "tools"}
      },
      operation_id: 1279,
      operation_name: "PLATING",
      order_id: 399,
      order_name: "10486027",
      purpose: "tEST",
      quantity: 20,
      remarks: "Test",
      requested_by: 2,
      requested_by_username: "operator",
      status: "Returned",
      updated_at: "2025-08-25T06:28:21.297253"
    },
    {
      id: 2,
      inventory_item_id: 2,
      inventory_item_code: "bfd46abe-a9a",
      actual_return_date: "2025-08-26T03:57:26.260573",
      approved_at: "2025-08-26T03:54:26.654715",
      approved_by: 8,
      approved_by_username: "admin",
      created_at: "2025-08-26T03:54:13.275480",
      expected_return_date: "2025-08-29T18:30:00",
      inventory_item_details: {
        id: 2,
        item_code: "bfd46abe-a9a",
        dynamic_data: {Sno: 2, Name: "Second-Item", Quanitty: 100},
        available_quantity: 100,
        quantity: 100,
        status: "Active",
        subcategory: {id: 1, name: "EndMills", description: "Test", category: {id: 1, name: "tools", description: "tools"}},
        category: {id: 1, name: "tools", description: "tools"}
      },
      operation_id: 1179,
      operation_name: "CNC MILLING",
      order_id: 379,
      order_name: "MRFU FILTER HOUSING 11.07.25",
      purpose: "Test",
      quantity: 5,
      remarks: "Test",
      requested_by: 2,
      requested_by_username: "operator",
      status: "Returned",
      updated_at: "2025-08-26T03:57:26.260573"
    }
  ]);

  const handleGlobalSearch = (value) => {
    setSearchText(value);
  };

  // Modify the columns array to work with global search
  const getFilteredData = () => {
    if (!searchText) return RequestData;

    return RequestData.filter(item => {
      return Object.keys(item).some(key => {
        const value = item[key]?.toString().toLowerCase();
        return value?.includes(searchText.toLowerCase());
      });
    });
  };

  const handleDetails = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const handleItemInfoClick = (item) => {
    setSelectedItemInfo(item);
    setItemInfoModalVisible(true);
  };

  const handleApprove = (key) => {
    setRequestData((prevData) =>
      prevData.map((item) =>
        item.id === key ? { ...item, status: 'approved' } : item
      )
    );
    message.success('Request approved successfully!');
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

  const filteredData = RequestData.filter(
    (item) =>
      item.id.toString().toLowerCase().includes(searchText) ||
      item.inventory_item_code.toLowerCase().includes(searchText) ||
      item.status.toLowerCase().includes(searchText) ||
      item.requested_by_username.toLowerCase().includes(searchText) ||
      item.purpose.toLowerCase().includes(searchText) ||
      item.order_name.toLowerCase().includes(searchText) ||
      item.operation_name.toLowerCase().includes(searchText)
  );

  const columns = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Item Code',
      dataIndex: 'inventory_item_code',
      key: 'inventory_item_code',
      sorter: (a, b) => a.inventory_item_code.localeCompare(b.inventory_item_code),
    },
    {
      title: 'Item Info',
      key: 'item_info',
      width: 200,
      render: (_, record) => {
        const itemDetails = record.inventory_item_details;
        if (!itemDetails) return <span className="text-gray-400">-</span>;
        
        return (
          <div className="space-y-1">
            <div className="font-medium text-blue-600 cursor-pointer hover:text-blue-800" 
                 onClick={() => handleItemInfoClick(itemDetails)}>
              {itemDetails.subcategory?.name || 'N/A'}
            </div>
            <div className="text-xs text-gray-500">
              {itemDetails.category?.name || 'N/A'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      ellipsis: true,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
    },
    {
      title: 'Order',
      key: 'order_info',
      render: (_, record) => (
        <div className="text-center">
          <div className="font-medium">{record.order_id}</div>
          <div className="text-xs text-gray-500">{record.order_name}</div>
        </div>
      ),
    },
    {
      title: 'Operation',
      key: 'operation_info',
      render: (_, record) => (
        <div className="text-center">
          <div className="font-medium">{record.operation_id}</div>
          <div className="text-xs text-gray-500">{record.operation_name}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'pending' ? 'red' : status === 'Returned' ? 'gray' : 'green'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Requested By',
      dataIndex: 'requested_by_username',
      key: 'requested_by_username',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} onClick={() => handleDetails(record)} />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="Approve">
              <Button
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
                className="text-green-500"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
        <Card title="Requests Table" extra={
          <AntInput.Search
            placeholder="Search across all columns..."
            onChange={(e) => handleGlobalSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        }
        bordered={false} className="shadow-lg">

      <Table
        columns={columns}
        dataSource={getFilteredData()}
        rowKey="id"
        rowClassName={(record) => (record.status === 'pending' ? 'bg-red-50' : '')}
        pagination={{
          defaultPageSize: 5,
          showSizeChanger: true,
        }}
        scroll={{ x: 1400 }}
      />

      <Modal
        title="Request Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {selectedRecord && (
          <Form
            layout="vertical"
            initialValues={selectedRecord}
            onFinish={() => {}}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="id"
                  label="Request ID"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="inventory_item_code"
                  label="Item Code"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="purpose"
                  label="Purpose"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="quantity"
                  label="Quantity"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="order_id"
                  label="Order ID"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="order_name"
                  label="Order Name"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="operation_id"
                  label="Operation ID"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="operation_name"
                  label="Operation Name"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="Status"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="requested_by_username"
                  label="Requested By"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="created_at"
                  label="Created At"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="expected_return_date"
                  label="Expected Return"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="remarks"
              label="Remarks"
            >
              <Input.TextArea disabled rows={3} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Item Info Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <EyeOutlined />
            <span>Item Details</span>
          </div>
        }
        open={itemInfoModalVisible}
        onCancel={() => setItemInfoModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedItemInfo && (
          <div className="space-y-4">
            {/* Basic Item Information */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-3">Basic Information</h4>
              <Row gutter={16}>
                <Col span={12}>
                  <div className="mb-2">
                    <span className="text-gray-600">Item ID:</span>
                    <span className="ml-2 font-medium">{selectedItemInfo.id}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-gray-600">Item Code:</span>
                    <span className="ml-2 font-medium text-blue-600">{selectedItemInfo.item_code}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 font-medium text-green-600">{selectedItemInfo.category?.name || 'N/A'}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="mb-2">
                    <span className="text-gray-600">Subcategory:</span>
                    <span className="ml-2 font-medium text-orange-600">{selectedItemInfo.subcategory?.name || 'N/A'}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-gray-600">Status:</span>
                    <Tag color={selectedItemInfo.status === 'Active' ? 'green' : 'red'} className="ml-2">
                      {selectedItemInfo.status}
                    </Tag>
                  </div>
                  <div className="mb-2">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="ml-2 font-medium">{selectedItemInfo.quantity || 0}</span>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Dynamic Data */}
            {selectedItemInfo.dynamic_data && Object.keys(selectedItemInfo.dynamic_data).length > 0 && (
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-medium mb-3">Dynamic Data</h4>
                <Row gutter={16}>
                  {Object.entries(selectedItemInfo.dynamic_data).map(([key, value]) => (
                    <Col span={12} key={key}>
                      <div className="mb-2">
                        <span className="text-gray-600">{key}:</span>
                        <span className="ml-2 font-medium">
                          {typeof value === 'number' ? value : value}
                        </span>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Quantity Information */}
            <div className="bg-green-50 p-4 rounded">
              <h4 className="font-medium mb-3">Quantity Information</h4>
              <Row gutter={16}>
                <Col span={8}>
                  <div className="mb-2">
                    <span className="text-gray-600">Available:</span>
                    <span className="ml-2 font-medium text-green-600">{selectedItemInfo.available_quantity || 0}</span>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="mb-2">
                    <span className="text-gray-600">Current:</span>
                    <span className="ml-2 font-medium">{selectedItemInfo.current_quantity || 0}</span>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="mb-2">
                    <span className="text-gray-600">Minimum:</span>
                    <span className="ml-2 font-medium">{selectedItemInfo.minimum_quantity || 0}</span>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>
      </Card>
    </div>
  );
};

export default RequestTable;
