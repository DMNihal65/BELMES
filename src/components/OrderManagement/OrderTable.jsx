import React, { useState } from 'react';
import { Table, Tag, Badge, Button, Space, Tooltip, Popconfirm, Modal, Form, Input, InputNumber, Select } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { message } from 'antd';
import dayjs from 'dayjs';
import useOrderStore from '../../store/order-store';

const OrderTable = ({ orders, onRefresh }) => {
  const { deleteOrder, updateOrder } = useOrderStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [form] = Form.useForm();

  // Remove polling - data will only be refreshed when parent component calls onRefresh
  // No automatic polling to prevent unnecessary API calls

  // Handle delete action
  const handleDelete = async (record) => {
    try {
      setDeletingOrder(record.id);
      await deleteOrder(record.id);
      message.success(`Order ${record.production_order} deleted successfully`);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      message.error('Failed to delete order: ' + error.message);
    } finally {
      setDeletingOrder(null);
    }
  };

  // Handle edit action
  const handleEdit = (record) => {
    setEditingOrder(record);
    form.setFieldsValue({
      part_description: record.part_description,
      required_quantity: record.required_quantity,
      launched_quantity: record.launched_quantity || 0,
      wbs_element: record.wbs_element,
      sale_order: record.sale_order,
      project: record.project?.name
    });
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      const updatedOrder = {
        ...editingOrder,
        part_description: values.part_description,
        required_quantity: values.required_quantity,
        launched_quantity: values.launched_quantity,
        wbs_element: values.wbs_element,
        sale_order: values.sale_order,
        project: {
          ...editingOrder.project,
          name: values.project
        }
      };

      await updateOrder(updatedOrder);
      message.success('Order updated successfully');
      setIsEditModalVisible(false);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      message.error('Failed to update order: ' + error.message);
    }
  };

  const columns = [
    {
      title: 'Sl.No',
      key: 'serialNumber',
      width: 80,
      render: (_, __, index) => {
        // Calculate serial number based on current page
        return ((currentPage - 1) * pageSize) + index + 1;
      },
      fixed: 'left',
    },
    {
      title: 'Part Number',
      dataIndex: 'part_number',
      key: 'part_number',
      sorter: (a, b) => a.part_number.localeCompare(b.part_number),
      searchable: true,
    },
    {
      title: 'Production Order',
      dataIndex: 'production_order',
      key: 'production_order',
      render: (text) => <a>{text}</a>,
      sorter: (a, b) => a.production_order.localeCompare(b.production_order),
    },
    {
      title: 'Project',
      key: 'project',
      render: (_, record) => (
        <div>
          <div>{record.project?.name}</div>
          <Tag color={getPriorityColor(record.project?.priority)}>
            Priority: {record.project?.priority || 'N/A'}
          </Tag>
        </div>
      ),
      sorter: (a, b) => {
        const priorityA = a.project?.priority || 999;
        const priorityB = b.project?.priority || 999;
        return priorityA - priorityB;
      },
      defaultSortOrder: 'ascend', // Sort by priority by default
    },
    {
      title: ' Description',
      dataIndex: 'part_description',
      key: 'part_description',
      render: (text) => (
        <div className="font-medium">{text}</div>
      ),
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_, record) => (
        <div>
          <div>Target: {record.required_quantity}</div>
          <div className="text-xs text-gray-500">
            Launched: {record.launched_quantity || 0}
          </div>
        </div>
      ),
      sorter: (a, b) => a.required_quantity - b.required_quantity,
    },
    {
      title: 'WBS Element',
      dataIndex: 'wbs_element',
      key: 'wbs_element',
    },
    {
      title: 'Sales Order',
      dataIndex: 'sale_order',
      key: 'sale_order',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => text ? dayjs(text).format('DD MMM YYYY') : '-',
      sorter: (a, b) => {
        if (!a.created_at || !b.created_at) return 0;
        return dayjs(a.created_at).unix() - dayjs(b.created_at).unix();
      },
    },
    {
      title: 'Status',
      key: 'status',
      fixed: 'right',
      width: 120,
      render: (_, record) => {
        const status = (record.status || 'created').toLowerCase();
        const statusConfig = {
          created: { color: '#d9d9d9', text: 'Created' }, // Blue
          in_progress: { color: '#fa8c16', text: 'In Progress' }, // Orange
          completed: { color: '#52c41a', text: 'Completed' }, // Green
          // delayed: { color: '#f5222d', text: 'Delayed' }, // Red
          default: { color: '#1890ff', text: 'Scheduled' } // Gray
        };
        
        const { color, text } = statusConfig[status] || statusConfig.default;
        
        return (
          <Tag 
            color={color}
            style={{
              color: color === '#d9d9d9' ? 'rgba(0, 0, 0, 0.65)' : '#fff',
              borderColor: color,
              backgroundColor: color === '#d9d9d9' ? '#f5f5f5' : color
            }}
          >
            {text}
          </Tag>
        );
      },
      filters: [
        { text: 'Created', value: 'created' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Completed', value: 'completed' },
        { text: 'Scheduled', value: 'scheduled' },
        // { text: 'Delayed', value: 'delayed' },
      ],
      onFilter: (value, record) => (record.status || '').toLowerCase() === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Order">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Order">
            <Popconfirm
              title="Are you sure you want to delete this order?"
              onConfirm={() => handleDelete(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                loading={deletingOrder === record.id}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Helper function to determine priority tag color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return 'red';
      case 2:
        return 'orange';
      case 3:
        return 'yellow';
      case 4:
        return 'blue';
      default:
        return 'default';
    }
  };

  // Sort orders by priority before rendering
  const sortedOrders = React.useMemo(() => {
    return [...orders].sort((a, b) => {
      const priorityA = a.project?.priority || 999;
      const priorityB = b.project?.priority || 999;
      return priorityA - priorityB;
    });
  }, [orders]);

  return (
    <>
      <Table
        columns={columns}
        dataSource={sortedOrders}
        rowKey="id"
        scroll={{ 
          x: 2000, // Increased to accommodate the new column
          y: 'calc(100vh - 420px)'
        }}
        pagination={{
          pageSize: pageSize,
          position: ['bottomCenter'],
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
          onChange: (page, newPageSize) => {
            setCurrentPage(page);
            if (pageSize !== newPageSize) {
              setPageSize(newPageSize);
              setCurrentPage(1);
            }
          },
          style: { 
            marginBottom: '8px',
            marginTop: '8px'
          }
        }}
        size="middle"
        bordered
        rowClassName={(record) => {
          const priority = record.project?.priority;
          if (priority === 1) return 'bg-red-50';
          if (priority === 2) return 'bg-orange-50';
          if (priority === 3) return 'bg-yellow-50';
          return '';
        }}
      />

      <Modal
        title="Edit Order"
        open={isEditModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setIsEditModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={editingOrder}
        >
          <Form.Item
            name="part_description"
            label="Part Description"
            rules={[{ required: true, message: 'Please enter part description' }]}
          >
            <Input />
          </Form.Item>

          {/* <Form.Item
            label="Required Quantity"
            name="required_quantity"
            rules={[{ required: true, message: 'Please input the required quantity!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item> */}
          <Form.Item
            label="Launched Quantity"
            name="launched_quantity"
            rules={[{ required: true, message: 'Please input the launched quantity!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="wbs_element"
            label="WBS Element"
            rules={[{ required: true, message: 'Please enter WBS element' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="sale_order"
            label="Sales Order"
            rules={[{ required: true, message: 'Please enter sales order' }]}
          >
            <Input />
          </Form.Item>
{/* 
          <Form.Item
            name="project"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input />
          </Form.Item> */}
        </Form>
      </Modal>
    </>
  );
};

export default OrderTable;

