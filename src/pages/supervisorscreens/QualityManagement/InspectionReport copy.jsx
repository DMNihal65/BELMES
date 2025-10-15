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
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const [currentPath, setCurrentPath] = useState('');
  const [filteredReports, setFilteredReports] = useState([]);

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
    
    const formattedTreeData = formatTreeData(data);
    setTreeData(formattedTreeData);
    
    const extractedReports = [];
    
    const extractDocuments = (items, currentPath = '') => {
      if (!items || !Array.isArray(items)) return;
      
      items.forEach(item => {
        if (item.type === 'document') {
          const versionId = item.latest_version?.id || '1.0';
          const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
          
          extractedReports.push({
            key: item.id,
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
            version_id: versionId,
            category: item.path?.split('/')[2] || 'Unknown',
            path: fullPath
          });
        }
        
        if (item.children && item.children.length > 0) {
          const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
          extractDocuments(item.children, newPath);
        }
      });
    };
    
    extractDocuments(data);
    setReports(extractedReports);
    setFilteredReports(extractedReports);
    console.log('Extracted reports with paths:', extractedReports);
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
    if (info && info.event) {
      info.event.preventDefault();
      info.event.stopPropagation();
    }
    
    if (selectedKeys.length > 0) {
      const selectedKey = selectedKeys[0];
      setSelectedCategory(selectedKey);
      
      const [itemType, itemId] = selectedKey.split('-');
      
      if (itemType === 'document') {
        // Find the selected document
        const selectedReport = reports.find(r => r.key === parseInt(itemId));
        if (selectedReport) {
          // Clear any existing search and filters
          setSearchText('');
          setSelectedReportType('all');
          
          // Set the current path
          setCurrentPath(selectedReport.path);
          
          // Filter to show only the selected report
          const filtered = reports.filter(report => report.key === parseInt(itemId));
          setFilteredReports(filtered);
          
          toast.info(`Showing report: ${selectedReport.name}`, {
            position: 'top-right',
            autoClose: 2000,
          });
        }
      } else if (itemType === 'folder') {
        // For folders, show all reports in that folder
        setSearchText('');
        setSelectedReportType('all');
        
        // Get the folder path from the tree node
        const folderPath = info.node.title;
        setCurrentPath(folderPath);
        
        // Filter reports to show only those in the selected folder
        const filtered = reports.filter(report => 
          report.path?.includes(folderPath) || report.category?.includes(folderPath)
        );
        setFilteredReports(filtered);
        
        toast.info(`Showing reports in folder: ${folderPath}`, {
          position: 'top-right',
          autoClose: 2000,
        });
      }
    }
    
    return false;
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
      toast.error('Missing document information for download', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
    
    const toastId = toast.loading('Preparing download...', {
      position: 'top-right',
    });
    
    try {
      const documentId = report.key;
      // Extract version number from the report data, default to "1.0" if not available
      const versionId = report.version_id || "1.0";
      
      console.log(`Download request details:`, {
        documentId,
        versionId,
        reportName: report.name,
        reportDetails: report
      });
      
      try {
        // Try downloading using the new document endpoint first
        console.log(`Attempting primary download method with documentId=${documentId}, versionId=${versionId}`);
        const downloadData = await qualityStore.downloadDocument(documentId, versionId);
        console.log('Download data received:', downloadData);
        
        // Create a link and click it to download
        const a = document.createElement('a');
        a.href = downloadData.url;
        // Ensure filename has .pdf extension
        let filename = report.name || downloadData.fileName;
        if (!filename.toLowerCase().endsWith('.pdf')) {
          filename += '.pdf';
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up the blob URL
        setTimeout(() => URL.revokeObjectURL(downloadData.url), 5000);
        
        // Dismiss the loading toast and show success toast
        toast.dismiss(toastId);
        toast.success('Report downloaded successfully', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } catch (downloadError) {
        console.log('Error in primary download method:', downloadError);
        console.log('Error details:', downloadError.response || downloadError.message || downloadError);
        console.log('Trying alternative methods...');
        
        try {
          // Fallback 1: Try the downloadReportById method
          console.log(`Attempting download using downloadReportById method with documentId=${documentId}, versionId=${versionId}`);
          const byIdData = await qualityStore.downloadReportById(documentId, versionId);
          console.log('Download data from alternative method:', byIdData);
          
          const a = document.createElement('a');
          a.href = byIdData.url;
          // Ensure filename has .pdf extension
          let filename = report.name || byIdData.fileName;
          if (!filename.toLowerCase().endsWith('.pdf')) {
            filename += '.pdf';
          }
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Clean up the blob URL
          setTimeout(() => URL.revokeObjectURL(byIdData.url), 5000);
          
          // Dismiss loading toast and show success toast
          toast.dismiss(toastId);
          toast.success('Report downloaded using alternative method', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          return;
        } catch (byIdError) {
          console.log('Error in first alternative method:', byIdError);
          console.log('Error details:', byIdError.response || byIdError.message || byIdError);
          
          // Fallback 2: If report has a file_path, try downloading by path
          if (report.file_path) {
            console.log('Attempting download using file path:', report.file_path);
            const pathDownloadData = await qualityStore.downloadReport(report.file_path);
            console.log('Download data from file path method:', pathDownloadData);
            
            const a = document.createElement('a');
            a.href = pathDownloadData.url;
            // Ensure filename has .pdf extension
            let filename = report.name || pathDownloadData.fileName;
            if (!filename.toLowerCase().endsWith('.pdf')) {
              filename += '.pdf';
            }
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up the blob URL
            setTimeout(() => URL.revokeObjectURL(pathDownloadData.url), 5000);
            
            // Dismiss loading toast and show success toast
            toast.dismiss(toastId);
            toast.success('Report downloaded using file path method', {
              position: 'top-right',
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
            return;
          }
          
          // If no alternatives work, show detailed error
          throw byIdError;
        }
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      console.error('Full error object:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        stack: error.stack
      });
      
      // Provide more specific error messages based on status code
      let errorMsg = 'Failed to download report';
      
      if (error.response) {
        switch (error.response.status) {
          case 404:
            errorMsg = 'Report file not found on server';
            break;
          case 403:
            errorMsg = 'You do not have permission to access this report';
            break;
          case 500:
            errorMsg = 'Server error occurred while downloading the report';
            break;
          default:
            errorMsg = `Server returned error (${error.response.status})`;
        }
      } else if (error.request) {
        errorMsg = 'No response from server. Please check your network connection';
      } else {
        errorMsg = error.message || 'Unknown error occurred';
      }
      
      // Dismiss loading toast and show error toast
      toast.dismiss(toastId);
      toast.error(errorMsg, {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Update the handleDeleteReport function to handle server connection issues better
  const handleDeleteReport = async (record) => {
    try {
      // Extract the document ID from the record
      const documentId = record.key;
      
      // Show a confirmation dialog before deleting
      if (!window.confirm(`Are you sure you want to delete "${record.name}"?`)) {
        return; // User canceled the deletion
      }
      
      // Show a loading message
      const toastId = toast.loading('Deleting report...', {
        position: 'top-right',
      });
      
      console.log(`Attempting to delete document with ID: ${documentId}`);
      
      // Optimistically update the UI by removing the report from the local state
      const originalReports = [...reports]; // Keep a copy of the original reports
      const updatedReports = reports.filter(r => r.key !== documentId);
      setReports(updatedReports);
      
      // Call the deleteDocument function from the quality store
      try {
        const result = await qualityStore.deleteDocument(documentId);
        
        // Dismiss the loading toast
        toast.dismiss(toastId);
        
        // Show success message
        toast.success('Report deleted successfully', {
          position: 'top-right',
          autoClose: 3000,
        });
        
        // Refresh the report structure in the background
        fetchReportStructure(true);
      } catch (error) {
        console.error('Error deleting report:', error);
        
        // Revert the optimistic update if the deletion fails
        setReports(originalReports);
        
        // Dismiss loading toast
        toast.dismiss(toastId);
        
        // Show error message with more helpful information
        let errorMsg = 'Failed to delete report';
        
        if (error.message && error.message.includes('Server did not respond')) {
          // Show a more detailed error with possible solutions
          toast.error(
            <div>
              <div><strong>Connection Error</strong></div>
              <div>The server did not respond to the delete request.</div>
              <div style={{ marginTop: '8px', fontSize: '0.9em' }}>
                <div>API Endpoint:</div>
                <div style={{ 
                  fontFamily: 'monospace', 
                  background: '#f0f0f0', 
                  padding: '4px 8px',
                  margin: '4px 0',
                  borderRadius: '4px',
                  fontSize: '0.9em',
                  wordBreak: 'break-all'
                }}>
                  DELETE http://172.19.224.1:8002/api/v1/document-management/report/structure/document/{documentId}
                </div>
                <div style={{ marginTop: '8px' }}>
                  Possible solutions:
                  <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                    <li>Verify the API endpoint is correct</li>
                    <li>Check if the server is running</li>
                    <li>Ensure your network can reach the server</li>
                    <li>Check server logs for errors</li>
                  </ul>
                </div>
              </div>
            </div>,
            {
              position: 'top-right',
              autoClose: 10000,
              closeOnClick: false,
              pauseOnHover: true,
              draggable: true,
            }
          );
          return;
        }
        
        if (error.response) {
          switch (error.response.status) {
            case 404:
              errorMsg = 'Report not found on server';
              break;
            case 403:
              errorMsg = 'You do not have permission to delete this report';
              break;
            case 500:
              errorMsg = 'Server error occurred while deleting the report';
              break;
            default:
              errorMsg = `Server returned error (${error.response.status})`;
          }
        } else if (error.request) {
          errorMsg = 'No response from server. Please check your network connection';
        } else {
          errorMsg = error.message || 'Unknown error occurred';
        }
        
        toast.error(errorMsg, {
          position: 'top-right',
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error('Unexpected error in handleDeleteReport:', error);
      
      // Show error message
      toast.error('An unexpected error occurred while trying to delete the report', {
        position: 'top-right',
        autoClose: 4000,
      });
    }
  };

  // Add a function to handle folder deletion
  const handleDeleteFolder = async (folderId) => {
    try {
      // Show a loading message
      const toastId = toast.loading('Deleting folder...', {
        position: 'top-right',
      });
      
      console.log(`Attempting to delete folder with ID: ${folderId}`);
      
      // Call the deleteFolder function from the quality store
      const result = await qualityStore.deleteFolder(folderId);
      
      // If deletion was successful
      if (result.success) {
        // Dismiss the loading toast
        toast.dismiss(toastId);
        
        // Show success message
        toast.success('Folder deleted successfully', {
          position: 'top-right',
          autoClose: 3000,
        });
        
        // Refresh the report structure to update the UI
        fetchReportStructure(true);
      } else {
        throw new Error(result.message || 'Failed to delete folder');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      
      // Show error message
      toast.error(error.message || 'Failed to delete folder', {
        position: 'top-right',
        autoClose: 4000,
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
          {record.category && (
            <div className="text-xs text-gray-400 mt-1">
              <FolderOutlined className="mr-1" />
              {record.category}
            </div>
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
          <Tooltip title="Delete report">
            <Button 
              icon={<DeleteOutlined />} 
              type="text" 
              danger 
              className="hover:bg-red-50"
              onClick={() => handleDeleteReport(record)}
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
  const displayedReports = filteredReports.filter(report => {
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
        // If a folder is selected, show reports that belong to this folder or its subfolders
        
        // First get the selected folder and its full path
        const findFolderPath = (nodes, folderId, parentPath = '') => {
          for (const node of nodes || []) {
            if (node.key === `folder-${folderId}`) {
              return parentPath ? `${parentPath}/${node.title}` : node.title;
            }
            
            if (node.children && node.children.length > 0) {
              const path = findFolderPath(node.children, folderId, parentPath ? `${parentPath}/${node.title}` : node.title);
              if (path) return path;
            }
          }
          return null;
        };
        
        const folderPath = findFolderPath(treeData, itemId);
        console.log('Selected folder path:', folderPath);
        
        if (folderPath) {
          // Check if the report belongs to this folder or its subfolders
          matchesCategory = report.category.includes(folderPath) || 
                          (report.path && report.path.includes(folderPath));
        } else {
          // Fallback to the basic filtering if path is not found
          const folder = treeData.find(item => item.key === selectedCategory);
          if (folder) {
            matchesCategory = report.category.includes(folder.title) || 
                            (report.path && report.path.includes(folder.title));
          }
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
        <Col span={16}>
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
                  selectable={true}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  expandAction="click"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
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
              <div>
                <div className="flex items-center mb-2">
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
                {currentPath && (
                  <div className="text-sm text-gray-500 flex items-center">
                    <FolderOutlined className="mr-1" />
                    <span>Current Path: {currentPath}</span>
                  </div>
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

      {/* ToastContainer for notifications */}
      <ToastContainer />
      
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