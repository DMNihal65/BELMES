import React, { useState, useEffect, useMemo } from 'react';
import { qualityStore } from '../../../store/quality-store';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Tag, 
  Table, 
  Card, 
  Typography, 
  Space, 
  Badge, 
  Spin,
  Button,
  Empty,
  Row,
  Col,
  DatePicker,
  Radio,
  Tree,
  Input,
  message,
  Tooltip,
  Divider,
  Modal,
  Checkbox,
  Upload,
  Popover,
  Dropdown,
  Progress
} from 'antd';
import { 
  FileTextOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  FilePdfOutlined,
  SearchOutlined,
  UploadOutlined,
  StarOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  FolderOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  DownOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const InspectionReport = (props) => {
  const { inspectionDetails, loading: propLoading } = props;
  const [selectedReportType, setSelectedReportType] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(propLoading || false);
  const [reportStructure, setReportStructure] = useState(null);
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState({});
  const [reports, setReports] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [refreshingData, setRefreshingData] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [filteredReports, setFilteredReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [deletedIds, setDeletedIds] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentVersions, setDocumentVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedVersionIds, setSelectedVersionIds] = useState([]);
  const [isVersionModalVisible, setIsVersionModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [newVersionNumber, setNewVersionNumber] = useState('');
  const [selectedOperations, setSelectedOperations] = useState({});

  // Use effect to update loading state when prop changes
  useEffect(() => {
    setLoading(propLoading);
  }, [propLoading]);

  // Reset selected operations when inspection details change (new production order)
  useEffect(() => {
    if (inspectionDetails?.production_order) {
      // Reset the selected operation for this production order
      setSelectedOperations(prev => ({
        ...prev,
        [inspectionDetails.production_order]: inspectionDetails.operations?.[0]?.toString() || null
      }));
    }
  }, [inspectionDetails?.production_order]);

  // Get production order ID from URL
  const getProductionOrderFromUrl = () => {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
  };

  // Function to fetch the initial folder structure
  const fetchFolders = async () => {
    try {
      setLoading(true);
      // First, fetch the root folders (parentId = 26)
      const rootFolders = await qualityStore.fetchFolders(26);
      
      if (rootFolders && rootFolders.length > 0) {
        // Format the folders for the Tree component
        const formattedFolders = rootFolders.map(folder => ({
          title: folder.name,
          key: `folder-${folder.id}`,
          icon: <FolderOutlined className="text-blue-500" />,
          isLeaf: false // This will be updated when expanded
        }));
        
        setTreeData(formattedFolders);
        
        // If there's a REPORT folder, select it by default
        const reportFolder = formattedFolders.find(f => f.title === 'REPORT');
        if (reportFolder) {
          handleTreeSelect([reportFolder.key], { node: reportFolder });
        }
      } else {
        // If no folders found, show a message
        message.info('No report categories found');
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      message.error('Failed to load report categories');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchFolders();
  }, []);

  // Handle tree selection and load subfolders
  const handleTreeSelect = async (selectedKeys, { node }) => {
    if (!selectedKeys.length) return;
    
    const selectedKey = selectedKeys[0];
    setSelectedCategory(selectedKey);
    
    if (selectedKey.startsWith('folder-')) {
      const folderId = selectedKey.split('-')[1];
      setSelectedFolderId(folderId);
      setCurrentPage(1);
      
      try {
        setLoading(true);
        
        // Fetch subfolders for the selected folder
        const subfolders = await qualityStore.fetchFolders(parseInt(folderId));
        
        // Update the tree data with the new subfolders
        const updateTreeData = (nodes) => {
          return nodes.map(n => {
            if (n.key === selectedKey) {
              return {
                ...n,
                children: [
                  ...(subfolders.map(folder => ({
                    title: folder.name,
                    key: `folder-${folder.id}`,
                    icon: <FolderOutlined className="text-blue-500" />,
                    isLeaf: false
                  }))),
                  ...(n.children?.filter(child => !child.key.startsWith('folder-')) || [])
                ].sort((a, b) => a.title.localeCompare(b.title))
              };
            }
            if (n.children) {
              return {
                ...n,
                children: updateTreeData(n.children)
              };
            }
            return n;
          });
        };
        
        // Update the tree data with the new subfolders
        setTreeData(prevTreeData => updateTreeData(prevTreeData));
        
        // Update expanded keys to show the selected folder as expanded
        setExpandedKeys(prev => ({
          ...prev,
          [selectedKey]: true
        }));
        
        // Fetch documents for the selected folder
        await fetchDocumentsForFolder(folderId);
        
      } catch (error) {
        console.error('Error loading folder:', error);
        message.error('Failed to load folder contents');
      } finally {
        setLoading(false);
      }
    }
  };

  // Process the report data to create tree structure and reports list
  const processReportData = (data) => {
    if (!data || data.length === 0) {
      console.log('No report data available');
      return;
    }
    
    // Filter to keep only REPORT category and its children
    const filteredData = data.filter(item => {
      if (item.type === 'folder' && item.name === 'REPORT') {
        return true;
      }
      return false;
    });
    
    const formattedTreeData = formatTreeData(filteredData);
    setTreeData(formattedTreeData);
    
    const extractedReports = [];
    
    const extractDocuments = (items, currentPath = '') => {
      if (!items || !Array.isArray(items)) return;
      
      items.forEach(item => {
        if (item.type === 'document') {
          const versionId = item.latest_version?.id || '1.0';
          const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
          
          // Only add documents that are under the REPORT category
          if (item.path && item.path.includes('REPORT')) {
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
              category: 'REPORT',
              path: fullPath
            });
          }
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

  // Helper function to find a node in the tree by key
  const findNodeInTree = (node, key) => {
    if (node.key === key) return true;
    if (node.children) {
      return node.children.some(child => findNodeInTree(child, key));
    }
    return false;
  };

  // Helper to get all parent keys of a node
  const getAllParentKeys = (nodes, key, parents = []) => {
    for (const node of nodes) {
      if (node.key === key) return parents;
      if (node.children) {
        const found = getAllParentKeys(node.children, key, [...parents, node.key]);
        if (found) return found;
      }
    }
    return null;
  };

  // Update the useEffect to fetch folders instead of report structure
  useEffect(() => {
    fetchFolders();
  }, []);


  // Add new function to fetch documents for a folder
  const fetchDocumentsForFolder = async (folderId) => {
    try {
      setLoading(true);
      console.log('Fetching documents for folder ID:', folderId);
      
      const data = await qualityStore.fetchDocumentsByFolder(folderId, currentPage, pageSize);
      console.log('Documents data received:', data);
      
      // Get production order ID from URL for context
      const urlProductionOrderId = window.location.pathname.split('/').pop();
      
      // Transform the data to match your table structure
      const transformedData = await Promise.all(data.items.map(async item => {
        const versions = await qualityStore.fetchDocumentVersions(item.id);
        console.log(`Versions for document ${item.id}:`, versions);
        
        // Try to extract operation number from the document name or metadata
        let operationNumber = null;
        
        // Check if the document has operation metadata
        if (item.metadata && item.metadata.operation_number) {
          operationNumber = item.metadata.operation_number;
        } else {
          // Try to extract from the document name
          operationNumber = extractOperationFromName(item.name);
        }
        
        // Use production_order_id from the document, or fall back to URL parameter
        const productionOrderId = item.production_order_id || urlProductionOrderId;
        
        return {
          key: item.id,
          name: item.name,
          type: 'REPORT',
          date: item.created_at,
          status: 'Available',
          description: item.description || '',
          part_number: item.part_number || '',
          production_order_id: productionOrderId,
          operation_number: operationNumber, // Add operation number
          file_path: item.file_path || '',
          file_size: item.file_size || 0,
          version: versions.length > 0 ? versions[0].version_number : '1.0',
          version_id: versions.length > 0 ? versions[0].id : '1.0',
          category: item.category || 'Unknown',
          path: item.path || '',
          versions: versions
        };
      }));
  
      // Filter out deleted documents
      const validDocuments = deletedIds.length > 0 
        ? transformedData.filter(doc => !deletedIds.includes(doc.key))
        : transformedData;
      
      // Update both reports and filtered reports
      setReports(validDocuments);
      setFilteredReports(validDocuments);
      setTotalDocuments(validDocuments.length);
      
    } catch (error) {
      console.error('Error fetching documents:', error);
      message.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Add pagination handler
  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    if (selectedFolderId) {
      fetchDocumentsForFolder(selectedFolderId);
    }
  };

  // Update handleRefresh to use fetchFolders
  const handleRefresh = () => {
    fetchFolders();
    message.loading({ content: 'Refreshing folders...', key: 'refresh', duration: 1 });
  };

  // Handle generate consolidated report
  const handleGenerateConsolidatedReport = async () => {
    try {
      setLoading(true);
      
      // Get the production order ID from the URL or the first report in the list
      const productionOrderId = window.location.pathname.split('/').pop(); // Assuming the URL contains the order ID
      
      if (!productionOrderId) {
        message.error('No production order ID found');
        return;
      }
      
      message.loading({ content: 'Generating consolidated report...', key: 'consolidatedReport' });
      
      // Call the quality store to generate the consolidated report
      await qualityStore.generateConsolidatedReport(productionOrderId);
      
      message.success({ content: 'Consolidated report generated successfully', key: 'consolidatedReport' });
    } catch (error) {
      console.error('Error generating consolidated report:', error);
      message.error({ 
        content: error.response?.data?.message || 'Failed to generate consolidated report', 
        key: 'consolidatedReport' 
      });
    } finally {
      setLoading(false);
    }
  };

// Updated handleDownloadReport function in InspectionReport.jsx
const handleDownloadReport = async (record) => {
  // Check if we have a valid document ID and version info
  if (!record.key) {
    message.error('Missing document information for download');
    return;
  }
  
  const hideLoading = message.loading('Preparing download...', 0);
  
  try {
    const documentId = record.key;
    const versionId = record.version_id || "1.0";
    
    // Get production order ID from URL or from record
    const productionOrderId = window.location.pathname.split('/').pop() || record.production_order_id;
    
    // Extract operation number from record if available
    // This might need adjustment based on your data structure
    const operationNumber = record.operation_number || record.op_no || extractOperationFromName(record.name);
    
    console.log(`Download request details:`, {
      documentId,
      versionId,
      productionOrderId,
      operationNumber,
      reportName: record.name,
      reportDetails: record
    });
    
    // Prepare additional info for meaningful filename
    const additionalInfo = {
      name: record.name,
      production_order_id: productionOrderId,
      operation_number: operationNumber
    };
    
    try {
      console.log(`Attempting download with documentId=${documentId}, versionId=${versionId}, additionalInfo=`, additionalInfo);
      const downloadData = await qualityStore.downloadReportById(documentId, versionId, additionalInfo);
      
      if (!downloadData || !downloadData.url) {
        throw new Error('Invalid response from server');
      }
      
      console.log('Download data received:', downloadData);
      
      // Create a link and click it to download
      const a = document.createElement('a');
      a.href = downloadData.url;
      a.download = downloadData.fileName; // This will now have the meaningful filename
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        try {
          URL.revokeObjectURL(downloadData.url);
        } catch (e) {
          console.warn('Error revoking blob URL:', e);
        }
      }, 5000);
      
      // Show success message
      hideLoading();
      message.success(`Report downloaded as: ${downloadData.fileName}`);
      
    } catch (downloadError) {
      console.error('Download error:', downloadError);
      
      // Show appropriate error message
      let errorMessage = 'Failed to download document';
      if (downloadError.response) {
        if (downloadError.response.status === 404) {
          errorMessage = 'Document not found. It may have been moved or deleted.';
        } else if (downloadError.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      }
      
      hideLoading();
      message.error(errorMessage);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    hideLoading();
    message.error('An unexpected error occurred. Please try again.');
  }
};

// Helper function to extract operation number from document name if needed
const extractOperationFromName = (name) => {
  if (!name) return null;
  
  // Try to extract operation number from common patterns
  // Adjust these regex patterns based on your naming conventions
  const patterns = [
    /op[_-]?(\d+)/i,           // op_10, op-20, op10
    /operation[_-]?(\d+)/i,    // operation_10, operation-20
    /(\d+)[_-]op/i,            // 10_op, 20-op
    /[_-](\d+)[_-]/,           // _10_, -20-
  ];
  
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

  // Update the handleDeleteReport function
  const handleDeleteReport = async (record) => {
    try {
      const documentId = record.key;
      
      if (!window.confirm(`Are you sure you want to delete "${record.name}"?`)) {
        return;
      }
      
      const toastId = toast.loading('Deleting report...', {
        position: 'top-right',
      });
      
      try {
        // Call the deleteDocumentVersion function
        const result = await qualityStore.deleteDocumentVersion(documentId);
        
        // Dismiss loading toast
        toast.dismiss(toastId);
        
        // Show success message
        toast.success('Report deleted successfully', {
          position: 'top-right',
          autoClose: 3000,
        });

        // Remove from state instantly
        setReports(prev => prev.filter(r => r.key !== documentId));
        setFilteredReports(prev => prev.filter(r => r.key !== documentId));
        setTotalDocuments(prev => prev - 1);
        setDeletedIds(prev => [...prev, documentId]);
        
      } catch (error) {
        console.error('Delete operation failed:', error);
        toast.dismiss(toastId);
        
        toast.error(
          <div>
            <div><strong>Error Deleting Report</strong></div>
            <div>{error.message}</div>
          </div>,
          {
            position: 'top-right',
            autoClose: 5000,
            closeOnClick: false,
          }
        );
      }
    } catch (error) {
      console.error('Unexpected error in handleDeleteReport:', error);
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
        fetchFolders();
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

  // Add function to handle version preview
  const handleVersionPreview = async (record) => {
    try {
      setLoading(true);
      setSelectedDocument(record);
      const versions = await qualityStore.fetchDocumentVersions(record.key);
      setDocumentVersions(versions);
      setIsVersionModalVisible(true);
    } catch (error) {
      console.error('Error fetching versions:', error);
      message.error('Failed to load document versions');
    } finally {
      setLoading(false);
    }
  };

  // Update the handleVersionSelect function
  const handleVersionSelect = async (version) => {
    setSelectedVersion(version);
    try {
      const downloadData = await qualityStore.downloadDocument(selectedDocument.key, version.id);
      // Open PDF in new window
      window.open(downloadData.url, '_blank');
    } catch (error) {
      console.error('Error previewing version:', error);
      // message.error('Failed to preview document version');
    }
  };

  // Add function to handle checkbox selection
  const handleVersionCheckboxChange = (versionId, checked) => {
    if (checked) {
      setSelectedVersionIds([...selectedVersionIds, versionId]);
    } else {
      setSelectedVersionIds(selectedVersionIds.filter(id => id !== versionId));
    }
  };

  // Add function to handle file upload
  const handleFileUpload = async (file) => {
    setUploadingFile(file);
  };

  // Add function to handle version upload
  const handleVersionUpload = async () => {
    if (!uploadingFile || !selectedDocument || !newVersionNumber) {
      message.error('Please provide both file and version number');
      return;
    }
    
    try {
      setUploadLoading(true);
      await qualityStore.uploadNewVersion(selectedDocument.key, uploadingFile, newVersionNumber);
      
      // Refresh the versions list
      const versions = await qualityStore.fetchDocumentVersions(selectedDocument.key);
      setDocumentVersions(versions);
      
      message.success('New version uploaded successfully');
      setIsUploadModalVisible(false);
      setUploadingFile(null);
      setNewVersionNumber(''); // Reset version number
    } catch (error) {
      console.error('Error uploading new version:', error);
      message.error('Failed to upload new version');
    } finally {
      setUploadLoading(false);
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
          {/* {record.category && (
            <div className="text-xs text-gray-400 mt-1">
              <FolderOutlined className="mr-1" />
              {record.category}
            </div>
          )} */}
        </div>
      ),
    },
    // {
    //   title: 'Type',
    //   dataIndex: 'type',
    //   key: 'type',
    //   width: 120,
    //   render: (type) => (
    //     <Badge 
    //       className="site-badge-count-109" 
    //       count={type} 
    //       style={{ 
    //         backgroundColor: '#1677ff', 
    //         padding: '0 10px',
    //         borderRadius: '12px',
    //         fontSize: '12px',
    //         fontWeight: '500'
    //       }} 
    //     />
    //   ),
    // },
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
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
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
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 120,
      render: (version, record) => {
        // Get all versions from the record
        const versions = record.versions || [];
        
        return (
          <Popover
            content={
              <div className="version-list">
                {versions.map((v) => (
                  <div 
                    key={v.id} 
                    className="version-item p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleVersionSelect(v)}
                  >
                    <div className="flex items-center justify-between">
                      <span>v{v.version_number}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(v.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            }
            title="All Versions"
            trigger="click"
          >
            <div className="flex items-center space-x-1">
              <Tag color="blue">v{version}</Tag>
              {versions.length > 1 && (
                <span className="text-xs text-gray-500">
                  (+{versions.length - 1})
                </span>
              )}
            </div>
          </Popover>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <Space>
          <Tooltip title="View versions">
            <Button 
              icon={<FileSearchOutlined />} 
              type="text" 
              onClick={() => handleVersionPreview(record)}
            />
          </Tooltip>
          <Tooltip title="Add new version">
            <Button 
              icon={<UploadOutlined />} 
              type="text"
              onClick={() => {
                setSelectedDocument(record);
                setIsUploadModalVisible(true);
              }}
            />
          </Tooltip>
          {/* <Tooltip title="Delete report">
            <Button 
              icon={<DeleteOutlined />} 
              type="text" 
              danger 
              className="hover:bg-red-50"
              onClick={() => handleDeleteReport(record)}
            />
          </Tooltip> */}
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

  // Use props for inspection details if available, otherwise use local state
  const [localInspectionDetails, setLocalInspectionDetails] = useState(inspectionDetails || null);
  
  // Update local state when props change
  useEffect(() => {
    if (inspectionDetails) {
      setLocalInspectionDetails(inspectionDetails);
    }
  }, [inspectionDetails]);

  // If we don't have inspection details from props, try to fetch them
  useEffect(() => {
    if (!inspectionDetails) {
      const fetchInspectionDetails = async () => {
        const orderId = getProductionOrderFromUrl();
        if (!orderId) return;

        try {
          setLoading(true);
          const allOrders = await qualityStore.fetchAllOrders();
          const selectedOrder = allOrders.find(order => order.production_order === orderId);
          
          if (selectedOrder) {
            const details = await qualityStore.fetchDetailedInspection(selectedOrder.order_id);
            setLocalInspectionDetails(details);
          } else {
            setLocalInspectionDetails({
              production_order: orderId,
              part_number: 'PN-00000',
              operations: [],
              final_inspection: 'Not Started'
            });
          }
        } catch (error) {
          console.error('Error fetching inspection details:', error);
          setLocalInspectionDetails({
            production_order: getProductionOrderFromUrl() || 'PO-00000',
            part_number: 'PN-00000',
            operations: [],
            final_inspection: 'Error loading details'
          });
        } finally {
          setLoading(false);
        }
      };

      fetchInspectionDetails();
    }
  }, []);

  // Reset selected operation when production order changes
  useEffect(() => {
    if (localInspectionDetails?.production_order) {
      const currentPO = localInspectionDetails.production_order;
      if (selectedOperations[currentPO] === undefined && localInspectionDetails.operations?.length > 0) {
        setSelectedOperations(prev => ({
          ...prev,
          [currentPO]: localInspectionDetails.operations[0].toString()
        }));
      }
    }
  }, [localInspectionDetails?.production_order, localInspectionDetails?.operations]);

  // Prepare summary data for the table
  const summaryData = React.useMemo(() => {
    if (!localInspectionDetails) return [];
    
    const data = {
      key: 'summary',
      order_id: localInspectionDetails.order_id,
      production_order: localInspectionDetails.production_order,
      part_number: localInspectionDetails.part_number,
      operations: localInspectionDetails.operations || [],
      final_inspection: localInspectionDetails.final_inspection || 'Not Started',
      status: localInspectionDetails.final_inspection === 'Completed' ? 'success' : 
              localInspectionDetails.final_inspection === 'In Progress' ? 'processing' : 'warning'
    };

    return [data];
  }, [localInspectionDetails]);

  const summaryColumns = [
    {
      title: 'Production Order',
      dataIndex: 'production_order',
      key: 'production_order',
      width: '20%',
      render: (text) => (
        <Typography.Text strong>
          {text || '-'}
        </Typography.Text>
      )
    },
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
      width: '20%',
      render: (text) => text || '-'
    },
    {
      title: 'Operations',
      key: 'operations',
      width: '25%',
      render: (_, record) => {
        const operations = record.operations || [];
        const recordKey = record.key || record.production_order;
        const selectedOp = selectedOperations[recordKey] || (operations.length > 0 ? operations[0].toString() : null);
        
        // Add Final Inspection option to the operations list if it doesn't exist
        const finalInspectionOp = 999;
        const operationsWithFinalInspection = [...new Set([...operations, finalInspectionOp])];
        
        const items = operationsWithFinalInspection.map(op => {
          const isFinal = op === finalInspectionOp;
          const labelText = isFinal ? 'FINAL' : `OP ${op}`;
          const itemClassName = isFinal ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-800';
          
          return {
            key: op.toString(),
            label: (
              <div className="w-full">
                <span className={`inline-block w-full px-3 py-1 rounded ${itemClassName}`}>
                  {labelText}
                </span>
              </div>
            ),
            className: itemClassName,
            style: { width: '100%' },
            onClick: () => {
              setSelectedOperations(prev => ({
                ...prev,
                [recordKey]: op.toString()
              }));
            }
          };
        });
        
        return (
          <Dropdown
            menu={{
              items,
              selectedKeys: selectedOp ? [selectedOp] : [],
              selectable: true,
            }}
            trigger={['click']}
          >
            <Button type="link" className="p-0">
              <div className={`inline-flex items-center px-3 py-1 rounded ${selectedOp ? (selectedOp === '999' ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-800') : ''}`}>
                {selectedOp ? (
                  <span>
                    {selectedOp === '999' ? 'FINAL' : `OP ${selectedOp}`}
                  </span>
                ) : 'Select Operation'}
                <DownOutlined className="ml-1" />
              </div>
            </Button>
          </Dropdown>
        );
      }
    },
    // {
    //   title: 'Final Inspection',
    //   key: 'final_inspection',
    //   width: '20%',
    //   render: (_, record) => {
    //     const hasFinalInspection = localInspectionDetails?.operation_groups?.some(
    //       group => group.op_no === 999
    //     );
  
    //     return (
    //       <Button
    //         type={hasFinalInspection ? 'primary' : 'default'}
    //         icon={<FileSearchOutlined />}
    //         className={`
    //           transition-all duration-300
    //           ${hasFinalInspection 
    //             ? 'bg-blue-100 hover:bg-blue-200 border-blue-200 hover:border-blue-300 text-blue-700' 
    //             : 'bg-gray-100 hover:bg-gray-200 border-gray-200 hover:border-gray-300 text-gray-700'}
    //         `}
    //       >
    //         Final Inspection
    //       </Button>
    //     );
    //   }
    // },
    {
      title: 'Actions',
      key: 'actions',
      width: '15%',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={() => handleGenerateReport(record)}
          className="bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700"
        >
          Generate Report
        </Button>
      )
    }
  ];

  const [generatingReport, setGeneratingReport] = useState(false);

  const handleGenerateReport = async (record) => {
    if (!record) {
      message.error('No record selected for report generation');
      return;
    }
  
    const recordKey = record.key || record.production_order;
    let selectedOp = selectedOperations[recordKey];
    
    // If no operation is selected but there are operations available, select the first one
    if (!selectedOp && record.operations && record.operations.length > 0) {
      selectedOp = record.operations[0].toString();
      setSelectedOperations(prev => ({
        ...prev,
        [recordKey]: selectedOp
      }));
    }
  
    if (!selectedOp) {
      message.error('No operations available for this record');
      return;
    }
  
    // Get the operation number directly from the selected operation
    const operationNumber = Number(selectedOp);
    
    if (isNaN(operationNumber)) {
      console.error('Invalid operation number:', selectedOp);
      message.error('Invalid operation number');
      return;
    }
  
    try {
      setGeneratingReport(true);
      message.loading({ content: 'Generating report...', key: 'reportGen' });
      
      console.log('Triggering report generation with params:', {
        productionOrder: record.production_order,
        operationNo: operationNumber,
        recordKey
      });

      // Use the same endpoint for both regular operations and final inspection
      // Final inspection is handled by operation_no=999
      await qualityStore.api.post(
        `/document-management/report/generate-consolidated/${record.production_order}?operation_no=${operationNumber}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      message.success({ content: 'Report generated successfully!', key: 'reportGen' });
    } catch (error) {
      console.error('Error generating report:', {
        error,
        record,
        selectedOp,
        operationNumber,
        operations: record.operations
      });
      message.error({ 
        content: error.message || 'Failed to generate report. Please try again.',
        key: 'reportGen',
        duration: 5
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Title level={4} className="mb-0">Quality Inspection Reports</Title>
          {/* <Button 
            type="primary" 
            icon={<FilePdfOutlined />} 
            className="bg-purple-600 hover:bg-purple-700 border-none flex items-center"
            onClick={() => handleGenerateConsolidatedReport()}
          >
            Generate Consolidated Report
          </Button> */}
        </div>
        {/* <Text type="secondary">View, filter, and download quality inspection reports</Text> */}



        
      </div>

      {/* Inspection Details Section */}
      {loading ? (
        <div className="flex justify-center my-8">
          <Spin tip="Loading inspection details..." />
        </div>
      ) : inspectionDetails ? (
        <Card 
          className="mb-6 shadow-sm"
          title={
            <div className="flex items-center">
              <FileTextOutlined className="mr-2 text-blue-500" />
              <span>Consolidated Report</span>
            </div>
          }
        >
          <Table
            columns={summaryColumns}
            dataSource={summaryData}
            pagination={false}
            size="middle"
            loading={loading}
            className="mb-4"
            rowClassName="hover:bg-gray-50"
          />
        </Card>
      ) : (
        <Card className="mb-6">
          <Empty description="No inspection details found" />
        </Card>
      )}
      
      <Divider className="my-4" />
      
    

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
                  expandedKeys={Object.keys(expandedKeys).filter(key => expandedKeys[key])}
                  showIcon
                  onSelect={(selectedKeys, { node }) => {
                    if (node.key.startsWith('folder-')) {
                      handleTreeSelect(selectedKeys, { node });
                    }
                  }}
                  onExpand={(expandedKeys, { node }) => {
                    setExpandedKeys(prev => ({
                      ...prev,
                      [node.key]: expandedKeys.includes(node.key)
                    }));
                  }}
                  blockNode
                  className="custom-tree"
                  selectable={true}
                  titleRender={(nodeData) => (
                    <span 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (nodeData.key.startsWith('folder-')) {
                          handleTreeSelect([nodeData.key], { node: nodeData });
                        }
                      }}
                    >
                      {nodeData.title}
                    </span>
                  )}
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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <FileTextOutlined className="mr-2 text-blue-500" />
                    <span className="text-lg font-medium">Reports List</span>
                    {/* {filteredReports.length > 0 && (
                      <Badge 
                        count={filteredReports.length} 
                        className="ml-2"
                        style={{ 
                          backgroundColor: '#52c41a', 
                          boxShadow: '0 0 0 1px #52c41a inset' 
                        }}
                      />
                    )} */}
                  </div>

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
                {/* <Input
                  placeholder="Search files..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  onChange={(e) => setSearchText(e.target.value)}
                  value={searchText}
                  className="rounded-md w-64"
                  allowClear
                /> */}
                {/* <Button 
                  type="primary"
                  icon={<UploadOutlined />}
                  className="bg-green-500 hover:bg-green-600 border-none"
                >
                  Upload New
                </Button> */}
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
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalDocuments,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} reports`
                }}
                onChange={handleTableChange}
                rowKey="key"
                className="reports-table"
                rowClassName="hover:bg-blue-50 transition-colors"
                bordered={false}
                size="middle"
                locale={{ emptyText: 'No reports found' }}
                key={`table-${filteredReports.length}-${Date.now()}`}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Version Preview Modal */}
      <Modal
        title="Select Version to Preview"
        open={isVersionModalVisible}
        onCancel={() => {
          setIsVersionModalVisible(false);
          setSelectedDocument(null);
          setDocumentVersions([]);
          setSelectedVersion(null);
          setSelectedVersionIds([]); // Reset selected versions
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setIsVersionModalVisible(false);
              setSelectedDocument(null);
              setDocumentVersions([]);
              setSelectedVersion(null);
              setSelectedVersionIds([]);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="preview"
            type="primary"
            onClick={() => {
              // Preview the first selected version
              const selectedVersion = documentVersions.find(v => v.id === selectedVersionIds[0]);
              if (selectedVersion) {
                handleVersionSelect(selectedVersion);
              }
            }}
            disabled={selectedVersionIds.length === 0}
          >
            Preview Selected
          </Button>
        ]}
        width={600}
      >
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Spin tip="Loading versions..." />
          </div>
        ) : (
          <div className="version-list">
            {documentVersions.map((version) => (
              <div 
                key={version.id}
                className={`version-item p-4 mb-2 rounded-lg transition-colors ${
                  selectedVersionIds.includes(version.id) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <Checkbox
                    checked={selectedVersionIds.includes(version.id)}
                    onChange={(e) => handleVersionCheckboxChange(version.id, e.target.checked)}
                    className="mr-4"
                  />
                  <div className="flex-grow">
                    <div className="font-medium">Version {version.version_number}</div>
                    <div className="text-sm text-gray-500">
                      Created: {new Date(version.created_at).toLocaleString()}
                    </div>
                    {version.metadata && version.metadata.operation_number && (
                      <div className="text-sm text-gray-500">
                        Operation: {version.metadata.operation_number}
                      </div>
                    )}
                  </div>
                  <Button 
                    type="primary"
                    size="small"
                    onClick={() => handleVersionSelect(version)}
                  >
                    Preview
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Version Upload Modal */}
      <Modal
        title="Upload New Version"
        open={isUploadModalVisible}
        onCancel={() => {
          setIsUploadModalVisible(false);
          setSelectedDocument(null);
          setUploadingFile(null);
          setNewVersionNumber(''); // Reset version number
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setIsUploadModalVisible(false);
              setSelectedDocument(null);
              setUploadingFile(null);
              setNewVersionNumber(''); // Reset version number
            }}
          >
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            onClick={handleVersionUpload}
            loading={uploadLoading}
            disabled={!uploadingFile || !newVersionNumber}
          >
            Upload
          </Button>
        ]}
        width={500}
      >
        <div className="upload-container">
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">
              Selected document: {selectedDocument?.name}
            </div>
            
            {/* Add version number input */}
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Version Number</div>
              <Input
                placeholder="Enter version number (e.g., 1.0)"
                value={newVersionNumber}
                onChange={(e) => setNewVersionNumber(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Upload
              accept=".pdf"
              beforeUpload={(file) => {
                handleFileUpload(file);
                return false; // Prevent auto upload
              }}
              showUploadList={true}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select PDF File</Button>
            </Upload>
          </div>
          {uploadingFile && (
            <div className="text-sm text-gray-500">
              Selected file: {uploadingFile.name}
            </div>
          )}
        </div>
      </Modal>

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

        .version-list {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .version-item {
          border-bottom: 1px solid #f0f0f0;
        }
        
        .version-item:last-child {
          border-bottom: none;
        }
        
        .version-item:hover {
          background-color: #f5f5f5;
        }
      `}</style>
    </div>
  );
};

export default InspectionReport;