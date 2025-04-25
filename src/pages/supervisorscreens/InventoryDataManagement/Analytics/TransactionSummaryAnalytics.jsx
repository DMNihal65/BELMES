import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Statistic, Spin, Input, Select, DatePicker, Space, Button, Typography, Tag   } from 'antd';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { SearchOutlined, ReloadOutlined, SwapOutlined, ExportOutlined, ImportOutlined, ClockCircleOutlined, ToolOutlined } from '@ant-design/icons';
import useInventoryStore from '../../../../store/inventory-store';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

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
  const [searchText, setSearchText] = useState('');
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});
  const [dateRange, setDateRange] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    loading,
    requestsByStatus,
    transactionSummary,
    transactionMetrics,
    transactionHistory,
    fetchAnalytics,
    searchTransactionHistory, 
    fetchCategories, 
    fetchItems, 
    fetchAllSubcategories,
  } = useInventoryStore();




  useEffect(() => {
    fetchAnalytics();
  }, []);

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

  const handleSearch = (value) => {
    setSearchText(value);
    searchTransactionHistory(value, dateRange);
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

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    searchTransactionHistory(searchText, dates);
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
      title: 'Inventory Item',
      dataIndex: 'inventory_item_id',
      key: 'inventory_item_id',
      width: 200,
      render: (itemId) => {
        // console.log('Rendering item with ID:', itemId); // Log the itemId being rendered
        const item = inventoryItems.find(item => item.id === itemId);
        const subcategory = item ? subcategories.find(sub => sub.id === item.subcategory_id) : null;

        // console.log('Item:', item); // Debug log
        // console.log('Subcategory:', subcategory); // Debug log

        if (!item) {
          return <span>N/A</span>; // Handle case where item is not found
        }

        const category = subcategory ? subcategory.category_name : 'N/A'; // Assuming category_name is available in subcategory

        return (
          <Tooltip title={`Click to view calibration history for this item`}>
            <Tag 
              icon={<ToolOutlined />} 
              style={{ cursor: 'pointer', color: '#1890ff' }}
              onClick={() => handleInventoryItemClick(itemId)}
            >
              {`${category !== 'N/A' ? `${category} - ` : ''}${subcategory?.name || 'N/A'}${item.dynamic_data["Instrument code"] ? ` - ${item.dynamic_data["Instrument code"]}` : ''}`}
            </Tag>
          </Tooltip>
        );
      }
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

  console.log('Inventory Itemssssss:', inventoryItems);
  console.log('Subcategoriesssssss:', subcategories);

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>Inventory Analytics Dashboard</h1>
      
      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
        <Card 
                hoverable 
                className="shadow-sm"
                style={{ backgroundColor: '#f0f5ff', borderLeft: '4px solid #1890ff' }}
              >
            <Statistic
              title={<Text strong>Total Transactions</Text>}
              value={transactionMetrics?.total_transactions || 0}
              prefix={<SwapOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            hoverable 
            className="shadow-sm"
            style={{ backgroundColor: '#f6ffed', borderLeft: '4px solid #52c41a' }}
          >
            <Statistic
              title={<Text strong>Items Issued</Text>}
              value={transactionMetrics?.total_items_issued || 0}
              prefix={<ExportOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            hoverable 
            className="shadow-sm"
            style={{ backgroundColor: '#fff7e6', borderLeft: '4px solid #fa8c16' }}
          >
            <Statistic
              title={<Text strong>Items Returned</Text>}
              value={transactionMetrics?.total_items_returned || 0}
              prefix={<ImportOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            hoverable 
            className="shadow-sm"
            style={{ backgroundColor: '#fff1f0', borderLeft: '4px solid #f5222d' }}
          >
            <Statistic
              title={<Text strong>Pending Returns</Text>}
              value={transactionMetrics?.pending_returns || 0}
              prefix={<ClockCircleOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
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
            onChange={handleDateRangeChange}
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
