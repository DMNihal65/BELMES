import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, Switch, Divider, message, Tooltip, Card, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, PlusCircleOutlined } from '@ant-design/icons';
import usePokayokeStore from '../../../store/pokayoke-store';

const { Option } = Select;
const { TextArea } = Input;

const ChecklistsTab = () => {
  const { checklists, checklist, loading, error, fetchChecklists, fetchChecklist, createChecklist, addChecklistItem, deleteChecklist } = usePokayokeStore();
  
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState(null);
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();
  
  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);
  
  const handleCreateChecklist = () => {
    setIsCreateModalVisible(true);
  };
  
  const handleAddItem = (checklistId) => {
    setSelectedChecklistId(checklistId);
    setIsItemModalVisible(true);
  };
  
  const handleViewChecklist = async (checklistId) => {
    await fetchChecklist(checklistId);
    setIsViewModalVisible(true);
  };
  
  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Format items with proper structure if provided
      let items = [];
      if (values.items && values.items.length > 0) {
        items = values.items.map(item => ({
          item_text: item.item_text,
          item_type: item.item_type,
          is_required: !!item.is_required,
          expected_value: item.expected_value || null
        }));
      }
      
      const checklistData = {
        name: values.name,
        description: values.description,
        items
      };
      
      const result = await createChecklist(checklistData);
      if (result) {
        message.success('Checklist created successfully');
        form.resetFields();
        setIsCreateModalVisible(false);
      }
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };
  
  const handleAddItemSubmit = async () => {
    try {
      const values = await itemForm.validateFields();
      
      const itemData = {
        checklist_id: selectedChecklistId,
        item_text: values.item_text,
        item_type: values.item_type,
        is_required: values.is_required,
        expected_value: values.expected_value || null
      };
      
      const result = await addChecklistItem(itemData);
      if (result) {
        message.success('Item added successfully');
        itemForm.resetFields();
        setIsItemModalVisible(false);
        // Refresh the checklist data
        fetchChecklists();
      }
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };

  const handleDeleteChecklist = async (checklistId, checklistName) => {
    try {
      const result = await deleteChecklist(checklistId);
      if (result) {
        message.success(`Checklist "${checklistName}" has been deleted successfully`);
        // Refresh the checklists list
        fetchChecklists();
      }
    } catch (error) {
      console.error('Error deleting checklist:', error);
      message.error('Failed to delete checklist. Please try again.');
    }
  };
  
  const columns = [
    {
      title: 'Sl No',
      key: 'sl_no',
      width: '5%',
      render: (_, __, index) => index + 1,
    },
    // {
    //   title: 'ID',
    //   dataIndex: 'id',
    //   key: 'id',
    //   width: '5%',
    // },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '20%',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '35%',
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      width: '10%',
      render: (items) => items?.length || 0,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '15%',
      render: (date) => {
        if (!date) return '-';
        
        // Log the raw date for debugging
        console.log('Raw date from API:', date);
        
        // Create a date object and account for timezone offset
        const dateObj = new Date(date);
        const timezoneOffset = dateObj.getTimezoneOffset() * 60000; // in milliseconds
        const localDate = new Date(dateObj.getTime() - timezoneOffset);
        
        // Format the date manually
        const formattedDate = localDate.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        
        console.log('Formatted date:', formattedDate);
        return formattedDate;
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: '5%',
      render: (active) => (
        <Tag color={active ? 'success' : 'error'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '15%',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Checklist">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => handleViewChecklist(record.id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Add Item">
            <Button 
              icon={<PlusCircleOutlined />} 
              onClick={() => handleAddItem(record.id)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Delete Checklist"
            description={
              <div>
                <p>Are you sure you want to delete this checklist?</p>
                <p className="text-red-500 font-medium">
                  <strong>Warning:</strong> This checklist will be deleted from all machines assigned to it.
                </p>
                <p className="text-sm text-gray-600">
                  Checklist: <strong>{record.name}</strong>
                </p>
              </div>
            }
            onConfirm={() => handleDeleteChecklist(record.id, record.name)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okType="danger"
            placement="topRight"
          >
            <Tooltip title="Delete Checklist">
              <Button 
                icon={<DeleteOutlined />} 
                danger
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  const itemsColumns = [
    // {
    //   title: 'Sl No',
    //   key: 'sl_no',
    //   width: '5%',
    //   render: (_, __, index) => index + 1,
    // },
    // {
    //   title: 'ID',
    //   dataIndex: 'id',
    //   key: 'id',
    //   width: '5%',
    // },
    {
      title: 'Sequence',
      dataIndex: 'sequence_number',
      key: 'sequence_number',
      width: '10%',
    },
    {
      title: 'Item Text',
      dataIndex: 'item_text',
      key: 'item_text',
      width: '40%',
    },
    {
      title: 'Type',
      dataIndex: 'item_type',
      key: 'item_type',
      width: '15%',
      render: (type) => (
        <Tag color={type === 'boolean' ? 'blue' : type === 'numerical' ? 'green' : 'purple'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Required',
      dataIndex: 'is_required',
      key: 'is_required',
      width: '10%',
      render: (required) => (
        <Tag color={required ? 'red' : 'default'}>
          {required ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Expected Value',
      dataIndex: 'expected_value',
      key: 'expected_value',
      width: '20%',
      render: (value) => value || '-',
    },
    
  ];
  
  return (
    <div>
      <div className="flex justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium">Manage Checklists</h2>
          <p className="text-sm text-gray-500">Create and manage PokaYoke checklists for your machines</p>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreateChecklist}
        >
          Create New Checklist
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={checklists}
        rowKey="id"
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
      />
      
      {/* Create Checklist Modal */}
      <Modal
        title="Create New Checklist"
        open={isCreateModalVisible}
        onCancel={() => {
          form.resetFields();
          setIsCreateModalVisible(false);
        }}
        onOk={handleCreateSubmit}
        width={700}
        okText="Create"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Checklist Name"
            rules={[{ required: true, message: 'Please enter the checklist name' }]}
          >
            <Input placeholder="e.g., CNC Machine Startup Checklist" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <TextArea 
              placeholder="Describe the purpose of this checklist" 
              rows={4} 
            />
          </Form.Item>
          
          <Divider orientation="left">Initial Items (Optional)</Divider>
          <p className="text-sm text-gray-500 mb-4">You can add items later or add some initial items now</p>
          
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card 
                    key={key} 
                    size="small" 
                    className="mb-4"
                    extra={
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => remove(name)} 
                      />
                    }
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'item_text']}
                      label="Item Text"
                      rules={[{ required: true, message: 'Please enter item text' }]}
                    >
                      <Input placeholder="e.g., Check if safety guards are in place" />
                    </Form.Item>
                    
                    <div className="flex gap-4">
                      <Form.Item
                        {...restField}
                        name={[name, 'item_type']}
                        label="Item Type"
                        rules={[{ required: true, message: 'Please select the item type' }]}
                        className="w-1/3"
                      >
                        <Select placeholder="Select type">
                          <Option value="boolean">Boolean (Yes/No)</Option>
                          <Option value="numerical">Numerical</Option>
                          <Option value="text">Text</Option>
                        </Select>
                      </Form.Item>
                      
                      <Form.Item
                        {...restField}
                        name={[name, 'is_required']}
                        label="Required"
                        valuePropName="checked"
                        className="w-1/3"
                      >
                        <Switch />
                      </Form.Item>
                      
                      <Form.Item
                        {...restField}
                        name={[name, 'expected_value']}
                        label="Expected Value"
                        className="w-1/3"
                        tooltip="For numerical items, you can specify expected values like '>=50' or '18-25'"
                        rules={[{ required: true, message: 'Please enter the expected value' }]}
                      >
                        <Input placeholder="e.g., >=50, 18-25" />
                      </Form.Item>
                    </div>
                  </Card>
                ))}
                
                <Form.Item>
                  <Button 
                    type="dashed" 
                    onClick={() => add()} 
                    block 
                    icon={<PlusOutlined />}
                  >
                    Add Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
      
      {/* Add Item Modal */}
      <Modal
        title="Add Item to Checklist"
        open={isItemModalVisible}
        onCancel={() => {
          itemForm.resetFields();
          setIsItemModalVisible(false);
        }}
        onOk={handleAddItemSubmit}
        width={600}
        okText="Add Item"
      >
        <Form
          form={itemForm}
          layout="vertical"
        >
          <Form.Item
            name="item_text"
            label="Item Text"
            rules={[{ required: true, message: 'Please enter item text' }]}
          >
            <Input placeholder="e.g., Check if safety guards are in place" />
          </Form.Item>
          
          <div className="flex gap-4">
            <Form.Item
              name="item_type"
              label="Item Type"
              rules={[{ required: true, message: 'Please select the item type' }]}
              className="w-1/3"
            >
              <Select placeholder="Select type">
                <Option value="boolean">Boolean (Yes/No)</Option>
                <Option value="numerical">Numerical</Option>
                <Option value="text">Text</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="is_required"
              label="Required"
              valuePropName="checked"
              initialValue={true}
              className="w-1/3"
            >
              <Switch defaultChecked />
            </Form.Item>
            
            <Form.Item
              name="expected_value"
              label="Expected Value"
              className="w-1/3"
              tooltip="For numerical items, you can specify expected values like '>=50' or '18-25'"
              rules={[{ required: true, message: 'Please enter the expected value' }]}
            >
              <Input placeholder="e.g., >=50, 18-25" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
      
      {/* View Checklist Modal */}
      <Modal
        title={checklist?.name || 'Checklist Details'}
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {checklist && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium">Description</h3>
              <p>{checklist.description}</p>
            </div>
            
            <div className="mb-4 flex gap-4">
              <div>
                <span className="text-gray-500">Created At:</span>
                <span className="ml-2">
                  {checklist.created_at ? (() => {
                    const dateObj = new Date(checklist.created_at);
                    const timezoneOffset = dateObj.getTimezoneOffset() * 60000;
                    const localDate = new Date(dateObj.getTime() - timezoneOffset);
                    return localDate.toLocaleString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    });
                  })() : '-'}
                </span>
              </div>
              
              <div>
                <span className="text-gray-500">Status:</span>
                <Tag className="ml-2" color={checklist.is_active ? 'success' : 'error'}>
                  {checklist.is_active ? 'Active' : 'Inactive'}
                </Tag>
              </div>
            </div>
            
            <Divider orientation="left">Checklist Items</Divider>
            
            <Table
              columns={itemsColumns}
              dataSource={[...(checklist.items || [])].sort((a, b) => (a.sequence_number ?? 0) - (b.sequence_number ?? 0))}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChecklistsTab; 