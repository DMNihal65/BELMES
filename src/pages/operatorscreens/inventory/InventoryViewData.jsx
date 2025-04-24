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
  Typography,
  Divider,
  Select,
  Breadcrumb,
  Switch,
  InputNumber,
  DatePicker
} from 'antd';
import { 
  PlusOutlined, 
  FolderOutlined,
  AppstoreAddOutlined,
  MinusCircleOutlined,
  CompressOutlined,
  FileExcelOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import useInventoryStore from '../../../store/inventory-store';
import dayjs from 'dayjs';
import axios from 'axios';
import RequestItemModal from '../../../components/inventory/RequestItemModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const { Title, Text } = Typography;

const InventoryViewData = () => {
  // State management
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('category');
  const [rightClickedNode, setRightClickedNode] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [breadcrumbItems, setBreadcrumbItems] = useState([{ title: 'Inventory' }]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [isRequestModalVisible, setIsRequestModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    isLoading,

  } = useInventoryStore();

  useEffect(() => {
    const fetchData = async () => {
      await fetchCategories();
      await fetchAllSubcategories();
      await fetchItems();
    };
    fetchData();
  }, [fetchCategories, fetchAllSubcategories, fetchItems]);

  // Modify getTreeData to remove right-click functionality
  const getTreeData = () => {
    return categories.map(category => ({
      key: `category-${category.id}`,
      data: category,
      title: (
        <Space onClick={() => toggleCategoryExpansion(category.id)}>
          <AppstoreAddOutlined />
          <span>{category.name}</span>
          <Tag color="blue">
            {subcategories.filter(sub => sub.category_id === category.id).length}
          </Tag>
        </Space>
      ),
      children: subcategories
        .filter(sub => sub.category_id === category.id)
        .map(sub => ({
          key: `subcategory-${sub.id}`,
          data: sub,
          title: (
            <Space>
              <FileExcelOutlined />
              <span>{sub.name}</span>
              <Tooltip title="Dynamic Fields">
                <Tag color="green">
                  {Object.keys(sub.dynamic_fields || {}).length}
                </Tag>
              </Tooltip>
            </Space>
          ),
        }))
    }));
  };

  // Add a function to toggle category expansion
  const toggleCategoryExpansion = (categoryId) => {
    setExpandedKeys(prevKeys => {
      if (prevKeys.includes(`category-${categoryId}`)) {
        return prevKeys.filter(key => key !== `category-${categoryId}`);
      } else {
        return [...prevKeys, `category-${categoryId}`];
      }
    });
  };

  // Update the expand all button icon
  const handleExpandAll = () => {
    setExpandedKeys(categories.map(cat => `category-${cat.id}`));
  };

  

  const handleCollapseAll = () => {
    setExpandedKeys([]);
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
        toast.success(`${modalType} ${rightClickedNode?.data?.id ? 'updated' : 'added'} successfully`);
        await fetchCategories();
        await fetchAllSubcategories();
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  // Handle item form submission
  const handleItemFormSubmit = async (values) => {
    try {
      if (!selectedCategory?.id || selectedCategory?.type !== 'subcategory') {
        toast.error('Please select a subcategory first');
        return;
      }

      const selectedSubcategory = subcategories.find(s => s.id === selectedCategory.id);
      if (!selectedSubcategory) {
        toast.error('Invalid subcategory');
        return;
      }

      // Format dynamic data - ensure proper type conversion
      const formattedDynamicData = {};
      if (values.dynamic_data) {
        Object.entries(values.dynamic_data).forEach(([key, value]) => {
          const fieldConfig = selectedSubcategory.dynamic_fields[key];
          switch (fieldConfig.type) {
            case 'number':
              formattedDynamicData[key] = Number(value) || 0;
              break;
            case 'boolean':
              formattedDynamicData[key] = Boolean(value);
              break;
            case 'date':
              formattedDynamicData[key] = value ? value.toISOString() : null;
              break;
            case 'string':
            default:
              formattedDynamicData[key] = String(value || '').trim();
          }
        });
      }

      const itemData = {
        item_code: String(values.item_code).trim(),
        dynamic_data: formattedDynamicData,
        quantity: Number(values.quantity) || 0,
        available_quantity: Number(values.available_quantity) || 0,
        status: values.status || 'Active',
        subcategory_id: selectedSubcategory.id,
        created_by: 1
      };

      console.log('Submitting item data:', itemData);

      let result;
      if (values.id) {
        result = await updateItem(values.id, itemData);
      } else {
        result = await addItem(itemData);
      }

      if (!result) {
        throw new Error('Operation failed');
      }

      toast.success(`Item ${values.id ? 'updated' : 'added'} successfully`);
      setIsModalVisible(false);
      form.resetFields();
      
      // Refresh items with the current subcategory ID
      await fetchItems(selectedSubcategory.id);
    } catch (error) {
      console.error('Error submitting item:', error);
      toast.error(`Error: ${error.response?.data?.detail || error.message}`);
    }
  };



  // Update the table title section
  const renderTableTitle = () => (
    <Space className="w-full justify-between">
      <Space>
        <Text strong>
          {selectedCategory 
            ? `${selectedCategory.type === 'category' ? 'Category' : 'Subcategory'} Items` 
            : 'All Items'}
        </Text>
        <Input.Search
          placeholder="Search items..."
          allowClear
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          className="min-w-[200px] max-w-[300px] flex-1 xl:flex-none"
        />
      </Space>
    </Space>
  );

  // Update the handleSearch function
  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  // Modify the getTableData function to filter based on the search term
  const getTableData = () => {
    if (!selectedCategory || selectedCategory.type === 'category') {
      return [];
    }

    // Only show items for selected subcategory
    return items.filter(item => {
      return item.subcategory_id === selectedCategory.id && 
             (item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
              Object.values(item.dynamic_data).some(val => 
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
              ));
    });
  };

  const isEditing = (record) => record.id === editingKey;

  const EditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    fieldConfig,
    ...restProps
  }) => {
    let inputNode;
    if (editing) {
      if (inputType === 'number') {
        inputNode = <InputNumber min={0} />;
      } else if (inputType === 'select') {
        inputNode = (
          <Select>
            <Select.Option value="Active">Active</Select.Option>
            <Select.Option value="Inactive">Inactive</Select.Option>
          </Select>
        );
      } else if (inputType === 'boolean') {
        inputNode = <Switch checkedChildren="Yes" unCheckedChildren="No" />;
      } else if (inputType === 'date') {
        inputNode = <DatePicker />;
      } else {
        inputNode = <Input />;
      }
    }

    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              {
                required: true,
                message: `Please Input ${title}!`,
              },
            ]}
          >
            {inputNode}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  

  const cancel = () => {
    setEditingKey('');
  };

  

  // Table columns definition
  const getColumns = () => {
    if (!selectedCategory || selectedCategory.type === 'category') {
      return [];
    }

    const columns = [];

    // Get the subcategory to access its dynamic fields
    const subcategory = subcategories.find(sub => sub.id === selectedCategory.id);
    if (subcategory?.dynamic_fields) {
      // Get dynamic fields and sort by order
      const orderedDynamicFields = Object.entries(subcategory.dynamic_fields)
        .map(([fieldName, config]) => ({
          fieldName,
          config,
          order: config.order || 0
        }))
        .sort((a, b) => a.order - b.order); // Sort by order

      // Add dynamic fields to columns in order
      orderedDynamicFields.forEach(({ fieldName, config }) => {
        columns.push({
          title: (
            <Tooltip title={`Type: ${config.type}${config.unit ? `, Unit: ${config.unit}` : ''}`}>
              <Space>
                {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
              </Space>
            </Tooltip>
          ),
          dataIndex: ['dynamic_data', fieldName],
          key: fieldName,
          width: 150,
          editable: true,
          fieldConfig: config,
          filters: [...new Set(items.map(item => item.dynamic_data[fieldName]))].map(value => ({ text: value, value })),
          onFilter: (value, record) => record.dynamic_data[fieldName] === value,
          sorter: (a, b) => {
            const aValue = a.dynamic_data[fieldName];
            const bValue = b.dynamic_data[fieldName];
            if (typeof aValue === 'number' && typeof bValue === 'number') {
              return aValue - bValue;
            }
            return aValue.toString().localeCompare(bValue.toString());
          },
          filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder={`Search ${fieldName}`}
                value={selectedKeys[0]}
                onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                onPressEnter={() => {
                  confirm();
                  handleSearch(selectedKeys[0]); // Optional: Call your search function
                }}
                style={{ marginBottom: 8, display: 'block' }}
              />
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Select options"
                onChange={(value) => {
                  setSelectedKeys(value.length ? value : []);
                  confirm();
                }}
                allowClear
              >
                {items.map(item => (
                  <Select.Option key={item.id} value={item.name}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  type="primary"
                  onClick={() => {
                    confirm();
                    handleSearch(selectedKeys[0]); // Confirm the selection
                  }}
                >
                  OK
                </Button>
                <Button
                  onClick={() => {
                    setSelectedKeys([]);
                    clearFilters();
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          ),
          render: (value) => {
            if (config.type === 'boolean') {
              return value ? 'Yes' : 'No';
            }
            if (config.unit) {
              return `${value} ${config.unit}`;
            }
            if (config.type === 'date' && value) {
              return dayjs(value).format('YYYY-MM-DD');
            }
            return value;
          }
        });
      });
    }

    // Add action column
    columns.push({
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={() => {
              setSelectedItem(record);
              setIsRequestModalVisible(true);
            }}
          >
            Request
          </Button>
        </Space>
      ),
    });

    return columns;
  };

  const mergedColumns = getColumns().map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.dataIndex === 'quantity' || col.dataIndex === 'available_quantity' 
          ? 'number' 
          : col.dataIndex === 'status' 
          ? 'select'
          : col.fieldConfig?.type || 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        fieldConfig: col.fieldConfig,
      }),
    };
  });

  // Render item form based on subcategory dynamic fields
  const renderItemForm = () => {
    const subcategory = subcategories.find(sub => sub.id === selectedCategory?.id);
    if (!subcategory) {
      toast.error('Please select a subcategory first');
      return null;
    }

    return (
      <Form
        form={form}
        onFinish={handleItemFormSubmit}
        layout="vertical"
        initialValues={{
          status: 'Active',
          quantity: 0,
          available_quantity: 0,
          subcategory_id: selectedCategory.id  // Set initial subcategory_id
        }}
      >
        <Form.Item
          name="id"
          hidden
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="subcategory_id"
          hidden
          initialValue={selectedCategory.id}  // Set initial value here as well
        >
          <Input />
        </Form.Item>

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
              // Auto-update available quantity when quantity changes
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
        >
          <Select>
            <Select.Option value="Active">Active</Select.Option>
            <Select.Option value="Inactive">Inactive</Select.Option>
          </Select>
        </Form.Item>

        <Divider>Dynamic Fields</Divider>

        {Object.entries(subcategory.dynamic_fields || {}).map(([fieldName, config]) => (
          <Form.Item
            key={fieldName}
            name={['dynamic_data', fieldName]}
            label={`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}${config.unit ? ` (${config.unit})` : ''}`}
            rules={[{ required: config.required, message: `Please enter ${fieldName}` }]}
          >
            {config.type === 'number' ? (
              <InputNumber style={{ width: '100%' }} />
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

  // Modal content renderer
  const renderModalContent = () => {
    if (modalType === 'item') {
      return renderItemForm();
    }

    return (
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
    );
  };

  return (
    <div className="bg-white p-4 lg:p-6 xl:p-8 rounded-lg shadow min-h-screen">
      <div className="flex flex-col h-full">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <Title level={4} className="m-0">Inventory Master Data</Title>
          <Space wrap className="self-start lg:self-auto">
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                setModalType('category');
                setRightClickedNode(null);
                setIsModalVisible(true);
              }}
            >
              Add Category
            </Button>
          </Space>
        </div>

        <Divider className="my-2" />
        
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 xl:gap-8 flex-1" style={{ minHeight: 0 }}>
          {/* Collapsible Category Tree */}
          <div 
            className="transition-all duration-300 flex-shrink-0 w-full lg:w-auto"
            style={{ 
              width: isSidebarCollapsed ? '80px' : '300px',
              minWidth: isSidebarCollapsed ? '80px' : '300px'
            }}
          >
            <Card 
              className="h-full"
              bodyStyle={{ 
                padding: isSidebarCollapsed ? '12px 8px' : '16px',
                height: '100%',
                overflowY: 'auto'
              }}
              title={
                <div className="flex items-center justify-between">
                  {!isSidebarCollapsed && <span>Categories</span>}
                  <Button
                    type="text"
                    icon={isSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="!flex items-center justify-center"
                  />
                </div>
              }
            >
              {isSidebarCollapsed ? (
                <div className="flex flex-col gap-2">
                  {categories.map(category => (
                    <Tooltip 
                      key={category.id} 
                      title={category.name}
                      placement="right"
                    >
                      <Button
                        type="text"
                        icon={<AppstoreAddOutlined />}
                        onClick={() => {
                          setSelectedCategory({ type: 'category', id: category.id });
                          setBreadcrumbItems([{ title: 'Inventory' }, { title: category.name }]);
                        }}
                        className="w-full !flex items-center justify-center"
                      />
                    </Tooltip>
                  ))}
                </div>
              ) : (
                <Tree
                  treeData={getTreeData()}
                  showLine={{ showLeafIcon: false }}
                  onSelect={(selectedKeys, info) => {
                    const key = selectedKeys[0];
                    if (key) {
                      const [type, id] = key.split('-');
                      setSelectedCategory({ type, id: parseInt(id) });
                      
                      // Update breadcrumb
                      const items = [{ title: 'Inventory' }];
                      if (type === 'category') {
                        const category = categories.find(c => c.id === parseInt(id));
                        if (category) {
                          items.push({ title: category.name });
                        }
                      } else if (type === 'subcategory') {
                        const subcategory = subcategories.find(s => s.id === parseInt(id));
                        const category = categories.find(c => c.id === subcategory?.category_id);
                        if (category) {
                          items.push({ title: category.name });
                        }
                        if (subcategory) {
                          items.push({ title: subcategory.name });
                        }
                      }
                      setBreadcrumbItems(items);
                    }
                  }}
                  expandedKeys={expandedKeys}
                  onExpand={setExpandedKeys}
                />
              )}
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            <Card className="flex-1" bodyStyle={{ height: '100%', padding: '16px', overflow: 'auto' }}>
              {!selectedCategory ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Title level={4} type="secondary">Please select a category from the left sidebar</Title>
                    <Text type="secondary">Select a category or subcategory to view its items</Text>
                  </div>
                </div>
              ) : (
                <Form form={form} component={false} className="h-full">
                  <div className="mb-4">
                    <Breadcrumb items={breadcrumbItems} />
                  </div>
                  <Table
                    components={{
                      body: {
                        cell: EditableCell,
                      },
                    }}
                    columns={mergedColumns}
                    dataSource={getTableData()}
                    scroll={{ x: 'max-content' }}
                    size="middle"
                    loading={isLoading}
                    title={renderTableTitle}
                    rowKey="id"
                    pagination={{
                      onChange: cancel,
                      pageSize: 5,
                      showSizeChanger: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                      position: ['bottomRight'],
                      className: 'px-4'
                    }}
                    className="border border-gray-200 rounded"
                  />
                </Form>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        title={modalType === 'item' ? 
          (form.getFieldValue('id') ? 'Edit Item' : 'Add Item') :
          (modalType === 'category' ? 'Add Category' : 
          rightClickedNode?.data?.id ? 'Edit Subcategory' : 'Add Subcategory to ' + rightClickedNode?.data?.name)}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={modalType === 'subcategory' ? 800 : 600}
      >
        {renderModalContent()}
      </Modal>

      <RequestItemModal
        visible={isRequestModalVisible}
        onCancel={() => {
          setIsRequestModalVisible(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
      />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default InventoryViewData; 