import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { Package, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const OrderStats = ({ orders }) => {
  const stats = {
    totalOrders: orders.length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    delayed: orders.filter(o => o.status === 'delayed').length,
  };

  return (
    <Row gutter={16}>
      <Col span={6}>
        <Card bordered={false} className="hover:shadow-md transition-shadow">
          <Statistic
            title="Total Orders"
            value={stats.totalOrders}
            prefix={<Package size={20} />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card bordered={false} className="hover:shadow-md transition-shadow">
          <Statistic
            title="In Progress"
            value={stats.inProgress}
            prefix={<TrendingUp size={20} />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card bordered={false} className="hover:shadow-md transition-shadow">
          <Statistic
            title="Completed"
            value={stats.completed}
            prefix={<CheckCircle2 size={20} />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card bordered={false} className="hover:shadow-md transition-shadow">
          <Statistic
            title="Delayed"

            value={stats.delayed}
            prefix={<AlertCircle size={20} />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default OrderStats; 