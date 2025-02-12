import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Tree,
  Table,
  Tag,
  Space,
  Dropdown,
  Menu,
  Typography,
  Badge,
  Avatar,
  Tooltip,
  Modal,
  message,
  Progress,
  Divider,
  Upload,
  Form,
  Checkbox,
  Select,
  List,
  Radio,
  Breadcrumb,
  Statistic,
  Alert,
  Skeleton
} from 'antd';
import {
  FolderOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  CloudUploadOutlined,
  EyeOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  FilterOutlined,
  SearchOutlined,
  PlusOutlined,
  HistoryOutlined,
  FileImageOutlined,
  FileDoneOutlined,
  FolderViewOutlined,
  TeamOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  InboxOutlined,
  MoreOutlined,
  EditOutlined,
  CopyOutlined,
  ScissorOutlined,
  SnippetsOutlined,
  DownOutlined,
  FileOutlined,
  UploadOutlined,
  HomeOutlined,
  AppstoreOutlined,
  BarsOutlined,
  LinkOutlined,
  MailOutlined,
  FileOutlined as FileOutlinedIcon,
  EyeOutlined as EyeOutlinedIcon,
  CloudDownloadOutlined,
  UsergroupAddOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import useDocumentStore from '../../store/document-store';
import ReactDOM from 'react-dom';
import useAuthStore from '../../store/auth-store';
import * as pdfjsLib from 'pdfjs-dist';
// Import the worker directly from the dist folder
import 'pdfjs-dist/build/pdf.worker.entry';

// Set up the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;


const { Title, Text } = Typography;
const { Search } = Input;

// Add this new component for version management
const VersionManagementModal = ({ visible, document, onClose }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { fetchDocumentVersions, uploadNewVersion, deleteVersion, updateVersion, fetchFolderDocuments } = useDocumentStore();

  useEffect(() => {
    if (visible && document) {
      loadVersions();
    }
  }, [visible, document]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await fetchDocumentVersions(document?.id);
      setVersions(data);
    } catch (error) {
      message.error('Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionUpload = async (file, version) => {
    try {
      let response;
      if (version) {
        response = await updateVersion(document.id, version.id, file, version.version_number);
        if (response) {
          await loadVersions();
          if (selectedFolder && selectedFolder !== 'all') {
            await fetchFolderDocuments(selectedFolder);
          }
          message.success('Version updated successfully');
          return true;
        }
      } else {
        response = await uploadNewVersion(document.id, file);
        if (response) {
          await loadVersions();
          if (selectedFolder && selectedFolder !== 'all') {
            await fetchFolderDocuments(selectedFolder);
          }
          message.success('New version uploaded successfully');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Version upload error:', error);
      message.error('Failed to upload version');
      return false;
    }
  };

  const handleVersionDelete = async (versionId) => {
    try {
      await deleteVersion(document.id, versionId);
      message.success('Version deleted successfully');
      await loadVersions();
    } catch (error) {
      message.error('Failed to delete version');
    }
  };

  // Add auto-refresh functionality for versions
  useEffect(() => {
    let intervalId;
    
    if (visible && document) {
      // Initial load
      loadVersions();
      
      // Set up periodic refresh every 5 seconds while modal is open
      intervalId = setInterval(() => {
        loadVersions();
      }, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [visible, document]);

  return (
    <Modal
      title={`Versions - ${document?.document_name}`}
      visible={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <div className="mb-4">
        <Upload
          showUploadList={false}
          beforeUpload={(file) => {
            Modal.confirm({
              title: 'Upload New Version',
              content: 'Are you sure you want to upload a new version?',
              onOk: async () => {
                const success = await handleVersionUpload(file);
                if (success) {
                  await loadVersions(); // Refresh versions immediately after successful upload
                  onClose();
                }
              },
            });
            return false;
          }}
        >
          <Button type="primary" icon={<UploadOutlined />}>
            Upload New Version
          </Button>
        </Upload>
      </div>

      <Table
        loading={loading}
        dataSource={versions}
        rowKey="id"
        columns={[
          {
            title: 'Version',
            dataIndex: 'version_number',
            render: v => `v${v}`,
          },
          {
            title: 'Created',
            dataIndex: 'created_at',
            render: date => new Date(date).toLocaleDateString(),
          },
          {
            title: 'Status',
            dataIndex: 'status',
            render: (status, record) => (
              <Tag color={status === 'active' ? 'green' : 'default'}>
                {status?.toUpperCase() || 'PENDING'}
              </Tag>
            ),
          },
          {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Upload
                  showUploadList={false}
                  beforeUpload={(file) => {
                    Modal.confirm({
                      title: 'Update Version',
                      content: 'Are you sure you want to update this version?',
                      onOk: async () => {
                        const success = await handleVersionUpload(file, record);
                        if (success) {
                          await loadVersions(); // Refresh versions immediately after successful update
                          onClose();
                        }
                      },
                    });
                    return false;
                  }}
                >
                  <Button icon={<EditOutlined />} type="text" />
                </Upload>
                <Button
                  icon={<DeleteOutlined />}
                  type="text"
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: 'Delete Version',
                      content: 'Are you sure you want to delete this version?',
                      okType: 'danger',
                      onOk: () => handleVersionDelete(record.id),
                    });
                  }}
                />
              </Space>
            ),
          },
        ]}
      />
    </Modal>
  );
};

// Update the AnalyticsCards component
const AnalyticsCards = ({ metrics, isLoading, error }) => {
  if (error) {
    return (
      <Alert
        message="Error Loading Metrics"
        description={error}
        type="error"
        showIcon
        className="mb-2"
      />
    );
  }

  if (isLoading && !metrics) {
    return (
      <div className="grid grid-cols-7 gap-2 mb-2">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="bg-white rounded-lg p-2">
            <Skeleton active paragraph={false} />
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const allMetrics = [
    {
      title: "Total Documents",
      value: metrics.total_documents,
      icon: <FileOutlined />,
    },
    {
      title: "Downloads",
      value: metrics.total_downloads,
      icon: <CloudDownloadOutlined />,
    },
    {
      title: "Storage Used",
      value: `${metrics.storage_usage_mb.toFixed(1)}MB`,
      icon: <InboxOutlined />,
    },
    {
      title: "Total Versions",
      value: metrics.total_versions,
      icon: <HistoryOutlined />,
    },
    {
      title: "Active Folders",
      value: metrics.active_folders,
      icon: <FolderOpenOutlined />,
    },
    {
      title: "Recent Activity",
      value: metrics.recent_activity_count,
      icon: <ClockCircleOutlined />,
    }
  ];

  // Calculate total documents by type
  const totalDocsByType = Object.entries(metrics.documents_by_type)
    .filter(([_, count]) => count > 0);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-2">
        {/* Main Metrics */}
        {allMetrics.map((metric, index) => (
          <div
            key={index}
            className="bg-sky-500/10 hover:bg-sky-500/20 rounded-lg p-2.5 transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="bg-sky-500 text-white rounded-md p-1.5">
                {React.cloneElement(metric.icon, { 
                  className: "text-sm" 
                })}
              </div>
              <div>
                <div className="text-sky-900 text-lg font-medium leading-tight">
                  {metric.value}
                </div>
                <div className="text-sky-700 text-xs">
                  {metric.title}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Document Types Dropdown */}
        <Dropdown
          overlay={
            <Card className="w-64 shadow-lg">
              <div className="text-sm font-medium mb-2 text-gray-700">
                Documents by Type
              </div>
              <div className="space-y-2 max-h-64 overflow-auto">
                {totalDocsByType.map(([type, count]) => (
                  <div 
                    key={type}
                    className="flex items-center justify-between p-2 bg-sky-50 rounded-md"
                  >
                    <span className="text-sm text-gray-600 truncate flex-1" title={type}>
                      {type}
                    </span>
                    <Badge 
                      count={count} 
                      className="ml-2"
                      style={{ 
                        backgroundColor: '#0ea5e9',
                        fontSize: '11px'
                      }} 
                    />
                  </div>
                ))}
              </div>
            </Card>
          }
          trigger={['click']}
          placement="bottomRight"
        >
          <div className="bg-sky-500/10 hover:bg-sky-500/20 rounded-lg p-2.5 transition-all cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="bg-sky-500 text-white rounded-md p-1.5">
                <FileTextOutlined className="text-sm" />
              </div>
              <div>
                <div className="text-sky-900 text-lg font-medium leading-tight">
                  {totalDocsByType.length}
                </div>
                <div className="text-sky-700 text-xs flex items-center gap-1">
                  Doc Types <DownOutlined className="text-xs" />
                </div>
              </div>
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

const DocumentManagement = () => {
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [favorites, setFavorites] = useState(['DOC001']);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [isDocTypeModalVisible, setIsDocTypeModalVisible] = useState(false);
  const [isCreateDocTypeModalVisible, setIsCreateDocTypeModalVisible] = useState(false);
  const [newDocType, setNewDocType] = useState({
    type_name: '',
    description: '',
    extensions: '',
    is_active: true
  });
  
  const { 
    documentTypes, 
    fetchDocTypes, 
    createDocType, 
    isLoading, 
    partNumbers, 
    fetchPartNumbers, 
    uploadDocument,
    documents,
    fetchFolderDocuments,
    searchDocuments,
    searchByPartNumber,
    downloadDocumentVersion,
    fetchDocumentVersions,
    folders,
    deleteFolder,
    fetchFolders,
    createFolder,
    updateFolder,
    copyDocument,
    metrics,
    isLoadingMetrics,
    metricsError,
    fetchMetrics,
    refreshMetrics
  } = useDocumentStore();
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, folder: null });
  const [isNewFolderModalVisible, setIsNewFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [clipboardItem, setClipboardItem] = useState(null);
  const { isLoading: folderLoading } = useDocumentStore();

  // Add new state for upload
  const [uploadForm] = Form.useForm();
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchType, setSearchType] = useState('text'); // 'text' or 'partNumber'
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Add new state to track the target folder for operations
  const [targetFolderId, setTargetFolderId] = useState(null);

  // Add new state for versions
  const [documentVersions, setDocumentVersions] = useState({});

  // Add new state for version management
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [selectedVersionDoc, setSelectedVersionDoc] = useState(null);

  // In your preview modal component:
  const [pdfPages, setPdfPages] = useState([]);

  // Add new state for download modal
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [downloadVersions, setDownloadVersions] = useState([]);
  const [selectedVersions, setSelectedVersions] = useState([]);

  // Add new state for preview version selection
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewVersions, setPreviewVersions] = useState([]);
  const [selectedPreviewVersion, setSelectedPreviewVersion] = useState(null);

  // Add new state for view mode
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  useEffect(() => {
    if (selectedDocument?.document_name.toLowerCase().endsWith('.pdf')) {
      const loadPdf = async () => {
        const loadingTask = pdfjsLib.getDocument(selectedDocument.versionUrl);
        const pdf = await loadingTask.promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          pages.push(canvas.toDataURL());
        }
        setPdfPages(pages);
      };
      
      loadPdf();
    }
  }, [selectedDocument]);

  // Fetch document types and part numbers on mount
  useEffect(() => {
    const fetchData = async () => {
      await fetchDocTypes();
      await fetchPartNumbers();
      await fetchFolders();
    };
    fetchData();
  }, [fetchDocTypes, fetchPartNumbers, fetchFolders]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Add click handler to close context menu
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu.visible]);

  const handleCreateDocType = async () => {
    try {
      if (!newDocType.type_name || !newDocType.extensions) {
        message.error('Type name and extensions are required');
        return;
      }

      const docTypeData = {
        type_name: newDocType.type_name,
        description: newDocType.description,
        extensions: newDocType.extensions.split(',').map(ext => ext.trim()).join(','),
        is_active: newDocType.is_active
      };

      await createDocType(docTypeData);
      setIsCreateDocTypeModalVisible(false);
      setNewDocType({ type_name: '', description: '', extensions: '', is_active: true });
      message.success('Document type created successfully');
      // Fetch updated list after creation
      fetchDocTypes();
    } catch (error) {
      message.error(error.message || 'Failed to create document type');
    }
  };

  // Update the convertFoldersToTree function
  const convertFoldersToTree = (folders) => {
    const folderMap = new Map();
    const tree = [];

    // First pass: create all nodes
    folders.forEach(folder => {
      const node = {
        title: (
          <div className="flex items-center justify-between w-full py-1">
            <div className="flex items-center space-x-2">
              <FolderOutlined className="text-blue-500" />
              <span className="font-medium">{folder.folder_name}</span>
            </div>
            {folder.document_count > 0 && (
              <Tag className="ml-2" color="blue">
                {folder.document_count}
              </Tag>
            )}
          </div>
        ),
        key: folder.id.toString(),
        parentId: folder.parent_folder_id,
        children: []
      };
      folderMap.set(folder.id, node);
    });

    // Second pass: build tree structure
    folders.forEach(folder => {
      const node = folderMap.get(folder.id);
      if (!folder.parent_folder_id) {
        tree.push(node);
      } else {
        const parentNode = folderMap.get(folder.parent_folder_id);
        if (parentNode) {
          if (!parentNode.children) parentNode.children = [];
          parentNode.children.push(node);
        }
      }
    });

    return tree;
  };

  const handleContextMenu = (event, folder) => {
    event.preventDefault();
    event.stopPropagation();
    if (!folder) return;
    
    console.log('Opening context menu for folder:', folder);
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      folder: folder
    });
  };

  const handleFolderSelect = (selectedKeys, info) => {
    if (selectedKeys.length === 0) {
      setSelectedFolder('all');
      setSelectedParentId(null);
    } else if (info.node) {
      const folderId = info.node.key;
      setSelectedFolder(folderId);
      setSelectedParentId(folderId);
      fetchFolderDocuments(folderId);
    }
  };

  const handleCreateFolder = async () => {
    try {
      if (!newFolderName.trim()) {
        message.error('Please enter a folder name');
        return;
      }
  
      const folderData = {
        folder_name: newFolderName.trim(),
        parent_folder_id: targetFolderId, // Use the locked-in folder ID
        is_active: true
      };
  
      await createFolder(folderData);
      setIsNewFolderModalVisible(false);
      setNewFolderName('');
      setTargetFolderId(null); // Reset target folder
      await fetchFolders();
      message.success('Folder created successfully');
      
      // Refresh the current folder's contents
      if (targetFolderId) {
        await fetchFolderDocuments(targetFolderId);
      }
    } catch (error) {
      message.error('Failed to create folder');
    }
  };

  // Update the handleFolderDelete function with null checks
  const handleFolderDelete = async (folder) => {
    if (!folder || !folder.id) {
      console.error('Invalid folder object:', folder);
      message.error('Cannot delete folder: Invalid folder data');
      return;
    }

    try {
      console.log('Starting delete process for folder:', folder);
      
      Modal.confirm({
        title: 'Delete Folder',
        content: (
          <div>
            <p>Are you sure you want to delete "{folder.folder_name}"?</p>
            <p className="text-red-500 text-sm mt-2">
              Note: Folders containing documents cannot be deleted.
            </p>
          </div>
        ),
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: async () => {
          try {
            console.log('Confirming delete for folder ID:', folder.id);
            await deleteFolder(folder.id);
            message.success(`Folder "${folder.folder_name}" deleted successfully`);
            await fetchFolders(); // Refresh the folder list
            
            // Reset selected folder if deleted folder was selected
            if (selectedFolder === folder.id) {
              setSelectedFolder('all');
              setSelectedParentId(null);
            }
          } catch (error) {
            console.error('Error deleting folder:', error);
            if (error.message.includes('containing active documents')) {
              message.error('Cannot delete folder containing active documents');
            } else {
              message.error('Failed to delete folder: ' + error.message);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error in handleFolderDelete:', error);
      message.error('Failed to process delete request');
    }
  };

  // Add handlePasteFolder function
  const handlePasteFolder = async (targetFolder) => {
    if (!clipboardItem) {
      message.error('No folder in clipboard');
      return;
    }

    try {
      // If target is the same as source or target is a child of source, prevent paste
      if (clipboardItem.id === targetFolder.id) {
        message.error('Cannot paste folder into itself');
        return;
      }

      // For cut operation
      if (clipboardItem.action === 'cut') {
        await updateFolder(clipboardItem.id, {
          folder_name: clipboardItem.folder_name,
          parent_folder_id: targetFolder.id,
          is_active: true,
          move_documents: true  // Add this flag to move documents
        });
        
        message.success('Folder and its documents moved successfully');
        setClipboardItem(null); // Clear clipboard after cut & paste
      }
      
      // For copy operation
      if (clipboardItem.action === 'copy') {
        // First create the new folder
        const newFolder = await createFolder({
          folder_name: `${clipboardItem.folder_name} (Copy)`,
          parent_folder_id: targetFolder.id,
          is_active: true
        });

        // Then copy all documents from source folder to new folder
        const sourceDocuments = await fetchFolderDocuments(clipboardItem.id);
        
        // Copy each document to the new folder
        if (sourceDocuments && sourceDocuments.length > 0) {
          const copyPromises = sourceDocuments.map(doc => 
            copyDocument({
              document_id: doc.id,
              new_folder_id: newFolder.id,
              new_document_name: `${doc.document_name} (Copy)`
            })
          );

          await Promise.all(copyPromises);
        }
        
        message.success('Folder and its documents copied successfully');
      }

      // Refresh folders and current folder contents
      await fetchFolders();
      if (selectedFolder !== 'all') {
        await fetchFolderDocuments(selectedFolder);
      }
    } catch (error) {
      console.error('Paste folder error:', error);
      message.error('Failed to paste folder: ' + error.message);
    }
  };

  // Update the context menu render function
  const renderContextMenu = () => {
    if (!contextMenu.visible || !contextMenu.folder) return null;

    return ReactDOM.createPortal(
      <div
        style={{
          position: 'fixed',
          top: contextMenu.y,
          left: contextMenu.x,
          zIndex: 1000,
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          borderRadius: '4px'
        }}
      >
        <Menu>
          <Menu.Item 
            key="rename" 
            icon={<EditOutlined />}
            onClick={() => {
              if (contextMenu.folder) {
                setRenameFolderModal({ visible: true, folder: contextMenu.folder });
                setContextMenu({ visible: false, folder: null });
              }
            }}
          >
            Rename
          </Menu.Item>
          <Menu.Item 
            key="cut" 
            icon={<ScissorOutlined />}
            onClick={() => {
              if (contextMenu.folder) {
                setClipboardItem({ 
                  ...contextMenu.folder, 
                  action: 'cut',
                  folder_name: contextMenu.folder.folder_name
                });
                setContextMenu({ visible: false, folder: null });
                message.info('Folder cut to clipboard');
              }
            }}
          >
            Cut
          </Menu.Item>
          <Menu.Item 
            key="copy" 
            icon={<CopyOutlined />}
            onClick={() => {
              if (contextMenu.folder) {
                setClipboardItem({ 
                  ...contextMenu.folder, 
                  action: 'copy',
                  folder_name: contextMenu.folder.folder_name
                });
                setContextMenu({ visible: false, folder: null });
                message.info('Folder copied to clipboard');
              }
            }}
          >
            Copy
          </Menu.Item>
          {clipboardItem && (
            <Menu.Item 
              key="paste" 
              icon={<SnippetsOutlined />}
              onClick={() => {
                handlePasteFolder(contextMenu.folder);
                setContextMenu({ visible: false, folder: null });
              }}
            >
              Paste
            </Menu.Item>
          )}
          <Menu.Divider />
          <Menu.Item 
            key="delete" 
            icon={<DeleteOutlined />} 
            danger
            onClick={() => {
              if (contextMenu.folder) {
                handleFolderDelete(contextMenu.folder);
                setContextMenu({ visible: false, folder: null });
              }
            }}
          >
            Delete
          </Menu.Item>
        </Menu>
      </div>,
      document.body
    );
  };

  // Update the New Folder Modal to show correct parent folder
  const renderNewFolderModal = () => (
    <Modal
      title="Create New Folder"
      visible={isNewFolderModalVisible}
      onOk={handleCreateFolder}
      onCancel={() => {
        setIsNewFolderModalVisible(false);
        setNewFolderName('');
        setTargetFolderId(null);
      }}
      okButtonProps={{ disabled: !newFolderName.trim() }}
    >
      <Form layout="vertical">
        <Form.Item 
          label="Folder Name" 
          required
          validateStatus={!newFolderName.trim() && 'error'}
          help={!newFolderName.trim() && 'Please enter a folder name'}
        >
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Enter folder name"
            autoFocus
            maxLength={50}
          />
        </Form.Item>
        <Form.Item label="Parent Folder">
          <Input 
            value={
              targetFolderId ? 
                folders.find(f => f.id.toString() === targetFolderId?.toString())?.folder_name 
                : 'Root'
            }
            disabled
          />
        </Form.Item>
      </Form>
    </Modal>
  );

  // Update the handleUploadClick function
  const handleUploadClick = () => {
    if (!selectedFolder || selectedFolder === 'all') {
      message.warning('Please select a folder before uploading');
      return;
    }
    setIsUploadModalVisible(true);
    setTargetFolderId(selectedFolder);
  };

  const handleUpload = async (file, values) => {
    try {
      if (!targetFolderId) {
        message.error('Please select a folder before uploading.');
        return;
      }

      // Check if document with same name exists in folder
      const existingDoc = documents.find(
        doc => doc.document_name === values.document_name && 
               doc.folder_id.toString() === targetFolderId.toString()
      );

      const uploadData = {
        file: file,
        folder_id: targetFolderId,
        document_name: values.document_name || file.name,
        doc_type_id: values.doc_type_id,
        part_number_id: values.part_number_id,
        description: values.description || '',
        version_number: existingDoc ? `1.${parseInt(existingDoc.version_number.split('.')[1] || '0') + 1}` : '1.0'
      };

      await uploadDocument(uploadData);
      setIsUploadModalVisible(false);
      uploadForm.resetFields();
      setSelectedFile(null);
      setTargetFolderId(null);
      message.success('File uploaded successfully');
      
      if (selectedFolder && selectedFolder !== 'all') {
        await fetchFolderDocuments(selectedFolder);
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error(
        error.message === '[object Object]' 
          ? 'Failed to upload file. Please check all required fields are filled correctly.'
          : `Upload failed: ${error.message}`
      );
    }
  };

  // Handle delete
  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Delete Document',
      content: `Are you sure you want to delete "${record.name}"?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        setDocuments(prev => prev.filter(doc => doc.id !== record.id));
        message.success('Document deleted successfully');
      }
    });
  };

  // Filter documents based on search and selected folder
  const filteredDocuments = Array.isArray(documents) ? documents.filter(doc => {
    const matchesSearch = doc.document_name?.toLowerCase().includes(searchText.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || doc.folder_id.toString() === selectedFolder.toString();
    return matchesSearch && matchesFolder;
  }) : [];

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconProps = { className: 'text-lg' };

    switch (extension) {
      case 'pdf':
        return <FilePdfOutlined {...iconProps} className="text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileWordOutlined {...iconProps} className="text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileExcelOutlined {...iconProps} className="text-green-500" />;
      case 'txt':
      case 'js':
      case 'jsx':
      case 'css':
      case 'html':
        return <FileTextOutlined {...iconProps} className="text-gray-500" />;
      case 'stp':
      case 'step':
        return <FileImageOutlined {...iconProps} className="text-purple-500" />;
      default:
        return <FileOutlined {...iconProps} className="text-gray-400" />;
    }
  };

  // Add download version selection modal
  const renderDownloadVersionModal = () => (
    <Modal
      title={`Select Versions to Download - ${selectedDocument?.document_name}`}
      visible={downloadModalVisible}
      onCancel={handleDownloadModalClose}
      onOk={async () => {
        try {
          // Download selected versions
          for (const version of selectedVersions) {
            const blob = await downloadDocumentVersion(selectedDocument.id, version.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedDocument.document_name}_v${version.version_number}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
          message.success('Documents downloaded successfully');
          setDownloadModalVisible(false);
          setSelectedVersions([]);
        } catch (error) {
          message.error('Failed to download documents');
        }
      }}
      okButtonProps={{ disabled: selectedVersions.length === 0 }}
    >
      <Checkbox.Group
        value={selectedVersions.map(v => v.id)}
        onChange={(values) => {
          setSelectedVersions(
            downloadVersions.filter(v => values.includes(v.id))
          );
        }}
      >
        <List
          dataSource={downloadVersions}
          renderItem={version => (
            <List.Item>
              <Checkbox value={version.id}>
                Version {version.version_number} 
                ({new Date(version.created_at).toLocaleDateString()})
              </Checkbox>
            </List.Item>
          )}
        />
      </Checkbox.Group>
    </Modal>
  );

  // Update the handleDownload function
  const handleDownload = async (record) => {
    try {
      // Get all versions of the document
      const versions = await fetchDocumentVersions(record.id);
      
      if (versions.length > 1) {
        // If multiple versions exist, show selection modal
        setSelectedDocument(record);
        setDownloadVersions(versions);
        setDownloadModalVisible(true);
      } else {
        // If only one version, download it directly
        const blob = await downloadDocumentVersion(record.id, versions[0].id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = record.document_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        message.success('Document downloaded successfully');
      }
    } catch (error) {
      message.error('Failed to download document');
    }
  };

  const handleShare = (record) => {
    Modal.confirm({
      title: 'Share Document',
      content: (
        <div>
          <p>Share "{record.name}" with:</p>
          <Input placeholder="Enter email addresses" />
        </div>
      ),
      onOk() {
        message.success('Document shared successfully');
      }
    });
  };

  const toggleFavorite = (docId) => {
    setFavorites(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
    message.success('Favorites updated');
  };

  // Update the columns definition
  const columns = [
    {
      title: 'Name',
      dataIndex: 'document_name',
      key: 'document_name',
      render: (text, record) => (
        <div className="flex items-center space-x-2">
          {getFileIcon(record.document_name)}
          <div>
            <span className="font-medium">{text}</span>
            <div className="text-xs text-gray-500">
              {record.description || ''}
              {record.latest_version?.file_size && 
                ` • ${(record.latest_version.file_size / (1024 * 1024)).toFixed(2)} MB`}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Version',
      dataIndex: 'version_number',
      key: 'version',
      width: 200,
      render: (version, record) => {
        const versions = record.versions || [];
        return (
          <Space wrap>
            {versions.map((ver) => (
              <Tag
                key={ver.id}
                color={ver.status === 'active' ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => handleVersionClick(record, ver)}
              >
                v{ver.version_number}
              </Tag>
            ))}
            {versions.length === 0 && version && (
              <Tag color="blue">
                v{version}
              </Tag>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: ['latest_version', 'status'],
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={
          status === 'active' ? 'success' : 
          status === 'under_review' ? 'processing' : 
          'default'
        }>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Modified',
      dataIndex: 'created_at',
      key: 'modified',
      width: 150,
      render: (date, record) => (
        <div>
          <div>{new Date(date).toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">by {record.created_by}</div>
        </div>
      ),
    },
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
      width: 150,
      render: (partNumber) => (
        <div>
          {partNumber || 'N/A'}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          />
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          />
          <Dropdown 
            overlay={renderQuickActions(record)} 
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const documentTypeButton = (
    <Col>
      <Button 
        icon={<FileTextOutlined />}
        onClick={() => setIsDocTypeModalVisible(true)}
      >
        Document Types
      </Button>
    </Col>
  );

  const documentTypeModals = (
    <>
      <Modal
        title="Document Types"
        visible={isDocTypeModalVisible}
        onCancel={() => setIsDocTypeModalVisible(false)}
        footer={[
          <Button 
            key="create" 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setIsDocTypeModalVisible(false);
              setIsCreateDocTypeModalVisible(true);
            }}
          >
            Create New Type
          </Button>
        ]}
        width={800}
      >
        <Table
          dataSource={documentTypes}
          rowKey="id"
          loading={isLoading}
          columns={[
            {
              title: 'Type Name',
              dataIndex: 'type_name',
              key: 'type_name',
              sorter: (a, b) => a.type_name.localeCompare(b.type_name)
            },
            {
              title: 'Description',
              dataIndex: 'description',
              key: 'description',
              ellipsis: true
            },
            {
              title: 'Extensions',
              dataIndex: 'file_extensions',
              key: 'file_extensions',
              render: (extensions) => (
                <Space wrap>
                  {extensions?.map(ext => (
                    <Tag key={ext} color="blue">
                      {ext}
                    </Tag>
                  ))}
                </Space>
              ),
            },
            {
              title: 'Status',
              dataIndex: 'is_active',
              key: 'is_active',
              render: (isActive) => (
                <Badge
                  status={isActive ? 'success' : 'default'}
                  text={isActive ? 'Active' : 'Inactive'}
                />
              ),
              filters: [
                { text: 'Active', value: true },
                { text: 'Inactive', value: false }
              ],
              onFilter: (value, record) => record.is_active === value,
            }
          ]}
          pagination={{
            defaultPageSize: 5,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`
          }}
        />
      </Modal>

      {/* Create Document Type Modal */}
      <Modal
        title="Create Document Type"
        visible={isCreateDocTypeModalVisible}
        onCancel={() => setIsCreateDocTypeModalVisible(false)}
        onOk={handleCreateDocType}
      >
        <Form layout="vertical">
          <Form.Item 
            label="Type Name" 
            required
            rules={[{ required: true, message: 'Please enter type name' }]}
          >
            <Input
              value={newDocType.type_name}
              onChange={(e) => setNewDocType(prev => ({ ...prev, type_name: e.target.value }))}
              placeholder="Enter type name"
            />
          </Form.Item>
          <Form.Item label="Description">
            <Input.TextArea
              value={newDocType.description}
              onChange={(e) => setNewDocType(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description"
            />
          </Form.Item>
          <Form.Item 
            label="File Extensions" 
            required
            rules={[{ required: true, message: 'Please enter file extensions' }]}
          >
            <Input
              value={newDocType.extensions}
              onChange={(e) => setNewDocType(prev => ({ ...prev, extensions: e.target.value }))}
              placeholder=".pdf, .doc, etc."
            />
          </Form.Item>
          <Form.Item>
            <Checkbox
              checked={newDocType.is_active}
              onChange={(e) => setNewDocType(prev => ({ ...prev, is_active: e.target.checked }))}
            >
              Active
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );

  // Update the left sidebar content
  const renderLeftSidebar = () => {
    return (
      <Card className="h-full" bodyStyle={{ padding: '16px' }}>
        <div className="flex items-center space-x-4 mb-6">
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={handleUploadClick}
            id="upload-button"
            className="flex-1"
          >
            Upload
          </Button>
          <Button 
            type="default" 
            icon={<FolderOutlined />}
            onClick={() => {
              setIsNewFolderModalVisible(true);
              setTargetFolderId(selectedParentId);
            }}
            id="new-folder-button"
          >
            New Folder
          </Button>
          {/* <Button 
            type="default" 
            icon={<StarOutlined />}
          >
            Favorites
          </Button> */}
        </div>
        
        <Divider className="my-4" />

        <div className="folder-tree-container">
          <Tree
            className="custom-tree document-tree"
            treeData={convertFoldersToTree(folders)}
            selectedKeys={[selectedFolder].filter(Boolean)}
            onSelect={handleFolderSelect}
            onRightClick={({ event, node }) => {
              event.preventDefault();
              const folder = folders.find(f => f.id.toString() === node.key);
              if (folder) {
                handleContextMenu(event, folder);
              }
            }}
            showIcon={false}
            defaultExpandAll
          />
        </div>
      </Card>
    );
  };

  // Update the Upload Modal
  const renderUploadModal = () => (
    <Modal
      title="Upload Document"
      visible={isUploadModalVisible}
      onCancel={() => {
        setIsUploadModalVisible(false);
        uploadForm.resetFields();
        setSelectedFile(null);
        setTargetFolderId(null);
      }}
      footer={null}
    >
      <Form
        form={uploadForm}
        layout="vertical"
        onFinish={async (values) => {
          if (!selectedFile) {
            message.error('Please select a file to upload');
            return;
          }
          
          // Use the selected folder ID
          const folderId = targetFolderId || selectedFolder;
          if (!folderId || folderId === 'all') {
            message.error('Please select a folder for upload');
            return;
          }

          await handleUpload(selectedFile, values);
        }}
      >
        <Form.Item 
          label="Selected Folder" 
          required
          className="mb-4"
        >
          <Input 
            value={folders.find(f => f.id.toString() === (targetFolderId || selectedFolder)?.toString())?.folder_name}
            disabled
            placeholder="Please select a folder first"
          />
        </Form.Item>

        <Form.Item
          label="Select File"
          required
          rules={[{ required: true, message: 'Please select a file' }]}
        >
          <Upload.Dragger
            beforeUpload={(file) => {
              setSelectedFile(file);
              // Set default document name from file name
              uploadForm.setFieldsValue({
                document_name: file.name
              });
              return false;
            }}
            maxCount={1}
            onRemove={() => {
              setSelectedFile(null);
              uploadForm.setFieldsValue({
                document_name: ''
              });
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Selected folder: {folders.find(f => f.id.toString() === (targetFolderId || selectedFolder)?.toString())?.folder_name}
            </p>
          </Upload.Dragger>
        </Form.Item>

        <Form.Item
          name="document_name"
          label="Document Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
  
        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea />
        </Form.Item>
  
        <Form.Item
          name="doc_type_id"
          label="Document Type"
          rules={[{ required: true, message: 'Please select document type' }]}
        >
          <Select>
            {documentTypes.map(type => (
              <Select.Option key={type.id} value={type.id}>
                {type.type_name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
  
        <Form.Item
          name="part_number_id"
          label="Part Number"
          rules={[{ required: true, message: 'Please select part number' }]}
        >
          <Select>
            {partNumbers.map(part => (
              <Select.Option key={part.id} value={part.id}>
                {part.part_number}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
  
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            block
            disabled={!selectedFile}
          >
            Upload Document
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );

  // Add this function to handle search
  const handleSearch = async (value) => {
    if (!value) {
      // If search is empty and a folder is selected, fetch folder documents
      if (selectedFolder && selectedFolder !== 'all') {
        await fetchFolderDocuments(selectedFolder);
        return;
      }
    }

    try {
      if (searchType === 'text') {
        await searchDocuments({
          search_text: value,
          folder_id: selectedFolder !== 'all' ? selectedFolder : undefined,
          doc_type_id: selectedDocType
        });
      } else if (searchType === 'partNumber') {
        // Update minimum character check to match your requirements
        if (value.length >= 2) { // You can adjust this minimum length
          // Get the token from auth store
          const token = useAuthStore.getState().token;

          if (!token) {
            throw new Error('No authorization token available');
          }

          const response = await fetch(
            `http://172.18.7.85:7739/api/v1/documents/search/by-partnumber/?part_number_query=${encodeURIComponent(value)}&skip=0&limit=100`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (!response.ok) {
            if (response.status === 401) {
              message.error('Session expired. Please login again.');
              // Optionally handle logout/redirect here
              return;
            }
            throw new Error('Failed to fetch documents');
          }

          const data = await response.json();
          
          // Update the documents state with the search results
          useDocumentStore.setState({
            documents: data.documents,
            totalDocuments: data.total
          });
          
          if (data.documents.length === 0) {
            message.info('No documents found for this part number');
          }
        } else {
          message.warning('Please enter at least 2 characters for part number search');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      message.error('Search failed: ' + error.message);
    }
  };

  // Update the search section in your render method
  // Replace the existing search input with this:
  const renderSearchSection = () => (
    <Row gutter={16} align="middle" justify="space-between">
      <Col flex="auto">
        <Input.Group compact>
          <Select
            defaultValue="text"
            style={{ width: '130px' }}
            onChange={(value) => {
              setSearchType(value);
              setSearchText(''); // Clear search text when switching search type
            }}
          >
            <Select.Option value="text">Search Text</Select.Option>
            <Select.Option value="partNumber">Part Number</Select.Option>
          </Select>
          <Search
            placeholder={searchType === 'text' ? "Search documents..." : "Enter part number (min. 2 characters)..."}
            allowClear
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              if (searchType === 'partNumber' && e.target.value.length < 2) {
                // Clear results if less than 2 characters
                if (selectedFolder && selectedFolder !== 'all') {
                  fetchFolderDocuments(selectedFolder);
                }
              }
            }}
            onSearch={handleSearch}
            style={{ width: 'calc(100% - 130px)' }}
            enterButton
          />
        </Input.Group>
      </Col>
      <Col>
        <Space>
          <Radio.Group 
            value={viewMode} 
            onChange={e => setViewMode(e.target.value)}
            buttonStyle="solid"
          >
            <Tooltip title="Table View">
              <Radio.Button value="table"><BarsOutlined /></Radio.Button>
            </Tooltip>
            <Tooltip title="Grid View">
              <Radio.Button value="grid"><AppstoreOutlined /></Radio.Button>
            </Tooltip>
          </Radio.Group>
          {documentTypeButton}
        </Space>
      </Col>
    </Row>
  );

  // Update the handleVersionClick function to show single version
  const handleVersionClick = async (document, version) => {
    try {
      // Fetch the document blob
      const blob = await downloadDocumentVersion(document.id, version.id);
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Check if it's a PDF
      if (document.document_name.toLowerCase().endsWith('.pdf')) {
        // Open PDF in new window with viewer
        window.open(url, '_blank');
      } else {
        // For other file types, show preview in modal
        setSelectedDocument({
          ...document,
          versionUrl: url,
          versionNumber: version.version_number
        });
        setIsPreviewModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to load document');
    }
  };

  // Update the handlePreview function
  const handlePreview = async (record) => {
    try {
      // Get all versions of the document
      const versions = await fetchDocumentVersions(record.id);
      
      if (versions.length > 1) {
        // If multiple versions exist, show selection modal
        setSelectedDocument(record);
        setPreviewVersions(versions);
        setPreviewModalVisible(true);
      } else {
        // If only one version, preview it directly
        const blob = await downloadDocumentVersion(record.id, versions[0].id);
        const url = window.URL.createObjectURL(blob);
        setSelectedDocument({
          ...record,
          versionUrl: url,
          version_number: versions[0].version_number
        });
        setIsPreviewModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to load document preview');
    }
  };

  // Add new function for quick actions
  const renderQuickActions = (record) => (
    <Menu>
      <Menu.Item 
        key="preview" 
        icon={<EyeOutlined />}
        onClick={() => handlePreview(record)}
      >
        Preview
      </Menu.Item>
      <Menu.Item 
        key="download" 
        icon={<DownloadOutlined />}
        onClick={() => handleDownload(record)}
      >
        Download
      </Menu.Item>
      <Menu.Item 
        key="versions" 
        icon={<HistoryOutlined />}
        onClick={() => {
          setSelectedVersionDoc(record);
          setVersionModalVisible(true);
        }}
      >
        Manage Versions
      </Menu.Item>
      <Menu.Divider />
      {/* <Menu.SubMenu 
        key="share" 
        icon={<ShareAltOutlined />} 
        title="Share"
      >
        <Menu.Item key="copy-link" icon={<LinkOutlined />}>
          Copy Link
        </Menu.Item>
        <Menu.Item key="email" icon={<MailOutlined />}>
          Share via Email
        </Menu.Item>
      </Menu.SubMenu> */}
      <Menu.Item 
        key="delete" 
        icon={<DeleteOutlined />}
        danger
      >
        Delete
      </Menu.Item>
    </Menu>
  );

  // Update the handleNewFolderClick function
  const handleNewFolderClick = () => {
    // Remove the folder selection check
    setIsNewFolderModalVisible(true);
    // Only set targetFolderId if a folder is selected
    if (selectedFolder && selectedFolder !== 'all') {
      setTargetFolderId(selectedFolder);
    } else {
      setTargetFolderId(null); // This will create folder at root
    }
  };

  // Update click outside handler to ignore modal interactions completely
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle clicks outside when no modal is open
      if (isUploadModalVisible || isNewFolderModalVisible) {
        return;
      }

      const tree = document.querySelector('.document-tree');
      const uploadButton = document.querySelector('#upload-button');
      const newFolderButton = document.querySelector('#new-folder-button');
      
      if (tree?.contains(event.target) || 
          uploadButton?.contains(event.target) || 
          newFolderButton?.contains(event.target)) {
        return;
      }
      
      setSelectedFolder('all');
      setSelectedParentId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUploadModalVisible, isNewFolderModalVisible]); // Add modal visibility to dependencies

  // Add click handler to close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.visible && !event.target.closest('.ant-menu')) {
        setContextMenu({ visible: false });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.visible]);

  // Add preview version selection modal
  const renderPreviewVersionModal = () => (
    <Modal
      title={`Select Version to Preview - ${selectedDocument?.document_name}`}
      visible={previewModalVisible}
      onCancel={handlePreviewModalClose}
      onOk={async () => {
        try {
          if (selectedPreviewVersion) {
            const blob = await downloadDocumentVersion(selectedDocument.id, selectedPreviewVersion.id);
            const url = window.URL.createObjectURL(blob);
            setSelectedDocument({
              ...selectedDocument,
              versionUrl: url,
              version_number: selectedPreviewVersion.version_number
            });
            setPreviewModalVisible(false);
            setIsPreviewModalVisible(true);
          }
        } catch (error) {
          message.error('Failed to load document preview');
        }
      }}
      okButtonProps={{ disabled: !selectedPreviewVersion }}
    >
      <Radio.Group
        value={selectedPreviewVersion?.id}
        onChange={(e) => {
          setSelectedPreviewVersion(
            previewVersions.find(v => v.id === e.target.value)
          );
        }}
      >
        <List
          dataSource={previewVersions}
          renderItem={version => (
            <List.Item>
              <Radio value={version.id}>
                Version {version.version_number} 
                ({new Date(version.created_at).toLocaleDateString()})
              </Radio>
            </List.Item>
          )}
        />
      </Radio.Group>
    </Modal>
  );

  // Add this effect to refresh document versions when folder changes
  useEffect(() => {
    const refreshDocuments = async () => {
      if (selectedFolder && selectedFolder !== 'all') {
        await fetchFolderDocuments(selectedFolder);
      }
    };
    refreshDocuments();
  }, [selectedFolder]);

  // Add this effect to refresh documents when needed
  useEffect(() => {
    const refreshDocuments = async () => {
      if (selectedFolder && selectedFolder !== 'all') {
        try {
          await fetchFolderDocuments(selectedFolder);
        } catch (error) {
          console.error('Failed to refresh documents:', error);
        }
      }
    };

    refreshDocuments();
  }, [selectedFolder, versionModalVisible]); // Add versionModalVisible to dependencies

  // Add this function to handle version modal close
  const handleVersionModalClose = () => {
    setVersionModalVisible(false);
    setSelectedVersionDoc(null);
    setSelectedVersions([]);
  };

  // Update the preview modal close handler
  const handlePreviewModalClose = () => {
    setIsPreviewModalVisible(false);
    setPreviewModalVisible(false);
    setSelectedPreviewVersion(null);
    if (selectedDocument?.versionUrl) {
      window.URL.revokeObjectURL(selectedDocument.versionUrl);
    }
    setSelectedDocument(null);
  };

  // Update the download modal close handler
  const handleDownloadModalClose = () => {
    setDownloadModalVisible(false);
    setSelectedVersions([]);
  };

  // Add this function inside DocumentManagement component
  const renderBreadcrumb = () => {
    const getFolderPath = (folderId) => {
      const path = [];
      let currentFolder = folders.find(f => f.id.toString() === folderId?.toString());
      
      while (currentFolder) {
        path.unshift(currentFolder);
        currentFolder = folders.find(f => f.id === currentFolder.parent_folder_id);
      }
      
      return path;
    };

    const folderPath = selectedFolder !== 'all' ? getFolderPath(selectedFolder) : [];

    return (
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item href="#" onClick={() => setSelectedFolder('all')}>
          <HomeOutlined /> Home
        </Breadcrumb.Item>
        {folderPath.map(folder => (
          <Breadcrumb.Item 
            key={folder.id}
            href="#"
            onClick={() => setSelectedFolder(folder.id.toString())}
          >
            {folder.folder_name}
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>
    );
  };

  // Add this function to render grid view
  const renderGridView = () => (
    <List
      grid={{ gutter: 16, column: 4 }}
      dataSource={filteredDocuments}
      renderItem={document => (
        <List.Item>
          <Card
            hoverable
            className="document-card"
            actions={[
              <Tooltip title="Preview">
                <EyeOutlined key="preview" onClick={() => handlePreview(document)} />
              </Tooltip>,
              <Tooltip title="Download">
                <DownloadOutlined key="download" onClick={() => handleDownload(document)} />
              </Tooltip>
            ]}
          >
            <Card.Meta
              avatar={getFileIcon(document.document_name)}
              title={document.document_name}
              description={
                <Space direction="vertical" size="small">
                  <Text type="secondary">{document.description}</Text>
                  <Space>
                    {document.versions?.map(ver => (
                      <Tag 
                        key={ver.id}
                        color={ver.status === 'active' ? 'blue' : 'default'}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleVersionClick(document, ver)}
                      >
                        v{ver.version_number}
                      </Tag>
                    ))}
                  </Space>
                  <Text type="secondary">
                    Modified: {new Date(document.created_at).toLocaleDateString()}
                  </Text>
                </Space>
              }
            />
          </Card>
        </List.Item>
      )}
    />
  );

  // Update the metrics loading effect
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        await fetchMetrics();
      } catch (error) {
        message.error('Failed to load analytics metrics');
      }
    };
    loadMetrics();

    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(refreshMetrics, 30000);

    return () => clearInterval(refreshInterval);
  }, [fetchMetrics, refreshMetrics]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Compact Header with Metrics */}
      <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              Document Management
            </h1>
            <p className="text-gray-500 text-sm">
              Manage and organize your documents
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={handleUploadClick}
              className="flex items-center"
            >
              Upload
            </Button>
            <Button
              icon={<FolderOutlined />}
              onClick={() => setIsNewFolderModalVisible(true)}
              className="flex items-center"
            >
              New Folder
            </Button>
          </div>
        </div>

        {/* Compact Analytics */}
        <AnalyticsCards 
          metrics={metrics} 
          isLoading={isLoadingMetrics}
          error={metricsError}
        />
      </div>

      {/* Main Document Management Area */}
      <Card bordered={false} className="shadow-sm" bodyStyle={{ padding: '16px' }}>
        <Row gutter={[16, 16]}>
          {/* Left Sidebar */}
          <Col flex="220px">
            {renderLeftSidebar()}
          </Col>

          {/* Document Area */}
          <Col flex="auto">
            <div className="flex flex-col h-[calc(100vh-230px)]">
              {renderBreadcrumb()}
              <div className="mb-3">
                {renderSearchSection()}
              </div>

              <Card 
                className="flex-1 overflow-hidden"
                bodyStyle={{ 
                  padding: viewMode === 'table' ? '0' : '16px',
                  height: '100%',
                  overflow: 'auto'
                }}
              >
                {viewMode === 'table' ? (
                  <Table
                    columns={columns}
                    dataSource={filteredDocuments}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true
                    }}
                    className="custom-table"
                  />
                ) : (
                  renderGridView()
                )}
              </Card>
            </div>
          </Col>
        </Row>
      </Card>

      {renderContextMenu()}
      {renderNewFolderModal()}

      {renderUploadModal()}

      {/* Document Preview Modal */}
      <Modal
        title={`Preview - ${selectedDocument?.document_name} (v${selectedDocument?.version_number})`}
        visible={isPreviewModalVisible}
        onCancel={handlePreviewModalClose}
        width={800}
        footer={[
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => {
              const a = document.createElement('a');
              a.href = selectedDocument.versionUrl;
              a.download = `${selectedDocument.document_name}_v${selectedDocument.version_number}`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(selectedDocument.versionUrl);
              document.body.removeChild(a);
            }}
          >
            Download
          </Button>,
          <Button key="close" onClick={handlePreviewModalClose}>
            Close
          </Button>
        ]}
      >
        {selectedDocument && (
          <div className="preview-content">
            {selectedDocument.document_name.toLowerCase().endsWith('.pdf') ? (
              <iframe 
                src={selectedDocument.versionUrl}
                style={{ width: '100%', height: '600px' }}
                title="PDF Preview"
              />
            ) : (
              <div>
                <p>Preview not available for this file type.</p>
                <p>Please download the file to view it.</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {documentTypeModals}

      <VersionManagementModal
        visible={versionModalVisible}
        document={selectedVersionDoc}
        onClose={handleVersionModalClose}
      />

      {renderDownloadVersionModal()}
      {renderPreviewVersionModal()}
    </div>
  );
};

// Add these styles
const styles = `
  .custom-tree .ant-tree-node-content-wrapper {
    display: flex;
    align-items: center;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.3s;
    margin: 2px 0;
  }

  .custom-tree .ant-tree-node-content-wrapper:hover {
    background-color: #f0f7ff;
  }

  .custom-tree .ant-tree-node-selected {
    background-color: #e6f4ff !important;
  }

  .custom-tree .ant-tree-switcher {
    align-self: center;
    width: 24px;
    height: 24px;
    line-height: 24px;
  }

  .custom-tree .ant-tree-indent-unit {
    width: 24px;
  }

  .folder-tree-container {
    max-height: calc(100vh - 240px);
    overflow-y: auto;
    padding-right: 8px;
  }

  .folder-tree-container::-webkit-scrollbar {
    width: 6px;
  }

  .folder-tree-container::-webkit-scrollbar-thumb {
    background-color: #d9d9d9;
    border-radius: 3px;
  }

  .folder-tree-container::-webkit-scrollbar-track {
    background-color: #f5f5f5;
    border-radius: 3px;
  }

  .document-card {
    transition: all 0.3s;
  }

  .document-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .ant-card-meta-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ant-breadcrumb {
    padding: 8px 0;
  }

  .ant-breadcrumb-link {
    cursor: pointer;
  }

  .ant-breadcrumb-link:hover {
    color: #1890ff;
  }

  .folder-tree-container .ant-tree-node-content-wrapper {
    transition: all 0.3s;
  }

  .folder-tree-container .ant-tree-node-content-wrapper:hover {
    background-color: #e6f7ff;
  }

  .document-table .ant-table-row {
    cursor: pointer;
    transition: all 0.3s;
  }

  .document-table .ant-table-row:hover {
    background-color: #f0f7ff !important;
  }

  .document-management {
    padding: 16px;
    background: #f0f2f5;
    min-height: 100vh;
  }

  .header-section {
    background: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }

  .analytics-card-compact {
    border-radius: 8px;
    height: 80px;
    overflow: hidden;
  }

  .metric-content {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 100%;
    padding: 12px;
  }

  .metric-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .metric-value {
    color: white;
    font-size: 20px;
    font-weight: 600;
    line-height: 1;
    margin-bottom: 4px;
  }

  .metric-label {
    color: rgba(255,255,255,0.85);
    font-size: 12px;
  }

  .bg-gradient-blue {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  }

  .bg-gradient-green {
    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  }

  .bg-gradient-purple {
    background: linear-gradient(135deg, #722ed1 0%, #531dab 100%);
  }

  .bg-gradient-orange {
    background: linear-gradient(135deg, #fa8c16 0%, #d46b08 100%);
  }

  .document-content {
    height: calc(100vh - 200px);
    display: flex;
    flex-direction: column;
  }

  .custom-table {
    height: 100%;
  }

  .custom-table .ant-table-thead > tr > th {
    background: #fafafa;
    font-weight: 500;
  }

  .document-table .ant-card-body {
    padding: 0;
  }

  .folder-tree-container {
    height: calc(100vh - 240px);
    overflow: auto;
    padding: 12px;
    background: #fafafa;
    border-radius: 6px;
  }
`;

export default DocumentManagement;