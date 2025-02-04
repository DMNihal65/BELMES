import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Tree, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Space, 
  Tooltip, 
  Tag,
  Dropdown,
  Menu,
  Typography,
  Divider,
  Badge,
  message,
  Select,
  Popconfirm,
  Breadcrumb,
  Upload,
  Switch,
  InputNumber,
  DatePicker,
  Empty
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SettingOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  FileOutlined,
  MoreOutlined,
  ImportOutlined,
  ExportOutlined,
  AppstoreAddOutlined,
  CopyOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  CompressOutlined,
  FileExcelOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import useInventoryStore from '../../../store/inventory-store';

const { Title, Text } = Typography;

const InventoryMasterData = () => {
  // State management
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('category');
  const [rightClickedNode, setRightClickedNode] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [breadcrumbItems, setBreadcrumbItems] = useState([{ title: 'Inventory' }]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [form] = Form.useForm();

  // Store hooks
  const { 
    categories, 
    subcategories,
    items,
    fetchCategories,
    fetchAllSubcategories,
    fetchItems,
    addCategory,
    addSubcategory,
    addItem,
    updateCategory,
    updateSubcategory,
    updateItem,
    deleteCategory,
    deleteSubcategory,
    deleteItem,
    isLoading,
    error,
  } = useInventoryStore();

  useEffect(() => {
    const fetchData = async () => {
      await fetchCategories();
      await fetchAllSubcategories();
      await fetchItems();
    };
    fetchData();
  }, [fetchCategories, fetchAllSubcategories, fetchItems]);

  // Add context menu handler
  const getContextMenu = (node) => {
    const isCategory = node?.key?.startsWith('category-');
    
    return {
      items: [
        {
          key: 'add',
          icon: <PlusOutlined />,
          label: isCategory ? 'Add Subcategory' : 'Add Item',
          onClick: () => {
            setModalType(isCategory ? 'subcategory' : 'item');
            setRightClickedNode(node);
            form.resetFields(); // Reset form when adding new
            setIsModalVisible(true);
          }
        },
        {
          key: 'edit',
          icon: <EditOutlined />,
          label: 'Edit',
          onClick: () => {
            setModalType(isCategory ? 'category' : 'subcategory');
            setRightClickedNode(node);
            // Set form values for editing
            form.setFieldsValue({
              ...node.data,
              dynamic_fields: node.data.dynamic_fields ? 
                Object.entries(node.data.dynamic_fields).map(([name, config]) => ({
                  name,
                  type: config.type,
                  required: config.required,
                  unit: config.unit
                })) : []
            });
            setIsModalVisible(true);
          }
        },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: 'Delete',
          danger: true,
          onClick: () => {
            Modal.confirm({
              title: `Are you sure you want to delete this ${isCategory ? 'category' : 'subcategory'}?`,
              content: 'This action cannot be undone.',
              okText: 'Yes',
              okType: 'danger',
              cancelText: 'No',
              onOk: () => handleDelete(node.data)
            });
          }
        }
      ]
    };
  };

  // Modify getTreeData to include right-click functionality
  const getTreeData = () => {
    return categories.map(category => ({
      key: `category-${category.id}`,
      data: category,
      title: (
        <Dropdown
          trigger={['contextMenu']}
          menu={getContextMenu({ key: `category-${category.id}`, data: category })}
          overlayStyle={{ width: 200 }}
        >
          <Space>
            <FolderOutlined />
            <span>{category.name}</span>
            <Tag color="blue">
              {subcategories.filter(sub => sub.category_id === category.id).length}
            </Tag>
          </Space>
        </Dropdown>
      ),
      children: subcategories
        .filter(sub => sub.category_id === category.id)
        .map(sub => ({
          key: `subcategory-${sub.id}`,
          data: sub,
          title: (
            <Dropdown
              trigger={['contextMenu']}
              menu={getContextMenu({ key: `subcategory-${sub.id}`, data: sub })}
              overlayStyle={{ width: 200 }}
            >
              <Space>
                <FileOutlined />
                <span>{sub.name}</span>
                <Tooltip title="Dynamic Fields">
                  <Tag color="green">
                    {Object.keys(sub.dynamic_fields || {}).length}
                  </Tag>
                </Tooltip>
              </Space>
            </Dropdown>
          ),
        }))
    }));
  };

  // Handlers
  const handleExportExcel = () => {
    message.success('Exporting to Excel...');
  };

  const handleExcelUpload = (file) => {
    message.success('Processing Excel file...');
    return false;
  };

  const handleCollapseAll = () => {
    setExpandedKeys([]);
  };

  const handleExpandAll = () => {
    setExpandedKeys(categories.map(cat => `category-${cat.id}`));
  };

  const handleEdit = (record) => {
    setModalType(record.category_id ? 'subcategory' : 'category');
    setRightClickedNode({ data: record });
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (record) => {
    try {
      let result;
      if (record.category_id) {
        // This is a subcategory
        result = await deleteSubcategory(record.id);
      } else {
        // This is a category
        result = await deleteCategory(record.id);
      }
      
      if (result) {
        message.success(`${record.category_id ? 'Subcategory' : 'Category'} deleted successfully`);
        // Refresh both categories and subcategories
        await fetchCategories();
        await fetchAllSubcategories();
      }
    } catch (error) {
      message.error(`Error: ${error.message}`);
    }
  };

  // Add category/subcategory form handler
  const handleFormSubmit = async (values) => {
    try {
      let result;
      if (modalType === 'category') {
        if (rightClickedNode?.data?.id) {
          result = await updateCategory(rightClickedNode.data.id, {
            name: values.name,
            description: values.description
          });
        } else {
          result = await addCategory({
            name: values.name,
            description: values.description,
            created_by: 1
          });
        }
      } else if (modalType === 'subcategory') {
        // Transform dynamic fields into required format
        const dynamicFields = {};
        values.dynamic_fields?.forEach(field => {
          if (field.name) {
            dynamicFields[field.name] = {
              type: field.type,
              required: field.required || false,
              unit: field.unit || null
            };
          }
        });

        const isEditing = rightClickedNode?.data?.id && !rightClickedNode?.key?.startsWith('category-');
        
        if (isEditing) {
          result = await updateSubcategory(rightClickedNode.data.id, {
            name: values.name,
            description: values.description,
            category_id: rightClickedNode.data.category_id,
            dynamic_fields: dynamicFields
          });
        } else {
          result = await addSubcategory({
            name: values.name,
            description: values.description,
            category_id: rightClickedNode.data.id,
            dynamic_fields: dynamicFields,
            created_by: 1
          });
        }
      }

      if (result) {
        setIsModalVisible(false);
        form.resetFields();
        message.success(`${modalType} ${rightClickedNode?.data?.id ? 'updated' : 'added'} successfully`);
        await fetchCategories();
        await fetchAllSubcategories();
      }
    } catch (error) {
      message.error(`Error: ${error.message}`);
    }
  };

  // Handle item form submission
  const handleItemFormSubmit = async (values) => {
    try {
      const itemData = {
        item_code: values.item_code,
        dynamic_data: values.dynamic_data,
        quantity: values.quantity,
        available_quantity: values.available_quantity,
        status: values.status,
        subcategory_id: selectedCategory.id,
        created_by: 1
      };

      const result = await addItem(itemData);

      if (result.success) {
        message.success('Item added successfully');
        setIsModalVisible(false);
        form.resetFields();
        fetchItems(selectedCategory.id);
      } else {
        message.error(result.error);
      }
    } catch (error) {
      message.error('Failed to add item');
    }
  };

  // Get table data based on selection
  const getTableData = () => {
    if (!selectedCategory) return [];
    
    if (selectedCategory.type === 'subcategory') {
      return items.filter(item => item.subcategory_id === selectedCategory.id);
    }
    
    return items.filter(item => {
      const itemSubcategory = subcategories.find(sub => sub.id === item.subcategory_id);
      return itemSubcategory?.category_id === selectedCategory.id;
    });
  };

  // Table columns definition
  const getColumns = (selectedCategory) => {
    const dynamicColumns = [];
    if (selectedCategory?.type === 'subcategory') {
      const subcategory = subcategories.find(sub => sub.id === selectedCategory.id);
      const dynamicFields = subcategory?.dynamic_fields || {};
      
      Object.entries(dynamicFields).forEach(([fieldName, fieldConfig]) => {
        dynamicColumns.push({
          title: (
            <Tooltip title={`Type: ${fieldConfig.type}${fieldConfig.unit ? `, Unit: ${fieldConfig.unit}` : ''}`}>
              <Space>
                {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                {fieldConfig.required && <Tag color="red">Required</Tag>}
              </Space>
            </Tooltip>
          ),
          dataIndex: ['dynamic_data', fieldName],
          key: fieldName,
          width: 150,
          render: (value) => {
            if (fieldConfig.unit) {
              return `${value} ${fieldConfig.unit}`;
            }
            return value;
          }
        });
      });
    }

    return dynamicColumns;
  };

  // Render item form based on subcategory dynamic fields
  const renderItemForm = (subcategory) => {
    if (!subcategory?.dynamic_fields) return null;

    return (
      <Form
        form={form}
        onFinish={handleItemFormSubmit}
        layout="vertical"
      >
        <Form.Item
          name="item_code"
          label="Item Code"
          rules={[{ required: true, message: 'Please enter item code' }]}
        >
          <Input placeholder="e.g., EM-001" />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[{ required: true, message: 'Please enter quantity' }]}
        >
          <InputNumber 
            min={0} 
            style={{ width: '100%' }} 
            onChange={(value) => {
              form.setFieldsValue({ available_quantity: value });
            }}
          />
        </Form.Item>

        <Form.Item
          name="available_quantity"
          label="Available Quantity"
          rules={[{ required: true, message: 'Please enter available quantity' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Please select status' }]}
          initialValue="Active"
        >
          <Select>
            <Select.Option value="Active">Active</Select.Option>
            <Select.Option value="Inactive">Inactive</Select.Option>
          </Select>
        </Form.Item>

        <Divider>Dynamic Fields</Divider>

        {Object.entries(subcategory.dynamic_fields).map(([fieldName, config]) => (
          <Form.Item
            key={fieldName}
            name={['dynamic_data', fieldName]}
            label={
              <Space>
                {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                {config.required && <Tag color="red">*</Tag>}
                {config.unit && <Tag color="blue">{config.unit}</Tag>}
              </Space>
            }
            rules={[{ required: config.required, message: `Please enter ${fieldName}` }]}
          >
            {config.type === 'number' || config.type === 'integer' ? (
              <InputNumber 
                style={{ width: '100%' }} 
                step={config.type === 'integer' ? 1 : 0.01}
              />
            ) : config.type === 'boolean' ? (
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            ) : config.type === 'date' ? (
              <DatePicker style={{ width: '100%' }} />
            ) : (
              <Input />
            )}
          </Form.Item>
        ))}

        <Form.Item className="mb-0 text-right">
          <Space>
            <Button onClick={() => {
              setIsModalVisible(false);
              form.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {form.getFieldValue('id') ? 'Update' : 'Create'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    );
  };

  // Update breadcrumb generation
  const updateBreadcrumb = (selectedCategory) => {
    const items = [{ title: 'Inventory' }];
    
    if (selectedCategory) {
      if (selectedCategory.type === 'category') {
        const category = categories.find(c => c.id === parseInt(selectedCategory.id));
        if (category) {
          items.push({ title: category.name });
        }
      } else if (selectedCategory.type === 'subcategory') {
        const subcategory = subcategories[selectedCategory.category_id]?.find(
          sub => sub.id === parseInt(selectedCategory.id)
        );
        const category = categories.find(c => c.id === subcategory?.category_id);
        
        if (category) {
          items.push({ title: category.name });
        }
        if (subcategory) {
          items.push({ title: subcategory.name });
        }
      }
    }
    
    setBreadcrumbItems(items);
  };

  // Update useEffect to handle breadcrumb updates
  useEffect(() => {
    updateBreadcrumb(selectedCategory);
  }, [selectedCategory, categories, subcategories]);

  return (
    <div className="bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="m-0">Inventory Master Data</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setModalType('category');
              setIsModalVisible(true);
            }}
          >
            Add Category
          </Button>
          <Upload
            beforeUpload={handleExcelUpload}
            showUploadList={false}
            accept=".xlsx,.xls"
          >
            <Button icon={<ImportOutlined />}>Import Excel</Button>
          </Upload>
          <Button icon={<ExportOutlined />} onClick={handleExportExcel}>
            Export to Excel
          </Button>
          <Button icon={<SettingOutlined />}>Column Settings</Button>
        </Space>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar */}
        <div className="w-72 flex-shrink-0">
          <Card title="Categories" className="h-full">
            <Tree
              treeData={getTreeData()}
              showLine={{ showLeafIcon: false }}
              onSelect={(selectedKeys, info) => {
                if (selectedKeys.length) {
                  const [type, id] = selectedKeys[0].split('-');
                  setSelectedCategory({ type, id: parseInt(id) });
                }
              }}
            />
          </Card>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <Breadcrumb 
            className="mb-4"
            items={breadcrumbItems.map(item => ({
              title: <a onClick={() => handleBreadcrumbClick(item.title)}>{item.title}</a>
            }))}
          />

          <Card>
            <div className="flex justify-between items-center mb-4">
              <Text>
                {selectedCategory?.type === 'subcategory' && (
                  <span>Showing items for subcategory with defined fields</span>
                )}
              </Text>
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    if (selectedCategory?.type === 'subcategory') {
                      setModalType('item');
                      setIsModalVisible(true);
                    } else {
                      message.warning('Please select a subcategory to add an item');
                    }
                  }}
                >
                  Add Item
                </Button>
                <Upload
                  beforeUpload={handleExcelUpload}
                  showUploadList={false}
                  accept=".xlsx,.xls"
                >
                  <Button icon={<UploadOutlined />}>Import</Button>
                </Upload>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={handleExportExcel}
                >
                  Export
                </Button>
              </Space>
            </div>

            <Table
              columns={getColumns(selectedCategory)}
              dataSource={selectedCategory?.type === 'subcategory' ? 
                items[parseInt(selectedCategory.id)]?.map(item => ({
                  ...item,
                  key: item.id
                })) || [] 
                : []
              }
              scroll={{ x: 'max-content' }}
              size="middle"
              rowSelection={{
                type: 'checkbox',
              }}
              loading={isLoading}
              locale={{
                emptyText: selectedCategory?.type === 'subcategory' ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No items found"
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Please select a subcategory to view items"
                  />
                )
              }}
            />
          </Card>
        </div>
      </div>

      {/* Modal */}
      <Modal
        title={
          <Space>
            {modalType === 'item' ? 'Add Item' : `Add ${modalType}`}
            {modalType === 'item' && selectedCategory && (
              <Tag color="blue">
                {subcategories[selectedCategory.category_id]?.find(
                  sub => sub.id === parseInt(selectedCategory.id)
                )?.name}
              </Tag>
            )}
          </Space>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={modalType === 'item' ? 600 : 520}
      >
        {modalType === 'item' ? (
          renderItemForm(
            subcategories[selectedCategory?.category_id]?.find(
              sub => sub.id === parseInt(selectedCategory?.id)
            )
          )
        ) : (
          <Form
            form={form}
            onFinish={handleFormSubmit}
            layout="vertical"
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter a name' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            {modalType === 'subcategory' && (
              <div className="mb-4">
                <Divider>Dynamic Fields</Divider>
                <Form.List name="dynamic_fields">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Form.Item
                            {...restField}
                            name={[name, 'name']}
                            rules={[{ required: true, message: 'Missing field name' }]}
                          >
                            <Input placeholder="Field Name" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'type']}
                            rules={[{ required: true, message: 'Missing type' }]}
                          >
                            <Select style={{ width: 120 }} placeholder="Type">
                              <Select.Option value="string">Text</Select.Option>
                              <Select.Option value="number">Number</Select.Option>
                              <Select.Option value="boolean">Boolean</Select.Option>
                              <Select.Option value="date">Date</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'unit']}
                          >
                            <Input placeholder="Unit (optional)" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'required']}
                            valuePropName="checked"
                          >
                            <Switch checkedChildren="Required" unCheckedChildren="Optional" />
                          </Form.Item>
                          <MinusCircleOutlined onClick={() => remove(name)} />
                        </Space>
                      ))}
                      <Form.Item>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          Add Field
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </div>
            )}

            <Form.Item className="mb-0 text-right">
              <Space>
                <Button onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  {rightClickedNode?.data?.id ? 'Update' : 'Create'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default InventoryMasterData; 	