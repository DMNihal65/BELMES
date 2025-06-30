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
  Divider,
  Modal,
  Checkbox,
  Upload,
  Popover,
  Tag
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
  const [isVersionModalVisible, setIsVersionModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentVersions, setDocumentVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedVersionIds, setSelectedVersionIds] = useState([]);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [newVersionNumber, setNewVersionNumber] = useState('');

  // Update the useEffect to fetch folders instead of report structure
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

  // Replace fetchReportStructure with fetchFolders
  const fetchFolders = async () => {
    try {
      setLoading(true);
      const folders = await qualityStore.fetchFolders();
      
      // Transform folders into tree data format
      const formattedTreeData = folders.map(folder => ({
        title: folder.name,
        key: `folder-${folder.id}`,
        icon: <FolderOutlined className="text-blue-500" />,
        isLeaf: false,
        selectable: true,
        children: []
      }));
      
      setTreeData(formattedTreeData);
      
    } catch (error) {
      console.error('Error fetching folders:', error);
      message.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  // Add new function to fetch documents for a folder
  const fetchDocumentsForFolder = async (folderId) => {
    try {
      setLoading(true);
      console.log('Fetching documents for folder ID:', folderId);
      
      const data = await qualityStore.fetchDocumentsByFolder(folderId, currentPage, pageSize);
      console.log('Documents data received:', data);
      
      // Transform the data to match your table structure
      const transformedData = await Promise.all(data.items.map(async item => {
        const versions = await qualityStore.fetchDocumentVersions(item.id);
        console.log(`Versions for document ${item.id}:`, versions);
        
        return {
          key: item.id,
          name: item.name,
          type: 'REPORT',
          date: item.created_at,
          status: 'Available',
          description: item.description || '',
          part_number: item.part_number || '',
          production_order_id: item.production_order_id,
          file_path: item.file_path || '',
          file_size: item.file_size || 0,
          version: versions.length > 0 ? versions[0].version_number : '1.0',
          version_id: versions.length > 0 ? versions[0].id : '1.0',
          category: item.category || 'Unknown',
          path: item.path || '',
          versions: versions
        };
      }));

      // Update both reports and filtered reports
      setReports(transformedData);
      setFilteredReports(transformedData);
      setTotalDocuments(data.total || 0);
      
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

        // Update the reports list by removing the deleted item
        setReports(prevReports => {
          const updatedReports = prevReports.filter(report => report.key !== documentId);
          console.log('Updated reports after deletion:', updatedReports);
          return updatedReports;
        });

        // Update the filtered reports
        setFilteredReports(prevFiltered => {
          const updatedFiltered = prevFiltered.filter(report => report.key !== documentId);
          console.log('Updated filtered reports after deletion:', updatedFiltered);
          return updatedFiltered;
        });

        // Update total count
        setTotalDocuments(prevTotal => prevTotal - 1);
        
        // If we're in a folder view, refresh the folder contents
        if (selectedFolderId) {
          await fetchDocumentsForFolder(selectedFolderId);
        }
        
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
      message.error('Failed to preview document version');
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