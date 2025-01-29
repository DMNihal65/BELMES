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
  Drawer,
  Timeline,
  Breadcrumb,
  Spin,
  Select,
  Grid
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
  FolderAddOutlined,
  MoreOutlined,
  RollbackOutlined,
  EditOutlined,
  CopyOutlined,
  SnippetsOutlined
} from '@ant-design/icons';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import useDocumentStore from '../../store/document-store';

const { Title, Text } = Typography;
const { Search } = Input;
const { DirectoryTree } = Tree;
const { Option } = Select;
const { useBreakpoint } = Grid;

const DocumentManagement = () => {
  const {
    folders,
    documents,
    documentTypes,
    versions,
    isLoading,
    error,
    fetchFolders,
    fetchDocTypes,
    fetchFolderDocuments,
    uploadDocument,
    createFolder,
    deleteDocument,
    fetchVersions,
    updateFolder
  } = useDocumentStore();

  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [favorites, setFavorites] = useState(['DOC001']);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isNewFolderModalVisible, setIsNewFolderModalVisible] = useState(false);
  const [isVersionDrawerVisible, setIsVersionDrawerVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isRenameFolderModalVisible, setIsRenameFolderModalVisible] = useState(false);
  const [selectedFolderForRename, setSelectedFolderForRename] = useState(null);
  const [copiedFolder, setCopiedFolder] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [renameForm] = Form.useForm();
  const [isVersionModalVisible, setIsVersionModalVisible] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [versionForm] = Form.useForm();
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [wordContent, setWordContent] = useState(null);
  const [partNumbers, setPartNumbers] = useState([]);
  const [form] = Form.useForm();

  // Add breakpoint hook
  const screens = useBreakpoint();

  // Fetch initial data
  useEffect(() => {
    fetchFolders();
    fetchDocTypes();
  }, []);

  // Fetch documents when folder is selected
  useEffect(() => {
    if (selectedFolder) {
      fetchFolderDocuments(selectedFolder);
    }
  }, [selectedFolder]);

  // Handle file upload
  const handleUpload = async ({ file, onSuccess, onError }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder_id', selectedFolder);
      
      await uploadDocument(formData);
      onSuccess('Upload successful');
      message.success('File uploaded successfully');
    } catch (error) {
      onError('Upload failed');
      message.error('Failed to upload file');
    }
  };

  // Handle folder creation
  const handleCreateFolder = async (values) => {
    try {
      await createFolder({
        name: values.folderName,
        parent_id: selectedFolder || 0  // Changed to match API expectation
      });
      setIsNewFolderModalVisible(false);
      form.resetFields();
      message.success('Folder created successfully');
      // Refresh folders list after creation
      await fetchFolders();
    } catch (error) {
      message.error('Failed to create folder');
    }
  };

  // Handle document deletion
  const handleDelete = async (record) => {
    try {
      await deleteDocument(record.id);
      message.success('Document deleted successfully');
    } catch (error) {
      message.error('Failed to delete document');
    }
  };

  // Show version history
  const showVersionHistory = async (record) => {
    setSelectedDocument(record);
    await fetchVersions(record.id);
    setIsVersionDrawerVisible(true);
  };

  // Update folder name
  const handleRenameFolderSubmit = async (values) => {
    try {
      await updateFolder(selectedFolder, {
        name: values.folderName
      });
      message.success('Folder renamed successfully');
    } catch (error) {
      message.error('Failed to rename folder');
    }
  };

  // Filter documents based on selected folder
  const filteredDocuments = documents.filter(doc => 
    (!selectedFolder || doc.folder_id === selectedFolder) &&
    doc.document_name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Convert folders to tree structure
  const getTreeData = (folders, parentId = null) => {
    return folders
      .filter(folder => 
        parentId === null 
          ? !folder.parent_id || folder.parent_id === 0
          : folder.parent_id === parentId
      )
      .map(folder => ({
        title: folder.folder_name || folder.name, // Handle both API and local naming
        key: folder.id,
        icon: <FolderOutlined />,
        children: getTreeData(folders, folder.id)
      }));
  };

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case 'excel':
      case 'xlsx':
        return <FileExcelOutlined style={{ color: '#52c41a' }} />;
      case 'word':
      case 'docx':
        return <FileWordOutlined style={{ color: '#1890ff' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  const handleDownload = (record) => {
    message.success(`Downloading ${record.document_name}`);
  };

  const handleShare = (record) => {
    Modal.confirm({
      title: 'Share Document',
      content: (
        <div>
          <p>Share "{record.document_name}" with:</p>
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

  const handlePreview = (record) => {
    setPreviewDocument(record);
    
    // Get mock file content
    const mockFile = mockFileContents[record.id];
    if (mockFile) {
      if (mockFile.type === 'pdf') {
        setPdfUrl(mockFile.content);
      } else if (mockFile.type === 'excel') {
        setExcelData(mockFile.content);
      }
    }
    
    setIsPreviewModalVisible(true);
  };

  const handleFilePreview = async (file) => {
    const reader = new FileReader();

    if (file.type === 'application/pdf') {
      // Use object tag for PDF preview
      reader.onload = (e) => {
        setPdfUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    } 
    else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
      // Use SheetJS (xlsx) for Excel files
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        setExcelData(jsonData);
      };
      reader.readAsArrayBuffer(file);
    } 
    else if (file.type.includes('word') || file.type.includes('document')) {
      // Show a download prompt for Word documents
      message.info('Word documents can only be downloaded for viewing');
      handleDownload(previewDocument);
    }
  };

  const handleVersionSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append('file', uploadingFile);
      formData.append('folder_id', selectedFolder);
      formData.append('part_number_id', values.partNumberId);
      formData.append('doc_type_id', values.docTypeId);
      formData.append('document_name', values.documentName);
      formData.append('description', values.description || '');
      formData.append('version_number', values.newVersion);
      formData.append('metadata', JSON.stringify(values.metadata || {}));

      await uploadDocument(formData);
      
      setIsVersionModalVisible(false);
      setUploadingFile(null);
      versionForm.resetFields();
      message.success('Document uploaded successfully');
    } catch (error) {
      message.error('Failed to upload document');
    }
  };

  const handleFolderContextMenu = (e, folder) => {
    e.preventDefault();
    setSelectedFolder(folder.key);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setIsContextMenuVisible(true);
  };

  const handleRenameFolder = () => {
    const folder = folders.find(f => f.id === selectedFolder);
    setSelectedFolderForRename(folder);
    renameForm.setFieldsValue({ folderName: folder.name });
    setIsRenameFolderModalVisible(true);
    setIsContextMenuVisible(false);
  };

  const handleCopyFolder = () => {
    const folderToCopy = folders.find(f => f.id === selectedFolder);
    setCopiedFolder(folderToCopy);
    setIsContextMenuVisible(false);
    message.success('Folder copied to clipboard');
  };

  const handlePasteFolder = (targetFolderId) => {
    if (!copiedFolder) return;

    const newFolder = {
      ...copiedFolder,
      id: String(Date.now()),
      name: `${copiedFolder.name} (Copy)`,
      parent_id: targetFolderId
    };

    setFolders([...folders, newFolder]);
    message.success('Folder pasted successfully');
  };

  return (
    <div className="p-4 md:p-6">
      <Card bordered={false}>
        <Row gutter={[16, 16]}>
          {/* Left Sidebar - Folder Tree */}
          <Col 
            xs={24} 
            sm={24} 
            md={8} 
            lg={6} 
            className={`${!screens.md ? 'mb-4' : ''}`}
          >
            <div className="mb-4">
              <Space wrap>
                <Button 
                  type="primary" 
                  icon={<FolderAddOutlined />}
                  onClick={() => setIsNewFolderModalVisible(true)}
                >
                  {screens.sm ? 'New Folder' : ''}
                </Button>
                <Upload
                  customRequest={handleUpload}
                  showUploadList={false}
                >
                  <Button icon={<CloudUploadOutlined />}>
                    {screens.sm ? 'Upload' : ''}
                  </Button>
                </Upload>
              </Space>
            </div>
            <DirectoryTree
              treeData={getTreeData(folders)}
              onSelect={([key]) => setSelectedFolder(key)}
              selectedKeys={selectedFolder ? [selectedFolder] : []}
              className="responsive-tree"
            />
          </Col>

          {/* Main Content - Document List */}
          <Col xs={24} sm={24} md={16} lg={18}>
            <div className="mb-4">
              <Row gutter={[16, 16]} align="middle" justify="space-between">
                <Col xs={24} sm={12}>
                  <Search
                    placeholder="Search documents..."
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </Col>
                {!screens.md && (
                  <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                    <Space wrap>
                      <Button 
                        type="primary" 
                        icon={<FilterOutlined />}
                      >
                        Filter
                      </Button>
                      <Button 
                        icon={<DownloadOutlined />}
                      >
                        Export
                      </Button>
                    </Space>
                  </Col>
                )}
              </Row>
            </div>
            
            <Spin spinning={isLoading}>
              <div className="table-responsive">
                <Table
                  columns={getResponsiveColumns(screens)}
                  dataSource={filteredDocuments}
                  rowKey="id"
                  scroll={{ x: true }}
                  pagination={{
                    responsive: true,
                    position: screens.sm ? ['bottomRight'] : ['bottomCenter']
                  }}
                />
              </div>
            </Spin>
          </Col>
        </Row>
      </Card>

      {/* New Folder Modal */}
      <Modal
        title="Create New Folder"
        open={isNewFolderModalVisible}
        onCancel={() => {
          setIsNewFolderModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={screens.sm ? 520 : '95%'}
        style={{ top: screens.sm ? 100 : 0 }}
      >
        <Form 
          form={form} 
          onFinish={handleCreateFolder}
          layout="vertical"
        >
          <Form.Item
            name="folderName"
            label="Folder Name"
            rules={[
              { required: true, message: 'Please enter folder name' },
              { max: 255, message: 'Folder name too long' }
            ]}
          >
            <Input placeholder="Enter folder name" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create
              </Button>
              <Button onClick={() => {
                setIsNewFolderModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Version History Drawer */}
      <Drawer
        title={`Version History - ${selectedDocument?.document_name}`}
        placement="right"
        width={500}
        open={isVersionDrawerVisible}
        onClose={() => setIsVersionDrawerVisible(false)}
      >
        {selectedDocument && (
          <Timeline>
            {versions[selectedDocument.id]?.map(version => (
              <Timeline.Item key={version.id}>
                <div>
                  <Tag color="blue">v{version.version_number}</Tag>
                  <Text>{new Date(version.created_at).toLocaleString()}</Text>
                  <div>{version.changes}</div>
                  <Space>
                    <Button 
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(selectedDocument, version.id)}
                    >
                      Download
                    </Button>
                  </Space>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Drawer>

      {/* Context Menu */}
      {isContextMenuVisible && (
        <>
          <div
            style={{
              position: 'fixed',
              top: contextMenuPosition.y,
              left: contextMenuPosition.x,
              zIndex: 1000
            }}
          >
            <Dropdown
              open
              menu={{
                items: [
                  {
                    key: 'rename',
                    icon: <EditOutlined />,
                    label: 'Rename',
                    onClick: handleRenameFolder
                  },
                  {
                    key: 'copy',
                    icon: <CopyOutlined />,
                    label: 'Copy',
                    onClick: handleCopyFolder
                  },
                  {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    label: 'Delete',
                    onClick: handleDeleteFolder
                  }
                ]
              }}
            >
              <div style={{ display: 'none' }} />
            </Dropdown>
          </div>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setIsContextMenuVisible(false)}
          />
        </>
      )}

      {/* Rename Folder Modal */}
      <Modal
        title="Rename Folder"
        open={isRenameFolderModalVisible}
        onCancel={() => setIsRenameFolderModalVisible(false)}
        footer={null}
      >
        <Form form={renameForm} onFinish={handleRenameFolderSubmit}>
          <Form.Item
            name="folderName"
            rules={[{ required: true, message: 'Please enter folder name' }]}
          >
            <Input placeholder="New folder name" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Rename
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Version Input Modal */}
      <Modal
        title="Document Details"
        open={isVersionModalVisible}
        onCancel={() => {
          setIsVersionModalVisible(false);
          setUploadingFile(null);
          versionForm.resetFields();
        }}
        footer={null}
      >
        <Form 
          form={versionForm} 
          onFinish={handleVersionSubmit}
          layout="vertical"
        >
          <Form.Item
            label="Document Name"
            name="documentName"
            rules={[{ required: true, message: 'Please enter document name' }]}
          >
            <Input placeholder="Enter document name" />
          </Form.Item>

          <Form.Item
            label="Part Number"
            name="partNumberId"
            rules={[{ required: true, message: 'Please select part number' }]}
          >
            <Select placeholder="Select part number">
              {partNumbers.map(part => (
                <Option key={part.id} value={part.id}>{part.number}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Document Type"
            name="docTypeId"
            rules={[{ required: true, message: 'Please select document type' }]}
          >
            <Select placeholder="Select document type">
              {documentTypes.map(type => (
                <Option key={type.id} value={type.id}>{type.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Version Number"
            name="newVersion"
            rules={[{ required: true, message: 'Please enter version number' }]}
          >
            <Input placeholder="Enter version number (e.g., 1.0)" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea placeholder="Enter description" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title={previewDocument?.document_name}
        open={isPreviewModalVisible}
        onCancel={() => {
          setIsPreviewModalVisible(false);
          setPdfUrl(null);
          setExcelData(null);
        }}
        width={1000}
        footer={[
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(previewDocument)}
          >
            Download
          </Button>,
          <Button 
            key="close" 
            onClick={() => setIsPreviewModalVisible(false)}
          >
            Close
          </Button>
        ]}
      >
        <div style={{ minHeight: '600px' }}>
          {previewDocument && (
            <div className="preview-container">
              {previewDocument.type === 'pdf' && (
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  width="100%"
                  height="600px"
                >
                  <p>Unable to display PDF. <a href={pdfUrl} target="_blank" rel="noopener noreferrer">Download</a> instead.</p>
                </object>
              )}
              
              {previewDocument.type === 'excel' && (
                <div className="excel-preview" style={{ width: '100%', overflowX: 'auto' }}>
                  <table className="preview-table">
                    <thead>
                      <tr>
                        {excelData[0].map((header, index) => (
                          <th key={index}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {excelData.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {previewDocument.type === 'word' && (
                <div className="word-preview" style={{ padding: '20px' }}>
                  <FileWordOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                  <p>Word preview is not available in this demo.</p>
                  <p>In production, we can use libraries like mammoth.js for Word preview.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Add responsive styles */}
      <style jsx global>{`
        .responsive-tree {
          max-height: ${screens.md ? 'calc(100vh - 280px)' : '300px'};
          overflow: auto;
        }

        .table-responsive {
          overflow-x: auto;
          margin: 0 -16px;
          padding: 0 16px;
        }

        @media (max-width: 576px) {
          .ant-table {
            font-size: 12px;
          }

          .ant-btn {
            padding: 4px 8px;
            height: 32px;
          }

          .ant-space {
            gap: 8px !important;
          }
        }

        @media (max-width: 768px) {
          .preview-container {
            padding: 10px;
          }

          .ant-modal {
            max-width: 95%;
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
};

// Add function to get responsive columns
const getResponsiveColumns = (screens) => {
  const baseColumns = [
    {
      title: 'Name',
      dataIndex: 'document_name',
      key: 'document_name',
      fixed: 'left',
      render: (text, record) => (
        <Space>
          {getFileIcon(record.type)}
          <Text ellipsis>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Version',
      dataIndex: 'version_number',
      key: 'version_number',
      render: version => <Tag color="blue">v{version}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: screens.sm ? undefined : 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          {screens.sm && (
            <>
              <Tooltip title="Download">
                <Button 
                  icon={<DownloadOutlined />} 
                  size="small"
                  onClick={() => handleDownload(record)}
                />
              </Tooltip>
              <Tooltip title="Version History">
                <Button
                  icon={<HistoryOutlined />}
                  size="small"
                  onClick={() => showVersionHistory(record)}
                />
              </Tooltip>
            </>
          )}
          <Dropdown
            menu={{
              items: getActionMenuItems(record, screens)
            }}
          >
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // Add additional columns for larger screens
  if (screens.md) {
    baseColumns.splice(1, 0, 
      {
        title: 'Document Type',
        dataIndex: 'doc_type_id',
        key: 'doc_type_id',
        render: id => {
          const docType = documentTypes.find(d => d.id === id);
          return docType?.name || id;
        }
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
      }
    );
  }

  return baseColumns;
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

  .folder-node {
    display: flex !important;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
  }

  .folder-node:hover {
    background-color: #f5f5f5;
  }

  .ant-tree-title {
    display: flex;
    align-items: center;
  }

  .context-menu .ant-menu {
    min-width: 160px;
  }

  .context-menu .ant-menu-item {
    padding: 8px 16px;
  }

  .preview-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 20px;
  }

  .excel-preview, .word-preview, .generic-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: #666;
  }

  .preview-table {
    border-collapse: collapse;
    width: 100%;
    margin-top: 20px;
  }

  .preview-table th,
  .preview-table td {
    border: 1px solid #ddd;
    padding: 12px 8px;
    text-align: left;
  }

  .preview-table th {
    background-color: #fafafa;
    font-weight: 600;
  }

  .preview-table tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  .preview-table tr:hover {
    background-color: #f5f5f5;
  }

  .upload-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    background-color: #fafafa;
  }

  .word-preview {
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    border-radius: 4px;
  }
`;

export default DocumentManagement;
