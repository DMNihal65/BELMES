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
  Checkbox
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
  SnippetsOutlined
} from '@ant-design/icons';
import useDocumentStore from '../../store/document-store';
import ReactDOM from 'react-dom';

const { Title, Text } = Typography;
const { Search } = Input;

const DocumentManagement = () => {
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [favorites, setFavorites] = useState(['DOC001']);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [documents, setDocuments] = useState([
    {
      id: 'DOC001',
      name: 'Assembly Line SOP Rev 2.3',
      type: 'pdf',
      size: '2.3 MB',
      modified: '2024-01-20',
      modifiedBy: 'Hajira',
      status: 'active',
      category: 'sops',
      version: '2.3',
      lastReviewed: '2024-01-15',
      reviewedBy: 'Quality Team',
      accessLevel: 'Restricted',
      folder: 'assembly-sops'
    },
    {
      id: 'DOC002',
      name: 'Quality Control Checklist',
      type: 'excel',
      size: '1.8 MB',
      modified: '2024-01-18',
      modifiedBy: 'Nihal',
      status: 'under_review',
      category: 'quality',
      version: '1.5',
      lastReviewed: '2024-01-17',
      reviewedBy: 'Process Team',
      accessLevel: 'Public'
    },
    {
      id: 'DOC003',
      name: 'Machine Maintenance Guide',
      type: 'word',
      size: '3.5 MB',
      modified: '2024-01-15',
      modifiedBy: 'Yadushree',
      status: 'archived',
      category: 'maintenance',
      version: '4.0',
      lastReviewed: '2024-01-10',
      reviewedBy: 'Engineering Team',
      accessLevel: 'Confidential'
    }
  ]);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [isDocTypeModalVisible, setIsDocTypeModalVisible] = useState(false);
  const [isCreateDocTypeModalVisible, setIsCreateDocTypeModalVisible] = useState(false);
  const [newDocType, setNewDocType] = useState({
    type_name: '',
    description: '',
    extensions: '',
    is_active: true
  });
  
  const { documentTypes, fetchDocTypes, createDocType, isLoading } = useDocumentStore();
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, folder: null });
  const [isNewFolderModalVisible, setIsNewFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [clipboardItem, setClipboardItem] = useState(null);
  const { folders, fetchFolders, createFolder, isLoading: folderLoading } = useDocumentStore();

  // Fetch document types on component mount
  useEffect(() => {
    fetchDocTypes();
  }, [fetchDocTypes]);

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

  // Convert API folders to Tree nodes - improved version
  const convertFoldersToTree = (folders) => {
    const folderMap = new Map();
    const tree = [];

    // First pass: create all nodes
    folders.forEach(folder => {
      const node = {
        title: folder.folder_name,
        key: folder.id.toString(),
        parentId: folder.parent_folder_id,
        isLeaf: false,
        icon: <FolderOutlined />,
        data: folder,
        children: []
      };
      folderMap.set(folder.id, node);
    });

    // Second pass: build tree structure
    folders.forEach(folder => {
      const node = folderMap.get(folder.id);
      if (!folder.parent_folder_id) {
        // Root level folders
        tree.push(node);
      } else {
        // Child folders
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
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      folder
    });
  };

  const handleCreateFolder = async () => {
    try {
      if (!newFolderName.trim()) {
        message.error('Please enter a folder name');
        return;
      }

      const folderData = {
        folder_name: newFolderName.trim(),
        parent_folder_id: selectedParentId,
        is_active: true
      };

      await createFolder(folderData);
      setIsNewFolderModalVisible(false);
      setNewFolderName('');
      await fetchFolders();
      message.success('Folder created successfully');
    } catch (error) {
      message.error('Failed to create folder');
    }
  };

  // Update the context menu to use Portal for better positioning
  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;

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
        onClick={e => e.stopPropagation()}
      >
        <Menu>
          <Menu.Item key="rename" icon={<EditOutlined />}>
            Rename
          </Menu.Item>
          <Menu.Item 
            key="cut" 
            icon={<ScissorOutlined />}
            onClick={() => {
              setClipboardItem({ ...contextMenu.folder, action: 'cut' });
              setContextMenu({ visible: false });
            }}
          >
            Cut
          </Menu.Item>
          <Menu.Item 
            key="copy" 
            icon={<CopyOutlined />}
            onClick={() => {
              setClipboardItem({ ...contextMenu.folder, action: 'copy' });
              setContextMenu({ visible: false });
            }}
          >
            Copy
          </Menu.Item>
          {clipboardItem && (
            <Menu.Item 
              key="paste" 
              icon={<SnippetsOutlined />}
              onClick={() => {
                // Handle paste operation
                setContextMenu({ visible: false });
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
              Modal.confirm({
                title: 'Delete Folder',
                content: `Are you sure you want to delete "${contextMenu.folder.folder_name}"?`,
                okText: 'Yes',
                okType: 'danger',
                cancelText: 'No',
                onOk() {
                  // Handle delete operation
                  setContextMenu({ visible: false });
                }
              });
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
              selectedParentId ? 
                folders.find(f => f.id.toString() === selectedParentId.toString())?.folder_name 
                : 'Root'
            }
            disabled
          />
        </Form.Item>
      </Form>
    </Modal>
  );

  // Add folder selection check for upload
  const handleUploadClick = () => {
    if (!selectedFolder) {
      Modal.confirm({
        title: 'Select Folder',
        content: 'Please select a folder where you want to upload the document.',
        okText: 'OK',
        cancelText: 'Cancel',
        onOk: () => {
          // User can proceed to select a folder
        }
      });
      return;
    }
    setIsUploadModalVisible(true);
  };

  // Handle file upload
  const handleUpload = (fileList) => {
    if (!selectedFolder || selectedFolder === 'all') {
      message.error('Please select a specific folder first');
      return;
    }

    const newFiles = fileList.map((file) => ({
      id: `DOC${Date.now()}`,
      name: file.name,
      type: file.name.split('.').pop().toLowerCase(),
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      modified: new Date().toISOString().split('T')[0],
      modifiedBy: 'Current User',
      status: 'active',
      category: selectedFolder,
      version: '1.0',
      lastReviewed: new Date().toISOString().split('T')[0],
      reviewedBy: 'System',
      accessLevel: 'Public',
      folder: selectedFolder
    }));

    setDocuments(prev => [...prev, ...newFiles]);
    setIsUploadModalVisible(false);
    message.success(`${fileList.length} file(s) uploaded successfully`);
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
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || doc.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case 'excel':
        return <FileExcelOutlined style={{ color: '#52c41a' }} />;
      case 'word':
        return <FileWordOutlined style={{ color: '#1890ff' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  const handleDownload = (record) => {
    message.success(`Downloading ${record.name}`);
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

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {getFileIcon(record.type)}
          <div>
            <Text strong className="cursor-pointer hover:text-blue-500" 
                  onClick={() => setIsPreviewModalVisible(true)}>
              {text}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.size} • {record.accessLevel}
            </Text>
          </div>
          {favorites.includes(record.id) && (
            <StarFilled style={{ color: '#faad14' }} />
          )}
        </Space>
      ),
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (version, record) => (
        <Space direction="vertical" size={0}>
          <Tag color="blue">v{version}</Tag>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Last reviewed: {record.lastReviewed}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          active: { color: 'success', text: 'ACTIVE' },
          under_review: { color: 'processing', text: 'UNDER REVIEW' },
          archived: { color: 'default', text: 'ARCHIVED' }
        };
        return (
          <Tag color={statusConfig[status].color}>
            {statusConfig[status].text}
          </Tag>
        );
      },
    },
    {
      title: 'Modified',
      dataIndex: 'modified',
      key: 'modified',
      render: (date, record) => (
        <Space direction="vertical" size={0}>
          <Text>{date}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            by {record.modifiedBy}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => setIsPreviewModalVisible(true)}
            />
          </Tooltip>
          <Tooltip title="Download">
            <Button 
              icon={<DownloadOutlined />} 
              size="small"
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Tooltip title="Share">
            <Button 
              icon={<ShareAltOutlined />} 
              size="small"
              onClick={() => handleShare(record)}
            />
          </Tooltip>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item 
                  key="1" 
                  icon={favorites.includes(record.id) ? <StarFilled /> : <StarOutlined />}
                  onClick={() => toggleFavorite(record.id)}
                >
                  {favorites.includes(record.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                  key="2" 
                  icon={<DeleteOutlined />} 
                  danger
                  onClick={() => handleDelete(record)}
                >
                  Delete
                </Menu.Item>
              </Menu>
            }
          >
            <Button size="small">More</Button>
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
  const renderLeftSidebar = () => (
    <Card className="h-full" bodyStyle={{ padding: '12px' }}>
      <div className="mb-4 space-y-4">
        <Button 
          type="primary" 
          icon={<CloudUploadOutlined />}
          block
          onClick={handleUploadClick}
        >
          Upload Document
        </Button>
        <Button 
          type="default" 
          icon={<FolderOutlined />}
          block
          onClick={() => setIsNewFolderModalVisible(true)}
        >
          New Folder
        </Button>
        <Button 
          type="default" 
          icon={<StarOutlined />}
          block
        >
          Favorites
        </Button>
      </div>
      <Tree
        treeData={convertFoldersToTree(folders)}
        selectedKeys={[selectedFolder]}
        onSelect={(keys, info) => {
          if (info.node) {
            setSelectedFolder(info.node.key);
            setSelectedParentId(info.node.key);
          }
        }}
        onRightClick={({ event, node }) => {
          event.preventDefault();
          event.stopPropagation();
          handleContextMenu(event, node.data);
        }}
        className="document-tree"
        showIcon
      />
    </Card>
  );

  return (
    <div className="p-6">
      <Card bordered={false} className="shadow-sm">
        <Row gutter={[24, 24]}>
          <Col span={6}>
            {renderLeftSidebar()}
          </Col>

          {/* Main Content */}
          <Col span={18}>
            <div className="mb-4">
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Search
                    placeholder="Search documents..."
                    allowClear
                    onChange={(e) => setSearchText(e.target.value)}
                    prefix={<SearchOutlined />}
                  />
                </Col>
                {documentTypeButton}
              </Row>
            </div>

            <Card 
              className="document-table"
              bodyStyle={{ padding: '0' }}
            >
              <Table
                columns={columns}
                dataSource={filteredDocuments}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true
                }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {renderContextMenu()}
      {renderNewFolderModal()}

      {/* Upload Modal */}
      <Modal
        title="Upload Document"
        visible={isUploadModalVisible}
        onCancel={() => setIsUploadModalVisible(false)}
        footer={null}
      >
        <div className="text-center p-8">
          <Upload.Dragger
            multiple
            beforeUpload={() => false}
            onChange={(info) => {
              handleUpload(info.fileList.map(f => f.originFileObj));
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Selected folder: {selectedFolder === 'all' ? 'Please select a folder' : selectedFolder}
            </p>
          </Upload.Dragger>
        </div>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        title="Document Preview"
        visible={isPreviewModalVisible}
        onCancel={() => setIsPreviewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsPreviewModalVisible(false)}>
            Close
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />}>
            Download
          </Button>
        ]}
      >
        {/* Add document preview content here */}
      </Modal>

      {documentTypeModals}
    </div>
  );
};

// Add these styles
const styles = `
  .document-tree .ant-tree-node-content-wrapper {
    padding: 4px 8px;
  }

  .document-tree .ant-tree-node-content-wrapper:hover {
    background-color: #f5f5f5;
  }

  .document-table .ant-table-thead > tr > th {
    background-color: #fafafa;
  }

  .document-table .ant-table-tbody > tr:hover > td {
    background-color: #f0f7ff;
  }

  .document-card {
    transition: all 0.3s;
  }

  .document-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export default DocumentManagement;
