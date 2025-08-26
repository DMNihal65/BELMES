import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Modal, 
  Input, 
  Form,
  InputNumber,
  Row,
  Col,
  Statistic,
  Empty,
  Tooltip
} from 'antd';
import { 
  HistoryOutlined, 
  UndoOutlined, 
  ReloadOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import useInventoryStore from '../../../store/inventory-store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const InventoryHistory = () => {
  const [loading, setLoading] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [itemInfoModalVisible, setItemInfoModalVisible] = useState(false);
  const [selectedItemInfo, setSelectedItemInfo] = useState(null);

  const { 
    requests, 
    fetchUserRequests, 
    submitReturnRequest,
    loading: storeLoading 
  } = useInventoryStore();

  useEffect(() => {
    loadUserRequests();
  }, []);

  const loadUserRequests = async () => {
    setLoading(true);
    try {
      await fetchUserRequests();
    } catch (error) {
      console.error('Error loading user requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnRequest = (record) => {
    setSelectedRequest(record);
    setReturnModalVisible(true);
    form.setFieldsValue({
      inventory_item_id: record.inventory_item_id,
      original_request_id: record.id,
      quantity_to_return: record.quantity,
      remarks: '',
      return_reason: ''
    });
  };

  const handleReturnSubmit = async (values) => {
    try {
      await submitReturnRequest({
        inventory_item_id: selectedRequest.inventory_item_id,
        original_request_id: selectedRequest.id,
        quantity_to_return: values.quantity_to_return,
        remarks: values.remarks,
        return_reason: values.return_reason
      });
      
      setReturnModalVisible(false);
      form.resetFields();
      await loadUserRequests();
    } catch (error) {
      console.error('Error submitting return request:', error);
    }
  };

  const handleItemInfoClick = (item) => {
    setSelectedItemInfo(item);
    setItemInfoModalVisible(true);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'Pending': { color: 'orange', icon: <ClockCircleOutlined /> },
      'Approved': { color: 'green', icon: <CheckCircleOutlined /> },
      'Issued': { color: 'blue', icon: <CheckCircleOutlined /> },
      'Rejected': { color: 'red', icon: <ClockCircleOutlined /> },
      'Returned': { color: 'gray', icon: <CheckCircleOutlined /> }
    };
    
    const config = statusMap[status] || { color: 'default', icon: null };
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {status}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Request Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: 'Item Code',
      dataIndex: 'inventory_item_code',
      key: 'inventory_item_code',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.inventory_item_code?.toLowerCase().includes(value.toLowerCase()) ||
        record.purpose?.toLowerCase().includes(value.toLowerCase()),
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
              {itemDetails.subcategory.category?.name || 'N/A'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: 'Order Name',
      dataIndex: 'order_name',
      key: 'order_name',
      align: 'center',
    },
    {
      title: 'Operation Name',
      dataIndex: 'operation_name',
      key: 'operation_name',
      align: 'center',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Approved', value: 'Approved' },
        { text: 'Issued', value: 'Issued' },
        { text: 'Rejected', value: 'Rejected' },
        { text: 'Returned', value: 'Returned' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Expected Return',
      dataIndex: 'expected_return_date',
      key: 'expected_return_date',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Actual Return',
      dataIndex: 'actual_return_date',
      key: 'actual_return_date',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => {
        const canReturn = ['Approved', 'Issued'].includes(record.status) && !record.actual_return_date;
        
        return (
          <Space>
            {canReturn && (
              <Button 
                type="primary" 
                size="small" 
                icon={<UndoOutlined />}
                onClick={() => handleReturnRequest(record)}
              >
                Return
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  // Calculate statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => ['Approved', 'Issued'].includes(r.status)).length,
    returned: requests.filter(r => r.status === 'Returned').length,
  };

  const filteredData = requests.filter(item =>
    searchText === '' || 
    item.inventory_item_code?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.purpose?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.order_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.operation_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.requested_by_username?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.inventory_item_details?.subcategory?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.inventory_item_details?.category?.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Title level={2} className="mb-2 flex items-center">
          <HistoryOutlined className="mr-2" />
          Inventory Request History
        </Title>
        <Text type="secondary">View and manage your inventory requests</Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Approved/Issued"
              value={stats.approved}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Returned"
              value={stats.returned}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Actions */}
      <Card className="mb-4">
        <Row justify="space-between" align="middle">
          <Col span={8}>
            <Input
              placeholder="Search by item code, purpose, order, operation, or username..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadUserRequests}
              loading={loading || storeLoading}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Requests Table */}
      <Card>
        {filteredData.length === 0 ? (
          <Empty 
            description="No inventory requests found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            loading={loading || storeLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            scroll={{ x: 1400 }}
            size="middle"
          />
        )}
      </Card>

      {/* Return Request Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <UndoOutlined className="mr-2" />
            Return Request
          </div>
        }
        open={returnModalVisible}
        onCancel={() => {
          setReturnModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          onFinish={handleReturnSubmit}
          layout="vertical"
          className="mt-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Item Code"
                name="inventory_item_code"
              >
                <Input 
                  value={selectedRequest?.inventory_item_code} 
                  disabled 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Original Quantity"
                name="original_quantity"
              >
                <Input 
                  value={selectedRequest?.quantity} 
                  disabled 
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Quantity to Return"
            name="quantity_to_return"
            rules={[
              { required: true, message: 'Please enter quantity to return' },
              { type: 'number', min: 1, message: 'Quantity must be at least 1' },
            ]}
          >
            <InputNumber
              min={1}
              max={selectedRequest?.quantity}
              style={{ width: '100%' }}
              placeholder="Enter quantity to return"
            />
          </Form.Item>

          <Form.Item
            label="Return Reason"
            name="return_reason"
            rules={[{ required: true, message: 'Please provide return reason' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="e.g., Operation completed, tools no longer needed"
            />
          </Form.Item>

          <Form.Item
            label="Additional Remarks"
            name="remarks"
          >
            <TextArea
              rows={3}
              placeholder="e.g., Tools in good condition"
            />
          </Form.Item>

          <Form.Item className="mb-0 mt-6">
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setReturnModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={storeLoading}
              >
                Submit Return Request
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Item Info Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <HistoryOutlined />
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
                    <span className="ml-2 font-medium text-green-600">{selectedItemInfo.subcategory.category?.name || 'N/A'}</span>
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
                    <span className="text-gray-600">Total Quantity:</span>
                    <span className="ml-2 font-medium">{selectedItemInfo.quantity || 0}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-gray-600">Available:</span>
                    <span className="ml-2 font-medium text-green-600">{selectedItemInfo.available_quantity || 0}</span>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Dynamic Data */}
            {selectedItemInfo.dynamic_data && Object.keys(selectedItemInfo.dynamic_data).length > 0 && (
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-medium mb-3">Item Data</h4>
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
            
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryHistory;

