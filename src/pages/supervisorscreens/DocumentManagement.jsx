import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import documentsAnimation from '../../assets/documents.json';
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
  Skeleton,
  InputNumber,
  Spin
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
  FolderOpenOutlined,
  DatabaseOutlined,
  ToolOutlined,
  BellOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  UploadOutlined as UploadIcon
} from '@ant-design/icons';
import useDocumentStore from '../../store/document-store';
import ReactDOM from 'react-dom';
import useAuthStore from '../../store/auth-store';
import * as pdfjsLib from 'pdfjs-dist';
// Import the worker directly from the dist folder
import 'pdfjs-dist/build/pdf.worker.entry';
import useNotificationStore from '../../store/notification';

// Set up the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;


const { Title, Text } = Typography;
const { Search } = Input;

// Add this new component for version management
const VersionManagementModal = ({ visible, document, onClose }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customVersionNumber, setCustomVersionNumber] = useState("");
  const [useCustomVersion, setUseCustomVersion] = useState(false);
  const { fetchDocumentVersions, uploadNewVersion, deleteDocumentVersion, fetchFolderDocuments, documents } = useDocumentStore();

  // Calculate next version number for auto increment
  const getNextVersionNumber = () => {
    if (!versions || versions.length === 0) return "1.0";
    
    const highestVersion = Math.max(
      ...versions.map(v => parseFloat(v.version_number.replace('v', '')))
    );
    
    return (highestVersion + 1).toString();
  };

  const loadVersions = async () => {
    if (!document) return;
    
    setLoading(true);
    try {
      const data = await fetchDocumentVersions(document.id);
      const sortedVersions = data.sort((a, b) => {
        const aNum = parseFloat(a.version_number.replace('v', ''));
        const bNum = parseFloat(b.version_number.replace('v', ''));
        return bNum - aNum;
      });
      setVersions(sortedVersions);
    } catch (error) {
      message.error('Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionDelete = async (versionId) => {
    try {
      // Optimistically update the UI
      const updatedVersions = versions.filter(v => v.id !== versionId);
      setVersions(updatedVersions);

      // Make the API call
      await deleteDocumentVersion(versionId);
      message.success('Version deleted successfully');
      
      // If this was the last version, close modal
      if (updatedVersions.length === 0) {
        onClose();
      }

      // Refresh both the version list and the main document table
      await loadVersions(); // Refresh version list
      
      // Update the document's versions in the main table
      const updatedDocuments = documents.map(doc => {
        if (doc.id === document.id) {
          return {
            ...doc,
            versions: updatedVersions,
            latest_version: updatedVersions[0] || null // Update latest version
          };
        }
        return doc;
      });
      
      // Update the documents state
      useDocumentStore.setState({ documents: updatedDocuments });
      
      // Refresh the folder documents to ensure everything is in sync
      // If we're in a subfolder, make sure to refresh that specific folder
      if (document.folder_id) {
        await fetchFolderDocuments(document.folder_id);
      } else {
        await fetchFolderDocuments();
      }

      // Close the version modal after successful deletion
      onClose();
    } catch (error) {
      // Revert optimistic update on error
      await loadVersions();
      message.error('Failed to delete version: ' + error.message);
    }
  };

  const handleNewVersion = async (file) => {
    try {
      const versionNumber = useCustomVersion ? customVersionNumber : null;
      
      // Make the API call
      const result = await uploadNewVersion(document.id, file, versionNumber);
      
      // Update versions list
      setVersions(prev => [result, ...prev]);
      
      message.success('New version uploaded successfully');
      setCustomVersionNumber("");
      setUseCustomVersion(false);
      
      // Refresh data in background
      await fetchFolderDocuments();
    } catch (error) {
      message.error('Failed to upload new version');
    }
  };

  const handleFileUpdate = async (file, versionId) => {
    try {
      await updateVersion(document.id, versionId, file);
      message.success('Version updated successfully');
      await loadVersions(); // Refresh versions list
      await fetchFolderDocuments(); // Refresh main document list
    } catch (error) {
      message.error('Failed to update version');
    }
  };

  // Load versions when modal becomes visible
  useEffect(() => {
    if (visible && document) {
      loadVersions();
    }
  }, [visible, document]);

  return (
    <Modal
      title={`Versions - ${document?.name || ''}`}
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div className="mb-4">
        <Form layout="inline" className="mb-4">
          <Form.Item label="Version Number">
            <Checkbox
              checked={useCustomVersion}
              onChange={(e) => setUseCustomVersion(e.target.checked)}
            >
              Custom Version Number
            </Checkbox>
          </Form.Item>
          
          {useCustomVersion ? (
            <Form.Item>
              <Input
                value={customVersionNumber}
                onChange={(e) => setCustomVersionNumber(e.target.value)}
                placeholder="Enter version number"
                style={{ width: 150 }}
              />
            </Form.Item>
          ) : (
            <Form.Item>
              <Badge 
                status="processing" 
                text={`Next: v${getNextVersionNumber()}`} 
                className="text-blue-600"
              />
            </Form.Item>
          )}
          
          <Form.Item>
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                Modal.confirm({
                  title: 'Upload New Version',
                  content: `Are you sure you want to upload version ${useCustomVersion ? customVersionNumber : getNextVersionNumber()}?`,
                  onOk: () => handleNewVersion(file),
                });
                return false;
              }}
            >
              <Button type="primary" icon={<UploadOutlined />}>
                Upload New Version
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </div>

      <Table
        loading={loading}
        dataSource={versions}
        rowKey="id"
        columns={[
          {
            title: 'Version',
            dataIndex: 'version_number',
            key: 'version',
            render: (text) => (
              <Tag color="blue">
                {text.startsWith('v') ? text : `v${text}`}
              </Tag>
            ),
          },
          {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created',
            render: (date) => new Date(date).toLocaleDateString(),
          },
          {
            title: 'Size',
            dataIndex: 'file_size',
            key: 'size',
            render: (size) => `${(size / (1024 * 1024)).toFixed(2)} MB`,
          },
          {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Tooltip title="Update Version">
                  <Upload
                    showUploadList={false}
                    beforeUpload={(file) => {
                      Modal.confirm({
                        title: 'Update Version',
                        content: `Are you sure you want to update version ${record.version_number} with a new file?`,
                        onOk: () => handleFileUpdate(file, record.id),
                      });
                      return false;
                    }}
                  >
                    <Button
                      icon={<EditOutlined />}
                      type="text"
                    />
                  </Upload>
                </Tooltip>
                <Tooltip title="Delete Version">
                  <Button
                    icon={<DeleteOutlined />}
                    type="text"
                    danger
                    onClick={() => {
                      Modal.confirm({
                        title: 'Delete Version',
                        content: 'Are you sure you want to delete this version? This action cannot be undone.',
                        okText: 'Delete',
                        okType: 'danger',
                        onOk: () => handleVersionDelete(record.id),
                      });
                    }}
                  />
                </Tooltip>
              </Space>
            ),
          },
        ]}
        pagination={false}
        className="version-table"
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

// Update MetricsCards to accept props
const MetricsCards = ({ documents, folders, documentTypes }) => {
  return (
    <div className="grid grid-cols-7 gap-4 mb-4">
      <div className="bg-sky-500/10 hover:bg-sky-500/20 rounded-lg p-2.5 transition-all">
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-blue-500" />
          <div>
            <div className="text-2xl font-semibold">{documents?.length || 0}</div>
            <div className="text-sm text-gray-600">Total Documents</div>
          </div>
        </div>
      </div>
      
      <div className="bg-sky-500/10 hover:bg-sky-500/20 rounded-lg p-2.5 transition-all">
        <div className="flex items-center gap-2">
          <CloudDownloadOutlined className="text-green-500" />
          <div>
            <div className="text-2xl font-semibold">0</div>
            <div className="text-sm text-gray-600">Downloads</div>
          </div>
        </div>
      </div>

      <div className="bg-sky-500/10 hover:bg-sky-500/20 rounded-lg p-2.5 transition-all">
        <div className="flex items-center gap-2">
          <DatabaseOutlined className="text-purple-500" />
          <div>
            <div className="text-2xl font-semibold">0.0MB</div>
            <div className="text-sm text-gray-600">Storage Used</div>
          </div>
        </div>
      </div>

      <div className="bg-sky-500/10 hover:bg-sky-500/20 rounded-lg p-2.5 transition-all">
        <div className="flex items-center gap-2">
          <HistoryOutlined className="text-cyan-500" />
          <div>
            <div className="text-2xl font-semibold">2</div>
            <div className="text-sm text-gray-600">Total Versions</div>
          </div>
        </div>
      </div>

      <div className="bg-sky-500/10 hover:bg-sky-500/20 rounded-lg p-2.5 transition-all">
        <div className="flex items-center gap-2">
          <FolderOutlined className="text-amber-500" />
          <div>
            <div className="text-2xl font-semibold">{folders?.length || 0}</div>
            <div className="text-sm text-gray-600">Active Folders</div>
          </div>
        </div>
      </div>

      <div className="bg-sky-500/10 hover:bg-sky-500/20 rounded-lg p-2.5 transition-all">
        <div className="flex items-center gap-2">
          <ClockCircleOutlined className="text-indigo-500" />
          <div>
            <div className="text-2xl font-semibold">2</div>
            <div className="text-sm text-gray-600">Recent Activity</div>
          </div>
        </div>
      </div>

      <div className="bg-sky-500/10 hover:bg-sky-500/20 rounded-lg p-2.5 transition-all">
        <div className="flex items-center gap-2">
          <FileOutlined className="text-rose-500" />
          <div>
            <div className="text-2xl font-semibold">{documentTypes?.length || 0}</div>
            <div className="text-sm text-gray-600">Doc Types</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentManagement = () => {
  // Define columns at the top of the component
  const tableColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <FileOutlined />
          <span>{text}</span>
          <span className="text-gray-400 text-sm">
            {record.latest_version?.file_size ? 
              `(${(record.latest_version.file_size / (1024 * 1024)).toFixed(2)} MB)` : ''}
          </span>
        </Space>
      ),
    },
    {
      title: 'Version',
      dataIndex: 'versions',
      render: (_, record) => {
        const versions = record.versions || [];
        return (
          <Space wrap>
            {versions.length > 0 ? (
              versions.map(version => (
                <Tag 
                  key={version.id}
                  color="blue"
                  style={{ 
                    padding: '4px 8px',
                    cursor: 'pointer',
                    marginBottom: '4px'
                  }}
                  onClick={() => handleVersionClick(record, version)}
                >
                  v{version.version_number}
                </Tag>
              ))
            ) : (
              <Tag>v1.0</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Modified',
      dataIndex: 'created_at',
      key: 'modified',
      render: (date, record) => (
        <Space direction="vertical" size={0}>
          <span>{new Date(date).toLocaleDateString()}</span>
          <span className="text-gray-400 text-sm">
            by {record.created_by_id}
          </span>
        </Space>
      ),
    },
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="Download">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item 
                  key="versions" 
                  icon={<HistoryOutlined />}
                  onClick={() => {
                    if (record) {
                      setSelectedVersionDoc(record);
                      setVersionModalVisible(true);
                    }
                  }}
                >
                  Versions
                </Menu.Item>
              </Menu>
            }
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

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
    deleteDocumentType, // Add this
    isLoading, 
    partNumbers, 
    fetchPartNumbers, 
    uploadDocument,
    documents,
    fetchFolderDocuments,
    searchDocuments,
    searchByPartNumber,
    downloadDocument,
    fetchDocumentVersions,
    deleteDocumentVersion, // Add this
    folders,
    columns,
    filteredDocuments,
    deleteFolder,
    fetchFolders,
    createFolder,
    updateFolder,
    copyDocument,
    metrics,
    isLoadingMetrics,
    metricsError,
    fetchMetrics,
    refreshMetrics,
    totalDocuments,
    getPreviewUrl,
    searchByProductionOrder,
    allOrders,
    fetchAllOrders,
    uploadMachineDocument,
    fetchMachines, // Add this
    machines, // Add this
    isLoadingMachines // Add this
  } = useDocumentStore();
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    folder: null
  });
  const [isNewFolderModalVisible, setIsNewFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [clipboardItem, setClipboardItem] = useState(null);
  const { isLoading: folderLoading } = useDocumentStore();

  // Add new state for upload
  const [uploadForm] = Form.useForm();
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchType, setSearchType] = useState('text'); // 'text' or 'partNumber' or 'productionOrder'
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
  const [selectedDownloadDoc, setSelectedDownloadDoc] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);

  // Add new state for preview version selection
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewVersions, setPreviewVersions] = useState([]);
  const [selectedPreviewVersion, setSelectedPreviewVersion] = useState(null);

  // Add new state for view mode
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedFolderPath, setSelectedFolderPath] = useState([]);

  // Add new state for selected part number details
  const [selectedPartNumber, setSelectedPartNumber] = useState(null);
  const [selectedProductionOrder, setSelectedProductionOrder] = useState(null);
  const [filteredProductionOrders, setFilteredProductionOrders] = useState([]);

  // Add this state to track the current folder context
  const [currentFolderContext, setCurrentFolderContext] = useState({
    folderId: null,
    folderPath: [],
    folderName: null
  });

  // Add states for folder operations
  const [cutFolder, setCutFolder] = useState(null);
  const [isRenameFolderModalVisible, setIsRenameFolderModalVisible] = useState(false);
  const [renameFolderData, setRenameFolderData] = useState({ id: null, name: '' });

  // Add this state for search input
  const [searchInput, setSearchInput] = useState('');

  // Update state to handle multiple selections
  const [selectedVersions, setSelectedVersions] = useState([]);

  // Add new state for machine document upload
  const [isMachineUploadVisible, setIsMachineUploadVisible] = useState(false);
  const [machineUploadForm] = Form.useForm();
  const [uploadLoading, setUploadLoading] = useState(false);

  // Update useEffect to use store's fetchAllOrders
  useEffect(() => {
    fetchAllOrders();
  }, []);

  // Add useEffect to fetch machines
  useEffect(() => {
    fetchMachines();
  }, []);

  // Update the handleCreateDocType function
  const handleCreateDocType = async () => {
    try {
      // Format the data properly before sending
      const docTypeData = {
        name: newDocType.type_name,
        description: newDocType.description || '',
        allowed_extensions: newDocType.extensions.split(',').map(ext => ext.trim()),
        is_active: newDocType.is_active
      };

      const result = await createDocType(docTypeData);
      
      if (result) {
        message.success('Document type created successfully');
        setIsCreateDocTypeModalVisible(false);
        // Reset form
        setNewDocType({
          type_name: '',
          description: '',
          extensions: '',
          is_active: true
        });
        // Refresh document types list
        await fetchDocTypes();
      }
    } catch (error) {
      console.error('Create document type error:', error);
      message.error('Failed to create document type');
    }
  };

  // Add handler for document type deletion
  const handleDeleteDocType = (docType) => {
    Modal.confirm({
      title: 'Delete Document Type',
      content: (
        <div>
          <p>Are you sure you want to delete document type "{docType.name}"?</p>
          <p className="text-red-500 text-sm mt-2">
            Note: Document types used by active documents cannot be deleted without force.
          </p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteDocumentType(docType.id, false);
          message.success(`Document type "${docType.name}" deleted successfully`);
          await fetchDocTypes(); // Refresh the document types list
        } catch (error) {
          if (error.message.includes('used by') && error.message.includes('active documents')) {
            Modal.confirm({
              title: 'Force Delete',
              content: (
                <div>
                  <p>{error.message}</p>
                  <p className="text-red-500 font-medium">
                    Do you want to force delete this document type?
                  </p>
                  <p>This may lead to issues with documents using this type.</p>
                </div>
              ),
              okText: 'Force Delete',
              okType: 'danger',
              cancelText: 'Cancel',
              onOk: async () => {
                try {
                  await deleteDocumentType(docType.id, true);
                  message.success(`Document type "${docType.name}" force deleted successfully`);
                  await fetchDocTypes(); // Refresh the document types list
                } catch (innerError) {
                  message.error(`Failed to force delete: ${innerError.message}`);
                }
              }
            });
          } else {
            message.error(`Failed to delete document type: ${error.message}`);
          }
        }
      }
    });
  };

  // Add back the context menu handler
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu.visible]);

  // Add back the onExpand function
  const onExpand = async (expandedKeys, { expanded, node }) => {
    setExpandedKeys(expandedKeys);
    if (expanded) {
      try {
        await fetchFolders(node.key);
      } catch (error) {
        message.error('Failed to load subfolders');
      }
    }
  };

  useEffect(() => {
    if (selectedDocument?.name?.toLowerCase().endsWith('.pdf')) {
      const loadPdf = async () => {
        try {
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
        } catch (error) {
          console.error('Error loading PDF:', error);
          message.error('Failed to load PDF preview');
        }
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

  // Update the click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      const folderTree = document.querySelector('.folder-tree-container');
      const uploadBtn = document.querySelector('[data-testid="upload-button"]');
      const newFolderBtn = document.querySelector('[data-testid="new-folder-button"]');
      
      // Check if click is outside folder tree and not on buttons
      if (folderTree && 
          !folderTree.contains(event.target) && 
          !uploadBtn?.contains(event.target) && 
          !newFolderBtn?.contains(event.target)) {
        // Only reset folder context for general clicks, not for upload/new folder
        if (!isUploadModalVisible && !isNewFolderModalVisible) {
          setSelectedFolder(null);
          setCurrentFolderContext({
            folderId: null,
            folderPath: [],
            folderName: 'Root'
          });
          fetchFolderDocuments(null); // Fetch root level documents
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUploadModalVisible, isNewFolderModalVisible]);

  // Update the New Folder button click handler
  const handleNewFolderClick = () => {
    setIsNewFolderModalVisible(true);
    // Current folder context is already maintained from selection
  };

  // Update the folder selection handler
  const handleFolderSelect = async (selectedKeys, info) => {
    if (!selectedKeys.length) {
      // Handle deselection
      setSelectedFolder(null);
      setCurrentFolderContext({
        folderId: null,
        folderPath: [],
        folderName: 'Root'
      });
      await fetchFolderDocuments(null);
      return;
    }

    const folderId = selectedKeys[0];
    setSelectedFolder(folderId);

    // Build folder path
    let currentNode = info?.node;
    const path = [];
    while (currentNode) {
      path.unshift({
        key: currentNode.key,
        title: currentNode.title,
        id: currentNode.key
      });
      currentNode = folders.find(f => f.id === currentNode.parent_folder_id);
    }

    setCurrentFolderContext({
      folderId: folderId,
      folderPath: path,
      folderName: info.node.title
    });

    await fetchFolderDocuments(folderId);
  };

  // Update the folder tree rendering
  const renderFolderTree = (folders) => {
    return folders.map(folder => ({
      key: folder.id.toString(),
      title: folder.folder_name,
      icon: <FolderOutlined />,
      children: folder.children && folder.children.length > 0 
        ? renderFolderTree(folder.children) 
        : undefined,
      isLeaf: false,
      parent_folder_id: folder.parent_folder_id
    }));
  };

  // Add this function before the renderLeftSidebar function
  const handleRightClick = ({ event, node }) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      folder: {
        id: node.key,
        folder_name: node.title
      }
    });
  };

  // Update the renderLeftSidebar function to include the right-click menu
  const renderLeftSidebar = () => (
    <div className="folder-tree-container" style={{ 
      width: '300px',
      height: 'calc(100vh - 120px)',
      padding: '20px',
      borderRight: '1px solid #e8e8e8',
      backgroundColor: '#fff',
      overflowY: 'auto',
      marginRight: '24px'
    }}>
      <div className="folder-header mb-4">
        {/* <div className="flex items-center justify-between mb-3">
          <Text strong>Folders</Text>
        </div> */}
        <div className="flex items-center space-x-2 mb-4">
        <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={handleUploadClick}
            >
              Upload
            </Button>
            <Button
              icon={<FolderOutlined />}
              onClick={handleNewFolderClick}
            >
              New Folder
            </Button>
        </div>
        {/* Show current path */}
        {/* {selectedFolder && (
          <div className="text-sm text-gray-500 mb-2">
            Current Path: {getCurrentPath()}
          </div>
        )} */}
      </div>
      <Tree
        showIcon
        defaultExpandAll={false}
        expandedKeys={expandedKeys}
        onExpand={onExpand}
        onSelect={handleFolderSelect}
        onRightClick={handleRightClick}  // Keep the right-click handler
        treeData={renderFolderTree(folders)}
        className="custom-tree"
        selectedKeys={[selectedFolder]}
        icon={({ expanded }) => (
          <FolderOutlined 
            style={{ 
              color: expanded ? '#1890ff' : '#8c8c8c',
              fontSize: '16px'
            }}
          />
        )}
      />
    </div>
  );

  // Update breadcrumb to show correct path
  const renderBreadcrumb = () => (
    <Breadcrumb className="mb-4">
      <Breadcrumb.Item onClick={() => handleFolderSelect(['all'])}>
        <HomeOutlined /> Home
      </Breadcrumb.Item>
      {currentFolderContext.folderPath.map((item) => (
        <Breadcrumb.Item key={item.key}>
          <span className="cursor-pointer" onClick={() => handleFolderSelect([item.key])}>
            {item.title}
          </span>
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );

  // Update the create folder handler to handle root/child folder creation
  const handleCreateFolder = async () => {
    try {
      if (!newFolderName.trim()) {
        message.error('Please enter a folder name');
        return;
      }

      const folderData = {
        name: newFolderName.trim(), // Ensure this is set
        parent_folder_id: currentFolderContext.folderId || null
      };

      await createFolder(folderData);
      setIsNewFolderModalVisible(false);
      setNewFolderName('');
      message.success('Folder created successfully');
      
      // Refresh folders based on context
      if (currentFolderContext.folderId) {
        await fetchFolders(currentFolderContext.folderId);
      } else {
        await fetchFolders();
      }
    } catch (error) {
      message.error('Failed to create folder: ' + error.message);
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
              setSelectedFolderPath([]);
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

  // Make sure the context menu rendering is still in place
  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;

    return ReactDOM.createPortal(
      <div
        style={{
          position: 'fixed',
          top: contextMenu.y,
          left: contextMenu.x,
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          borderRadius: '4px',
          zIndex: 1000
        }}
      >
        <Menu>
          {/* <Menu.Item 
            key="rename" 
            icon={<EditOutlined />}
            onClick={() => {
              setRenameFolderData({
                id: contextMenu.folder.id,
                name: contextMenu.folder.folder_name
              });
              setIsRenameFolderModalVisible(true);
              setContextMenu({ visible: false });
            }}
          >
            Rename
          </Menu.Item> */}
          {/* <Menu.Item 
            key="cut" 
            icon={<ScissorOutlined />}
            onClick={() => {
              setClipboardItem({
                ...contextMenu.folder,
                action: 'cut'
              });
              setContextMenu({ visible: false });
            }}
          >
            Cut
          </Menu.Item> */}
          {/* {clipboardItem && (
            <Menu.Item 
              key="paste" 
              icon={<SnippetsOutlined />}
              onClick={() => {
                handlePasteFolder(contextMenu.folder);
                setContextMenu({ visible: false });
              }}
            >
              Paste
          </Menu.Item>
          )} */}
          <Menu.Item 
            key="delete" 
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              handleFolderDelete(contextMenu.folder);
              setContextMenu({ visible: false });
            }}
          >
            Delete
          </Menu.Item>
        </Menu>
      </div>,
      document.body
    );
  };

  // Update the Upload button click handler
  const handleUploadClick = () => {
    if (!selectedFolder) {
      message.warning('Please select a folder first');
      return;
    }
    
    setIsUploadModalVisible(true);
  };

  // Update the handleUpload function to correctly handle part number
  const handleUpload = async (values) => {
    try {
      if (!currentFolderContext.folderId) {
        message.error('Please select a folder first');
        return;
      }

      if (!selectedFile) {
        message.error('Please select a file to upload');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folder_id', currentFolderContext.folderId.toString());
      formData.append('doc_type_id', values.doc_type_id.toString());
      formData.append('name', values.document_name);
      formData.append('document_name', values.document_name);
      formData.append('description', values.description || '');
      formData.append('version_number', 'v1');
      formData.append('metadata', JSON.stringify({
        uploadedBy: 'user',
        uploadDate: new Date().toISOString(),
        fileName: selectedFile.name
      }));
      
      // Update part number handling
      if (values.part_number) {
        formData.append('part_number', values.part_number);
      }
      
      if (values.production_order_id) {
        formData.append('production_order_id', values.production_order_id.toString());
      }

      // Log the FormData contents for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      await uploadDocument(formData);
      message.success('Document uploaded successfully');
      setIsUploadModalVisible(false);
      uploadForm.resetFields();
      setSelectedFile(null);
      setSelectedPartNumber(null);
      
      if (currentFolderContext.folderId) {
        await fetchFolderDocuments(currentFolderContext.folderId);
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Failed to upload document: ' + (error.message || 'Unknown error'));
    }
  };

  // Update the Upload component in the modal
  const renderUploadModal = () => (
    <Modal
      title="Upload Document"
      visible={isUploadModalVisible}
      onCancel={() => {
        setIsUploadModalVisible(false);
        uploadForm.resetFields();
        setSelectedFile(null);
        setSelectedPartNumber(null);
      }}
      footer={null}
    >
      <Form
        form={uploadForm}
        layout="vertical"
        onFinish={handleUpload}
        initialValues={{
          version_number: 'v1'
        }}
      >
        <Form.Item label="Selected Folder">
          <Input
            value={currentFolderContext.folderName}
            disabled
            prefix={<FolderOutlined />}
          />
        </Form.Item>

        <Form.Item
          name="file"
          label="Select File"
          rules={[{ required: true, message: 'Please select a file' }]}
        >
          <Upload.Dragger
            beforeUpload={(file) => {
              setSelectedFile(file);
              uploadForm.setFieldsValue({
                name: file.name,
                document_name: file.name
              });
              return false;
            }}
            maxCount={1}
            onRemove={() => {
              setSelectedFile(null);
              uploadForm.setFieldsValue({
                name: '',
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
          </Upload.Dragger>
        </Form.Item>

        <Form.Item
          name="document_name"
          label="Document Name"
          rules={[{ required: true, message: 'Please enter document name' }]}
        >
          <Input onChange={(e) => {
            uploadForm.setFieldsValue({ name: e.target.value });
          }} />
        </Form.Item>

        <Form.Item
          name="doc_type_id"
          label="Document Type"
          rules={[{ required: true, message: 'Please select document type' }]}
        >
          <Select>
            {documentTypes.map(type => (
              <Select.Option key={type.id} value={type.id}>
                {type.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea />
        </Form.Item>

        <Form.Item
          name="part_number"
          label="Part Number"
        >
          <Select
            showSearch
            placeholder="Select part number"
            optionFilterProp="children"
            allowClear
            onChange={(value) => {
              setSelectedPartNumber(value);
              if (value) {
                const filteredOrders = allOrders.filter(order => order.part_number === value);
                setFilteredProductionOrders(filteredOrders);
              } else {
                setFilteredProductionOrders([]);
              }
              uploadForm.setFieldsValue({ production_order_id: undefined });
            }}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {allOrders.map(order => (
              <Select.Option key={order.part_number} value={order.part_number}>
                {order.part_number} - {order.part_description}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {selectedPartNumber && (
          <Form.Item
            name="production_order_id"
            label="Production Order"
          >
            <Select
              showSearch
              placeholder="Select production order"
              optionFilterProp="children"
              allowClear
              onChange={(value) => setSelectedProductionOrder(value)}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {filteredProductionOrders.map(order => (
                <Select.Option key={order.id} value={order.id}>
                  {order.production_order} - {order.sale_order}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Upload Document
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );

  // Update the handleSearch function
  const handleSearch = async (value) => {
    if (!value || value.length < 2) {
      // If search is cleared, show current folder documents
      if (selectedFolder) {
        await fetchFolderDocuments(selectedFolder);
      }
      return;
    }

    if (searchType === 'partNumber') {
      // Call the part number search function
      await searchByPartNumber(
        value,
        selectedDocType?.id || null
      );
    } else {
      // Call the text search function
      await searchDocuments(
        value,
        selectedDocType?.id || null,
        currentFolderContext.folderId
      );
    }
  };

  // Update the search input in renderSearchSection
  const renderSearchSection = () => (
    <Row gutter={[16, 16]} align="middle" style={{ marginBottom: '16px' }}>
      <Col flex="auto">
        <Input.Group compact>
          <Select
            defaultValue="text"
            style={{ width: '130px' }}
            onChange={(value) => {
              setSearchType(value);
              setSearchInput('');
              if (selectedFolder) {
                fetchFolderDocuments(selectedFolder);
              }
            }}
          >
            <Select.Option value="text">Search Text</Select.Option>
            <Select.Option value="partNumber">Part Number</Select.Option>
            <Select.Option value="productionOrder">Production Order</Select.Option>
          </Select>
          {searchType === 'text' ? (
            // Text search with real-time updates
            <Search
              placeholder="Search documents (min. 3 characters)..."
              allowClear
              enterButton
              value={searchInput}
              style={{ width: 'calc(100% - 130px)' }}
              onChange={(e) => {
                const value = e.target.value;
                setSearchInput(value);
                if (value.length >= 3 || value.length === 0) {
                  searchDocuments(
                    value,
                    selectedDocType?.id || null,
                    currentFolderContext.folderId
                  );
                }
              }}
              onSearch={(value) => {
                if (value && value.length >= 3) {
                  searchDocuments(
                  value,
                  selectedDocType?.id || null,
                  currentFolderContext.folderId
                );
                }
              }}
            />
          ) : searchType === 'partNumber' ? (
              // Part number search
              <Search
                placeholder="Enter or select part number"
                allowClear
                enterButton
                value={searchInput}
                style={{ width: 'calc(100% - 130px)' }}
                onChange={(e) => setSearchInput(e.target.value)}
                onSearch={(value) => {
                  if (value && value.length >= 2) {
                    searchByPartNumber(value, selectedDocType?.id || null);
                  }
                }}
                addonBefore={
                  <Select
                    showSearch
                    value={searchInput || undefined}
                    placeholder="Select from list"
                    style={{ width: 200 }}
                    onChange={(value) => {
                      setSearchInput(value);
                      searchByPartNumber(value, selectedDocType?.id || null);
                    }}
                    filterOption={(input, option) =>
                      option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {partNumbers.map(part => (
                      <Select.Option key={part.id} value={part.part_number}>
                        {part.part_number} - {part.part_description}
                      </Select.Option>
                    ))}
                  </Select>
                }
              />
            ) : (
              // Production order search
              <Search
                placeholder="Enter or select production order"
                allowClear
                enterButton
                value={searchInput}
                style={{ width: 'calc(100% - 130px)' }}
                onChange={(e) => setSearchInput(e.target.value)}
                onSearch={(value) => {
                  if (value) {
                    const order = allOrders.find(o => o.production_order === value);
                    if (order) {
                      searchByProductionOrder(order.id, selectedDocType?.id || null);
                    }
                  }
                }}
                addonBefore={
                  <Select
                    showSearch
                    value={searchInput || undefined}
                    placeholder="Select from list"
                    style={{ width: 200 }}
                    onChange={(value) => {
                      const order = allOrders.find(o => o.production_order === value);
                      setSearchInput(value);
                      if (order) {
                        searchByProductionOrder(order.id, selectedDocType?.id || null);
                      }
                    }}
                    filterOption={(input, option) =>
                      option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    dropdownRender={menu => (
                      <>
                        <div style={{ padding: '8px', color: '#666' }}>
                          <InfoCircleOutlined /> Select from list or type and search
                        </div>
                        {menu}
                      </>
                    )}
                  >
                    {allOrders.map(order => (
                      <Select.Option key={order.id} value={order.production_order}>
                        {order.production_order} - {order.part_description}
                      </Select.Option>
                    ))}
                  </Select>
                }
              />
            )}
        </Input.Group>
      </Col>
      <Col>
        <Space>
          <Button
            type="primary"
            icon={<UploadIcon size={16} />}
            onClick={() => setIsMachineUploadVisible(true)}
          >
            Upload Machine Document
          </Button>
          <Radio.Group 
            value={viewMode} 
            onChange={e => setViewMode(e.target.value)}
            buttonStyle="solid"
          >
            {/* <Tooltip title="Table View">
              <Radio.Button value="table"><BarsOutlined /></Radio.Button>
            </Tooltip>
            <Tooltip title="Grid View">
              <Radio.Button value="grid"><AppstoreOutlined /></Radio.Button>
            </Tooltip> */}
          </Radio.Group>
          {documentTypeButton}
        </Space>
      </Col>
    </Row>
  );

  // Update the handleDownload function
  const handleDownload = async (record) => {
    try {
      const result = await downloadDocument(record.id);
      if (result.success && result.versions) {
        setDownloadVersions(result.versions);
        setSelectedDownloadDoc(record);
        setDownloadModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to fetch document versions');
    }
  };

  // Update the preview handler
  const handlePreview = async (record) => {
    try {
      const versions = await fetchDocumentVersions(record.id);
      
      if (versions.length > 1) {
        setSelectedDocument(record);
        setPreviewVersions(versions);
        setPreviewModalVisible(true);
      } else {
        try {
          const url = await getPreviewUrl(record.id);
          
          if (record.name?.toLowerCase().endsWith('.pdf')) {
            setSelectedDocument({
              ...record,
              versionUrl: url,
              version_number: versions[0].version_number,
              selectedVersionId: versions[0].id
            });
            setIsPreviewModalVisible(true);
            
            // Load PDF preview
            const loadingTask = pdfjsLib.getDocument(url);
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
          } else {
            Modal.confirm({
              title: 'File Preview Not Available',
              content: `This file type cannot be previewed. Would you like to download "${record.name}" instead?`,
              okText: 'Download',
              cancelText: 'Cancel',
              onOk: () => handleDownload(record)
            });
          }
        } catch (error) {
          message.error('Failed to load preview');
          console.error('Preview error:', error);
        }
      }
    } catch (error) {
      message.error('Failed to load document versions');
      console.error('Version fetch error:', error);
    }
  };

  // Add PDF preview modal component
  const renderPdfPreviewModal = () => (
    <Modal
      title={`Preview - ${selectedDocument?.name} (${selectedDocument?.version_number})`}
      visible={isPreviewModalVisible}
      onCancel={handlePreviewModalClose}
      width="60%"
      footer={[
        <Button key="close" onClick={handlePreviewModalClose}>
          Close
        </Button>,
        <Button
          key="download"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => downloadDocument(selectedDocument.id, selectedDocument.selectedVersionId)}
        >
          Download
        </Button>
      ]}
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {pdfPages.map((pageUrl, index) => (
          <div key={index} style={{ marginBottom: '20px' }}>
            <img 
              src={pageUrl} 
              alt={`Page ${index + 1}`} 
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        ))}
      </div>
    </Modal>
  );

  // Update the version preview modal
  const renderPreviewVersionModal = () => (
    <Modal
      title={`Select Version to Preview - ${selectedDocument?.name || ''}`}
      visible={previewModalVisible}
      onCancel={() => {
        setPreviewModalVisible(false);
        setSelectedPreviewVersion(null);
      }}
      footer={[
        <Button key="cancel" onClick={() => {
          setPreviewModalVisible(false);
          setSelectedPreviewVersion(null);
        }}>
          Cancel
        </Button>,
        <Button
          key="preview"
          type="primary"
          disabled={!selectedPreviewVersion}
          onClick={async () => {
            try {
              const url = await getPreviewUrl(selectedDocument.id, selectedPreviewVersion.id);
              
              if (selectedDocument.name?.toLowerCase().endsWith('.pdf')) {
                setSelectedDocument({
                  ...selectedDocument,
                  versionUrl: url,
                  version_number: selectedPreviewVersion.version_number,
                  selectedVersionId: selectedPreviewVersion.id
                });
                setPreviewModalVisible(false);
                setIsPreviewModalVisible(true);
                
                // Load PDF preview
                const loadingTask = pdfjsLib.getDocument(url);
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
              } else {
                Modal.confirm({
                  title: 'File Preview Not Available',
                  content: `This file type cannot be previewed. Would you like to download "${selectedDocument.name}" (${selectedPreviewVersion.version_number}) instead?`,
                  okText: 'Download',
                  cancelText: 'Cancel',
                  onOk: () => handleDownload(selectedDocument)
                });
              }
            } catch (error) {
              message.error('Failed to load preview');
              console.error('Preview error:', error);
            }
          }}
        >
          Preview
        </Button>
      ]}
    >
      <List
        dataSource={previewVersions}
        renderItem={version => (
          <List.Item
            className={`cursor-pointer p-3 rounded-lg ${
              selectedPreviewVersion?.id === version.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => setSelectedPreviewVersion(version)}
          >
            <Radio checked={selectedPreviewVersion?.id === version.id}>
              <Space direction="vertical" size={1}>
                <Text strong>Version {version.version_number}</Text>
                <Text type="secondary" className="text-sm">
                  Created: {new Date(version.created_at).toLocaleDateString()}
                  <br />
                  Size: {(version.file_size / (1024 * 1024)).toFixed(2)} MB
                </Text>
              </Space>
            </Radio>
          </List.Item>
        )}
      />
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
  const handleVersionModalClose = async () => {
    setVersionModalVisible(false);
    setSelectedVersionDoc(null);
    // Refresh the document list to show updated version numbers
    if (selectedFolder && selectedFolder !== 'all') {
      await fetchFolderDocuments(selectedFolder);
    } else {
      await fetchFolderDocuments();
    }
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
              dataIndex: 'name',
              key: 'name',
              sorter: (a, b) => a.name.localeCompare(b.name)
            },
            {
              title: 'Description',
              dataIndex: 'description',
              key: 'description',
              ellipsis: true
            },
            {
              title: 'Extensions',
              dataIndex: 'allowed_extensions',
              key: 'allowed_extensions',
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
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Tooltip title="Delete Document Type">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteDocType(record)}
                    />
                  </Tooltip>
                </Space>
              ),
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

  // Update the renderNewFolderModal function
  const renderNewFolderModal = () => (
    <Modal
      title="Create New Folder"
      visible={isNewFolderModalVisible}
      onOk={handleCreateFolder}
      onCancel={() => {
        setIsNewFolderModalVisible(false);
        setNewFolderName('');
      }}
      okText="Create"
      cancelText="Cancel"
    >
      <Form layout="vertical">
        <Form.Item
          label={<span>Folder Name <span style={{ color: '#ff4d4f' }}>*</span></span>}
          required
          validateStatus={!newFolderName.trim() && 'error'}
          help={!newFolderName.trim() && 'Please enter a folder name'}
        >
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Enter folder name"
            maxLength={50}
          />
        </Form.Item>

        <Form.Item label="Parent Folder">
          <Input 
            value={currentFolderContext.folderName || 'Root'}
            disabled
          />
          {currentFolderContext.folderPath.length > 0 && (
            <div className="text-sm text-gray-500 mt-1">
              Path: {currentFolderContext.folderPath.map(f => f.title).join(' / ')}
            </div>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );

  // Update the download version modal
  const renderDownloadVersionModal = () => (
    <Modal
      title="Select Versions to Download"
      visible={downloadModalVisible}
      onCancel={() => {
        setDownloadModalVisible(false);
        setSelectedVersions([]);
      }}
      footer={[
        <Button key="cancel" onClick={() => setDownloadModalVisible(false)}>
          Cancel
        </Button>,
        <Button
          key="download"
          type="primary"
          disabled={selectedVersions.length === 0}
          onClick={async () => {
            try {
              // Download all selected versions
              for (const version of selectedVersions) {
                await downloadDocument(selectedDownloadDoc.id, version.id);
              }
              setDownloadModalVisible(false);
              setSelectedVersions([]);
              message.success(`Successfully downloaded ${selectedVersions.length} version(s)`);
            } catch (error) {
              message.error('Failed to download selected versions');
            }
          }}
        >
          Download Selected ({selectedVersions.length})
        </Button>
      ]}
    >
      <List
        dataSource={downloadVersions}
        renderItem={version => (
          <List.Item
            className={`cursor-pointer p-3 rounded-lg ${
              selectedVersions.find(v => v.id === version.id) ? 'bg-blue-50' : ''
            }`}
            onClick={() => {
              setSelectedVersions(prev => {
                const exists = prev.find(v => v.id === version.id);
                if (exists) {
                  return prev.filter(v => v.id !== version.id);
                }
                return [...prev, version];
              });
            }}
          >
            <Checkbox
              checked={selectedVersions.some(v => v.id === version.id)}
            >
              <Space direction="vertical" size={1}>
                <Text strong>Version {version.version_number}</Text>
                <Text type="secondary" className="text-sm">
                  Created: {new Date(version.created_at).toLocaleDateString()}
                  <br />
                  Size: {version.file_size}
                </Text>
              </Space>
            </Checkbox>
          </List.Item>
        )}
      />
    </Modal>
  );

  // Update the renderDocumentTable function
  const renderDocumentTable = () => (
    <div className="bg-white rounded-lg shadow">
      <Table
        columns={tableColumns}
        dataSource={documents}
        rowKey="id"
        loading={isLoading}
        pagination={{
          total: totalDocuments,
          pageSize: 5,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
          onChange: (page, pageSize) => {
            if (selectedFolder && selectedFolder !== 'all') {
              fetchFolderDocuments(selectedFolder, page, pageSize);
            }
          }
        }}
        className="custom-table"
      />
    </div>
  );

  // Add rename handler
  const handleRenameFolder = (folder) => {
    setRenameFolderData({ id: folder.id, name: folder.folder_name });
    setIsRenameFolderModalVisible(true);
  };

  // Add rename modal
  const renderRenameFolderModal = () => (
    <Modal
      title="Rename Folder"
      visible={isRenameFolderModalVisible}
      onOk={handleRenameFolderSubmit}
      onCancel={() => setIsRenameFolderModalVisible(false)}
    >
      <Form layout="vertical">
        <Form.Item
          label="New Folder Name"
          required
          validateStatus={!renameFolderData.name.trim() && 'error'}
          help={!renameFolderData.name.trim() && 'Please enter a folder name'}
        >
          <Input
            value={renameFolderData.name}
            onChange={(e) => setRenameFolderData({ ...renameFolderData, name: e.target.value })}
            maxLength={50}
          />
        </Form.Item>
      </Form>
    </Modal>
  );

  // Add this function to get the current path
  const getCurrentPath = () => {
    if (!selectedFolder) return '';
    
    const findPath = (folders, targetId, path = []) => {
      for (const folder of folders) {
        if (folder.id === targetId) {
          return [...path, folder.folder_name];
        }
        if (folder.children) {
          const foundPath = findPath(folder.children, targetId, [...path, folder.folder_name]);
          if (foundPath) return foundPath;
        }
      }
      return null;
    };

    const path = findPath(folders, selectedFolder);
    return path ? path.join(' / ') : '';
  };

  // Add this effect to filter production orders when part number changes
  useEffect(() => {
    if (selectedPartNumber) {
      const filteredOrders = allOrders.filter(order => order.part_number === selectedPartNumber);
      setFilteredProductionOrders(filteredOrders);
    } else {
      setFilteredProductionOrders([]);
    }
    // Reset production order when part number changes
    setSelectedProductionOrder(null);
  }, [selectedPartNumber, allOrders]);

  // Add these styles to your existing styles
  const styles = `
    .custom-tree {
      background: #fff;
    }

    .custom-tree .ant-tree-node-content-wrapper {
      padding: 8px 12px;
      border-radius: 4px;
      margin: 2px 0;
      transition: all 0.3s;
    }

    .custom-tree .ant-tree-node-content-wrapper:hover {
      background-color: #f5f5f5;
    }

    .custom-tree .ant-tree-node-selected {
      background-color: #e6f7ff !important;
    }

    .custom-tree .ant-tree-switcher {
      width: 24px;
      height: 32px;
      line-height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .custom-tree .ant-tree-title {
      font-size: 14px;
      color: #262626;
    }

    .folder-tree-container::-webkit-scrollbar {
      width: 0px;
      background: transparent;
    }

    .folder-tree-container {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
  `;

  // Handle machine document upload
  const handleMachineDocumentUpload = async (values) => {
    if (!selectedFile) {
      message.error('Please select a file to upload');
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('machine_id', values.machine_id);
      formData.append('document_name', values.document_name);
      formData.append('document_type', values.document_type);
      formData.append('description', values.description || '');
      formData.append('version_number', values.version_number || '1.0');

      await uploadMachineDocument(formData);
      message.success('Machine document uploaded successfully');
      setIsMachineUploadVisible(false);
      machineUploadForm.resetFields();
      setSelectedFile(null);
      
      // Refresh the current folder's documents if we're in a folder
      if (currentFolderContext.folderId) {
        await fetchFolderDocuments(currentFolderContext.folderId);
      }
    } catch (error) {
      message.error('Failed to upload machine document: ' + error.message);
    } finally {
      setUploadLoading(false);
    }
  };

  // Render machine document upload modal
  const renderMachineUploadModal = () => (
    <Modal
      title="Upload Machine Document"
      open={isMachineUploadVisible}
      onCancel={() => {
        setIsMachineUploadVisible(false);
        machineUploadForm.resetFields();
        setSelectedFile(null);
      }}
      footer={null}
      destroyOnClose
    >
      <Form
        form={machineUploadForm}
        layout="vertical"
        onFinish={handleMachineDocumentUpload}
        initialValues={{ version_number: '1.0' }}
      >
        <Form.Item
          label="File"
          required
          tooltip="Select the document file to upload"
        >
          <Upload
            beforeUpload={(file) => {
              setSelectedFile(file);
              return false;
            }}
            onRemove={() => setSelectedFile(null)}
            maxCount={1}
          >
            <Button icon={<UploadIcon size={16} />}>Select File</Button>
          </Upload>
        </Form.Item>

        <Form.Item
          name="machine_id"
          label="Machine"
          rules={[{ required: true, message: 'Please select a machine' }]}
        >
          <Select
            loading={isLoadingMachines}
            placeholder="Select a machine"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {machines.map(machine => (
              <Select.Option key={machine.id} value={machine.id}>
                {machine.make} - {machine.work_center.description} ({machine.work_center.code})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="document_name"
          label="Document Name"
          rules={[{ required: true, message: 'Please enter the document name' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="document_type"
          label="Document Type"
          rules={[{ required: true, message: 'Please enter the document type' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          name="version_number"
          label="Version Number"
          rules={[{ required: true, message: 'Please enter the version number' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={uploadLoading} block>
            Upload Document
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 mr-3">
              <Lottie
                animationData={documentsAnimation}
                loop={true}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Document Management
              </h1>
              <p className="text-gray-500 text-sm">
                Manage and organize your documents
              </p>
            </div>
          </div>
          {/* <div className="flex gap-2">Cannot delete the only version of a document
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={handleUploadClick}
            >
              Upload
            </Button>
            <Button
              icon={<FolderOutlined />}
              onClick={handleNewFolderClick}
            >
              New Folder
            </Button>
          </div> */}
        </div>
        
        <MetricsCards 
          documents={documents}
          folders={folders}
          documentTypes={documentTypes}
        />
      </div>

      <Card bordered={false} className="shadow-sm" bodyStyle={{ padding: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col flex="220px">
            {renderLeftSidebar()}
          </Col>

          <Col flex="auto">
            <div className="flex flex-col h-[calc(100vh-230px)]">
              {renderBreadcrumb()}
              <div className="mb-3">
                {renderSearchSection()}
              </div>

              {renderDocumentTable()}
            </div>
          </Col>
        </Row>
      </Card>

      {renderContextMenu()}
      {renderNewFolderModal()}

      {renderUploadModal()}

      {renderPdfPreviewModal()}
      {renderPreviewVersionModal()}

      <VersionManagementModal
        visible={versionModalVisible}
        document={selectedVersionDoc}
        onClose={handleVersionModalClose}
      />

      {renderDownloadVersionModal()}

      {documentTypeModals}

      {renderMachineUploadModal()}
    </div>
  );
};

export default DocumentManagement;