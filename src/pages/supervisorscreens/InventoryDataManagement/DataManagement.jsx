import React, { useState, useEffect } from 'react';
import { 
  Tabs, Card, Table, Button, Modal, Form, Input, Space, message, 
  Row, Col, Statistic, Typography, Tooltip, Badge, Tag, Select
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  InfoCircleOutlined, AppstoreOutlined, DatabaseOutlined,
  ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import useInventoryStore from '../../../store/inventory-store';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

function DataManagement() {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const { 
    categories, 
    loading, 
    fetchCategories, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    allSubcategories,
    fetchAllSubcategories 
  } = useInventoryStore();

  useEffect(() => {
    fetchCategories();
    fetchAllSubcategories();
  }, [fetchCategories, fetchAllSubcategories]);

  useEffect(() => {
    if (isModalVisible) {
      axios.get('http://172.19.224.1:8002/api/v1/api/inventory/categories/')
        .then(response => {
          const options = response.data.map(category => ({
            value: category.name,
            label: category.name,
            description: category.description,
            created_by: category.created_by
          }));
          setCategoryOptions(options);
        })
        .catch(error => {
          toast.error('Failed to fetch categories');
        });
    }
  }, [isModalVisible]);

  const showModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        name: record.name,
        description: record.description,
        created_by: record.created_by
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await updateCategory(editingId, {
          name: values.name,
          description: values.description,
          created_by: values.created_by || 1
        });
        toast.success('Category updated successfully');
        fetchCategories();
      } else {
        await addCategory(values);
        toast.success('Category added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingId(null);
    } catch (error) {
      toast.error('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Delete Category',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete this category? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No, Cancel',
      async onOk() {
        try {
          await deleteCategory(id);
          toast.success('Category deleted successfully');
          fetchCategories(); // Refresh the table after deletion
        } catch (error) {
          toast.error('Failed to delete category: ' + (error.response?.data?.message || error.message));
        }
      },
      onCancel() {
        toast.info('Delete operation cancelled');
      },
    });
  };

  const handleCategoryChange = (value, option) => {
    form.setFieldsValue({
      name: value,
      description: option.description,
      created_by: option.created_by
    });
  };

  const columns = [
    {
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Badge status={record.active ? "success" : "default"} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    // {
    //   title: 'Subcategories',
    //   key: 'subcategories',
    //   width: 300,
    //   render: (_, record) => {
    //     const categorySubcategories = allSubcategories.filter(
    //       sub => sub.category_id === record.id
    //     );
        
    //     return categorySubcategories.length > 0 ? (
    //       <Space size={[0, 4]} wrap>
    //         {categorySubcategories.map((sub) => (
    //           <Tag 
    //             color="blue" 
    //             key={sub.id}
    //             style={{ margin: '2px' }}
    //           >
    //             <Space>
    //               <span>{sub.name}</span>
    //               <small style={{ opacity: 0.7 }}>
    //                 ({Object.keys(sub.dynamic_fields || {}).length} fields)
    //               </small>
    //             </Space>
    //           </Tag>
    //         ))}
    //       </Space>
    //     ) : (
    //       <Text type="secondary">No subcategories</Text>
    //     );
    //   },
    // },
    {
      title: 'Created By',
      dataIndex: 'created_by',
      key: 'created_by',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.active ? 'green' : 'default'}>
          {record.active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Category">
            <Button 
              type="primary"
              ghost
              icon={<EditOutlined />} 
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Category">
            <Button 
              danger
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id)}
              loading={loading && record.id === selectedCategory?.id}
            />
          </Tooltip>
          <Tooltip title="View Details">
            <Button
              icon={<InfoCircleOutlined />}
              onClick={() => setSelectedCategory(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card className="shadow-sm">
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                  <DatabaseOutlined /> Inventory Category Management
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Manage and monitor all inventory categories in your system
                </Text>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card 
                hoverable 
                className="shadow-sm"
                style={{ backgroundColor: '#f0f5ff', borderLeft: '4px solid #1890ff' }}
              >
                <Statistic
                  title={<Text strong>Total Categories</Text>}
                  value={categories.length}
                  prefix={<AppstoreOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
                <Text type="secondary">Total number of inventory categories</Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card 
                hoverable 
                className="shadow-sm"
                style={{ backgroundColor: '#f6ffed', borderLeft: '4px solid #52c41a' }}
              >
                <Statistic
                  title={<Text strong>Active Categories</Text>}
                  value={categories.filter(cat => cat.active).length}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Text type="secondary">Currently active categories</Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card 
                hoverable 
                className="shadow-sm"
                style={{ backgroundColor: '#fff7e6', borderLeft: '4px solid #fa8c16' }}
              >
                <Statistic
                  title={<Text strong>Recently Added</Text>}
                  value={categories.filter(cat => {
                    const date = new Date(cat.created_at);
                    return Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
                  }).length}
                  prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
                  valueStyle={{ color: '#fa8c16' }}
                />
                <Text type="secondary">Categories added in last 7 days</Text>
              </Card>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Card className="shadow-sm">
            <div style={{ 
              marginBottom: 16, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Text strong style={{ fontSize: '18px' }}>
                Category List
              </Text>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
                size="large"
                style={{ 
                  background: '#1890ff',
                  borderRadius: '6px',
                  height: '40px'
                }}
              >
                Add New Category
              </Button>
            </div>

            <Table
              columns={columns}
              dataSource={categories}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => 
                  `Showing ${range[0]}-${range[1]} of ${total} categories`,
                showQuickJumper: true,
                style: { marginTop: '16px' }
              }}
              className="custom-table"
              rowClassName={(record) => record.active ? 'active-row' : 'inactive-row'}
              style={{ marginTop: '16px' }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <Title level={4} style={{ margin: 0 }}>
            {editingId ? (
              <><EditOutlined style={{ color: '#1890ff' }} /> Edit Category</>
            ) : (
              <><PlusOutlined style={{ color: '#52c41a' }} /> Add New Category</>
            )}
          </Title>
        }
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={600}
        okText={editingId ? "Update Category" : "Create Category"}
        okButtonProps={{ 
          style: { 
            background: editingId ? '#1890ff' : '#52c41a',
            borderRadius: '6px'
          } 
        }}
        cancelButtonProps={{ 
          style: { borderRadius: '6px' } 
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            created_by: 1
          }}
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[
              { required: true, message: 'Please select or enter category name!' },
              { max: 100, message: 'Category name cannot exceed 100 characters!' }
            ]}
          >
            {editingId ? (
              <Input 
                prefix={<AppstoreOutlined />} 
                placeholder="Enter category name"
                disabled={false}
              />
            ) : (
              <Input 
                prefix={<AppstoreOutlined />} 
                placeholder="e.g., Tools, Raw Materials, etc." 
              />
            )}
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please input category description!' },
              { max: 500, message: 'Description cannot exceed 500 characters!' }
            ]}
          >
            <Input.TextArea 
              placeholder="e.g., All manufacturing tools"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="created_by"
            hidden
          >
            <Input type="hidden" />
          </Form.Item>

          {/* Display additional information */}
          <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              {editingId 
                ? "Select an existing category to edit its details."
                : "This category will be created with your user ID as the creator."}
            </Text>
          </div>
        </Form>
      </Modal>

      <style jsx global>{`
        .custom-table .ant-table-thead > tr > th {
          background: #fafafa;
          font-weight: 600;
        }
        .active-row {
          background: #ffffff;
        }
        .inactive-row {
          background: #fafafa;
        }
        .shadow-sm {
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
        }
        .ant-card {
          border-radius: 8px;
        }
        .ant-btn {
          border-radius: 6px;
        }
        .ant-table {
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}

export default DataManagement; 
