import React from 'react';
import { Row, Col } from 'antd';
import { Package, TrendingUp, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import MetricCard from './OrderMetricCard'; 

const OrderStats = ({ orders }) => {
  const stats = {
    totalOrders: orders.length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    delayed: orders.filter(o => o.status === 'delayed').length,
    pending: orders.filter(o => o.status === 'pending').length,
  };

  return (
    <Row gutter={[1, 1]}>
      <Col span={4}>
          <MetricCard 
            title="Total Orders" 
            value={stats.totalOrders} 
            trend={0} // Placeholder for trend
            trendPeriod="N/A" // Placeholder for trend period
            icon={Package} 
          />
      </Col>
      <Col span={4}>
          <MetricCard 
            title="In Progress" 
            value={stats.inProgress} 
            trend={0} // Placeholder for trend
            trendPeriod="N/A" // Placeholder for trend period
            icon={TrendingUp} 
          />
      </Col>
      <Col span={4}>
          <MetricCard 
            title="Completed" 
            value={stats.completed} 
            trend={0} // Placeholder for trend
            trendPeriod="N/A" // Placeholder for trend period
            icon={CheckCircle} 
          />
      </Col>
      <Col span={4}>
          <MetricCard 
            title="Delayed" 
            value={stats.delayed} 
            trend={0} // Placeholder for trend
            trendPeriod="N/A" // Placeholder for trend period
            icon={AlertTriangle} 
          />
      </Col>
      <Col span={4}>
          <MetricCard 
            title="Pending" 
            value={stats.pending} 
            trend={0} // Placeholder for trend
            trendPeriod="N/A" // Placeholder for trend period
            icon={Clock} 
          />
      </Col>
    </Row>
  );
};

export default OrderStats;
