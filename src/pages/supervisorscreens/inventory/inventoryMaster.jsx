import React, { useState, useEffect } from 'react';
import { 
  Tabs, Card, Button, Table, Space, Typography, Tag, Modal, Form, Input,
  Row, Col, Statistic, Tooltip, Badge, message, Empty, Divider, Spin, Breadcrumb, Select, Checkbox
} from 'antd';
import { 
  FilterOutlined, AppstoreOutlined, TagOutlined, PlusOutlined, 
  EditOutlined, DeleteOutlined, InfoCircleOutlined, DatabaseOutlined,
  ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined,
  UserOutlined, HomeOutlined, FolderOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import useInventoryStore from '../../../store/inventory-store';
import axios from 'axios';

import Tools from './Tools/Tools'; 
import GaugesAndInstruments from './GaugesAndInstruments';
import Fixtures from './Fixtures';
import RawMaterials from './RawMaterials';
import Consumables from './Consumables';
// import FilterSidebar from '../../../components/inventory/FilterSidebar';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;

function InventoryMaster() {
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState(null);
  const [items, setItems] = useState([]);
  const [isSubcategoryModalVisible, setIsSubcategoryModalVisible] = useState(false);
  const [subcategoryForm] = Form.useForm();
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [itemForm] = Form.useForm();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [parentSubcategory, setParentSubcategory] = useState(null);
  
  const { 
    categories, 
    loading, 
    fetchCategories,
    fetchSubcategories,
    fetchSubcategoriesByCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    fetchItems,
    fetchItemsBySubcategory,
    updateItem,
    deleteItem,
    fetchSubcategoriesForCategory,
    fetchItemsForSubcategory,
    fetchCategorySubcategories,
    addItem
  } = useInventoryStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategoryChange = async (categoryId) => {
    try {
      const subcats = await fetchCategorySubcategories(categoryId);
      setSubcategories(subcats);
      setSelectedCategory(categoryId);
    } catch (error) {
      message.error('Failed to fetch subcategories');
    }
  };

  // Updated function to render all subcategory details
  const renderSubcategoryDetails = (subcategory) => {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Basic Details Cards */}
        <div className="subcategory-basic-details">
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card size="small" className="info-card">
                <Statistic
                  title="Subcategory ID"
                  value={subcategory.id}
                  prefix={<DatabaseOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className="info-card">
                <Statistic
                  title="Created By"
                  value={subcategory.created_by}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" className="info-card">
                <Statistic
                  title="Created At"
                  value={new Date(subcategory.created_at).toLocaleString()}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card size="small" className="info-card description-card">
                <div>
                  <Text type="secondary">Name</Text>
                  <Paragraph strong>{subcategory.name}</Paragraph>
                  <Text type="secondary">Description</Text>
                  <Paragraph>{subcategory.description || 'No description available'}</Paragraph>
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Dynamic Fields Table - keeping this as a table */}
        <Card title="Dynamic Fields Configuration" size="small" className="detail-card">
          <Table
            columns={[
              {
                title: 'Field Name',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Type',
                dataIndex: 'type',
                key: 'type',
              },
              {
                title: 'Required',
                dataIndex: 'required',
                key: 'required',
                render: (required) => (
                  <Tag color={required ? "success" : "default"}>
                    {required ? "Yes" : "No"}
                  </Tag>
                ),
              },
              {
                title: 'Unit',
                dataIndex: 'unit',
                key: 'unit',
                render: (unit) => unit || '-',
              },
            ]}
            dataSource={Object.entries(subcategory.dynamic_fields || {}).map(([name, details]) => ({
              key: name,
              name: name,
              ...details,
            }))}
            pagination={false}
            size="small"
          />
        </Card>
      </Space>
    );
  };

  // First, add a new state for selected category details
  const renderSelectedCategoryDetails = () => {
    if (!selectedCategoryDetails) return null;

    return (
      <div className="selected-category-details">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card size="small" className="info-card">
              <Statistic
                title="Category ID"
                value={selectedCategoryDetails.id}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="info-card">
              <Statistic
                title="Created By"
                value={selectedCategoryDetails.created_by}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" className="info-card">
              <Statistic
                title="Created At"
                value={new Date(selectedCategoryDetails.created_at).toLocaleString()}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="info-card description-card">
              <div>
                <Text type="secondary">Name</Text>
                <Paragraph strong>{selectedCategoryDetails.name}</Paragraph>
                <Text type="secondary">Description</Text>
                <Paragraph>{selectedCategoryDetails.description || 'No description available'}</Paragraph>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Map components to category names (you can adjust this based on your categories)
  const componentMap = {
    'Tools': Tools,
    'Gauges & Instruments': GaugesAndInstruments,
    'Fixtures': Fixtures,
    'Raw Materials': RawMaterials,
    'Consumables': Consumables
  };

  // Add category management functions
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
      const categoryData = {
        name: values.name,
        description: values.description || '',
      };

      if (editingId) {
        await updateCategory(editingId, categoryData);
        message.success('Category updated successfully');
      } else {
        await addCategory(categoryData);
        message.success('Category created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingId(null);
      fetchCategories(); // Refresh categories
    } catch (error) {
      console.error('Error saving category:', error);
      message.error('Failed to save category: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = (categoryId) => {
    Modal.confirm({
      title: 'Delete Category',
      content: 'Are you sure you want to delete this category? All subcategories and items will also be deleted.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteCategory(categoryId);
          message.success('Category deleted successfully');
          fetchCategories(); // Refresh categories
          setSelectedCategory(null); // Clear selected category
        } catch (error) {
          console.error('Error deleting category:', error);
          message.error('Failed to delete category: ' + (error.message || 'Unknown error'));
        }
      }
    });
  };

  // Update the subcategories display section
  const renderSubcategories = (categoryId) => {
    if (loading) return <div>Loading subcategories...</div>;
    
    // Filter subcategories for this category
    const categorySubcategories = subcategories.filter(
      subcat => subcat.category_id === categoryId
    );
    
    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TagOutlined style={{ color: '#1890ff' }} />
              <Text strong>
                {/* Find subcategory by category_id instead of id */}
                Subcategory: {categorySubcategories[0]?.name || 'No subcategory'} 
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  ID: {categorySubcategories[0]?.id}
                </Tag>
              </Text>
            </div>
            <Text type="secondary">
              Total: {categorySubcategories.length}
            </Text>
          </div>
        }
        className="subcategories-card"
      >
        {categorySubcategories.length > 0 ? (
          <div className="subcategories-grid">
            {categorySubcategories.map(subcat => (
              <Card 
                key={subcat.id} 
                size="small" 
                className="subcat-card"
                title={
                  <div className="subcat-header">
                    <Text strong>{subcat.name}</Text>
                    <Tag color="blue">{`ID: ${subcat.id}`}</Tag>
                  </div>
                }
              >
                <div className="subcat-content">
                  <div className="subcat-info">
                    <Text type="secondary">Description:</Text>
                    <Text>{subcat.description || 'No description'}</Text>
                  </div>
                  
                  {Object.keys(subcat.dynamic_fields || {}).length > 0 && (
                    <div className="dynamic-fields">
                      <Text type="secondary" strong>Dynamic Fields:</Text>
                      <div className="fields-grid">
                        {Object.entries(subcat.dynamic_fields).map(([fieldName, field]) => (
                          <div key={fieldName} className="field-item">
                            <Text strong>{fieldName}</Text>
                            <Space>
                              <Tag color="cyan">{field.type}</Tag>
                              {field.unit && <Tag color="purple">{field.unit}</Tag>}
                              <Tag color={field.required ? "success" : "default"}>
                                {field.required ? "Required" : "Optional"}
                              </Tag>
                            </Space>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="subcat-footer">
                    <Text type="secondary">Created: {new Date(subcat.created_at).toLocaleString()}</Text>
                    <Text type="secondary">By: {subcat.created_by}</Text>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="No subcategories found for this category" />
        )}
      </Card>
    );
  };

  // Update the handleTabChange function
  const handleTabChange = async (key) => {
    const category = categories[parseInt(key)];
    if (category) {
      setSelectedCategory(category);
      setSelectedCategoryDetails(category);
      
      try {
        // Fetch subcategories using store function
        const subcats = await fetchSubcategoriesForCategory(category.id);
        setSubcategories(subcats);
        
        // If there are subcategories, fetch items for the first one
        if (subcats.length > 0) {
          const items = await fetchItemsForSubcategory(subcats[0].id);
          setItems(items);
        }
      } catch (error) {
        message.error('Failed to fetch data');
      }
    }
  };

  // Update subcategory tab change handler
  const handleSubcategoryTabChange = async (subcategoryId) => {
    try {
      const items = await fetchItemsBySubcategory(parseInt(subcategoryId));
      setItems(items);
    } catch (error) {
      message.error('Failed to fetch items');
    }
  };

  // Update handleEditItem function
  const handleEditItem = (item) => {
    Modal.confirm({
      title: 'Edit Item',
      width: 500,
      content: (
        <Form
          form={itemForm}
          initialValues={{
            flutes: item.dynamic_data.flutes,
            length: item.dynamic_data.length,
            coating: item.dynamic_data.coating,
            diameter: item.dynamic_data.diameter
          }}
          layout="vertical"
        >
          {/* Form items remain the same */}
        </Form>
      ),
      okText: 'Save',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const values = await itemForm.validateFields();
          const updateData = {
            ...item,
            dynamic_data: {
              flutes: parseInt(values.flutes),
              length: parseFloat(values.length),
              coating: values.coating,
              diameter: parseFloat(values.diameter)
            }
          };

          await updateItem(item.id, updateData);
          message.success('Item updated successfully');
          
          // Refresh items using store function
          const updatedItems = await fetchItemsForSubcategory(item.subcategory_id);
          setItems(updatedItems);
        } catch (error) {
          message.error('Failed to update item: ' + error.message);
        }
      }
    });
  };

  // Update handleDeleteItem function
  const handleDeleteItem = async (itemId) => {
    try {
      await deleteItem(itemId);
      message.success('Item deleted successfully');
      
      // Refresh items list
      const updatedItems = await fetchItems();
      setItems(updatedItems);
    } catch (error) {
      console.error('Error deleting item:', error);
      message.error('Failed to delete item: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle item submission (add/edit)
  const handleItemSubmit = async () => {
    try {
      const values = await itemForm.validateFields();
      
      // Format dynamic fields from the form list
      const dynamicFields = {};
      values.dynamic_fields?.forEach(field => {
        dynamicFields[field.name] = {
          type: typeof field.value === 'number' ? 'float' : 'string',
          required: field.required || false,
          unit: field.unit || null,
          value: field.value
        };
      });

      const itemData = {
        item_code: values.item_code,
        subcategory_id: selectedItem.id,
        quantity: parseInt(values.quantity),
        status: values.status,
        dynamic_data: {
          flutes: parseInt(values.flutes),
          length: parseFloat(values.length),
          coating: values.coating,
          diameter: parseFloat(values.diameter),
          ...dynamicFields
        }
      };

      if (selectedItem?.item_code) {
        await updateItem(selectedItem.id, itemData);
        message.success('Item updated successfully');
      } else {
        await addItem(itemData);
        message.success('Item added successfully');
      }

      setIsItemModalVisible(false);
      setSelectedItem(null);
      itemForm.resetFields();

      // Refresh items
      if (selectedItem?.subcategory_id) {
        const updatedItems = await fetchItemsBySubcategory(selectedItem.subcategory_id);
        setItems(updatedItems);
      }
    } catch (error) {
      console.error('Error submitting item:', error);
      message.error('Failed to save item: ' + (error.message || 'Unknown error'));
    }
  };

  // Add this effect to load subcategories when category changes
  useEffect(() => {
    if (selectedCategory?.id) {
      fetchSubcategoriesForCategory(selectedCategory.id)
        .then(subcats => setSubcategories(subcats))
        .catch(error => {
          console.error('Error loading subcategories:', error);
          message.error('Failed to load subcategories');
        });
    }
  }, [selectedCategory, fetchSubcategoriesForCategory]);

  // Add this effect to load items when subcategory changes
  useEffect(() => {
    const loadItems = async () => {
      if (selectedItem?.id) {
        try {
          const fetchedItems = await fetchItemsBySubcategory(selectedItem.id);
          setItems(fetchedItems);
        } catch (error) {
          console.error('Error loading items:', error);
          message.error('Failed to load items');
        }
      }
    };

    loadItems();
  }, [selectedItem, fetchItemsBySubcategory]);

  // Update handleAddSubcategory function
  const handleAddSubcategory = async (values) => {
    try {
      if (!selectedCategory?.id) {
        message.error('Please select a category first');
        return;
      }

      const subcategoryData = {
        name: values.name,
        description: values.description || '',
        category_id: selectedCategory.id,
        dynamic_fields: {
          flutes: { 
            type: "integer", 
            required: true,
            unit: null,
            value: values.flutes ? parseInt(values.flutes) : null
          },
          length: { 
            type: "float", 
            required: true,
            unit: "mm",
            value: values.length ? parseFloat(values.length) : null
          },
          coating: { 
            type: "string", 
            required: false,
            unit: null,
            value: values.coating || ''
          },
          diameter: { 
            type: "float", 
            required: true,
            unit: "mm",
            value: values.diameter ? parseFloat(values.diameter) : null
          }
        }
      };

      await addSubcategory(subcategoryData);
      message.success('Subcategory added successfully');
      setIsSubcategoryModalVisible(false);
      subcategoryForm.resetFields();
      
      // Refresh subcategories
      const updatedSubcategories = await fetchSubcategoriesForCategory(selectedCategory.id);
      setSubcategories(updatedSubcategories);
    } catch (error) {
      console.error('Error adding subcategory:', error);
      message.error('Failed to add subcategory: ' + (error.message || 'Unknown error'));
    }
  };

  // Update handleEditSubcategory function
  const handleEditSubcategory = async (values) => {
    try {
      if (!editingSubcategory?.id) {
        message.error('No subcategory selected for editing');
        return;
      }

      const subcategoryData = {
        name: values.name,
        description: values.description || '',
        category_id: editingSubcategory.category_id,
        dynamic_fields: {
          flutes: { 
            type: "integer", 
            required: true,
            unit: null,
            value: values.flutes ? parseInt(values.flutes) : null
          },
          length: { 
            type: "float", 
            required: true,
            unit: "mm",
            value: values.length ? parseFloat(values.length) : null
          },
          coating: { 
            type: "string", 
            required: false,
            unit: null,
            value: values.coating || ''
          },
          diameter: { 
            type: "float", 
            required: true,
            unit: "mm",
            value: values.diameter ? parseFloat(values.diameter) : null
          }
        }
      };

      await updateSubcategory(editingSubcategory.id, subcategoryData);
      message.success('Subcategory updated successfully');
      setIsSubcategoryModalVisible(false);
      subcategoryForm.resetFields();
      setEditingSubcategory(null);
      
      // Refresh subcategories
      if (selectedCategory?.id) {
        const updatedSubcategories = await fetchSubcategoriesForCategory(selectedCategory.id);
        setSubcategories(updatedSubcategories);
      }
    } catch (error) {
      console.error('Error updating subcategory:', error);
      message.error('Failed to update subcategory: ' + error.message);
    }
  };

  // Update handleDeleteSubcategory function
  const handleDeleteSubcategory = (subcategoryId) => {
    Modal.confirm({
      title: 'Delete Subcategory',
      content: 'Are you sure you want to delete this subcategory? All associated items will also be deleted.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteSubcategory(subcategoryId);
          message.success('Subcategory deleted successfully');
          
          // Refresh subcategories for the current category
          if (selectedCategory?.id) {
            const updatedSubcategories = await fetchSubcategoriesForCategory(selectedCategory.id);
            setSubcategories(updatedSubcategories);
          }
        } catch (error) {
          console.error('Error deleting subcategory:', error);
          message.error('Failed to delete subcategory: ' + error.message);
        }
      }
    });
  };

  return (
    <div className="p-4">
      {/* Header */}
      <Card className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <Title level={3}>Inventory Master</Title>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            Add Category
          </Button>
        </div>
      </Card>

      {/* Main Content */}
      <Card>
        <Tabs defaultActiveKey="0" onChange={handleTabChange}>
          {categories.map((category, index) => (
            <TabPane
              tab={category.name}
              key={String(index)}
            >
              <Card className="mb-4">
                <div className="flex justify-between mb-4">
                  <div>
                    <Text strong>Description: </Text>
                    <Text>{category.description}</Text>
                  </div>
                  <Space>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => {
                        form.setFieldsValue(category);
                        setEditingId(category.id);
                        setIsModalVisible(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(category.id)}
                    >
                      Delete
                    </Button>
                  </Space>
                </div>

                <Divider />

                <div className="flex justify-between mb-4">
                  <Title level={4}>Subcategories</Title>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingSubcategory(null);
                      subcategoryForm.resetFields();
                      setSelectedCategory(category);
                      setIsSubcategoryModalVisible(true);
                    }}
                  >
                    Add Subcategory
                  </Button>
                </div>

                <Tabs type="card">
                  {subcategories
                    .filter(sub => sub.category_id === category.id)
                    .map(subcategory => (
                      <TabPane
                        tab={
                          <span>
                            {subcategory.name}
                            <Space style={{ marginLeft: 8 }}>
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSubcategory(subcategory);
                                  subcategoryForm.setFieldsValue({
                                    name: subcategory.name,
                                    description: subcategory.description,
                                    flutes: subcategory.dynamic_fields?.flutes?.value,
                                    length: subcategory.dynamic_fields?.length?.value,
                                    coating: subcategory.dynamic_fields?.coating?.value,
                                    diameter: subcategory.dynamic_fields?.diameter?.value
                                  });
                                  setIsSubcategoryModalVisible(true);
                                }}
                              />
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSubcategory(subcategory.id);
                                }}
                              />
                            </Space>
                          </span>
                        }
                        key={subcategory.id}
                      >
                        <div className="mb-4">
                          <Text type="secondary">{subcategory.description}</Text>
                        </div>

                        <div className="flex justify-between mb-4">
                          <Title level={5}>Items</Title>
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              setSelectedItem(null);
                              itemForm.resetFields();
                              setSelectedItem({ subcategory_id: subcategory.id });
                              setIsItemModalVisible(true);
                            }}
                          >
                            Add Item
                          </Button>
                        </div>

                        <Table
                          dataSource={items.filter(item => item.subcategory_id === subcategory.id)}
                          columns={[
                            {
                              title: 'Item Code',
                              dataIndex: 'item_code',
                              key: 'item_code',
                            },
                            {
                              title: 'Flutes',
                              dataIndex: ['dynamic_data', 'flutes'],
                              key: 'flutes',
                            },
                            {
                              title: 'Length (mm)',
                              dataIndex: ['dynamic_data', 'length'],
                              key: 'length',
                            },
                            {
                              title: 'Coating',
                              dataIndex: ['dynamic_data', 'coating'],
                              key: 'coating',
                            },
                            {
                              title: 'Diameter (mm)',
                              dataIndex: ['dynamic_data', 'diameter'],
                              key: 'diameter',
                            },
                            {
                              title: 'Quantity',
                              dataIndex: 'quantity',
                              key: 'quantity',
                            },
                            {
                              title: 'Status',
                              dataIndex: 'status',
                              key: 'status',
                              render: (status) => (
                                <Tag color={status === 'Active' ? 'green' : 'red'}>
                                  {status}
                                </Tag>
                              )
                            },
                            {
                              title: 'Actions',
                              key: 'actions',
                              render: (_, record) => (
                                <Space>
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => {
                                      setSelectedItem(record);
                                      itemForm.setFieldsValue({
                                        item_code: record.item_code,
                                        quantity: record.quantity,
                                        status: record.status,
                                        ...record.dynamic_data
                                      });
                                      setIsItemModalVisible(true);
                                    }}
                                  />
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteItem(record.id)}
                                  />
                                </Space>
                              )
                            }
                          ]}
                          pagination={false}
                          size="small"
                        />
                      </TabPane>
                    ))}
                </Tabs>
              </Card>
            </TabPane>
          ))}
        </Tabs>
      </Card>

      {/* Category Modal */}
      <Modal
        title={editingId ? "Edit Category" : "Add Category"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingId(null);
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input category name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

      {/* Subcategory Modal */}
      <Modal
        title={editingSubcategory ? "Edit Subcategory" : "Add Subcategory"}
        open={isSubcategoryModalVisible}
        onOk={() => {
          subcategoryForm
            .validateFields()
            .then((values) => {
              if (editingSubcategory) {
                handleEditSubcategory(values);
              } else {
                handleAddSubcategory(values);
              }
            })
            .catch((info) => {
              console.log('Validate Failed:', info);
            });
        }}
        onCancel={() => {
          setIsSubcategoryModalVisible(false);
          setEditingSubcategory(null);
          subcategoryForm.resetFields();
        }}
        width={600}
      >
        <Form
          form={subcategoryForm}
          layout="vertical"
          initialValues={editingSubcategory ? {
            name: editingSubcategory.name,
            description: editingSubcategory.description,
            flutes: editingSubcategory.dynamic_fields?.flutes?.value,
            length: editingSubcategory.dynamic_fields?.length?.value,
            coating: editingSubcategory.dynamic_fields?.coating?.value,
            diameter: editingSubcategory.dynamic_fields?.diameter?.value
          } : undefined}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input subcategory name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea />
          </Form.Item>

          <Divider>Specifications</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="flutes"
                label="Flutes"
                rules={[{ required: true, message: 'Please input number of flutes!' }]}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="length"
                label="Length (mm)"
                rules={[{ required: true, message: 'Please input length!' }]}
              >
                <Input type="number" step="0.01" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="coating"
                label="Coating"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="diameter"
                label="Diameter (mm)"
                rules={[{ required: true, message: 'Please input diameter!' }]}
              >
                <Input type="number" step="0.01" min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Item Modal */}
      <Modal
        title={selectedItem?.id ? "Edit Item" : "Add Item"}
        open={isItemModalVisible}
        onOk={handleItemSubmit}
        onCancel={() => {
          setIsItemModalVisible(false);
          setSelectedItem(null);
          itemForm.resetFields();
        }}
        width={800}
      >
        <Form form={itemForm} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="item_code"
                label="Item Code"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true }]}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="Active">Active</Select.Option>
                  <Select.Option value="Inactive">Inactive</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Specifications</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="flutes"
                label="Flutes"
                rules={[{ required: true }]}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="length"
                label="Length (mm)"
                rules={[{ required: true }]}
              >
                <Input type="number" step="0.01" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="coating"
                label="Coating"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="diameter"
                label="Diameter (mm)"
                rules={[{ required: true }]}
              >
                <Input type="number" step="0.01" min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <style jsx global>{`
        .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
          background: #fafafa;
          border: 1px solid #f0f0f0;
        }

        .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
          background: #fff;
          border-color: #1890ff;
          border-bottom: none;
        }

        .ant-card {
          box-shadow: none;
          border: 1px solid #f0f0f0;
        }

        .ant-table {
          background: #ffffff;
        }

        .ant-btn {
          border-radius: 2px;
        }

        .ant-tag {
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}

export default InventoryMaster;