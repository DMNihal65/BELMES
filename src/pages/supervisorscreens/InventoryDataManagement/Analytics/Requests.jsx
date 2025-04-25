import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Tooltip, Modal, Input, message, Card, Form, Row, Col, Input as AntInput, Spin, Tabs, Statistic } from 'antd';
import { EyeOutlined, CheckOutlined, ReloadOutlined, DatabaseOutlined, ToolOutlined, ArrowUpOutlined, ArrowDownOutlined, SearchOutlined } from '@ant-design/icons';
import { Pie, Column } from '@ant-design/plots';
import useInventoryStore from '../../../../store/inventory-store';
import 'tailwindcss/tailwind.css';
import axios from 'axios';
import TransactionHistoryTable from '../TransactionHistoryTable';
import TransactionSummaryAnalytics from './TransactionSummaryAnalytics';

const { TabPane } = Tabs;

const RequestTable = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [approveRecord, setApproveRecord] = useState(null);
  const [columnFilters, setColumnFilters] = useState({});
  const [inventoryItems, setInventoryItems] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { requests, loading, fetchRequests, approveRequest, fetchCategories, fetchItems, fetchAllSubcategories, } = useInventoryStore();

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
        toast.error('Failed to load some data');
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
      toast.error('Failed to load subcategories');
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
      toast.error('Failed to load inventory items');
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

  const handleApprove = async (record) => {
    try {
      await approveRequest(record.id, record);
      await fetchRequests();
      setIsApproveModalVisible(false);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleRefresh = () => {
    fetchRequests();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const columns = [
    {
      //Inventory1111
      title: 'Inventory Item',
      dataIndex: 'inventory_item_id',
      key: 'inventory_item_id',
      width:200,
      render: (itemId) => {
        const item = inventoryItems.find(item => item.id === itemId);
        const subcategory = subcategories.find(sub => sub.id === item?.subcategory_id);
        return (
          <Tooltip title={`Click to view calibration history for this item`}>
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
      width: 100,
      sorter: (a, b) => a.quantity - b.quantity,
      ...getColumnSearchProps('quantity')
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      width: 200,
      ...getColumnSearchProps('purpose')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      ...getColumnSearchProps('status'),
      render: (status) => (
        <Tag color={status.toLowerCase() === 'pending' ? 'red' : 'green'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Expected Return',
      dataIndex: 'expected_return_date',
      key: 'expected_return_date',
      width: 150,
      ...getColumnSearchProps('expected_return_date'),
      render: formatDate,
    },
    {
      title: 'Actual Return',
      dataIndex: 'actual_return_date',
      key: 'actual_return_date',
      width: 150,
      ...getColumnSearchProps('actual_return_date'),
      render: formatDate,
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
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
    // {
    //   title: 'Requested By',
    //   dataIndex: 'requested_by',
    //   key: 'requested_by',
    //   width: 120,
    //   ...getColumnSearchProps('requested_by'),
    // },
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
    // {
    //   title: 'Approved By',
    //   dataIndex: 'approved_by',
    //   key: 'approved_by',
    //   width: 120,
    //   ...getColumnSearchProps('approved_by'),
    //   render: (text) => text || '-',
    // },
    {
      title: 'Approved At',
      dataIndex: 'approved_at',
      key: 'approved_at',
      width: 150,
      ...getColumnSearchProps('approved_at'),
      render: formatDate,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      ...getColumnSearchProps('created_at'),
      render: formatDate,
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
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
            <Tooltip title="Approve">
              <Button
                icon={<CheckOutlined />}
                onClick={() => showApproveConfirm(record)}
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
                />
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
                  initialValues={selectedRecord}
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
                        <Input disabled value={formatDate(selectedRecord.expected_return_date)} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Actual Return Date" name="actual_return_date">
                        <Input disabled value={formatDate(selectedRecord.actual_return_date)} />
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
                        <Input disabled value={formatDate(selectedRecord.approved_at)} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Created At" name="created_at">
                        <Input disabled value={formatDate(selectedRecord.created_at)} />
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

            <Modal
              title="Confirm Approval"
              open={isApproveModalVisible}
              onCancel={() => setIsApproveModalVisible(false)}
              onOk={() => handleApprove(approveRecord)}
              okText="Yes"
              cancelText="No"
              confirmLoading={loading}
            >
              <p>Are you sure you want to approve this request?</p>
              {approveRecord && (
                <div>
                  <p>Request ID: {approveRecord.id}</p>
                  <p>Quantity: {approveRecord.quantity}</p>
                  <p>Purpose: {approveRecord.purpose}</p>
                </div>
              )}
            </Modal>
          </Card>
        </TabPane>
        <TabPane tab="Transaction Summary" key="2">
          <TransactionSummaryAnalytics />
        </TabPane>
        <TabPane tab="Transaction History" key="3">
          <TransactionHistoryTable />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default RequestTable;