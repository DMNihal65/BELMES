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
  DatePicker
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
import dayjs from 'dayjs';
import axios from 'axios';

const { Title, Text } = Typography;

const InventoryAllData = () => {
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
  const handleExportExcel = async () => {
    if (!selectedCategory || selectedCategory.type !== 'subcategory') {
      message.warning('Please select a subcategory first');
      return;
    }

    try {
      // Get items for the selected subcategory
      const subcategoryItems = getTableData();
      
      const response = await axios({
        url: 'http://172.18.7.89:2222/api/v1/api/inventory/items/bulk/',
        method: 'POST',
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        data: {
          created_by: 1,
          items: subcategoryItems.map(item => ({
            item_code: item.item_code,
            quantity: item.quantity,
            available_quantity: item.available_quantity,
            status: item.status,
            dynamic_data: item.dynamic_data || {}
          })),
          subcategory_id: selectedCategory.id
        }
      });

      // Create a blob from the response data
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      // Get subcategory name for the file name
      const subcategory = subcategories.find(sub => sub.id === selectedCategory.id);
      const fileName = `${subcategory?.name || 'inventory'}_items.xlsx`;
      
      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      message.error('Failed to download Excel file: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDownloadTemplate = () => {
    window.open('http://172.18.7.89:2222/api/v1/api/inventory/items/bulk/', '_blank');
  };

  const handleExcelUpload = (file) => {
    if (!selectedCategory || selectedCategory.type !== 'subcategory') {
      message.warning('Please select a subcategory first');
      return false;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('created_by', 1);
    formData.append('subcategory_id', selectedCategory.id);

    axios.post('http://172.18.7.89:2222/api/v1/api/inventory/items/bulk/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then(response => {
      message.success('Excel file uploaded successfully');
      // Refresh the items list
      fetchItems(selectedCategory.id);
    })
    .catch(error => {
      console.error('Error uploading Excel:', error);
      message.error('Failed to upload Excel file: ' + (error.response?.data?.detail || error.message));
    });

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
      if (!selectedCategory?.id || selectedCategory?.type !== 'subcategory') {
        message.error('Please select a subcategory first');
        return;
      }

      const selectedSubcategory = subcategories.find(s => s.id === selectedCategory.id);
      if (!selectedSubcategory) {
        message.error('Invalid subcategory');
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

      message.success(`Item ${values.id ? 'updated' : 'added'} successfully`);
      setIsModalVisible(false);
      form.resetFields();
      
      // Refresh items with the current subcategory ID
      await fetchItems(selectedSubcategory.id);
    } catch (error) {
      console.error('Error submitting item:', error);
      message.error(`Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  // Update the Add Item button click handler
  const handleAddItemClick = () => {
    if (selectedCategory?.type === 'subcategory') {
      setModalType('item');
      setRightClickedNode(null);
      form.resetFields();
      form.setFieldsValue({
        status: 'Active',
        quantity: 0,
        available_quantity: 0,
        subcategory_id: selectedCategory.id
      });
      setIsModalVisible(true);
    } else {
      message.warning('Please select a subcategory to add an item');
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
      </Space>
      <Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddItemClick}
        >
          Add Item
        </Button>
        {selectedCategory?.type === 'subcategory' && (
          <Upload
            beforeUpload={handleExcelUpload}
            showUploadList={false}
            accept=".xlsx,.xls"
          >
            <Button icon={<UploadOutlined />}>Import</Button>
          </Upload>
        )}
        <Button 
          icon={<DownloadOutlined />}
          onClick={handleExportExcel}
        >
          Export
        </Button>
      </Space>
    </Space>
  );

  // Get table data based on selection
  const getTableData = () => {
    if (!selectedCategory || selectedCategory.type === 'category') {
      return [];
    }
    
    // Only show items for selected subcategory
    return items.filter(item => item.subcategory_id === selectedCategory.id);
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

  const edit = (record) => {
    const formattedDynamicData = {};
    if (record.dynamic_data) {
      Object.entries(record.dynamic_data).forEach(([key, value]) => {
        const fieldConfig = subcategories.find(sub => sub.id === record.subcategory_id)?.dynamic_fields[key];
        if (fieldConfig?.type === 'date' && value) {
          formattedDynamicData[key] = dayjs(value);
        } else {
          formattedDynamicData[key] = value;
        }
      });
    }

    form.setFieldsValue({
      ...record,
      ...formattedDynamicData
    });
    setEditingKey(record.id);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (record) => {
    try {
      const row = await form.validateFields();
      const newData = { ...record, ...row };
      
      await updateItem(record.id, {
        item_code: newData.item_code,
        quantity: parseInt(newData.quantity),
        available_quantity: parseInt(newData.available_quantity),
        status: newData.status,
        subcategory_id: record.subcategory_id,
        dynamic_data: newData.dynamic_data
      });

      setEditingKey('');
      await fetchItems(selectedCategory.id);
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  // Table columns definition
  const getColumns = () => {
    if (!selectedCategory || selectedCategory.type === 'category') {
      return [];
    }

    const columns = [
      {
        title: 'Item Code',
        dataIndex: 'item_code',
        key: 'item_code',
        width: 150,
        editable: true,
      },
      {
        title: 'Quantity',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 100,
        editable: true,
      },
      {
        title: 'Available Quantity',
        dataIndex: 'available_quantity',
        key: 'available_quantity',
        width: 150,
        editable: true,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        editable: true,
        render: (status) => (
          <Tag color={status === 'Active' ? 'green' : 'red'}>
            {status}
          </Tag>
        ),
      }
    ];

    // Get the subcategory to access its dynamic fields
    const subcategory = subcategories.find(sub => sub.id === selectedCategory.id);
    if (subcategory?.dynamic_fields) {
      Object.entries(subcategory.dynamic_fields).forEach(([fieldName, fieldConfig]) => {
        columns.push({
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
          editable: true,
          fieldConfig: fieldConfig,
          render: (value) => {
            if (fieldConfig.type === 'boolean') {
              return value ? 'Yes' : 'No';
            }
            if (fieldConfig.unit) {
              return `${value} ${fieldConfig.unit}`;
            }
            if (fieldConfig.type === 'date' && value) {
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
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button
              type="link"
              onClick={() => save(record)}
              style={{ marginRight: 8 }}
            >
              Save
            </Button>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <Button type="link">Cancel</Button>
            </Popconfirm>
          </Space>
        ) : (
          <Space>
            <Button
              type="text"
              icon={<EditOutlined />}
              disabled={editingKey !== ''}
              onClick={() => edit(record)}
            />
            <Popconfirm
              title="Delete Item"
              description="Are you sure you want to delete this item?"
              onConfirm={async () => {
                try {
                  await deleteItem(record.id);
                  message.success('Item deleted successfully');
                  await fetchItems(selectedCategory.id);
                } catch (error) {
                  console.error('Error deleting item:', error);
                  message.error('Failed to delete item');
                }
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Space>
        );
      },
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
      message.error('Please select a subcategory first');
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
    <div className="bg-white p-6 rounded-lg shadow">
      <Title level={4}>Inventory Master Data</Title>
      <Divider />
      
      {/* Top Action Bar */}
      <div className="mb-6">
        <Space wrap>
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
          <Upload
            beforeUpload={handleExcelUpload}
            showUploadList={false}
            accept=".xlsx,.xls"
          >
            <Button icon={<UploadOutlined />}>Import Excel</Button>
          </Upload>
          <Button 
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
          >
            Export to Excel
          </Button>
          <Button 
            icon={<SettingOutlined />}
            onClick={() => {/* Implement column settings */}}
          >
            Column Settings
          </Button>
        </Space>
      </div>
      
      <div className="flex gap-6" style={{ minHeight: 'calc(100vh - 250px)' }}>
        {/* Collapsible Category Tree */}
        <div 
          className={`transition-all duration-300 flex-shrink-0`}
          style={{ 
            width: isSidebarCollapsed ? '80px' : '300px',
            minWidth: isSidebarCollapsed ? '80px' : '300px'
          }}
        >
          <Card 
            className="h-full"
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
            bodyStyle={{ padding: isSidebarCollapsed ? '12px 8px' : '24px' }}
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
                      icon={<FolderOutlined />}
                      onClick={() => {
                        setSelectedCategory({ type: 'category', id: category.id });
                        setBreadcrumbItems([
                          { title: 'Inventory' },
                          { title: category.name }
                        ]);
                      }}
                      className="w-full !flex items-center justify-center"
                    />
                  </Tooltip>
                ))}
              </div>
            ) : (
              <div>
                <Space className="mb-2">
                  <Tooltip title="Expand All">
                    <Button 
                      type="text" 
                      size="small"
                      icon={<FolderOpenOutlined />}
                      onClick={handleExpandAll}
                    />
                  </Tooltip>
                  <Tooltip title="Collapse All">
                    <Button 
                      type="text" 
                      size="small"
                      icon={<CompressOutlined />}
                      onClick={handleCollapseAll}
                    />
                  </Tooltip>
                </Space>
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
              </div>
            )}
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <Breadcrumb items={breadcrumbItems} />
            {selectedCategory && (
              <div className="mt-2">
                <Title level={5}>
                  {selectedCategory.type === 'category' 
                    ? categories.find(c => c.id === selectedCategory.id)?.name
                    : subcategories.find(s => s.id === selectedCategory.id)?.name}
                </Title>
                <Text type="secondary">
                  {selectedCategory.type === 'category'
                    ? categories.find(c => c.id === selectedCategory.id)?.description
                    : subcategories.find(s => s.id === selectedCategory.id)?.description}
                </Text>
              </div>
            )}
          </div>
          
          <Card>
            {!selectedCategory ? (
              <div className="text-center py-12">
                <Title level={4} type="secondary">Please select a category from the left sidebar</Title>
                <Text type="secondary">Select a category or subcategory to view its items</Text>
              </div>
            ) : selectedCategory.type === 'category' ? (
              <div className="text-center py-12">
                <Title level={4} type="secondary">Please select a subcategory</Title>
                <Text type="secondary">Select a subcategory from {categories.find(c => c.id === selectedCategory.id)?.name} to view its items</Text>
              </div>
            ) : (
              <Form form={form} component={false}>
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
                  rowSelection={{
                    type: 'checkbox',
                  }}
                  loading={isLoading}
                  title={renderTableTitle}
                  rowKey="id"
                  pagination={{
                    onChange: cancel,
                  }}
                />
              </Form>
            )}
          </Card>
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
    </div>
  );
};

export default InventoryAllData; 