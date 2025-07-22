import React, { useState, useEffect } from 'react';
import { Select, Card, Spin, Alert, Row, Col, Typography, Descriptions, Table, Tag, Progress, Button, Statistic, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const OrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [operationStatus, setOperationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://172.18.7.91:8008/api/v1/planning/all_orders');
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

  const handleOrderSelect = async (value) => {
    const selected = orders.find(order => order.production_order === value);
    if (!selected) return;

    setSelectedOrder(selected);
    setLoading(true);
    setError(null);
    
    setOperationStatus(null);

    try {
      const productionOrder = selected.production_order;

      const { data } = await axios.get(`http://172.18.7.91:8008/api/v1/operatorlogs2/production-order-operations-status/${productionOrder}`);
      setOperationStatus(data);

    } catch (err) {
      setError('Failed to fetch order details. Please check the order and try again.');
      console.error(err);
    }
    setLoading(false);
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
  ];

  // Aggregated statistics for quick insight
  const totalOps = operationStatus?.operations?.length || 0;
  const completedOps = operationStatus?.operations?.filter(op => op.is_complete).length || 0;
  const overallPercent = operationStatus ? (operationStatus.completion_percentage ?? Math.round((completedOps / totalOps) * 100)) : 0;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Order Tracking</Title>
      <Card
        style={{ marginBottom: 24 }}
        title="Select Production Order"
        extra={<Button icon={<ReloadOutlined />} onClick={fetchOrders} disabled={loading} />}>

        <Spin spinning={loading && !orders.length}>
          <Select
            showSearch
            style={{ width: '100%' }}
            placeholder="Select a Production Order or Part Number"
            onChange={handleOrderSelect}
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
            disabled={loading}
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
    </div>
  );
};

export default OrderTracking;
