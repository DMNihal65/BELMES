import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Statistic, Spin, Input, Select, DatePicker, Space, Button } from 'antd';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Search } = Input;
const { RangePicker } = DatePicker;

// Standard colors for charts
const COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  purple: '#722ed1',
  cyan: '#13c2c2',
  blue: '#2f54eb',
  red: '#f5222d',
};

// Pie chart colors
const PIE_COLORS = [COLORS.primary, COLORS.success];

// Bar chart colors for different purposes
const BAR_COLORS = {
  transactions: COLORS.primary,
  items: COLORS.purple,
  requests: COLORS.success
};

const TransactionSummaryAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [requestsByStatus, setRequestsByStatus] = useState([]);
  const [transactionSummary, setTransactionSummary] = useState([]);
  const [transactionMetrics, setTransactionMetrics] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState({ transactions: [] });
  const [searchText, setSearchText] = useState('');
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});
  const [dateRange, setDateRange] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [requestsRes, summaryRes, metricsRes, historyRes] = await Promise.all([
        axios.get('http://172.18.7.85:7744/api/v1/api/inventory/analytics/requests-by-status'),
        axios.get('http://172.18.7.85:7744/api/v1/api/inventory/analytics/transaction-summary'),
        axios.get('http://172.18.7.85:7744/api/v1/api/inventory/analytics/transaction-metrics'),
        axios.get('http://172.18.7.85:7744/api/v1/api/inventory/analytics/transaction-history?limit=100&offset=0')
      ]);

      setRequestsByStatus(requestsRes.data);
      setTransactionSummary(summaryRes.data);
      setTransactionMetrics(metricsRes.data);
      setTransactionHistory(historyRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter);
  };

  const handleReset = () => {
    setSearchText('');
    setFilteredInfo({});
    setSortedInfo({});
    setDateRange(null);
    fetchAnalytics();
  };

  const getColumnSearchProps = (dataIndex, title) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${title}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) => {
      const path = dataIndex.split('.');
      let recordValue = record;
      for (const key of path) {
        recordValue = recordValue?.[key];
      }
      return recordValue?.toString().toLowerCase().includes(value.toLowerCase());
    },
  });

  const transactionHistoryColumns = [
    {
      title: 'Transaction ID',
      dataIndex: ['transaction', 'id'],
      key: 'id',
      sorter: (a, b) => a.transaction.id - b.transaction.id,
      ...getColumnSearchProps(['transaction', 'id'], 'Transaction ID'),
    },
    {
      title: 'Type',
      dataIndex: ['transaction', 'type'],
      key: 'type',
      filters: [
        { text: 'Issue', value: 'Issue' },
        { text: 'Return', value: 'Return' },
      ],
      onFilter: (value, record) => record.transaction.type === value,
      filterMultiple: false,
    },
    {
      title: 'Quantity',
      dataIndex: ['transaction', 'quantity'],
      key: 'quantity',
      sorter: (a, b) => a.transaction.quantity - b.transaction.quantity,
      ...getColumnSearchProps(['transaction', 'quantity'], 'Quantity'),
    },
    {
      title: 'Item Code',
      dataIndex: ['item', 'item_code'],
      key: 'item_code',
      ...getColumnSearchProps(['item', 'item_code'], 'Item Code'),
    },
    {
      title: 'Performed By',
      dataIndex: ['transaction', 'performed_by', 'username'],
      key: 'username',
      ...getColumnSearchProps(['transaction', 'performed_by', 'username'], 'User'),
    },
    {
      title: 'Date',
      dataIndex: ['transaction', 'created_at'],
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.transaction.created_at) - new Date(b.transaction.created_at),
    },
  ];

  const filteredData = transactionHistory.transactions.filter((item) => {
    if (!searchText) return true;
    
    const searchFields = [
      item.transaction.id,
      item.transaction.type,
      item.transaction.quantity,
      item.item.item_code,
      item.transaction.performed_by.username,
      new Date(item.transaction.created_at).toLocaleDateString(),
    ];

    return searchFields.some(field => 
      field?.toString().toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const dailyTransactionData = transactionMetrics?.daily_transaction_counts
    ? Object.entries(transactionMetrics.daily_transaction_counts).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString(),
        count,
      }))
    : [];

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0 }}>{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>Inventory Analytics Dashboard</h1>
      
      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={transactionMetrics?.total_transactions || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Items Issued"
              value={transactionMetrics?.total_items_issued || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Items Returned"
              value={transactionMetrics?.total_items_returned || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Returns"
              value={transactionMetrics?.pending_returns || 0}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* Transaction Type Distribution */}
        <Col span={12}>
          <Card title="Transaction Type Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(transactionMetrics?.transaction_by_type || {}).map(([type, count]) => ({
                    transaction_type: type,
                    count: count
                  }))}
                  dataKey="count"
                  nameKey="transaction_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={5}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={true}
                >
                  {Object.keys(transactionMetrics?.transaction_by_type || {}).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span style={{ color: '#666' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Daily Transactions */}
        <Col span={12}>
          <Card title="Daily Transactions">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={dailyTransactionData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#666' }}
                  axisLine={{ stroke: '#ccc' }}
                />
                <YAxis 
                  tick={{ fill: '#666' }}
                  axisLine={{ stroke: '#ccc' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => <span style={{ color: '#666' }}>{value}</span>}
                />
                <Bar 
                  dataKey="count" 
                  name="Transactions" 
                  fill={BAR_COLORS.transactions}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Most Active Items and Top Requesters */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* Most Active Items */}
        <Col span={12}>
          <Card title="Most Active Items">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={transactionMetrics?.most_active_items || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <XAxis 
                  type="number"
                  tick={{ fill: '#666' }}
                  axisLine={{ stroke: '#ccc' }}
                />
                <YAxis 
                  type="category"
                  dataKey="item_code"
                  tick={{ fill: '#666' }}
                  axisLine={{ stroke: '#ccc' }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => <span style={{ color: '#666' }}>{value}</span>}
                />
                <Bar 
                  dataKey="transaction_count" 
                  name="Transactions" 
                  fill={BAR_COLORS.items}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Top Requesters */}
        <Col span={12}>
          <Card title="Top Requesters">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={transactionMetrics?.top_requesters || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <XAxis 
                  type="number"
                  tick={{ fill: '#666' }}
                  axisLine={{ stroke: '#ccc' }}
                />
                <YAxis 
                  type="category"
                  dataKey="user_name"
                  tick={{ fill: '#666' }}
                  axisLine={{ stroke: '#ccc' }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => <span style={{ color: '#666' }}>{value}</span>}
                />
                <Bar 
                  dataKey="request_count" 
                  name="Requests" 
                  fill={BAR_COLORS.requests}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Transaction History Table */}
      <Card title="Recent Transactions" style={{ marginBottom: '24px' }}>
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="Search all fields"
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            style={{ width: 300 }}
          />
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            Reset Filters
          </Button>
        </Space>
        <Table
          columns={transactionHistoryColumns}
          dataSource={filteredData}
          rowKey={(record) => record.transaction.id}
          onChange={handleChange}
          pagination={{
            total: transactionHistory.metadata?.total_count,
            pageSize: 5,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default TransactionSummaryAnalytics;
