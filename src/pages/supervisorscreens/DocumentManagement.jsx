import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Upload,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
  Tooltip,
  Tag,
} from 'antd';
import {
  UploadOutlined,
  FileAddOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined ,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const DocumentManagement = () => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documents, setDocuments] = useState([
    {
      key: 'DOC-001',
      documentId: 'DOC-001',
      type: 'MPP',
      linkedJob: 'JOB-123',
      uploadedBy: 'John Doe',
      version: 'v2',
      timestamp: '2024-01-19 10:30 AM',
    },
    {
      key: 'DOC-002',
      documentId: 'DOC-002',
      type: 'OARC',
      linkedJob: 'JOB-456',
      uploadedBy: 'Jane Smith',
      version: 'v1',
      timestamp: '2024-01-19 11:45 AM',
    },
  ]);
  const [currentDocument, setCurrentDocument] = useState(null); // For view/edit
  const [form] = Form.useForm();

  // Handle file upload
  const handleFileUpload = ({ file }) => {
    setSelectedFile(file); // This should set the selected file
    setUploadModalVisible(true); // This should trigger the upload modal
  };

  // Add document
  const onFinishUpload = (values) => {
    if (selectedFile) {
      const newDocument = {
        key: `DOC-${Date.now()}`,
        documentId: values.documentId,
        type: values.type,
        linkedJob: values.linkedJob,
        uploadedBy: values.uploadedBy || 'Anonymous',
        version: values.version,
        timestamp: new Date().toLocaleString(),
      };

      setDocuments((prevDocuments) => [...prevDocuments, newDocument]);
      message.success('Document added successfully');
      setUploadModalVisible(false);
      form.resetFields();
      setSelectedFile(null);
    } else {
      message.error('No file selected');
    }
  };

  // Delete document
  const handleDelete = (record) => {
    confirm({
      title: 'Are you sure you want to delete this document?',
      icon: <ExclamationCircleOutlined />,
      onOk: () => {
        setDocuments((prevDocuments) =>
          prevDocuments.filter((doc) => doc.key !== record.key)
        );
        message.success('Document deleted successfully');
      },
    });
  };

  // View document
  const handleView = (record) => {
    setCurrentDocument(record);
    setViewModalVisible(true);
  };

  // Edit document
  const handleEdit = (record) => {
    setCurrentDocument(record);
    setEditModalVisible(true);
    form.setFieldsValue(record); // Pre-fill form with document details
  };

  const onFinishEdit = (values) => {
    setDocuments((prevDocuments) =>
      prevDocuments.map((doc) =>
        doc.key === currentDocument.key ? { ...doc, ...values } : doc
      )
    );
    message.success('Document updated successfully');
    setEditModalVisible(false);
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          autoFocus
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
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
          <Button
            onClick={() => clearFilters && clearFilters()}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) => record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
  });


  const columns = [
    {
      title: 'Document ID',
      dataIndex: 'documentId',
      key: 'documentId',
      sorter: (a, b) => a.documentId.localeCompare(b.documentId),
      ...getColumnSearchProps('documentId'),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a, b) => a.type.localeCompare(b.type),
      filters: [
        { text: 'MPP', value: 'MPP' },
        { text: 'OARC', value: 'OARC' },
        { text: 'IPID', value: 'IPID' },
      ],
      onFilter: (value, record) => record.type.includes(value),
      render: (type) => (
        <Tag color="blue" style={{ padding: '4px 8px', borderRadius: '4px' }}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Linked Job',
      dataIndex: 'linkedJob',
      key: 'linkedJob',
      sorter: (a, b) => a.linkedJob.localeCompare(b.linkedJob),
      ...getColumnSearchProps('linkedJob'),
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
      sorter: (a, b) => a.uploadedBy.localeCompare(b.uploadedBy),
      ...getColumnSearchProps('uploadedBy'),
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      sorter: (a, b) => a.version.localeCompare(b.version),
      filters: [
        { text: 'v1', value: 'v1' },
        { text: 'v2', value: 'v2' },
      ],
      onFilter: (value, record) => record.version.includes(value),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      render: (timestamp) => (
        <Tooltip title={new Date(timestamp).toLocaleString()}>{timestamp}</Tooltip>
      ),
      ...getColumnSearchProps('timestamp'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button icon={<EyeOutlined />} onClick={() => handleView(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];
  

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card bordered={false} className="mb-6 hover:shadow-md transition-shadow">
        <div className="mb-6">
          <Title level={4}>Document Management</Title>
          <Text type="secondary">Upload, manage, and track all your documents</Text>
        </div>

        {/* Drag and Drop Upload */}
        <Upload.Dragger
  beforeUpload={() => false}
  onChange={handleFileUpload} // Ensure this is correctly triggering
  showUploadList={false}
  className="mb-4"
>
          <p className="ant-upload-drag-icon">
            <FileAddOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to upload</p>
          <p className="ant-upload-hint">Supports single file uploads only</p>
        </Upload.Dragger>

        <Table
          columns={columns}
          dataSource={documents}
          pagination={{
            total: documents.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          rowClassName="hover:bg-gray-100"
        />
      </Card>

      <Modal
  title="Upload Document"
  open={uploadModalVisible} // Controls the visibility
  onCancel={() => setUploadModalVisible(false)} // Closes the modal
  footer={null}
>
  <Form form={form} layout="vertical" onFinish={onFinishUpload}>
    <Form.Item
      name="documentId"
      label="Document ID"
      rules={[{ required: true, message: 'Please enter document ID' }]}
    >
      <Input />
    </Form.Item>
    <Form.Item
      name="type"
      label="Type"
      rules={[{ required: true, message: 'Please select document type' }]}
    >
      <Select>
        <Option value="MPP">MPP</Option>
        <Option value="OARC">OARC</Option>
        <Option value="IPID">IPID</Option>
      </Select>
    </Form.Item>
    <Form.Item
      name="linkedJob"
      label="Linked Job"
      rules={[{ required: true, message: 'Please enter linked job' }]}
    >
      <Input />
    </Form.Item>
    <Form.Item
      name="uploadedBy"
      label="Uploaded By"
      rules={[{ required: true, message: 'Please enter uploader name' }]}
    >
      <Input />
    </Form.Item>
    <Form.Item
      name="version"
      label="Version"
      rules={[{ required: true, message: 'Please enter version' }]}
    >
      <Input />
    </Form.Item>
    <Form.Item>
      <Space className="w-full justify-end">
        <Button onClick={() => setUploadModalVisible(false)}>Cancel</Button>
        <Button type="primary" htmlType="submit">
          Upload
        </Button>
      </Space>
    </Form.Item>
  </Form>
</Modal>

      {/* View Modal */}
      <Modal
        title="View Document"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
      >
        {currentDocument && (
          <div>
            <p>
              <Text strong>Document ID:</Text> {currentDocument.documentId}
            </p>
            <p>
              <Text strong>Type:</Text> {currentDocument.type}
            </p>
            <p>
              <Text strong>Linked Job:</Text> {currentDocument.linkedJob}
            </p>
            <p>
              <Text strong>Uploaded By:</Text> {currentDocument.uploadedBy}
            </p>
            <p>
              <Text strong>Version:</Text> {currentDocument.version}
            </p>
            <p>
              <Text strong>Timestamp:</Text> {currentDocument.timestamp}
            </p>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Document"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinishEdit}>
          <Form.Item
            name="documentId"
            label="Document ID"
            rules={[{ required: true, message: 'Please enter document ID' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select document type' }]}
          >
            <Select>
              <Option value="MPP">MPP</Option>
              <Option value="OARC">OARC</Option>
              <Option value="IPID">IPID</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="linkedJob"
            label="Linked Job"
            rules={[{ required: true, message: 'Please enter linked job' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="uploadedBy"
            label="Uploaded By"
            rules={[{ required: true, message: 'Please enter uploader name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="version"
            label="Version"
            rules={[{ required: true, message: 'Please enter version' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setEditModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentManagement;
