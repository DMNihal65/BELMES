import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Statistic, Spin, Input, Select, DatePicker, Space, Button, Typography, Tag } from 'antd';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { SearchOutlined, ReloadOutlined, SwapOutlined, ExportOutlined, ImportOutlined, ClockCircleOutlined, ToolOutlined, InfoCircleOutlined, TagOutlined } from '@ant-design/icons';
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
  const [itemDetails, setItemDetails] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const {
    // loading,
    requestsByStatus,
    transactionSummary,
    transactionMetrics,
    transactionHistory,
    fetchAnalytics,
    searchTransactionHistory, 
    fetchCategories, 
    fetchItems, 
    fetchAllSubcategories,
    fetchCategoryById,
    fetchSubcategoryById,
    fetchItemById,
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

  useEffect(() => {
    const fetchItemDetails = async () => {
      const details = {};
      for (const transaction of transactionHistory.transactions) {
        const itemId = transaction.item.id;
        try {
          const item = await fetchItemById(itemId);
          const subcategory = await fetchSubcategoryById(item.subcategory_id);
          const category = await fetchCategoryById(subcategory.category_id);

          details[itemId] = {
            categoryName: category?.name || 'N/A',
            subcategoryName: subcategory?.name || 'N/A',
          };
        } catch (error) {
          console.error(`Error fetching details for item ID ${itemId}:`, error.message || error);
          details[itemId] = {
            categoryName: `Error: ${error.message || 'Failed to fetch category'}`,
            subcategoryName: `Error: ${error.message || 'Failed to fetch subcategory'}`,
          };
        }
      }
      setItemDetails(details);
    };

    fetchItemDetails();
  }, [transactionHistory.transactions]);

  const mostActiveItemsData = transactionMetrics?.most_active_items?.map(item => {
    const itemId = item.item_id; // Use item.item_id instead of item.id
    const details = itemDetails[itemId]; // Fetch item details using the correct item ID

    // Combine category and subcategory for the y-axis label
    const categorySubcategory = `${item.item_category} - ${item.item_subcategory}`;

    return {
        ...item,
        itemDetails: details ? `${details.categoryName} - ${details.subcategoryName}` : 'Loading', // Combine category and subcategory
        categorySubcategory, // Add the combined category-subcategory for the y-axis
    };
  }) || [];

  
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

  const handleTableChange = (pagination, filters, sorter) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
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
      title: 'Item Details',
      dataIndex: 'item_code',
      key: 'item_details',
      width: 300,
      render: (itemCode, record) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Tag style={{ cursor: 'pointer', color: '#1890ff' }}>
              <ToolOutlined /> {record.category_name} - {record.subcategory_name}
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'Issue', value: 'Issue' },
        { text: 'Return', value: 'Return' },
      ],
      onFilter: (value, record) => record.type === value,
      filterMultiple: false,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
      ...getColumnSearchProps('quantity', 'Quantity'),
    },
    {
      title: 'Performed By',
      dataIndex: 'performed_by_username',
      key: 'username',
      ...getColumnSearchProps('performed_by_username', 'User'),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
  ];

  const filteredData = transactionHistory.transactions?.filter((item) => {
    if (!searchText) return true;
    
    const searchFields = [
      item.id,
      item.type,
      item.quantity,
      item.item_code,
      item.performed_by_username,
      new Date(item.created_at).toLocaleDateString(),
    ];

    return searchFields.some(field => 
      field?.toString().toLowerCase().includes(searchText.toLowerCase())
    );
  }) || [];

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

  // if (loading) {
  //   return <Spin size="large" />;
  // }

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
            {mostActiveItemsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={mostActiveItemsData}
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
                    dataKey="categorySubcategory"
                    tick={{
                      fill: '#1E293B',          // dark blue-grey color for text
                      fontSize: 12,             // smaller font size
                      fontWeight: 500,          // medium bold
                      angle: 0,                 // keep labels horizontal (you can change to -45 if needed)
                      textAnchor: 'end',        // align text nicely
                    }}
                    axisLine={{ stroke: '#94A3B8' }}   // softer axis line color
                    tickLine={{ stroke: '#CBD5E1', strokeWidth: 1 }} // small lines for each tick
                    width={120}
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
            ) : (
              <p>No data available for the chart.</p>
            )}
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

     
    </div>
  );
};

export default TransactionSummaryAnalytics;










