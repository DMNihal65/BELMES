import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Tabs, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Spin, 
  Empty, 
  message,
  Typography,
  Space,
  Tooltip,
  Badge,
  Table,
  Tag
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  InfoCircleOutlined,
  AppstoreAddOutlined,
  SettingOutlined
} from '@ant-design/icons';
import useInventoryStore from '../../../store/inventory-store';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const InventoryMasterData = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [form] = Form.useForm();
  
  const { 
    categories, 
    subcategories,
    fetchCategories, 
    addCategory, 
    setSelectedCategory,
    isLoading,
    error 
  } = useInventoryStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (values) => {
    const categoryData = {
      ...values,
      created_by: 1
    };
    
    const result = await addCategory(categoryData);
    if (result.success) {
      setIsModalVisible(false);
      form.resetFields();
      message.success('Category added successfully');
    } else {
      message.error(`Failed to add category: ${result.error}`);
    }
  };

  const getColumnsFromDynamicFields = (dynamicFields) => {
    if (!dynamicFields) return [];

    return Object.entries(dynamicFields).map(([field, config]) => ({
      title: (
        <Tooltip title={`${config.required ? 'Required' : 'Optional'} ${config.type} field`}>
          <Space>
            {field.charAt(0).toUpperCase() + field.slice(1)}
            {config.unit && <Tag color="blue">{config.unit}</Tag>}
            {config.required && <Tag color="red">Required</Tag>}
          </Space>
        </Tooltip>
      ),
      dataIndex: field,
      key: field,
      width: 150,
      render: (value) => value || '-'
    }));
  };

  const renderSubcategoryContent = (subcategory) => {
    return (
      <div className="p-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Space align="start">
              <Title level={5} className="m-0">{subcategory.name}</Title>
              <Tag color="blue">ID: {subcategory.id}</Tag>
            </Space>
            <Text type="secondary" className="block mt-2">{subcategory.description}</Text>
          </div>
          <Space>
            <Button type="primary" ghost icon={<PlusOutlined />}>
              Add Item
            </Button>
            <Button icon={<EditOutlined />}>Edit</Button>
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Space>
        </div>

        <Card className="shadow-sm">
          <Table
            columns={getColumnsFromDynamicFields(subcategory.dynamic_fields)}
            dataSource={[]} // This will be replaced with actual items
            scroll={{ x: 'max-content' }}
            pagination={false}
            className="subcategory-table"
          />
        </Card>
      </div>
    );
  };

  const renderCategoryContent = (category) => {
    const categorySubcategories = subcategories[category.id] || [];

    return (
      <div className="p-4">
        {/* Category Details Card */}
        <Card className="mb-6 shadow-sm">
          <div className="flex justify-between">
            <div>
              <Title level={4} className="mb-1">{category.name}</Title>
              <Space className="mb-3">
                <Tag color="blue">ID: {category.id}</Tag>
                <Tag color="green">Created by: {category.created_by}</Tag>
                <Tag color="orange">
                  Created: {new Date(category.created_at).toLocaleString()}
                </Tag>
              </Space>
              <Text type="secondary" className="block">{category.description}</Text>
            </div>
            <Space>
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                className="bg-blue-500"
              >
                Edit Category
              </Button>
              <Button 
                danger 
                icon={<DeleteOutlined />}
              >
                Delete
              </Button>
            </Space>
          </div>
        </Card>

        {/* Subcategories Section */}
        <Card className="shadow-md">
          <div className="flex justify-between items-center mb-4">
            <Title level={5} className="m-0">Subcategories</Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              className="bg-blue-500"
            >
              Add Subcategory
            </Button>
          </div>
          
          <Tabs
            type="card"
            onChange={(key) => setActiveSubcategory(key)}
            tabBarStyle={{ marginBottom: '1rem' }}
          >
            {categorySubcategories.map(subcategory => (
              <TabPane
                tab={
                  <Tooltip title={subcategory.description}>
                    <span>{subcategory.name}</span>
                  </Tooltip>
                }
                key={subcategory.id}
              >
                {renderSubcategoryContent(subcategory)}
              </TabPane>
            ))}
          </Tabs>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Text type="danger">Error: {error}</Text>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6">
        <Card className="overflow-hidden">
          <Tabs
            type="card"
            tabBarExtraContent={{
              right: (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalVisible(true)}
                  className="bg-blue-500"
                >
                  Add Category
                </Button>
              )
            }}
          >
            {categories.map((category) => (
              <TabPane 
                tab={
                  <Tooltip title={category.description}>
                    <span>{category.name}</span>
                  </Tooltip>
                } 
                key={category.id}
              >
                {renderCategoryContent(category)}
              </TabPane>
            ))}
          </Tabs>
        </Card>
      </div>

      {/* Add Category Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <AppstoreAddOutlined className="text-blue-500" />
            <span>Add New Category</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleAddCategory}
          layout="vertical"
          className="pt-4"
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea 
              placeholder="Enter category description"
              rows={4}
            />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" className="bg-blue-500">
                Add Category
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryMasterData; 