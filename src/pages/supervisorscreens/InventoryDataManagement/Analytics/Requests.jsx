import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Tooltip, Modal, Input, message, Card, Form, Row, Col, Input as AntInput, Spin, Tabs, Statistic } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, ReloadOutlined, DatabaseOutlined, ToolOutlined, ArrowUpOutlined, ArrowDownOutlined, SearchOutlined } from '@ant-design/icons';
import { Pie, Column } from '@ant-design/plots';
import useInventoryStore from '../../../../store/inventory-store';
import 'tailwindcss/tailwind.css';
import axios from 'axios';
import TransactionHistoryTable from '../TransactionHistoryTable';
import TransactionSummaryAnalytics from './TransactionSummaryAnalytics';
import EnhancedTransactionHistory from './EnhancedTransactionHistory';

const { TabPane } = Tabs;

const RequestTable = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [approveRecord, setApproveRecord] = useState(null);
  const [rejectRecord, setRejectRecord] = useState(null);
  const [columnFilters, setColumnFilters] = useState({});
  const [inventoryItems, setInventoryItems] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemInfoModalVisible, setItemInfoModalVisible] = useState(false);
  const [selectedItemInfo, setSelectedItemInfo] = useState(null);
  
  const { requests, loading, fetchRequests, approveRequest, rejectRequest, fetchCategories, fetchItems, fetchAllSubcategories } = useInventoryStore();

  useEffect(() => {
    fetchRequests().catch(error => {
      console.error('Error fetching requests:', error);
    });
  }, [fetchRequests]);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        const [categoriesData, itemsData, subcatsData, upcomingData] = await Promise.all([
          fetchCategories(),
          loadInventoryItems(),
          loadSubcategories(),
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
        message.error('Failed to load some data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [fetchCategories]);

  const loadSubcategories = async () => {
    try {
      const subCats = await fetchAllSubcategories();
      // console.log('Loaded subcategories:', subCats); // Debug log
      setSubcategories(subCats || []);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      message.error('Failed to load subcategories');
      setSubcategories([]);
    }
  };

  const loadInventoryItems = async () => {
    try {
      const items = await fetchItems();
      // console.log('Loaded items:', items); // Debug log
      setInventoryItems(items || []);
    } catch (error) {
      console.error('Error loading inventory items:', error);
      message.error('Failed to load inventory items');
      setInventoryItems([]);
    }
  };

  const handleGlobalSearch = (value) => {
    setSearchText(value);
  };

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setColumnFilters({
      ...columnFilters,
      [dataIndex]: selectedKeys[0]
    });
  };

  const handleReset = (clearFilters, dataIndex) => {
    clearFilters();
    setColumnFilters({
      ...columnFilters,
      [dataIndex]: ''
    });
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleReset(clearFilters, dataIndex)}
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
      
      if (typeof recordValue === 'number') {
        return String(recordValue).toLowerCase().includes(value.toLowerCase());
      }
      
      if (dataIndex.includes('date') || dataIndex.includes('at')) {
        return formatDate(recordValue).toLowerCase().includes(value.toLowerCase());
      }
      
      return recordValue.toString().toLowerCase().includes(value.toLowerCase());
    },
    filteredValue: columnFilters[dataIndex] ? [columnFilters[dataIndex]] : null
  });

  const getFilteredData = () => {
    if (!searchText && Object.values(columnFilters).every(v => !v)) return requests;

    return requests.filter(item => {
      // First check global search
      if (searchText) {
        const searchValue = searchText.toLowerCase().trim();
        const matchesGlobal = (
          String(item.id || '').toLowerCase().includes(searchValue) ||
          String(item.quantity || '').toLowerCase().includes(searchValue) ||
          String(item.purpose || '').toLowerCase().includes(searchValue) ||
          String(item.status || '').toLowerCase().includes(searchValue) ||
          String(item.remarks || '').toLowerCase().includes(searchValue) ||
          String(item.inventory_item_id || '').toLowerCase().includes(searchValue) ||
          String(item.inventory_item_code || '').toLowerCase().includes(searchValue) ||
          String(item.requested_by || '').toLowerCase().includes(searchValue) ||
          String(item.order_id || '').toLowerCase().includes(searchValue) ||
          String(item.operation_id || '').toLowerCase().includes(searchValue) ||
          String(item.approved_by || '').toLowerCase().includes(searchValue) ||
          formatDate(item.expected_return_date).toLowerCase().includes(searchValue) ||
          formatDate(item.actual_return_date).toLowerCase().includes(searchValue) ||
          formatDate(item.approved_at).toLowerCase().includes(searchValue) ||
          formatDate(item.created_at).toLowerCase().includes(searchValue) ||
          formatDate(item.updated_at).toLowerCase().includes(searchValue)
        );
        if (!matchesGlobal) return false;
      }

      // Then check column filters
      return Object.entries(columnFilters).every(([key, value]) => {
        if (!value) return true;
        const itemValue = item[key];
        if (!itemValue) return false;
        
        if (typeof itemValue === 'number') {
          return String(itemValue).toLowerCase().includes(value.toLowerCase());
        }
        
        if (key.includes('date') || key.includes('at')) {
          return formatDate(itemValue).toLowerCase().includes(value.toLowerCase());
        }
        
        return itemValue.toString().toLowerCase().includes(value.toLowerCase());
      });
    });
  };

  const handleDetails = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const showApproveConfirm = (record) => {
    setApproveRecord(record);
    setIsApproveModalVisible(true);
  };

  const showRejectConfirm = (record) => {
    setRejectRecord(record);
    setIsRejectModalVisible(true);
  };

  const handleApprove = async () => {
    try {
      await approveRequest(approveRecord.id);
      await fetchRequests();
      setIsApproveModalVisible(false);
      setApproveRecord(null);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectRequest(rejectRecord.id);
      await fetchRequests();
      setIsRejectModalVisible(false);
      setRejectRecord(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleRefresh = () => {
    fetchRequests();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    // Convert to local timezone by adding the timezone offset
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleInventoryItemClick = (itemId) => {
    const item = inventoryItems.find(i => i.id === itemId);
    if (item) {
      setSelectedItemInfo(item);
      setItemInfoModalVisible(true);
    } else {
      message.error('Inventory item not found.');
    }
  };

  const columns = [
    {
      //Inventory1111
      title: 'Inventory Item',
      dataIndex: 'inventory_item_id',
      key: 'inventory_item_id',
      align: 'center',
      width:200,
      render: (itemId) => {
        const item = inventoryItems.find(item => item.id === itemId);
        const subcategory = subcategories.find(sub => sub.id === item?.subcategory_id);
        return (
          <Tooltip >
            <Tag 
              icon={<ToolOutlined />} 
              style={{ cursor: 'pointer', color: '#1890ff' }}
              onClick={() => handleInventoryItemClick(itemId)}
            >
              {item ? `${subcategory?.name || 'N/A'}${item.dynamic_data["Instrument code"] ? ` - ${item.dynamic_data["Instrument code"]}` : ''}` : itemId}
            </Tag>
          </Tooltip>
        );
      }
    },
    // {
    //   title: 'Request ID',
    //   dataIndex: 'id',
    //   key: 'id',
    //   width: 100,
    //   sorter: (a, b) => a.id - b.id,
    //   ...getColumnSearchProps('id')
    // },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      width: 100,
      sorter: (a, b) => a.quantity - b.quantity,
      ...getColumnSearchProps('quantity')
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      align: 'center',
      width: 200,
      ...getColumnSearchProps('purpose')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 120,
      ...getColumnSearchProps('status'),
      render: (status) => {
        const statusLower = status.toLowerCase();
        let color = 'default';
        
        if (statusLower === 'pending') {
          color = 'orange';
        } else if (statusLower === 'approved') {
          color = 'green';
        } else if (statusLower === 'rejected') {
          color = 'red';
        } else if (statusLower === 'returned') {
          color = 'blue';
        }
        
        return (
          <Tag color={color}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Expected Return',
      dataIndex: 'expected_return_date',
      key: 'expected_return_date',
      align: 'center',
      width: 150,
      ...getColumnSearchProps('expected_return_date'),
      render: formatDate,
    },
    {
      title: 'Actual Return',
      dataIndex: 'actual_return_date',
      key: 'actual_return_date',
      align: 'center',
      width: 150,
      ...getColumnSearchProps('actual_return_date'),
      render: formatDate,
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      align: 'center',
      width: 150,
      ...getColumnSearchProps('remarks'),
    },
    // {
    //   title: 'Inventory Item ID',
    //   dataIndex: 'inventory_item_id',
    //   key: 'inventory_item_id',
    //   width: 130,
    //   ...getColumnSearchProps('inventory_item_id'),
    // },
    // {
    //   title: 'Inventory Item Code',
    //   dataIndex: 'inventory_item_code',
    //   key: 'inventory_item_code',
    //   width: 130,
    //   ...getColumnSearchProps('inventory_item_code'),
    // },
    {
      title: 'Requested By',
      dataIndex: 'requested_by_username',
      key: 'requested_by_username',
      align: 'center',
      width: 120,
      ...getColumnSearchProps('requested_by_username'),
    },
    // {
    //   title: 'Order ID',
    //   dataIndex: 'order_id',
    //   key: 'order_id',
    //   width: 100,
    //   ...getColumnSearchProps('order_id'),
    // },
    // {
    //   title: 'Operation ID',
    //   dataIndex: 'operation_id',
    //   key: 'operation_id',
    //   width: 120,
    //   ...getColumnSearchProps('operation_id'),
    // },
    {
      title: 'Approved By',
      dataIndex: 'approved_by_username',
      key: 'approved_by_username',
      align: 'center',
      width: 120,
      ...getColumnSearchProps('approved_by_username'),
      render: (text) => text || '-',
    },
    {
      title: 'Approved At',
      dataIndex: 'approved_at',
      key: 'approved_at',
      align: 'center',
      width: 150,
      ...getColumnSearchProps('approved_at'),
      render: formatDate,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      align: 'center',
      width: 150,
      ...getColumnSearchProps('created_at'),
      render: formatDate,
      sorter: (a, b) => new Date(b.created_at) - new Date(a.created_at),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      align: 'center',
      width: 150,
      ...getColumnSearchProps('updated_at'),
      render: formatDate,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} onClick={() => handleDetails(record)} />
          </Tooltip>
          {record.status.toLowerCase() === 'pending' && (
            <>
              <Tooltip title="Approve">
                <Button
                  icon={<CheckOutlined />}
                  onClick={() => showApproveConfirm(record)}
                  type="primary"
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => showRejectConfirm(record)}
                  danger
                  size="small"
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Tabs defaultActiveKey="1" type="card">
        <TabPane tab="Requests" key="1">
          <Card 
            title="Requests Table" 
            extra={
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={loading}
                >
                  Refresh
                </Button>
                <AntInput.Search
                  placeholder="Search across all columns..."
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                  style={{ width: 300 }}
                  allowClear
                />
              </Space>
            }
            bordered={false} 
            className="shadow-lg"
          >
            <Spin spinning={loading}>
              <Table
                columns={columns}
                dataSource={getFilteredData()}
                rowKey="id"
                rowClassName={(record) => (record.status.toLowerCase() === 'pending' ? 'bg-red-50' : '')}
                pagination={{
                  defaultPageSize: 7,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} items`,
                }}
                scroll={{ x: 2500 }}
                size="middle"
                defaultSortOrder="ascend"
                sortDirections={['descend', 'ascend']}
              />
            </Spin>

            <Modal
              title="Request Details"
              open={isModalVisible}
              onCancel={() => setIsModalVisible(false)}
              footer={null}
              width={800}
            >
              {selectedRecord && (
                <Form
                  layout="vertical"
                  initialValues={{
                    ...selectedRecord,
                    expected_return_date: formatDate(selectedRecord.expected_return_date),
                    actual_return_date: formatDate(selectedRecord.actual_return_date),
                    approved_at: formatDate(selectedRecord.approved_at),
                    created_at: formatDate(selectedRecord.created_at),
                    updated_at: formatDate(selectedRecord.updated_at)
                  }}
                >
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Request ID" name="id">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Quantity" name="quantity">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Status" name="status">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Purpose" name="purpose">
                        <Input.TextArea disabled />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Remarks" name="remarks">
                        <Input.TextArea disabled />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Expected Return Date" name="expected_return_date">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Actual Return Date" name="actual_return_date">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Inventory Item ID" name="inventory_item_id">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Requested By" name="requested_by">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Order ID" name="order_id">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Operation ID" name="operation_id">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Approved By" name="approved_by">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Approved At" name="approved_at">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Created At" name="created_at">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Updated At" name="updated_at">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              )}
            </Modal>

            <Modal
              title="Confirm Approval"
              open={isApproveModalVisible}
              onCancel={() => setIsApproveModalVisible(false)}
              onOk={handleApprove}
              okText="Approve"
              cancelText="Cancel"
              confirmLoading={loading}
              okButtonProps={{ type: 'primary' }}
            >
              <p>Are you sure you want to approve this request?</p>
              {approveRecord && (
                <div>
                  <p><strong>Request ID:</strong> {approveRecord.id}</p>
                  <p><strong>Item Code:</strong> {approveRecord.inventory_item_code}</p>
                  <p><strong>Quantity:</strong> {approveRecord.quantity}</p>
                  <p><strong>Purpose:</strong> {approveRecord.purpose}</p>
                  <p><strong>Requested By:</strong> {approveRecord.requested_by_username}</p>
                </div>
              )}
            </Modal>

            <Modal
              title="Confirm Rejection"
              open={isRejectModalVisible}
              onCancel={() => setIsRejectModalVisible(false)}
              onOk={handleReject}
              okText="Reject"
              cancelText="Cancel"
              confirmLoading={loading}
              okButtonProps={{ danger: true }}
            >
              <p>Are you sure you want to reject this request?</p>
              {rejectRecord && (
                <div>
                  <p><strong>Request ID:</strong> {rejectRecord.id}</p>
                  <p><strong>Item Code:</strong> {rejectRecord.inventory_item_code}</p>
                  <p><strong>Quantity:</strong> {rejectRecord.quantity}</p>
                  <p><strong>Purpose:</strong> {rejectRecord.purpose}</p>
                  <p><strong>Requested By:</strong> {rejectRecord.requested_by_username}</p>
                </div>
              )}
            </Modal>

            {/* Item Info Modal */}
            <Modal
              title={
                <div className="flex items-center gap-2">
                  <ToolOutlined />
                  <span>Inventory Item Details</span>
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
                        
                      </Col>
                      <Col span={12}>
                        <div className="mb-2">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="ml-2 font-medium">{selectedItemInfo.quantity || 0}</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-gray-600">Available Quantity:</span>
                          <span className="ml-2 font-medium text-green-600">{selectedItemInfo.available_quantity || 0}</span>
                        </div>
                        <div className="mb-2">
                            <span className="text-gray-600">Subcategory:</span>
                            <span className="ml-2 font-medium text-orange-600">
                              {subcategories.find(sub => sub.id === selectedItemInfo.subcategory_id)?.name || 'N/A'}
                            </span>
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

                  
                </div>
              )}
            </Modal>
          </Card>
        </TabPane>
        <TabPane tab="Transaction Summary" key="2">
          <TransactionSummaryAnalytics />
        </TabPane>
        <TabPane tab="Transaction History" key="3">
          <EnhancedTransactionHistory />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default RequestTable;