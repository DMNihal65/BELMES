import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Card, 
  Tag, 
  Space, 
  Input, 
  Button, 
  Modal, 
  Descriptions, 
  Row, 
  Col, 
  Statistic, 
  Tooltip,
  Spin,
  Empty,
  Badge,
  DatePicker,
  Select,
  Divider,
  Timeline,
  Steps
} from 'antd';
import { 
  ReloadOutlined, 
  SearchOutlined, 
  InfoCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  SwapOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  FilterOutlined,
  ClearOutlined,
  HistoryOutlined,
  LinkOutlined
} from '@ant-design/icons';
import useInventoryStore from '../../../../store/inventory-store';
import dayjs from 'dayjs';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const EnhancedTransactionHistory = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [workflowModalVisible, setWorkflowModalVisible] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [enhancedData, setEnhancedData] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs().subtract(1, 'day'), dayjs()]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);

  const { 
    fetchTransactionHistoryEnhanced,
    loading: storeLoading 
  } = useInventoryStore();

  useEffect(() => {
    loadEnhancedHistory(dateRange[0], dateRange[1]);
  }, []);



  const loadEnhancedHistory = async (startDate = null, endDate = null) => {
    setLoading(true);
    try {
      // Use provided parameters or fall back to state
      const start = startDate || dateRange[0];
      const end = endDate || dateRange[1];
      
      // Format dates for API (ISO string format)
      const startDateStr = start ? start.toISOString() : null;
      const endDateStr = end ? end.toISOString() : null;
      
      // Call API with date parameters (no limit/offset - API handles pagination)
      const data = await fetchTransactionHistoryEnhanced(startDateStr, endDateStr);
      setEnhancedData(data);
      
      // Set total count from API response metadata
      if (data && data.metadata && data.metadata.total_count) {
        setTotalCount(data.metadata.total_count);
      } else if (data && data.transactions) {
        // Fallback: if no metadata, use the length of transactions array
        setTotalCount(data.transactions.length);
      }
      
      // Clear any previous errors on successful load
      setError(null);
      
      console.log('Loaded data:', data); // Debug log to see the structure
    } catch (error) {
      console.error('Error loading enhanced transaction history:', error);
      setError(error.message || 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
      setCurrentPage(1); // Reset to first page when date range changes
      setTotalCount(0); // Reset total count when date range changes
      setError(null); // Clear any previous errors
      loadEnhancedHistory(dates[0], dates[1]);
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setTypeFilter('all');
    setStatusFilter('all');
    const defaultDateRange = [dayjs().subtract(1, 'day'), dayjs()];
    setDateRange(defaultDateRange);
    setCurrentPage(1);
    setPageSize(10);
    setTotalCount(0);
    setError(null);
    loadEnhancedHistory(defaultDateRange[0], defaultDateRange[1]);
  };

  // Handle search text changes
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle type filter changes
  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle status filter changes
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleViewDetails = (record) => {
    setSelectedTransaction(record);
    setIsModalVisible(true);
  };

  const handleViewWorkflow = (record) => {
    // Find related transactions for workflow
    const relatedTransactions = [];
    
    if (record.issue_request) {
      // Find all transactions related to this issue request
      const issueId = record.issue_request.id;
      enhancedData.transactions.forEach(trans => {
        if (trans.issue_request?.id === issueId || trans.return_request?.original_request_id === issueId) {
          relatedTransactions.push(trans);
        }
      });
    } else if (record.return_request) {
      // Find transactions related to the original request
      const originalId = record.return_request.original_request_id;
      enhancedData.transactions.forEach(trans => {
        if (trans.issue_request?.id === originalId || trans.return_request?.original_request_id === originalId) {
          relatedTransactions.push(trans);
        }
      });
    }
    
    // Sort by date
    relatedTransactions.sort((a, b) => dayjs(a.transaction.created_at).unix() - dayjs(b.transaction.created_at).unix());
    
    setSelectedWorkflow(relatedTransactions);
    setWorkflowModalVisible(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const getTransactionTypeTag = (type) => {
    const config = {
      'Issue': { color: 'red', icon: <ArrowDownOutlined /> },
      'Return': { color: 'green', icon: <ArrowUpOutlined /> }
    };
    
    const typeConfig = config[type] || { color: 'default', icon: null };
    
    return (
      <Tag color={typeConfig.color} icon={typeConfig.icon}>
        {type}
      </Tag>
    );
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'Pending': { color: 'orange' },
      'Approved': { color: 'blue' },
      'Completed': { color: 'green' },
      'Returned': { color: 'purple' },
      'Rejected': { color: 'red' }
    };
    
    const config = statusMap[status] || { color: 'default' };
    return <Tag color={config.color}>{status}</Tag>;
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: ['transaction', 'created_at'],
      key: 'created_at',
      width: 30,
      render: (date) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">{dayjs(date).format('DD/MM/YYYY')}</div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.transaction.created_at).unix() - dayjs(b.transaction.created_at).unix(),
    },
    {
      title: 'Transaction',
      key: 'transaction_info',
      width: 40,
      render: (_, record) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            {getTransactionTypeTag(record.transaction.type)}
            <span className="text-xs text-gray-500">#{record.transaction.id}</span>
          </div>
          <div className="font-medium">{record.item.item_code}</div>
          <div className="text-xs text-gray-500">Qty: {record.transaction.quantity}</div>
        </div>
      ),
    },
    {
      title: 'Item Info',
      key: 'item_info',
      width: 60,
      render: (_, record) => (
        <Tooltip 
          title={
            <div>
              <div><strong>Item Code:</strong> {record.item.item_code}</div>
              <div><strong>Category:</strong> {record.item.subcategory.category?.name || 'N/A'}</div>
              <div><strong>Subcategory:</strong> {record.item.subcategory?.name || 'N/A'}</div>
              <div><strong>Available Qty:</strong> {record.item.available_quantity || 0}</div>
            </div>
          }
        >
          <div className="space-y-1">
            <div className="font-medium text-blue-600 cursor-pointer hover:text-blue-800" 
                 onClick={() => handleItemInfoClick(record.item)}>
              {record.item.subcategory?.name || 'N/A'}
            </div>
            <div className="text-xs text-gray-500">
              {record.item.subcategory.category?.name || 'N/A'}
            </div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Users',
      key: 'users',
      width: 60,
      render: (_, record) => (
        <div className="space-y-1">
          <div>
            <div className="text-xs text-gray-500">Performed by</div>
            <Tag size="small" icon={<UserOutlined />}>
              {record.transaction.performed_by.username}
            </Tag>
          </div>
          {record.issue_request?.requested_by && (
            <div>
              <div className="text-xs text-gray-500">Requested by</div>
              <Tag size="small" color="blue" icon={<UserOutlined />}>
                {record.issue_request.requested_by.username}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Request Info',
      key: 'request_info',
      width: 50,
      render: (_, record) => {
        const issueRequest = record.issue_request;
        const returnRequest = record.return_request;
        
        if (issueRequest) {
          return (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Tag color="blue" size="small">Issue #{issueRequest.id}</Tag>
                {getStatusTag(issueRequest.status)}
              </div>
              <div className="text-xs text-gray-600 truncate">
                {issueRequest.purpose}
              </div>
             
            </div>
          );
        }
        
        if (returnRequest) {
          return (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Tag color="purple" size="small">Return #{returnRequest.id}</Tag>
                {getStatusTag(returnRequest.status)}
              </div>
              <div className="text-xs text-gray-600 truncate">
                {returnRequest.return_reason}
              </div>
            </div>
          );
        }
        
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      title: 'Stock Change',
      key: 'stock_change',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div className="text-center">
          <div className="text-xs text-gray-500">
            {record.transaction.quantity_before} → {record.transaction.quantity_after}
          </div>
          <div className={`font-medium ${record.transaction.type === 'Issue' ? 'text-red-600' : 'text-green-600'}`}>
            {record.transaction.type === 'Issue' ? '-' : '+'}{record.transaction.quantity}
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 50,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
              size="small"
            />
          </Tooltip>
          {(record.issue_request || record.return_request) && (
            <Tooltip title="View Workflow">
              <Button 
                icon={<LinkOutlined />}
                onClick={() => handleViewWorkflow(record)}
                size="small"
                type="primary"
                ghost
              />
            </Tooltip>
          )}
        </Space>
      ),
    }
  ];

  // Get all filtered data for pagination
  const allFilteredData = enhancedData?.transactions?.filter(item => {
          // Search filter
      let searchMatch = true;
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        searchMatch = (
          item.transaction.id.toString().includes(searchLower) ||
          item.item.item_code.toLowerCase().includes(searchLower) ||
          item.transaction.type.toLowerCase().includes(searchLower) ||
          item.transaction.performed_by.username.toLowerCase().includes(searchLower) ||
          item.transaction.remarks?.toLowerCase().includes(searchLower) ||
          item.issue_request?.purpose?.toLowerCase().includes(searchLower) ||
          item.return_request?.return_reason?.toLowerCase().includes(searchLower) ||
          item.issue_request?.requested_by?.username?.toLowerCase().includes(searchLower) ||
          item.item.subcategory?.name?.toLowerCase().includes(searchLower) ||
          item.item.category?.name?.toLowerCase().includes(searchLower) ||
          item.issue_request?.status?.toLowerCase().includes(searchLower) ||
          item.return_request?.status?.toLowerCase().includes(searchLower) ||
          item.issue_request?.order_name?.toLowerCase().includes(searchLower) ||
          item.issue_request?.operation_name?.toLowerCase().includes(searchLower)
        );
      }
    
    // Type filter
    let typeMatch = true;
    if (typeFilter !== 'all') {
      typeMatch = item.transaction.type === typeFilter;
    }
    
    // Status filter
    let statusMatch = true;
    if (statusFilter !== 'all') {
      statusMatch = item.issue_request?.status === statusFilter || item.return_request?.status === statusFilter;
    }
    
    return searchMatch && typeMatch && statusMatch;
  }) || [];

  // Apply pagination to filtered data
  const filteredData = allFilteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  // Update total count based on filtered results
  useEffect(() => {
    if (allFilteredData.length !== totalCount) {
      setTotalCount(allFilteredData.length);
    }
  }, [allFilteredData, totalCount]);

  // Quick stats for filtered data
  const quickStats = {
    total: allFilteredData.length,
    issued: allFilteredData.filter(item => item.transaction.type === 'Issue').length,
    returned: allFilteredData.filter(item => item.transaction.type === 'Return').length,
    totalQuantity: allFilteredData.reduce((sum, item) => sum + item.transaction.quantity, 0)
  };

  // State for item info popup
  const [itemInfoModalVisible, setItemInfoModalVisible] = useState(false);
  const [selectedItemInfo, setSelectedItemInfo] = useState(null);

  // Handle item info click
  const handleItemInfoClick = (item) => {
    setSelectedItemInfo(item);
    setItemInfoModalVisible(true);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Quick Stats */}
      

      {/* Filters */}
      <Card className="mb-4" size="small">
        <Row gutter={16} align="middle">
          <Col span={6}>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">Date Range</span>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                size="small"
                allowClear={false}
              />
            </div>
          </Col>
          <Col span={4}>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">Type</span>
              <Select
                value={typeFilter}
                onChange={handleTypeFilterChange}
                size="small"
                className="w-full"
              >
                <Option value="all">All Types</Option>
                <Option value="Issue">Issues</Option>
                <Option value="Return">Returns</Option>
              </Select>
            </div>
          </Col>
          
          
          
          <Col span={4}>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">Search</span>
              <Search
                placeholder="Search transactions..."
                value={searchText}
                onChange={handleSearchChange}
                size="small"
                allowClear
              />
            </div>
          </Col>
          <Col span={4}>
            <Space className="mt-4">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => loadEnhancedHistory(dateRange[0], dateRange[1])}
                size="small"
                loading={loading}
              >
                Refresh
              </Button>
              <Button 
                icon={<ClearOutlined />} 
                onClick={clearFilters}
                size="small"
              >
                Clear
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Transaction Table */}
      <Card 
                title={
          <div className="flex items-center gap-2">
            <HistoryOutlined />
            <span>Transaction History</span>
            <Badge count={totalCount} style={{ backgroundColor: '#1890ff' }} />
          </div>
        }
      >
        <Spin spinning={loading || storeLoading}>
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-500 text-lg mb-2">Error loading data</div>
              <div className="text-gray-600 mb-4">{error}</div>
              <Button 
                type="primary" 
                onClick={() => {
                  setError(null);
                  loadEnhancedHistory();
                }}
              >
                Retry
              </Button>
            </div>
          ) : !enhancedData ? (
            <Empty 
              description="Loading transaction history..."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : filteredData.length === 0 ? (
            <Empty 
              description="No transaction history found for the selected filters"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey={(record) => record.transaction.id}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalCount,
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} transactions`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
                onShowSizeChange: (current, size) => {
                  setPageSize(size);
                  setCurrentPage(1); // Reset to first page when size changes
                }
              }}
              // scroll={{ x: 1800 }}
              size="middle"
              rowClassName={(record) => 
                record.transaction.type === 'Issue' ? 'bg-red-50 hover:bg-red-100' : 'bg-green-50 hover:bg-green-100'
              }
            />
          )}
        </Spin>

        {/* Enhanced Detail Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <InfoCircleOutlined />
              <span>Transaction Details</span>
              {selectedTransaction && (
                <Tag color={selectedTransaction.transaction.type === 'Issue' ? 'red' : 'green'}>
                  {selectedTransaction.transaction.type}
                </Tag>
              )}
            </div>
          }
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={900}
        >
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Transaction Info */}
              <Card title="Transaction Information" size="small">
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Transaction ID">
                    {selectedTransaction.transaction.id}
                  </Descriptions.Item>
                  <Descriptions.Item label="Type">
                    {getTransactionTypeTag(selectedTransaction.transaction.type)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Quantity">
                    <Badge count={selectedTransaction.transaction.quantity} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Performed By">
                    <Tag icon={<UserOutlined />}>
                      {selectedTransaction.transaction.performed_by.username}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Quantity Before">
                    {selectedTransaction.transaction.quantity_before}
                  </Descriptions.Item>
                  <Descriptions.Item label="Quantity After">
                    {selectedTransaction.transaction.quantity_after}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created At" span={2}>
                    {formatDate(selectedTransaction.transaction.created_at)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Remarks" span={2}>
                    {selectedTransaction.transaction.remarks || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Item Information */}
              <Card title="Item Information" size="small">
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Item ID">
                    {selectedTransaction.item.id}
                  </Descriptions.Item>
                  <Descriptions.Item label="Item Code">
                    {selectedTransaction.item.item_code}
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Available Quantity">
                    <span className="font-medium text-orange-600">
                      {selectedTransaction.item.available_quantity}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Issue Request Details */}
              {selectedTransaction.issue_request && (
                <Card title="Related Issue Request" size="small">
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Request ID">
                      {selectedTransaction.issue_request.id}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {getStatusTag(selectedTransaction.issue_request.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Purpose" span={2}>
                      {selectedTransaction.issue_request.purpose}
                    </Descriptions.Item>
                    <Descriptions.Item label="Requested By">
                      <Tag icon={<UserOutlined />}>
                        {selectedTransaction.issue_request.requested_by.username}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Order ID">
                      {selectedTransaction.issue_request.order_id}
                    </Descriptions.Item>
                    <Descriptions.Item label="Operation ID">
                      {selectedTransaction.issue_request.operation_id}
                    </Descriptions.Item>
                    <Descriptions.Item label="Expected Return">
                      {formatDate(selectedTransaction.issue_request.expected_return_date)}
                    </Descriptions.Item>
                    {selectedTransaction.issue_request.actual_return_date && (
                      <Descriptions.Item label="Actual Return" span={2}>
                        {formatDate(selectedTransaction.issue_request.actual_return_date)}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              )}

              {/* Return Request Details */}
              {selectedTransaction.return_request && (
                <Card title="Related Return Request" size="small">
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Return Request ID">
                      {selectedTransaction.return_request.id}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {getStatusTag(selectedTransaction.return_request.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Original Request ID">
                      {selectedTransaction.return_request.original_request_id}
                    </Descriptions.Item>
                    <Descriptions.Item label="Requested By">
                      <Tag icon={<UserOutlined />}>
                        {selectedTransaction.return_request.requested_by.username}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Return Reason" span={2}>
                      {selectedTransaction.return_request.return_reason}
                    </Descriptions.Item>
                    {selectedTransaction.return_request.actual_return_date && (
                      <Descriptions.Item label="Actual Return Date" span={2}>
                        {formatDate(selectedTransaction.return_request.actual_return_date)}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              )}
            </div>
          )}
        </Modal>

        {/* Workflow Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <LinkOutlined />
              <span>Transaction Workflow</span>
            </div>
          }
          open={workflowModalVisible}
          onCancel={() => setWorkflowModalVisible(false)}
          footer={null}
          width={800}
        >
          {selectedWorkflow && selectedWorkflow.length > 0 && (
            <div>
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <div className="font-medium">Workflow Overview</div>
                <div className="text-sm text-gray-600">
                  Item: <span className="font-medium">{selectedWorkflow[0].item.item_code}</span>
                </div>
              </div>
              
              <Timeline className="mt-4">
                {selectedWorkflow.map((transaction, index) => (
                  <Timeline.Item
                    key={transaction.transaction.id}
                    color={transaction.transaction.type === 'Issue' ? 'red' : 'green'}
                    dot={transaction.transaction.type === 'Issue' ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                  >
                    <div className="pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        {getTransactionTypeTag(transaction.transaction.type)}
                        <span className="text-sm text-gray-500">
                          {formatDate(transaction.transaction.created_at)}
                        </span>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <Row gutter={16}>
                          <Col span={12}>
                            <div className="text-sm">
                              <div className="font-medium">Transaction #{transaction.transaction.id}</div>
                              <div>Quantity: {transaction.transaction.quantity}</div>
                              <div>By: {transaction.transaction.performed_by.username}</div>
                            </div>
                          </Col>
                          <Col span={12}>
                            {transaction.issue_request && (
                              <div className="text-sm">
                                <div className="font-medium text-blue-600">Issue Request #{transaction.issue_request.id}</div>
                                {/* <div>Status: {getStatusTag(transaction.issue_request.status)}</div> */}
                                <div>Purpose: {transaction.issue_request.purpose}</div>
                                <div>Requested by: {transaction.issue_request.requested_by.username}</div>
                              </div>
                            )}
                            {transaction.return_request && (
                              <div className="text-sm">
                                <div className="font-medium text-purple-600">Return Request #{transaction.return_request.id}</div>
                                <div>Status: {getStatusTag(transaction.return_request.status)}</div>
                                <div>Reason: {transaction.return_request.return_reason}</div>
                                <div>Requested by: {transaction.return_request.requested_by.username}</div>
                              </div>
                            )}
                          </Col>
                        </Row>
                        
                        {transaction.transaction.remarks && (
                          <div className="mt-2 pt-2 border-t text-sm text-gray-600">
                            <strong>Remarks:</strong> {transaction.transaction.remarks}
                          </div>
                        )}
                      </div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          )}
        </Modal>

                 {/* Item Info Modal */}
         <Modal
           title={
             <div className="flex items-center gap-2">
               <InfoCircleOutlined />
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
               <Card title="Basic Information" size="small">
                 <Descriptions bordered column={2}>
                   <Descriptions.Item label="Item ID">
                     {selectedItemInfo.id}
                   </Descriptions.Item>
                   <Descriptions.Item label="Item Code">
                     <Tag color="blue">{selectedItemInfo.item_code}</Tag>
                   </Descriptions.Item>
                   <Descriptions.Item label="Category">
                     <Tag color="green">{selectedItemInfo.subcategory.category?.name || 'N/A'}</Tag>
                   </Descriptions.Item>
                   <Descriptions.Item label="Subcategory">
                     <Tag color="orange">{selectedItemInfo.subcategory?.name || 'N/A'}</Tag>
                   </Descriptions.Item>
                   
                   <Descriptions.Item label="Quantity">
                     <Tag color="orange" >{selectedItemInfo.quantity || 0} </Tag>
                   </Descriptions.Item>
                   <Descriptions.Item label="Available Quantity">
                     <Tag color="orange" >{selectedItemInfo.available_quantity || 0} </Tag>
                   </Descriptions.Item>
                 </Descriptions>
               </Card>

               
               {/* Dynamic Data */}
               {selectedItemInfo.dynamic_data && Object.keys(selectedItemInfo.dynamic_data).length > 0 && (
                 <Card title="Items Data" size="small">
                   <Descriptions bordered column={2}>
                     {Object.entries(selectedItemInfo.dynamic_data).map(([key, value]) => (
                       <Descriptions.Item key={key} label={key}>
                         {typeof value === 'number' ? <Tag color='orange'>{value} </Tag>  :  <text>{value}</text>}
                       </Descriptions.Item>
                     ))}
                   </Descriptions>
                 </Card>
               )}

              
             </div>
           )}
         </Modal>
      </Card>
    </div>
  );
};

export default EnhancedTransactionHistory;
