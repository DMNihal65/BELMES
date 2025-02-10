import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Tooltip, Modal, Input, message, Card, Form, Row, Col, Input as AntInput, Spin, Tabs, Statistic } from 'antd';
import { EyeOutlined, CheckOutlined, ReloadOutlined, DatabaseOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Pie, Column } from '@ant-design/plots';
import useInventoryStore from '../../../store/inventory-store';
import 'tailwindcss/tailwind.css';
import axios from 'axios';
import TransactionHistoryTable from '../../../components/Inventory/TransactionHistoryTable';

const { TabPane } = Tabs;

const RequestTable = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [approveRecord, setApproveRecord] = useState(null);
  
  const { requests, loading, fetchRequests, approveRequest } = useInventoryStore();

  useEffect(() => {
    fetchRequests().catch(error => {
      console.error('Error fetching requests:', error);
    });
  }, [fetchRequests]);

  const handleGlobalSearch = (value) => {
    setSearchText(value);
  };

  const getFilteredData = () => {
    if (!searchText) return requests;

    return requests.filter(item => {
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
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left',
      sorter: (a, b) => a.id - b.id,
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => String(record.id).includes(value),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      sorter: (a, b) => a.quantity - b.quantity,
      filters: [
        { text: '1-10', value: '1-10' },
        { text: '11-50', value: '11-50' },
        { text: '50+', value: '50+' },
      ],
      onFilter: (value, record) => {
        const qty = record.quantity;
        switch(value) {
          case '1-10': return qty >= 1 && qty <= 10;
          case '11-50': return qty >= 11 && qty <= 50;
          case '50+': return qty > 50;
          default: return true;
        }
      },
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      width: 200,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Approved', value: 'approved' },
      ],
      onFilter: (value, record) => record.status.toLowerCase() === value,
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
      render: formatDate,
    },
    {
      title: 'Actual Return',
      dataIndex: 'actual_return_date',
      key: 'actual_return_date',
      width: 150,
      render: formatDate,
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 150,
    },
    {
      title: 'Inventory Item ID',
      dataIndex: 'inventory_item_id',
      key: 'inventory_item_id',
      width: 130,
    },
    {
      title: 'Inventory Item Code',
      dataIndex: 'inventory_item_code',
      key: 'inventory_item_code',
      width: 130,
    },
    {
      title: 'Requested By',
      dataIndex: 'requested_by',
      key: 'requested_by',
      width: 120,
    },
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      key: 'order_id',
      width: 100,
    },
    {
      title: 'Operation ID',
      dataIndex: 'operation_id',
      key: 'operation_id',
      width: 120,
    },
    {
      title: 'Approved By',
      dataIndex: 'approved_by',
      key: 'approved_by',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: 'Approved At',
      dataIndex: 'approved_at',
      key: 'approved_at',
      width: 150,
      render: formatDate,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: formatDate,
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      render: formatDate,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
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

  // Transaction Summary Component
  const TransactionSummary = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const { fetchTransactionAnalytics } = useInventoryStore();

    useEffect(() => {
      const fetchAnalytics = async () => {
        setLoading(true);
        try {
          const data = await fetchTransactionAnalytics();
          setAnalyticsData(data);
        } catch (error) {
          console.error('Error fetching analytics:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchAnalytics();
    }, [fetchTransactionAnalytics]);

    if (loading) {
      return <Spin size="large" className="flex justify-center my-8" />;
    }

    if (!analyticsData) {
      return <div>No analytics data available</div>;
    }

    // Pie Chart Configuration for Transaction Types
    const pieConfig = {
      data: [
        { type: 'Issue', value: analyticsData.total_issues || 0 },
        { type: 'Return', value: analyticsData.total_returns || 0 },
      ],
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      label: {
        type: 'outer',
        content: '{name} {percentage}',
      },
      color: ['#ff4d4f', '#52c41a'],
      interactions: [{ type: 'element-active' }],
      legend: {
        position: 'bottom',
      },
    };

    // Column Chart Configuration for Monthly Trends
    const columnConfig = {
      data: analyticsData.monthly_trends || [],
      xField: 'month',
      yField: 'count',
      seriesField: 'type',
      isGroup: true,
      columnStyle: {
        radius: [4, 4, 0, 0],
      },
      label: {
        position: 'top',
      },
      color: ['#ff4d4f', '#52c41a'],
      legend: {
        position: 'bottom',
      },
    };

    return (
      <div>
        <Row gutter={[16, 16]}>
          {/* Overview Cards */}
          <Col span={8}>
            <Card className="text-center">
              <Statistic
                title="Total Transactions"
                value={analyticsData.total_transactions || 0}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card className="text-center">
              <Statistic
                title="Total Issues"
                value={analyticsData.total_issues || 0}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<ArrowUpOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card className="text-center">
              <Statistic
                title="Total Returns"
                value={analyticsData.total_returns || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<ArrowDownOutlined />}
              />
            </Card>
          </Col>

          {/* Charts */}
          <Col span={12}>
            <Card title="Transaction Distribution" className="shadow-md">
              <Pie {...pieConfig} />
            </Card>
          </Col>

          <Col span={12}>
            <Card title="Monthly Transaction Trend" className="shadow-md">
              <Column {...columnConfig} />
            </Card>
          </Col>

          {/* Detailed Summary Table */}
          <Col span={24}>
            <Card title="Time Period Summary" className="shadow-md">
              <Table
                columns={[
                  {
                    title: 'Period',
                    dataIndex: 'period',
                    key: 'period',
                  },
                  {
                    title: 'Total Transactions',
                    dataIndex: 'total',
                    key: 'total',
                  },
                  {
                    title: 'Issues',
                    dataIndex: 'issues',
                    key: 'issues',
                    render: (text) => <span className="text-red-500">{text}</span>,
                  },
                  {
                    title: 'Returns',
                    dataIndex: 'returns',
                    key: 'returns',
                    render: (text) => <span className="text-green-500">{text}</span>,
                  }
                ]}
                dataSource={[
                  {
                    key: 'today',
                    period: 'Today',
                    total: analyticsData.today_total || 0,
                    issues: analyticsData.today_issues || 0,
                    returns: analyticsData.today_returns || 0,
                  },
                  {
                    key: 'week',
                    period: 'This Week',
                    total: analyticsData.week_total || 0,
                    issues: analyticsData.week_issues || 0,
                    returns: analyticsData.week_returns || 0,
                  },
                  {
                    key: 'month',
                    period: 'This Month',
                    total: analyticsData.month_total || 0,
                    issues: analyticsData.month_issues || 0,
                    returns: analyticsData.month_returns || 0,
                  }
                ]}
                pagination={false}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

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
                  defaultPageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} items`,
                }}
                scroll={{ x: 2500, y: 500 }}
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
          <TransactionSummary />
        </TabPane>
        <TabPane tab="Transaction History" key="3">
          <TransactionHistoryTable />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default RequestTable;
