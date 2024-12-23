import React, { useState } from 'react';
import {
  Layout,
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
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

const DocumentManagement = () => {
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [form] = Form.useForm();

  // Mock data for documents
  const documents = [
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
    {
      key: 'DOC-003',
      documentId: 'DOC-003',
      type: 'IPID',
      linkedJob: 'JOB-789',
      uploadedBy: 'Mike Johnson',
      version: 'v1',
      timestamp: '2024-01-19 12:15 PM',
    },
  ];

  const columns = [
    {
      title: 'Document ID',
      dataIndex: 'documentId',
      key: 'documentId',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let color = 'blue';
        if (type === 'OARC') color = 'green';
        if (type === 'IPID') color = 'purple';
        return (
          <Tag color={color} style={{ padding: '4px 8px', borderRadius: '4px' }}>
            {type}
          </Tag>
        );
      },
    },
    {
      title: 'Linked Job',
      dataIndex: 'linkedJob',
      key: 'linkedJob',
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
      render: (text) => (
        <Space>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
            {text.split(' ').map(word => word[0]).join('')}
          </div>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (version) => (
        <Tag color="purple" style={{ padding: '4px 8px', borderRadius: '4px' }}>
          {version}
        </Tag>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              className="text-blue-500 hover:text-blue-600"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="text-green-500 hover:text-green-600"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              className="text-red-500 hover:text-red-600"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleView = (document) => {
    setSelectedDocument(document);
    setViewModalVisible(true);
  };

  const handleEdit = (document) => {
    setSelectedDocument(document);
    form.setFieldsValue(document);
    setEditModalVisible(true);
  };

  const handleDelete = (document) => {
    setSelectedDocument(document);
    setDeleteModalVisible(true);
  };

  const onFinishEdit = (values) => {
    console.log('Edited values:', values);
    message.success('Document updated successfully');
    setEditModalVisible(false);
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    action: 'https://your-upload-endpoint.com/upload',
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card bordered={false} className="mb-6 hover:shadow-md transition-shadow">
        <div className="mb-6">
          <Title level={4}>Document Management</Title>
          <Text type="secondary">Upload, manage and track all your documents</Text>
        </div>

        <Dragger {...uploadProps} className="mb-6">
          <p className="ant-upload-drag-icon">
            <InboxOutlined className="text-blue-500" />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for single or bulk upload. Strictly prohibited from uploading company data or other
            banned files.
          </p>
        </Dragger>

        <Table
          columns={columns}
          dataSource={documents}
          pagination={{
            total: documents.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} documents`,
          }}
          className="custom-table"
        />
      </Card>

      {/* View Modal */}
      <Modal
        title="Document Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {selectedDocument && (
          <div className="space-y-4">
            <div>
              <Text type="secondary">Document ID</Text>
              <div>{selectedDocument.documentId}</div>
            </div>
            <div>
              <Text type="secondary">Type</Text>
              <div>{selectedDocument.type}</div>
            </div>
            <div>
              <Text type="secondary">Linked Job</Text>
              <div>{selectedDocument.linkedJob}</div>
            </div>
            <div>
              <Text type="secondary">Uploaded By</Text>
              <div>{selectedDocument.uploadedBy}</div>
            </div>
            <div>
              <Text type="secondary">Version</Text>
              <div>{selectedDocument.version}</div>
            </div>
            <div>
              <Text type="secondary">Timestamp</Text>
              <div>{selectedDocument.timestamp}</div>
            </div>
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
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setEditModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Document"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={() => {
              message.success('Document deleted successfully');
              setDeleteModalVisible(false);
            }}
          >
            Delete
          </Button>,
        ]}
      >
        <p>Are you sure you want to delete this document?</p>
        <p>This action cannot be undone.</p>
      </Modal>

      <style jsx global>{`
        .ant-card {
          border-radius: 12px;
          overflow: hidden;
        }
        
        .ant-upload-drag {
          border-radius: 8px;
          border: 2px dashed #d9d9d9;
          background: #fafafa;
          padding: 24px;
          text-align: center;
        }
        
        .ant-upload-drag:hover {
          border-color: #1890ff;
        }
        
        .ant-upload-drag-icon {
          font-size: 48px;
          color: #1890ff;
        }
        
        .ant-upload-text {
          font-size: 16px;
          margin: 8px 0;
        }
        
        .ant-upload-hint {
          color: #8c8c8c;
        }
        
        .ant-table-thead > tr > th {
          background: #fafafa;
          font-weight: 600;
        }
        
        .ant-table-tbody > tr > td {
          padding: 16px 24px;
        }
        
        .ant-table-tbody > tr:hover > td {
          background: #f5f5f5;
        }
        
        .ant-tag {
          border: none;
          font-weight: 500;
        }
        
        .ant-modal-content {
          border-radius: 12px;
          overflow: hidden;
        }
        
        .ant-modal-header {
          border-bottom: 1px solid #f0f0f0;
          padding: 16px 24px;
        }
        
        .ant-modal-body {
          padding: 24px;
        }
        
        .ant-modal-footer {
          border-top: 1px solid #f0f0f0;
          padding: 16px 24px;
        }
        
        .ant-btn {
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default DocumentManagement;