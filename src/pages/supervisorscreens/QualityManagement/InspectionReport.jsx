import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Space, 
  Button,
  Select,
  Row,
  Col,
  DatePicker,
  Radio,
  Tree,
  Input,
  message,
  Spin,
  Typography,
  Tooltip,
  Badge,
  Divider
} from 'antd';
import { 
  SearchOutlined,
  UploadOutlined,
  StarOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FolderOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  FilterOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { qualityStore } from '../../../store/quality-store';

const { Title, Text } = Typography;

const InspectionReport = () => {
  const [selectedReportType, setSelectedReportType] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportStructure, setReportStructure] = useState(null);
  const [treeData, setTreeData] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [refreshingData, setRefreshingData] = useState(false);

  // Fetch report structure data
  useEffect(() => {
    fetchReportStructure();
  }, []);

  // Function to fetch the report structure
  const fetchReportStructure = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (forceRefresh) {
        setRefreshingData(true);
      }
      
      const data = await qualityStore.fetchReportStructure(forceRefresh);
      setReportStructure(data);
      
      // Process the data to create tree structure and reports list
      if (data) {
        processReportData(data);
      }
    } catch (error) {
      console.error('Error fetching report structure:', error);
      message.error('Failed to load report structure');
    } finally {
      setLoading(false);
      setRefreshingData(false);
    }
  };

  // Process the report data to create tree structure and reports list
  const processReportData = (data) => {
    if (!data || data.length === 0) {
      console.log('No report data available');
      return;
    }
    
    // Format the hierarchical data into a tree structure
    const formattedTreeData = formatTreeData(data);
    setTreeData(formattedTreeData);
    
    // Extract all documents from the nested structure into a flat list
    const extractedReports = [];
    
    // Recursive function to extract documents
    const extractDocuments = (items) => {
      if (!items || !Array.isArray(items)) return;
      
      items.forEach(item => {
        // If it's a document, add it to our reports list
        if (item.type === 'document') {
          extractedReports.push({
            key: item.id, // This is the document ID we need for download
            name: item.name,
            type: 'REPORT',
            date: item.created_at,
            status: 'Available',
            description: item.description || '',
            part_number: item.part_number || '',
            production_order_id: item.production_order_id,
            file_path: item.latest_version?.minio_path || '',
            file_size: item.latest_version?.file_size || 0,
            version: item.latest_version?.version_number || '1.0',
            category: item.path?.split('/')[2] || 'Unknown' // Extract category from path
          });
        }
        
        // If it has children, recursively process them
        if (item.children && item.children.length > 0) {
          extractDocuments(item.children);
        }
      });
    };
    
    // Start the extraction
    extractDocuments(data);
    
    // Set the extracted reports
    setReports(extractedReports);
    console.log('Extracted reports:', extractedReports);
  };

  // Format the categories into a tree structure
  const formatTreeData = (data) => {
    // Recursive function to map the nested structure
    const mapNestedData = (items) => {
      if (!items || !Array.isArray(items)) return [];
      
      return items.map(item => {
        const isFolder = item.type === 'folder';
        const isDocument = item.type === 'document';
        
        return {
          title: item.name,
          key: `${item.type}-${item.id}`,
          icon: isFolder ? <FolderOutlined className="text-blue-500" /> : <FileTextOutlined className="text-green-500" />,
          isLeaf: isDocument,
          selectable: true,
          children: item.children && item.children.length > 0 ? mapNestedData(item.children) : []
        };
      });
    };
    
    return mapNestedData(data);
  };

  // Handle tree selection
  const handleTreeSelect = (selectedKeys, info) => {
    if (selectedKeys.length > 0) {
      const selectedKey = selectedKeys[0];
      setSelectedCategory(selectedKey);
      
      // Check if the selection is a document or folder
      const [itemType, itemId] = selectedKey.split('-');
      
      if (itemType === 'document') {
        // Find the specific document and filter to show only it
        setSearchText(''); // Clear any existing search
        setSelectedReportType('all'); // Reset type filter
        
        // The table will be filtered in the filteredReports computed value
        message.info(`Selected document: ${info.node.title}`);
      } else if (itemType === 'folder') {
        // For folders, we'll simply use the path to filter reports
        setSearchText(''); // Clear any existing search
        setSelectedReportType('all'); // Reset type filter
        
        // The filtering will happen in the filteredReports computed value
        message.info(`Selected folder: ${info.node.title}`);
      }
    }
  };

  // Handle refreshing the report structure
  const handleRefresh = () => {
    fetchReportStructure(true);
    message.loading({ content: 'Refreshing report structure...', key: 'refresh', duration: 1 });
  };

  // Handle downloading a report
  const handleDownloadReport = async (report) => {
    // Check if we have a valid document ID and version info
    if (!report.key) {
      message.error('Missing document information for download');
      return;
    }
    
    message.loading({ content: 'Preparing download...', key: 'download' });
    
    try {
      const documentId = report.key;
      // Extract version number from the report data, default to "1.0" if not available
      const versionNumber = report.version || "1.0";
      
      console.log(`Downloading document ID: ${documentId}, version: ${versionNumber}`);
      
      // Call the new download method from the quality store
      const downloadData = await qualityStore.downloadReportById(documentId, versionNumber);
      
      // Create a link and click it to download
      const a = document.createElement('a');
      a.href = downloadData.url;
      a.download = report.name || downloadData.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(downloadData.url), 5000);
      
      message.success({ content: 'Report downloaded successfully', key: 'download' });
    } catch (error) {
      console.error('Error downloading report:', error);
      message.error({ 
        content: `Failed to download report: ${error.message || 'Unknown error'}`, 
        key: 'download' 
      });
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Report Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div className="font-medium text-blue-600 hover:text-blue-800 transition-colors">{text}</div>
          {record.description && (
            <div className="text-xs text-gray-500 mt-1 max-w-md">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Badge 
          className="site-badge-count-109" 
          count={type} 
          style={{ 
            backgroundColor: '#1677ff', 
            padding: '0 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500'
          }} 
        />
      ),
    },
    {
      title: 'Part No.',
      dataIndex: 'part_number',
      key: 'part_number',
      width: 120,
      render: (text) => text ? (
        <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded inline-block text-xs font-mono">
          {text}
        </div>
      ) : '-',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 160,
      render: (date) => {
        if (!date) return '-';
        const formattedDate = new Date(date).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        return (
          <div className="flex items-center">
            <CalendarOutlined className="mr-1 text-gray-400" />
            <span>{formattedDate}</span>
          </div>
        );
      },
    },
    {
      title: 'Size',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: (size) => {
        if (!size) return '-';
        // Convert bytes to KB or MB
        let formattedSize;
        if (size < 1024) formattedSize = `${size} B`;
        else if (size < 1024 * 1024) formattedSize = `${(size / 1024).toFixed(1)} KB`;
        else formattedSize = `${(size / (1024 * 1024)).toFixed(1)} MB`;
        
        return (
          <Tooltip title={`${size} bytes`}>
            <span className="text-gray-600">{formattedSize}</span>
          </Tooltip>
        );
      }
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (version) => version ? (
        <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full inline-block text-xs">
          v{version}
        </div>
      ) : 'v1.0',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Add to favorites">
            <Button 
              icon={<StarOutlined />} 
              type="text" 
              className="text-amber-400 hover:text-amber-500 hover:bg-amber-50" 
            />
          </Tooltip>
          <Tooltip title="Delete report">
            <Button 
              icon={<DeleteOutlined />} 
              type="text" 
              danger 
              className="hover:bg-red-50" 
            />
          </Tooltip>
          <Tooltip title={record.key ? "Download PDF" : "No document available"}>
            <Button 
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadReport(record)}
              disabled={!record.key}
              size="middle"
              className={!record.key ? "opacity-50" : ""}
            >
              PDF
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Filter reports based on search text, selected type, and selected category
  const filteredReports = reports.filter(report => {
    // Text search filter
    const matchesSearch = searchText 
      ? report.name.toLowerCase().includes(searchText.toLowerCase()) 
      : true;
    
    // Type filter
    const matchesType = selectedReportType === 'all' || 
      report.type.toLowerCase() === selectedReportType.toLowerCase();
    
    // Category filter (from tree selection)
    let matchesCategory = true;
    if (selectedCategory) {
      const [itemType, itemId] = selectedCategory.split('-');
      
      if (itemType === 'document') {
        // If a document is selected, only show that specific document
        matchesCategory = report.key === parseInt(itemId);
      } else if (itemType === 'folder') {
        // If a folder is selected, show reports where path contains this folder
        // For simplicity, we'll use the name in the check, but in reality
        // you might need more complex logic depending on your data structure
        const folder = treeData.find(item => 
          item.key === selectedCategory || 
          findNodeInTree(item, selectedCategory)
        );
        
        if (folder) {
          // Check if the report belongs to this folder based on category or path
          matchesCategory = report.category.includes(folder.title) || 
                           (report.path && report.path.includes(folder.title));
        }
      }
    }
    
    return matchesSearch && matchesType && matchesCategory;
  });
  
  // Helper function to find a node in the tree by key
  const findNodeInTree = (node, key) => {
    if (node.key === key) return true;
    if (node.children) {
      return node.children.some(child => findNodeInTree(child, key));
    }
    return false;
  };

  const handleLaunchQMS = () => {
    try {
      // Using registered protocol to launch QMS
      window.location.href = "belmes://launch-qms";
      message.success('Launching QMS application...');
    } catch (error) {
      console.error('Failed to launch QMS application:', error);
      message.error('Failed to launch QMS. Please ensure the application is properly installed.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Page Header */}
      <div className="mb-6">
        <Title level={4} className="mb-2">Quality Inspection Reports</Title>
        <Text type="secondary">View, filter, and download quality inspection reports</Text>
      </div>
      
      <Divider className="my-4" />
      
      {/* Filters Section */}
      <Row gutter={[24, 24]} className="mb-6">
        <Col span={8}>
          <div className="font-medium mb-2 flex items-center">
            <CalendarOutlined className="mr-2 text-blue-500" />
            <span>Date Range</span>
          </div>
          <DatePicker.RangePicker 
            className="w-full"
            placeholder={['Start date', 'End date']}
            size="middle"
          />
        </Col>
        <Col span={8}>
          <div className="font-medium mb-2 flex items-center">
            <FilterOutlined className="mr-2 text-blue-500" />
            <span>Report Type</span>
          </div>
          <Select
            className="w-full"
            defaultValue="all"
            onChange={setSelectedReportType}
            options={[
              { value: 'all', label: 'All Reports' },
              { value: 'METRICS', label: 'Quality Metrics' },
              { value: 'INSPECTION', label: 'Inspection Reports' },
              { value: 'NONCONFORMANCE', label: 'Non-conformance' },
            ]}
            size="middle"
          />
        </Col>
        <Col span={8}>
          <div className="font-medium mb-2 flex items-center">
            <AppstoreOutlined className="mr-2 text-blue-500" />
            <span>Actions</span>
          </div>
          <Button 
            type="primary"
            icon={<AppstoreOutlined />}
            onClick={handleLaunchQMS}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 border-none shadow-sm hover:shadow-md transition-all"
          >
            Launch QMS
          </Button>
        </Col>
      </Row>

      {/* Content Section */}
      <Row gutter={24}>
        {/* Left Side - Tree */}
        <Col span={6}>
          <Card 
            title={
              <div className="flex items-center">
                <FolderOutlined className="mr-2 text-blue-500" />
                <span>Report Categories</span>
              </div>
            }
            bordered={true}
            className="shadow-sm hover:shadow-md transition-shadow duration-300"
            extra={
              <Tooltip title="Refresh data">
                <Button 
                  type="text" 
                  icon={<ReloadOutlined spin={refreshingData} />} 
                  onClick={handleRefresh}
                  className="text-blue-500 hover:bg-blue-50"
                />
              </Tooltip>
            }
            headStyle={{ borderBottom: '1px solid #e6f0ff', backgroundColor: '#f7faff' }}
          >
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Spin tip="Loading categories..." />
              </div>
            ) : treeData && treeData.length > 0 ? (
              <div className="max-h-[60vh] overflow-auto">
                <Tree
                  treeData={treeData}
                  defaultExpandAll
                  showIcon
                  onSelect={handleTreeSelect}
                  blockNode
                  className="custom-tree"
                />
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No categories found
              </div>
            )}
          </Card>
        </Col>

        {/* Right Side - Table */}
        <Col span={18}>
          <Card 
            title={
              <div className="flex items-center">
                <FileTextOutlined className="mr-2 text-blue-500" />
                <span>Reports List</span>
                {filteredReports.length > 0 && (
                  <Badge 
                    count={filteredReports.length} 
                    className="ml-2"
                    style={{ 
                      backgroundColor: '#52c41a', 
                      boxShadow: '0 0 0 1px #52c41a inset' 
                    }}
                  />
                )}
              </div>
            }
            bordered={true}
            className="shadow-sm hover:shadow-md transition-shadow duration-300"
            extra={
              <Space>
                <Input
                  placeholder="Search files..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  onChange={(e) => setSearchText(e.target.value)}
                  value={searchText}
                  className="rounded-md w-64"
                  allowClear
                />
                <Button 
                  type="primary"
                  icon={<UploadOutlined />}
                  className="bg-green-500 hover:bg-green-600 border-none"
                >
                  Upload New
                </Button>
              </Space>
            }
            headStyle={{ borderBottom: '1px solid #e6f0ff', backgroundColor: '#f7faff' }}
          >
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Spin tip="Loading reports..." />
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={filteredReports}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} reports`
                }}
                rowKey="key"
                className="reports-table"
                rowClassName="hover:bg-blue-50 transition-colors"
                bordered={false}
                size="middle"
                locale={{ emptyText: 'No reports found' }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Custom CSS */}
      <style jsx="true">{`
        .reports-table .ant-table-thead > tr > th {
          background-color: #f7faff;
          font-weight: 600;
          color: #1f3a64;
          border-bottom: 2px solid #e6f0ff;
        }
        
        .custom-tree .ant-tree-node-content-wrapper:hover {
          background-color: #f0f7ff;
        }
        
        .custom-tree .ant-tree-node-selected {
          background-color: #e6f4ff !important;
        }

        .ant-btn-primary:not(:disabled) {
          box-shadow: 0 2px 0 rgba(5, 125, 255, 0.1);
        }
        
        .ant-card {
          border-radius: 8px;
          overflow: hidden;
        }
        
        .ant-input {
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .ant-select:not(.ant-select-disabled):hover .ant-select-selector {
          border-color: #40a9ff;
        }
        
        .ant-radio-button-wrapper {
          display: inline-flex;
          align-items: center;
        }
        
        .ant-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default InspectionReport;