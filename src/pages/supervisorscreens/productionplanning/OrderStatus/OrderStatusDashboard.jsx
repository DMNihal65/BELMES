import React, { useState, useEffect } from 'react';
import {
  Card,Table,Tag,Progress,Timeline,Input,Select,Button,Statistic,Row,
  Col,Tooltip,Badge,Modal,Form,message,Divider,Space
} from 'antd';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  FileSearchOutlined,
  CalendarOutlined,
  BellOutlined,
  CloseOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Search } = Input;
const { Option } = Select;

const OrderStatusDashboard = ({ scheduleData }) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [messageForm] = Form.useForm();
  const [isOrderDetailsVisible, setIsOrderDetailsVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // Process schedule data for customer view
  const processOrderData = () => {
    if (!scheduleData?.scheduled_operations) return [];
    return scheduleData.scheduled_operations.reduce((acc, operation) => {
      const existingOrder = acc.find(o => o.production_order === operation.production_order);
      if (existingOrder) {
        existingOrder.operations.push(operation);
        // Update progress
        const completedOps = existingOrder.operations.filter(op => 
          scheduleData.component_status[op.component]?.completed_quantity === scheduleData.component_status[op.component]?.total_quantity
        ).length;
        existingOrder.progress = (completedOps / existingOrder.operations.length) * 100;
      } else {
        acc.push({
          production_order: operation.production_order,
          customer: operation.customer || 'N/A',
          component: operation.component,
          start_date: operation.start_time,
          end_date: operation.end_time,
          status: getOrderStatus(operation, scheduleData.component_status),
          operations: [operation],
          progress: scheduleData.component_status[operation.component]?.completed_quantity 
            ? (scheduleData.component_status[operation.component].completed_quantity / 
               scheduleData.component_status[operation.component].total_quantity) * 100
            : 0
        });
      }
      return acc;
    }, []);
  };

  const getOrderStatus = (operation, componentStatus) => {
    const status = componentStatus[operation.component];
    if (!status) return 'pending';
    const now = new Date();
    const endDate = new Date(operation.end_time);
    if (status.completed_quantity === status.total_quantity) return 'completed';
    if (now > endDate) return 'delayed';
    if (status.completed_quantity > 0) return 'in_progress';
    return 'scheduled';
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
  };

  const handleMessageSubmit = (values) => {
    // Here you would implement the actual message sending logic
    message.success('Message sent successfully');
    setIsMessageModalVisible(false);
    messageForm.resetFields();
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'production_order',
      key: 'production_order',
      render: (text) => <a>{text}</a>,
    },
    {
      title: 'Component',
      dataIndex: 'component',
      key: 'component',
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => moment(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Expected Completion',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => moment(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          completed: { color: 'success', text: 'Completed', icon: <CheckCircleOutlined /> },
          in_progress: { color: 'processing', text: 'In Progress', icon: <SyncOutlined spin /> },
          delayed: { color: 'error', text: 'Delayed', icon: <ExclamationCircleOutlined /> },
          scheduled: { color: 'default', text: 'Scheduled', icon: <ClockCircleOutlined /> },
          pending: { color: 'warning', text: 'Pending', icon: <ClockCircleOutlined /> }
        };

        return (
          <Tag icon={statusConfig[status].icon} color={statusConfig[status].color}>
            {statusConfig[status].text}
          </Tag>
        );
      },
    },

    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress, record) => {
        const componentStatus = scheduleData.component_status[record.component];
        const completed = componentStatus?.completed_quantity || 0;
        const total = componentStatus?.total_quantity || 0;
        const remaining = total - completed;
        
        return (
          <div>
            <Progress 
              percent={Math.round(progress)} 
              size="small"
              format={() => `${completed}/${total}`}
            />
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
              {`Completed: ${completed} | Remaining: ${remaining}`}
            </div>
          </div>
        );
      },
    },

    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              icon={<FileSearchOutlined />} 
              onClick={() => showOrderDetails(record)}
            />
          </Tooltip>

          <Tooltip title="Send Message">
            <Button 
              icon={<MessageOutlined />} 
              onClick={() => {
                setSelectedOrder(record);
                setIsMessageModalVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const showOrderDetails = (order) => {
    setCurrentOrder(order);
    setIsOrderDetailsVisible(true);
  };


  const handleOrderDetailsClose = () => {
    setIsOrderDetailsVisible(false);
    setCurrentOrder(null);
  };


  const getTimelineItemColor = (operation, componentStatus) => {
    const status = getOrderStatus(operation, componentStatus);
    const colorMap = {
      completed: 'green',
      in_progress: 'blue',
      delayed: 'red',
      scheduled: 'gray',
      pending: 'orange'
    };
    return colorMap[status];
  };

  const orderData = processOrderData();

  const filteredOrders = orderData.filter(order => {
    const matchesSearch = 
      order.production_order.toLowerCase().includes(searchText.toLowerCase()) ||
      order.component.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });



  const getStatusCounts = () => {
    return orderData.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
  };

  const statusCounts = getStatusCounts();

  // Add statusConfig at the component level
  const statusConfig = {
    completed: { color: 'success', text: 'Completed', icon: <CheckCircleOutlined /> },
    in_progress: { color: 'processing', text: 'In Progress', icon: <SyncOutlined spin /> },
    delayed: { color: 'error', text: 'Delayed', icon: <ExclamationCircleOutlined /> },
    scheduled: { color: 'default', text: 'Scheduled', icon: <ClockCircleOutlined /> },
    pending: { color: 'warning', text: 'Pending', icon: <ClockCircleOutlined /> }
  };



  return (
    <div className="customer-view">
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={orderData.length}
              prefix={<FileSearchOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="In Progress"
              value={statusCounts.in_progress || 0}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed"
              value={statusCounts.completed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Delayed"
              value={statusCounts.delayed || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="mb-4">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Search
                placeholder="Search orders..."
                onSearch={handleSearch}
                onChange={(e) => setSearchText(e.target.value)}
                className="mb-4"
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="Filter by status"
                onChange={handleStatusFilter}
                value={statusFilter}
                allowClear
              >
                <Option value="all">All Status</Option>
                <Option value="completed">Completed</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="delayed">Delayed</Option>
                <Option value="scheduled">Scheduled</Option>
                <Option value="pending">Pending</Option>
              </Select>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="production_order"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Production Order Details</span>
            <Button 
              type="text" 
              icon={<CloseOutlined />} 
              onClick={handleOrderDetailsClose}
              style={{ marginRight: -8 }}
            />
          </div>
        }

        open={isOrderDetailsVisible}
        onCancel={handleOrderDetailsClose}
        footer={null}
        width={600}
        className="order-details-modal"
        closeIcon={null}
      >

        {currentOrder && (
          <div className="order-details-content">
            <div className="order-info">
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>Order ID:</strong> {currentOrder.production_order}</p>
                  <p><strong>Component:</strong> {currentOrder.component}</p>
                </Col>

                <Col span={12}>
                  <p><strong>Status:</strong> 
                    <Tag 
                      icon={statusConfig[currentOrder.status].icon} 
                      color={statusConfig[currentOrder.status].color}
                      style={{ marginLeft: 8 }}
                    >
                      {statusConfig[currentOrder.status].text}
                    </Tag>
                  </p>
                  <p><strong>Progress:</strong></p>
                  {(() => {
                    const componentStatus = scheduleData.component_status[currentOrder.component];
                    const completed = componentStatus?.completed_quantity || 0;
                    const total = componentStatus?.total_quantity || 0;
                    const remaining = total - completed;
                    
                    return (
                      <div>
                        <Progress 
                          percent={Math.round(currentOrder.progress)} 
                          size="small"
                          format={() => `${completed}/${total}`}
                        />
                        <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                          {`Completed: ${completed} | Remaining: ${remaining}`}
                        </div>
                      </div>
                    );
                  })()}
                </Col>
              </Row>
            </div>

            <Divider />

            <div className="operations-timeline">
              <Timeline>
                {currentOrder.operations.map((op, index) => (
                  <Timeline.Item 
                    key={index}
                    color={getTimelineItemColor(op, scheduleData.component_status)}
                  >
                    <Card size="small" className="operation-card">
                      <p><strong>{op.description}</strong></p>
                      <p><strong>Machine:</strong> {op.machine}</p>
                      <p><strong>Start:</strong> {moment(op.start_time).format('YYYY-MM-DD HH:mm')}</p>
                      <p><strong>End:</strong> {moment(op.end_time).format('YYYY-MM-DD HH:mm')}</p>
                      {scheduleData.component_status[op.component] && (() => {
                        const status = scheduleData.component_status[op.component];
                        const completed = status.completed_quantity;
                        const total = status.total_quantity;
                        const remaining = total - completed;
                        
                        return (
                          <div>
                            <Progress 
                              percent={Math.round((completed / total) * 100)} 
                              size="small"
                              format={() => `${completed}/${total}`}
                            />
                            <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                              {`Completed: ${completed} | Remaining: ${remaining}`}
                            </div>
                          </div>
                        );
                      })()}
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Send Message"
        open={isMessageModalVisible}
        onCancel={() => {
          setIsMessageModalVisible(false);
          messageForm.resetFields();
        }}
        footer={null}
      >

        <Form
          form={messageForm}
          onFinish={handleMessageSubmit}
          layout="vertical"
        >

          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please enter a subject' }]}
          >
            <Input placeholder="Enter message subject" />
          </Form.Item>

          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: 'Please enter your message' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Enter your message here..."
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Send Message
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .customer-view {
          padding: 24px;
        }
        .customer-view .ant-card {
          border-radius: 8px;
        }
        .customer-view .ant-statistic-title {
          font-size: 14px;
        }
        .customer-view .ant-progress-text {
          font-size: 12px;
        }
        .customer-view .ant-timeline {
          max-height: 400px;
          overflow-y: auto;
        }
        .customer-view .ant-table-thead > tr > th {
          background: #fafafa;
        }
        .customer-view .ant-tag {
          border-radius: 4px;
        }
        .mb-4 {
          margin-bottom: 16px;
        }
        .order-details-modal .ant-modal-header {
          border-bottom: 1px solid #f0f0f0;
          padding: 16px 24px;
        }
        .order-details-modal .ant-modal-close {
          display: none;
        }
        .order-details-modal .ant-modal-body {
          padding: 24px;
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }
        .order-details-modal .ant-modal-content {
          border-radius: 8px;
          overflow: hidden;
        }
        .order-details-content {
          max-height: 600px;
          overflow-y: auto;
        }
        .operation-card {
          margin-bottom: 8px;
          border-radius: 6px;
        }
        .operation-card .ant-card-body {
          padding: 12px;
        }
        .operation-card p {
          margin-bottom: 8px;
        }
        .operation-card p:last-child {
          margin-bottom: 0;
        }
        .order-info {
          background: #fafafa;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
};

export default OrderStatusDashboard; 
