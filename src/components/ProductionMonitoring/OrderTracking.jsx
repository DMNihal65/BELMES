import React, { useState, useEffect } from 'react';
import { Select, Card, Spin, Alert, Row, Col, Typography, Descriptions, Table, Tag, Progress, Button, Statistic, Space, Modal, Form, InputNumber, DatePicker, Input, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const OrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [operationStatus, setOperationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateOperation, setUpdateOperation] = useState(null);
  const [updateForm] = Form.useForm();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    // Clear selected order when refreshing
    setSelectedOrder(null);
    setOperationStatus(null);
    try {
      const response = await axios.get('http://172.16.0.229:1292/api/v1/planning/all_orders');
      setOrders(response.data);
    } catch (err) {
      setError('Failed to fetch production orders. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // fetch active users for operator dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://172.16.0.229:1292/api/v1/auth/api/v1/auth/users-get?active_only=true');
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };
    fetchUsers();
  }, []);

  const handleOrderSelect = async (value) => {
    const selected = orders.find(order => order.production_order === value);
    if (!selected) return;

    setSelectedOrder(selected);
    setLoading(true);
    setError(null);
    
    setOperationStatus(null);

    try {
      const productionOrder = selected.production_order;

      const { data } = await axios.get(`http://172.16.0.229:1292/api/v1/operatorlogs2/production-order-operations-status/${productionOrder}`);
      setOperationStatus(data);

    } catch (err) {
      setError('Failed to fetch order details. Please check the order and try again.');
      console.error(err);
    }
    setLoading(false);
  };

  const openUpdateModal = (record) => {
    setUpdateOperation(record);
    updateForm.resetFields();
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async () => {
    try {
      const values = await updateForm.validateFields();
      const payload = {
        operation_id: updateOperation.operation_id || updateOperation.id,
        operator_id: values.operator_id,
        quantity_completed: values.quantity_completed,
        quantity_rejected: values.quantity_rejected,
        start_time: values.start_time.toISOString(),
        end_time: values.end_time.toISOString(),
        notes: values.notes || '',
        machine_id: values.machine_id || null,
      };
      await axios.post('http://172.16.0.229:1292/api/v1/operatorlogs2/operator-log', payload);
      message.success('Quantity updated successfully');
      setShowUpdateModal(false);
      // refresh
      if (selectedOrder) {
        handleOrderSelect(selectedOrder.production_order);
      }
    } catch (err) {
      if (err?.errorFields) return; // validation errors
      console.error(err);
      message.error(err.message || 'Failed to update');
    }
  };

  const columns = [
    { title: 'Operation No', dataIndex: 'operation_number', key: 'operation_number', sorter: (a, b) => a.operation_number - b.operation_number, },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Work Center', dataIndex: 'work_center', key: 'work_center' },
    // {
    //   title: 'Status',
    //   dataIndex: 'is_complete',
    //   key: 'is_complete',
    //   render: (is_complete) => (
    //     <Tag color={is_complete ? 'success' : 'processing'}>
    //       {is_complete ? 'Completed' : 'In Progress'}
    //     </Tag>
    //   ),
    // },
    { title: 'Completed Qty', dataIndex: 'completed_quantity', key: 'completed_quantity' },
    { title: 'Rejected Qty', dataIndex: 'rejected_quantity', key: 'rejected_quantity' },
    { title: 'Required Qty', dataIndex: 'required_quantity', key: 'required_quantity' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) =>
        record.completed_quantity < record.required_quantity ? (
          <Button type="link" size="small" onClick={() => openUpdateModal(record)}>
            Update
          </Button>
        ) : null,
    },
  ];

  // Aggregated statistics for quick insight
  const totalOps = operationStatus?.operations?.length || 0;
  const completedOps = operationStatus?.operations?.filter(op => op.is_complete).length || 0;
  const overallPercent = operationStatus ? (operationStatus.completion_percentage ?? Math.round((completedOps / totalOps) * 100)) : 0;

  return (<>
    <div style={{ padding: '24px' }}>
      <Title level={2}>Order Tracking (BETA)</Title>
      <Card
        style={{ marginBottom: 24 }}
        title="Select Production Order"
        extra={<Button icon={<ReloadOutlined />} onClick={fetchOrders} disabled={loading} />}>

        <Spin spinning={loading && !orders.length}>
          <Select
            key={selectedOrder ? 'selected' : 'empty'}
            showSearch
            style={{ width: '100%' }}
            placeholder="Select a Production Order or Part Number"
            onChange={handleOrderSelect}
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
            disabled={loading}
            value={selectedOrder ? selectedOrder.production_order : undefined}
          >
            {orders.map(order => (
              <Select.Option key={order.id} value={order.production_order}>
                {`${order.production_order} - ${order.part_number} (${order.part_description})`}
              </Select.Option>
            ))}
          </Select>
        </Spin>
      </Card>

      {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}

       <Spin spinning={loading && !!selectedOrder}>
        {operationStatus && (
          <Card style={{ marginBottom: 24 }} title="Order Overview">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} lg={8} style={{ textAlign: 'center' }}>
                 <Progress 
                    type="dashboard" 
                    percent={overallPercent} 
                    strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} 
                    format={percent => `${percent}%`} 
                  />
              </Col>
              <Col xs={24} md={12} lg={16}>
                <Space size="large" style={{ marginBottom: 16 }}>
                  <Statistic title="Completed Ops" value={completedOps} suffix={`/ ${totalOps}`} />
                  <Statistic title="Required Qty" value={operationStatus.required_quantity} />
                  <Statistic title="Priority" value={operationStatus.priority} />
                </Space>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Production Order">{operationStatus.production_order}</Descriptions.Item>
                  <Descriptions.Item label="Part Number">{operationStatus.part_number}</Descriptions.Item>
                  <Descriptions.Item label="Project">{operationStatus.project}</Descriptions.Item>
                  <Descriptions.Item label="Sale Order">{operationStatus.sale_order}</Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>
        )}

        {operationStatus && (
          <Card title="Operation Details">
            <Table
              dataSource={operationStatus.operations}
              columns={columns}
              rowKey="operation_id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        )}
      </Spin>
    {/* Update Quantity Modal */}
      <Modal
        title="Update Quantity"
        open={showUpdateModal}
        onOk={handleUpdateSubmit}
        onCancel={() => setShowUpdateModal(false)}
        okText="Submit"
        destroyOnClose
      >
        <Form form={updateForm} layout="vertical">
          <Form.Item name="operator_id" label="Operator" rules={[{ required: true, message: 'Please select operator' }]}> 
            <Select placeholder="Select operator">
              {users.map(u => (
                <Select.Option key={u.id} value={u.id}>{u.username}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantity_completed" label="Quantity Completed" rules={[{ required: true, type: 'number', min: 1 }]}> 
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="quantity_rejected" label="Quantity Rejected" rules={[{ required: true, type: 'number', min: 0 }]}> 
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="start_time" label="Start Time" rules={[{ required: true }]}> 
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_time" label="End Time" rules={[{ required: true }]}> 
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="machine_id" label="Machine ID (optional)"> 
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  </> );
};

export default OrderTracking;
