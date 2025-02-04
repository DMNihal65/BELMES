import React, { useEffect, useState, useRef } from 'react';
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
  InfoCircleOutlined,
  DownOutlined
} from '@ant-design/icons';
import useInventoryStore from '../../../store/inventory-store';
import dayjs from 'dayjs';
import axios from 'axios';
import { read, utils, write } from 'xlsx';

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
  const [searchText, setSearchText] = useState('');
  const tableRef = useRef();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
    set,
  } = useInventoryStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        set({ loading: true });
        await fetchCategories();
        const subcategoriesData = await fetchAllSubcategories();
        set({ subcategories: subcategoriesData });
        const itemsData = await fetchItems();
        set({ items: itemsData });
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Failed to fetch data');
      } finally {
        set({ loading: false });
      }
    };
    fetchData();
  }, [fetchCategories, fetchAllSubcategories, fetchItems]);

  useEffect(() => {
    const refreshData = async () => {
      if (selectedCategory?.id && selectedCategory?.type === 'subcategory') {
        try {
          set({ loading: true });
          const newItems = await fetchItems();
          if (Array.isArray(newItems)) {
            set({ items: newItems });
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
          message.error('Failed to refresh data');
        } finally {
          set({ loading: false });
        }
      }
    };
    refreshData();
  }, [refreshTrigger, selectedCategory]);

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
    if (!selectedCategory || selectedCategory.type !== 'subcategory') {
      message.warning('Please select a subcategory first');
      return;
    }

    try {
      // Get the current table data
      const tableData = getTableData();
      
      // Get the subcategory to access its dynamic fields
      const subcategory = subcategories.find(sub => sub.id === selectedCategory.id);
      
      // Transform data for Excel
      const excelData = tableData.map(item => {
        const row = {
          'Item Code': item.item_code,
          'Quantity': item.quantity,
          'Available Quantity': item.available_quantity,
          'Status': item.status,
        };

        // Add dynamic fields
        if (subcategory?.dynamic_fields && item.dynamic_data) {
          Object.entries(subcategory.dynamic_fields).forEach(([fieldName, fieldConfig]) => {
            const value = item.dynamic_data[fieldName];
            if (fieldConfig.type === 'boolean') {
              row[fieldName] = value ? 'Yes' : 'No';
            } else if (fieldConfig.type === 'date' && value) {
              row[fieldName] = dayjs(value).format('YYYY-MM-DD');
            } else if (fieldConfig.unit) {
              row[fieldName] = `${value} ${fieldConfig.unit}`;
            } else {
              row[fieldName] = value;
            }
          });
        }

        return row;
      });

      // Create worksheet
      const ws = utils.json_to_sheet(excelData);

      // Create workbook
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Items');

      // Generate Excel file
      const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // Download file
      const fileName = `${subcategory?.name || 'inventory'}_items.xlsx`;
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
      console.error('Error exporting to Excel:', error);
      message.error('Failed to export Excel file');
    }
  };

  const handleDownloadTemplate = () => {
    if (!selectedCategory || selectedCategory.type !== 'subcategory') {
      message.warning('Please select a subcategory first');
      return;
    }

    try {
      const subcategory = subcategories.find(sub => sub.id === selectedCategory.id);
      if (!subcategory) {
        throw new Error('Subcategory not found');
      }

      // Get all columns from the table
      const columns = getColumns()
        .filter(col => col.key !== 'actions') // Exclude actions column
        .map(col => {
          // Handle nested dataIndex for dynamic fields
          const fieldName = Array.isArray(col.dataIndex) ? col.dataIndex[1] : col.dataIndex;
          return {
            header: typeof col.title === 'string' ? col.title : fieldName,
            key: fieldName
          };
        });

      // Create template data with example row
      const templateData = [{
        'Item Code': '',
        'Quantity': '',
        'Available Quantity': '',
        'Status': 'Active',
        ...Object.entries(subcategory.dynamic_fields || {}).reduce((acc, [fieldName, config]) => {
          acc[fieldName] = '';
          return acc;
        }, {})
      }];

      // Create worksheet with headers
      const ws = utils.json_to_sheet(templateData);

      // Customize column widths
      const colWidths = columns.map(() => ({ wch: 20 })); // Set width of 20 for all columns
      ws['!cols'] = colWidths;

      // Add notes/instructions in a separate worksheet
      const instructionsWS = utils.json_to_sheet([
        { Instructions: 'Please follow these guidelines:' },
        { Instructions: '1. Item Code: Unique identifier for the item (e.g., EM-001)' },
        { Instructions: '2. Quantity: Total quantity of the item (numeric value)' },
        { Instructions: '3. Available Quantity: Currently available quantity (numeric value)' },
        { Instructions: '4. Status: Must be either "Active" or "Inactive"' },
        { Instructions: '\nDynamic Fields:' },
        ...Object.entries(subcategory.dynamic_fields || {}).map(([fieldName, config]) => ({
          Instructions: `${fieldName}: ${getFieldInstructions(config)}`
        }))
      ], { header: ['Instructions'] });

      // Set column width for instructions
      instructionsWS['!cols'] = [{ wch: 100 }];

      // Create workbook and add worksheets
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Template');
      utils.book_append_sheet(wb, instructionsWS, 'Instructions');

      // Generate Excel file
      const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Download file
      const fileName = `${subcategory.name}_template.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      message.error('Failed to create template');
    }
  };

  // Helper function to get field instructions based on field configuration
  const getFieldInstructions = (config) => {
    let instructions = `Type: ${config.type}`;
    if (config.required) {
      instructions += ' (Required)';
    }
    if (config.unit) {
      instructions += ` (Unit: ${config.unit})`;
    }
    
    switch (config.type) {
      case 'number':
        instructions += ' - Enter numeric value';
        break;
      case 'boolean':
        instructions += ' - Enter "Yes" or "No"';
        break;
      case 'date':
        instructions += ' - Enter date in YYYY-MM-DD format';
        break;
      default:
        instructions += ' - Enter text value';
    }
    
    return instructions;
  };

  const handleExcelUpload = async (file) => {
    if (!selectedCategory || selectedCategory.type !== 'subcategory') {
      message.warning('Please select a subcategory first');
      return false;
    }

    const loadingMessage = message.loading('Processing file...', 0);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = utils.sheet_to_json(worksheet);

          const subcategory = subcategories.find(sub => sub.id === selectedCategory.id);
          if (!subcategory) {
            throw new Error('Subcategory not found');
          }

          // Validate data before sending
          for (const row of jsonData) {
            if (!row['Item Code']) {
              throw new Error('Item Code is required for all items');
            }
            if (!row['Quantity'] || isNaN(parseInt(row['Quantity']))) {
              throw new Error(`Invalid Quantity for item ${row['Item Code']}`);
            }
            if (!row['Available Quantity'] || isNaN(parseInt(row['Available Quantity']))) {
              throw new Error(`Invalid Available Quantity for item ${row['Item Code']}`);
            }
            
            // Validate dynamic fields
            for (const [fieldName, config] of Object.entries(subcategory.dynamic_fields || {})) {
              const value = row[fieldName];
              if (config.required && (value === undefined || value === null || value === '')) {
                throw new Error(`${fieldName} is required for item ${row['Item Code']}`);
              }
              if (value !== undefined && value !== null && value !== '') {
                if (config.type === 'number' && isNaN(parseFloat(value))) {
                  throw new Error(`Invalid number value for ${fieldName} in item ${row['Item Code']}`);
                }
                if (config.type === 'date') {
                  const dateValue = dayjs(value);
                  if (!dateValue.isValid()) {
                    throw new Error(`Invalid date format for ${fieldName} in item ${row['Item Code']}`);
                  }
                }
              }
            }
          }

          const formattedItems = jsonData.map(row => ({
            item_code: String(row['Item Code'] || '').trim(),
            quantity: parseInt(row['Quantity'] || 0),
            available_quantity: parseInt(row['Available Quantity'] || 0),
            status: String(row['Status'] || 'Active').trim(),
            dynamic_data: Object.entries(subcategory.dynamic_fields || {}).reduce((acc, [fieldName, config]) => {
              const value = row[fieldName];
              if (value !== undefined && value !== null && value !== '') {
                if (config.type === 'date') {
                  const dateValue = dayjs(value);
                  acc[fieldName] = dateValue.isValid() ? dateValue.format('YYYY-MM-DD') : null;
                } else if (config.type === 'number') {
                  acc[fieldName] = parseFloat(value);
                } else if (config.type === 'boolean') {
                  acc[fieldName] = value === true || value === 'true' || value === 'Yes' || value === 1;
                } else {
                  acc[fieldName] = String(value);
                }
              }
              return acc;
            }, {})
          }));

          // Log the request payload for debugging
          console.log('Request Payload:', {
            created_by: 1,
            subcategory_id: selectedCategory.id,
            items: formattedItems
          });

          try {
            const response = await axios.post(
              'http://172.18.7.85:4411/api/v1/api/inventory/items/bulk/',
              {
                created_by: 1,
                subcategory_id: selectedCategory.id,
                items: formattedItems
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                }
              }
            );

            if (response.data) {
              loadingMessage();
              message.success('Excel data imported successfully');
              setRefreshTrigger(prev => prev + 1);
            }
          } catch (error) {
            loadingMessage();
            console.error('Server Error Details:', {
              status: error.response?.status,
              data: error.response?.data,
              error: error.message
            });

            if (error.response?.status === 500) {
              message.error(
                'Server error (500). Possible issues:\n' +
                '1. Duplicate item codes\n' +
                '2. Invalid data format\n' +
                '3. Missing required fields\n' +
                'Please check your data and try again.'
              );
            } else if (error.response?.data?.detail) {
              message.error(`Upload failed: ${error.response.data.detail}`);
            } else {
              message.error('Failed to upload data. Please check the server logs for details.');
            }
          }
        } catch (error) {
          loadingMessage();
          console.error('Data Processing Error:', error);
          message.error(error.message || 'Failed to process Excel file');
        }
      };

      reader.onerror = () => {
        loadingMessage();
        message.error('Failed to read file');
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      loadingMessage();
      console.error('File Processing Error:', error);
      message.error('Failed to process file');
    }

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

  // Add search function
  const handleSearch = (value) => {
    setSearchText(value);
  };

  // Modify getTableData to include search filter
  const getTableData = () => {
    if (!selectedCategory || selectedCategory.type === 'category') {
      return [];
    }
    
    // Get items for selected subcategory
    let filteredData = items.filter(item => item.subcategory_id === selectedCategory.id);

    // Apply search filter if searchText exists
    if (searchText) {
      filteredData = filteredData.filter(item => {
        // Search in standard fields
        if (
          item.item_code?.toString().toLowerCase().includes(searchText.toLowerCase()) ||
          item.quantity?.toString().includes(searchText) ||
          item.available_quantity?.toString().includes(searchText) ||
          item.status?.toLowerCase().includes(searchText.toLowerCase())
        ) {
          return true;
        }

        // Search in dynamic fields
        if (item.dynamic_data) {
          return Object.values(item.dynamic_data).some(value => 
            value?.toString().toLowerCase().includes(searchText.toLowerCase())
          );
        }

        return false;
      });
    }

    return filteredData;
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
          // Create a dayjs object only for valid date strings
          const dateValue = dayjs(value, 'YYYY-MM-DD');
          formattedDynamicData[key] = dateValue.isValid() ? dateValue : null;
        } else {
          formattedDynamicData[key] = value;
        }
      });
    }

    form.setFieldsValue({
      ...record,
      dynamic_data: formattedDynamicData
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
        sorter: (a, b) => a.item_code.localeCompare(b.item_code),
        filterSearch: true,
        filters: [...new Set(items
          .filter(item => item.subcategory_id === selectedCategory.id)
          .map(item => item.item_code))]
          .map(code => ({ text: code, value: code })),
        onFilter: (value, record) => record.item_code === value,
      },
      {
        title: 'Quantity',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 100,
        editable: true,
        sorter: (a, b) => a.quantity - b.quantity,
        filters: [
          { text: '0', value: '0' },
          { text: '1-10', value: '1-10' },
          { text: '11-50', value: '11-50' },
          { text: '50+', value: '50+' },
        ],
        onFilter: (value, record) => {
          if (value === '0') return record.quantity === 0;
          if (value === '1-10') return record.quantity > 0 && record.quantity <= 10;
          if (value === '11-50') return record.quantity > 10 && record.quantity <= 50;
          if (value === '50+') return record.quantity > 50;
          return true;
        },
      },
      {
        title: 'Available Quantity',
        dataIndex: 'available_quantity',
        key: 'available_quantity',
        width: 150,
        editable: true,
        sorter: (a, b) => a.available_quantity - b.available_quantity,
        filters: [
          { text: '0', value: '0' },
          { text: '1-10', value: '1-10' },
          { text: '11-50', value: '11-50' },
          { text: '50+', value: '50+' },
        ],
        onFilter: (value, record) => {
          if (value === '0') return record.available_quantity === 0;
          if (value === '1-10') return record.available_quantity > 0 && record.available_quantity <= 10;
          if (value === '11-50') return record.available_quantity > 10 && record.available_quantity <= 50;
          if (value === '50+') return record.available_quantity > 50;
          return true;
        },
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        editable: true,
        filters: [
          { text: 'Active', value: 'Active' },
          { text: 'Inactive', value: 'Inactive' },
        ],
        onFilter: (value, record) => record.status === value,
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
        const uniqueValues = [...new Set(items
          .filter(item => item.subcategory_id === selectedCategory.id)
          .map(item => item.dynamic_data?.[fieldName])
          .filter(value => value !== undefined && value !== null)
        )];

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
          sorter: (a, b) => {
            const aValue = a.dynamic_data?.[fieldName];
            const bValue = b.dynamic_data?.[fieldName];
            if (fieldConfig.type === 'number') {
              return (aValue || 0) - (bValue || 0);
            }
            if (fieldConfig.type === 'date') {
              return dayjs(aValue).unix() - dayjs(bValue).unix();
            }
            return String(aValue || '').localeCompare(String(bValue || ''));
          },
          filters: uniqueValues.map(value => ({
            text: fieldConfig.type === 'boolean' 
              ? (value ? 'Yes' : 'No')
              : fieldConfig.type === 'date'
              ? dayjs(value).format('YYYY-MM-DD')
              : String(value),
            value: String(value)
          })),
          onFilter: (value, record) => {
            const recordValue = record.dynamic_data?.[fieldName];
            if (fieldConfig.type === 'boolean') {
              return String(recordValue) === value;
            }
            if (fieldConfig.type === 'date') {
              return dayjs(recordValue).format('YYYY-MM-DD') === value;
            }
            return String(recordValue) === value;
          },
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
          subcategory_id: selectedCategory.id
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

  // Update the table title section
  const renderTableTitle = () => (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <Text strong className="whitespace-nowrap">
            {selectedCategory 
              ? `${selectedCategory.type === 'category' ? 'Category' : 'Subcategory'} Items` 
              : 'All Items'}
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input.Search
            placeholder="Search in all columns..."
            allowClear
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ 
              width: '100%',
              minWidth: '200px',
              maxWidth: '300px'
            }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddItemClick}
          >
            Add Item
          </Button>
          {selectedCategory?.type === 'subcategory' && (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'download',
                    icon: <DownloadOutlined />,
                    label: 'Download Template',
                    onClick: handleDownloadTemplate
                  },
                  {
                    key: 'upload',
                    icon: <UploadOutlined />,
                    label: (
                      <Upload
                        accept=".xlsx,.xls"
                        beforeUpload={handleExcelUpload}
                        showUploadList={false}
                      >
                        Upload Excel
                      </Upload>
                    )
                  }
                ]
              }}
            >
              <Button icon={<ImportOutlined />}>
                Import <DownOutlined />
              </Button>
            </Dropdown>
          )}
          <Button 
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  );

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
          <div className="flex-1 min-w-0 flex flex-col">
            <Card className="flex-1" bodyStyle={{ height: '100%', padding: '16px', overflow: 'auto' }}>
              {!selectedCategory ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Title level={4} type="secondary">Please select a category from the left sidebar</Title>
                    <Text type="secondary">Select a category or subcategory to view its items</Text>
                  </div>
                </div>
              ) : selectedCategory.type === 'category' ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Title level={4} type="secondary">Please select a subcategory</Title>
                    <Text type="secondary">Select a subcategory from {categories.find(c => c.id === selectedCategory.id)?.name} to view its items</Text>
                  </div>
                </div>
              ) : (
                <Form form={form} component={false} className="h-full">
                  <Table
                    ref={tableRef}
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
                      pageSize: 10,
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
        width={modalType === 'subcategory' ? '90vw' : '70vw'}
        style={{ 
          maxWidth: modalType === 'subcategory' ? '800px' : '600px',
          top: 20
        }}
        bodyStyle={{ 
          maxHeight: 'calc(100vh - 200px)',
          overflow: 'auto'
        }}
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
};

export default InventoryAllData; 

