import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Tag, 
  Button, 
  Space, 
  Tooltip, 
  Modal, 
  Input, 
  Card, 
  Form, 
  Row, 
  Col, 
  Spin,
  Statistic
} from 'antd';
import { 
  EyeOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  UndoOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import useInventoryStore from '../../../../store/inventory-store';
import dayjs from 'dayjs';

const ReturnRequests = () => {
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [approveRecord, setApproveRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [itemInfoModalVisible, setItemInfoModalVisible] = useState(false);
  const [selectedItemInfo, setSelectedItemInfo] = useState(null);

  const { 
    returnRequests = [], 
    fetchReturnRequests, 
    approveReturnRequest,
    loading: storeLoading 
  } = useInventoryStore();

  useEffect(() => {
    loadReturnRequests();
  }, []);

  const loadReturnRequests = async () => {
    setLoading(true);
    try {
      await fetchReturnRequests();
    } catch (error) {
      console.error('Error loading return requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDetails = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const showApproveConfirm = (record) => {
    setApproveRecord(record);
    setIsApproveModalVisible(true);
  };

  const handleApprove = async () => {
    try {
      await approveReturnRequest(approveRecord.id);
      await loadReturnRequests();
      setIsApproveModalVisible(false);
      setApproveRecord(null);
    } catch (error) {
      console.error('Error approving return request:', error);
    }
  };

  const handleItemInfoClick = (item) => {
    setSelectedItemInfo(item);
    setItemInfoModalVisible(true);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'Pending': { color: 'orange', icon: <UndoOutlined /> },
      'Approved': { color: 'green', icon: <CheckOutlined /> },
      'Completed': { color: 'blue', icon: <CheckOutlined /> },
      'Rejected': { color: 'red', icon: <CloseOutlined /> }
    };
    
    const config = statusMap[status] || { color: 'default', icon: null };
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {status}
      </Tag>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters()}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) => {
      const recordValue = record[dataIndex];
      if (!recordValue) return false;
      return recordValue.toString().toLowerCase().includes(value.toLowerCase());
    },
  });

  const columns = [
    {
      title: 'Return ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      sorter: (a, b) => a.id - b.id,
      ...getColumnSearchProps('id')
    },
    {
      title: 'Item Code',
      dataIndex: 'inventory_item_code',
      key: 'inventory_item_code',
      width: 150,
      ...getColumnSearchProps('inventory_item_code')
    },
    {
      title: 'Item Info',
      key: 'item_info',
      width: 150,
      render: (_, record) => {
        const itemDetails = record.inventory_item_details;
        if (!itemDetails)
          return <span className="text-gray-400">-</span>;

        return (
          <div className="space-y-1">
            <div
              className="font-medium text-blue-600 cursor-pointer hover:text-blue-800"
              onClick={() => handleItemInfoClick(itemDetails)}
            >
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
      title: 'Quantity to Return',
      dataIndex: 'quantity_to_return',
      key: 'quantity_to_return',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.quantity_to_return - b.quantity_to_return,
    },

    {
      title: 'Return Reason',
      dataIndex: 'return_reason',
      key: 'return_reason',
      width: 200,
      ellipsis: true,
      ...getColumnSearchProps('return_reason'),
    },
    {
        title: 'Remarks',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 200,
        ellipsis: true,
        ...getColumnSearchProps('remarks')
      },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Approved', value: 'Approved' },
        { text: 'Completed', value: 'Completed' },
        { text: 'Rejected', value: 'Rejected' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Requested By',
      dataIndex: 'requested_by_username',
      key: 'requested_by_username',
      width: 120,
      align: 'center',
      ...getColumnSearchProps('requested_by_username')
    },
    {
      title: 'Approved By',
      dataIndex: 'approved_by_username',
      key: 'approved_by_username',
      width: 120,
      align: 'center',
      render: (text) => text || '-',
      ...getColumnSearchProps('approved_by_username')
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      align: 'center',
      render: formatDate,
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix()
    },
    {
      title: 'Approved At',
      dataIndex: 'approved_at',
      key: 'approved_at',
      width: 150,
      align: 'center',
      render: formatDate
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => handleDetails(record)}
              size="small"
            />
          </Tooltip>
          {record.status === 'Pending' && (
            <Tooltip title="Approve Return">
              <Button
                icon={<CheckOutlined />}
                onClick={() => showApproveConfirm(record)}
                type="primary"
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  const filteredData = returnRequests.filter(item =>
    !searchText || 
    Object.values(item).some(value => 
      value && value.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  // Calculate statistics
  const stats = {
    total: returnRequests.length,
    pending: returnRequests.filter(r => r.status === 'Pending').length,
    approved: returnRequests.filter(r => r.status === 'Approved').length,
    completed: returnRequests.filter(r => r.status === 'Completed').length
  };

  return (
    <div className="p-4">
      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Return Requests"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UndoOutlined />}
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
              title="Approved"
              value={stats.approved}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Return Requests" 
        extra={
          <Space>
            <Input.Search
              placeholder="Search return requests..."
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadReturnRequests}
              loading={loading || storeLoading}
            >
              Refresh
            </Button>
          </Space>
        }
        className="shadow-lg"
      >
        <Spin spinning={loading || storeLoading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            rowClassName={(record) => 
              record.status === 'Pending' ? 'bg-orange-50' : ''
            }
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            scroll={{ x: 1600 }}
            size="middle"
          />
        </Spin>

        {/* Details Modal */}
        <Modal
          title="Return Request Details"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={800}
        >
          {selectedRecord && (
            <Form
              layout="vertical"
              initialValues={selectedRecord}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Return ID" name="id">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Original Request ID" name="original_request_id">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Item Code" name="inventory_item_code">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Quantity to Return" name="quantity_to_return">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Status" name="status">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Return Reason" name="return_reason">
                    <Input.TextArea disabled rows={3} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Remarks" name="remarks">
                    <Input.TextArea disabled rows={3} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Requested By" name="requested_by_username">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Approved By" name="approved_by_username">
                    <Input disabled value={selectedRecord.approved_by_username || '-'} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Created At" name="created_at">
                    <Input disabled value={formatDate(selectedRecord.created_at)} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Approved At" name="approved_at">
                    <Input disabled value={formatDate(selectedRecord.approved_at)} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Updated At" name="updated_at">
                    <Input disabled value={formatDate(selectedRecord.updated_at)} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          )}
        </Modal>

        {/* Approve Return Modal */}
        <Modal
          title="Confirm Return Approval"
          open={isApproveModalVisible}
          onCancel={() => setIsApproveModalVisible(false)}
          onOk={handleApprove}
          okText="Approve Return"
          cancelText="Cancel"
          confirmLoading={storeLoading}
          okButtonProps={{ type: 'primary' }}
        >
          <p>Are you sure you want to approve this return request?</p>
          {approveRecord && (
            <div>
              <p><strong>Return ID:</strong> {approveRecord.id}</p>
              <p><strong>Item Code:</strong> {approveRecord.inventory_item_code}</p>
              <p><strong>Quantity to Return:</strong> {approveRecord.quantity_to_return}</p>
              <p><strong>Return Reason:</strong> {approveRecord.return_reason}</p>
              <p><strong>Requested By:</strong> {approveRecord.requested_by_username}</p>
            </div>
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
                      <span className="text-gray-600">Quantity:</span>
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

             
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default ReturnRequests;
