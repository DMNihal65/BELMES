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

  // Add useEffect for initial load and polling
  React.useEffect(() => {
    // Initial load
    if (onRefresh) {
      onRefresh();
    }

    // Set up polling every 10 seconds
    const intervalId = setInterval(() => {
      if (onRefresh) {
        onRefresh();
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [onRefresh]);

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
      render: (_, record) => {
        const priority = record.project?.priority;
        const priorityLabel = priority ? `Priority ${priority}` : 'N/A';
        
        return (
          <div>
            <div className="font-medium">{record.project?.name}</div>
            <span 
              className="font-bold text-sm px-3 py-1 mt-1 inline-block"
              style={{
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                cursor: 'default',
                backgroundColor: getPriorityBackgroundColor(priority),
                color: getPriorityTextColor(priority),
                border: '1px solid ' + getPriorityBorderColor(priority)
              }}
            >
              {priorityLabel}
            </span>
          </div>
        );
      },
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
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const status = record.status || 'pending';
        const statusColors = {
          in_progress: 'processing',
          completed: 'success',
          delayed: 'error',
          pending: 'default'
        };
        return (
          <Badge
            status={statusColors[status]}
            text={status.replace('_', ' ').toUpperCase()}
          />
        );
      },
      filters: [
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Completed', value: 'completed' },
        { text: 'Delayed', value: 'delayed' },
      ],
      onFilter: (value, record) => record.status === value,
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

  // Helper functions for priority styling
  const getPriorityBackgroundColor = (priority) => {
    switch (priority) {
      case 1:
        return '#fff2f0';
      case 2:
        return '#fff7e6';
      case 3:
        return '#fffbe6';
      case 4:
        return '#f0f5ff';
      default:
        return '#f5f5f5';
    }
  };

  const getPriorityTextColor = (priority) => {
    switch (priority) {
      case 1:
        return '#cf1322';
      case 2:
        return '#d46b08';
      case 3:
        return '#d48806';
      case 4:
        return '#1d39c4';
      default:
        return '#595959';
    }
  };

  const getPriorityBorderColor = (priority) => {
    switch (priority) {
      case 1:
        return '#ffccc7';
      case 2:
        return '#ffe7ba';
      case 3:
        return '#fff1b8';
      case 4:
        return '#d6e4ff';
      default:
        return '#d9d9d9';
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

  // Add custom styles for the table
  const tableStyle = {
    '.ant-table-thead > tr > th': {
      background: 'linear-gradient(to bottom, #EBF5FF, #DBEAFE)',
      color: '#1D4ED8',
      fontWeight: 'bold',
      borderBottom: '2px solid #2563EB',
      textTransform: 'uppercase',
      fontSize: '0.9rem'
    },
    '.ant-table-tbody > tr > td': {
      fontWeight: '500'
    },
    '.ant-table-tbody > tr:hover > td': {
      backgroundColor: 'inherit !important'
    }
  };

  return (
    <>
      <Table
        columns={columns.map(col => ({
          ...col,
          className: 'font-medium'
        }))}
        components={{
          header: {
            cell: props => (
              <th
                {...props}
                style={{
                  background: 'linear-gradient(to bottom, #EBF5FF, #DBEAFE)',
                  color: '#1D4ED8',
                  fontWeight: 'bold',
                  borderBottom: '2px solid #2563EB',
                  textTransform: 'uppercase',
                  fontSize: '0.9rem'
                }}
              />
            )
          }
        }}
        dataSource={sortedOrders}
        rowKey="id"
        scroll={{ 
          x: 1800
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
        className="custom-table"
        rowClassName={(record) => {
          const priority = record.project?.priority;
          if (priority === 1) return 'bg-red-100 font-medium border-l-4 border-red-500';
          if (priority === 2) return 'bg-orange-100 font-medium border-l-4 border-orange-500';
          if (priority === 3) return 'bg-yellow-100 font-medium border-l-4 border-yellow-500';
          return 'font-medium';
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

          <Form.Item
            name="required_quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
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

          <Form.Item
            name="project"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default OrderTable;

