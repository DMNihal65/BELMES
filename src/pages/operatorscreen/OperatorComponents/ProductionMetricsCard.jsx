import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Tooltip, Spin, Progress, Tabs, Button } from 'antd';
import { BarChart3, Clock, TrendingUp, Goal, AlertCircle, BarChart2, Percent } from 'lucide-react';
import useOperatorStore from '../../../store/operator-store';
import { Line, Bar } from '@ant-design/charts';

const { TabPane } = Tabs;

const ProductionMetricsCard = () => {
  const {
    selectedOperation,
    productionStats,
    fetchProductionMetrics
  } = useOperatorStore();
  
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('today'); // today, week, month
  
  // Fetch metrics based on time range
  useEffect(() => {
    const loadMetrics = async () => {
      if (!selectedOperation?.id) return;
      
      setLoading(true);
      try {
        const data = await fetchProductionMetrics(selectedOperation.id, timeRange);
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMetrics();
    // Set up polling every 5 minutes
    const interval = setInterval(loadMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedOperation?.id, timeRange, fetchProductionMetrics]);
  
  // Calculate efficiency
  const calculateEfficiency = () => {
    if (!metrics) return 0;
    return Math.round((metrics.actual_production / metrics.planned_production) * 100) || 0;
  };
  
  // Calculate OEE (Overall Equipment Effectiveness)
  const calculateOEE = () => {
    if (!metrics) return 0;
    // OEE = Availability × Performance × Quality
    const availability = metrics.uptime / metrics.total_time || 0;
    const performance = metrics.actual_production / metrics.planned_production || 0;
    const quality = (metrics.good_parts) / (metrics.good_parts + metrics.defects) || 0;
    
    return Math.round(availability * performance * quality * 100) || 0;
  };
  
  // Get quality rate
  const getQualityRate = () => {
    if (!metrics) return 0;
    return Math.round((metrics.good_parts / (metrics.good_parts + metrics.defects)) * 100) || 0;
  };
  
  // Mock data for charts - would be replaced with actual data from the API
  const getProductionData = () => {
    if (!metrics) return [];
    
    // Generate some data points based on the time range
    const points = timeRange === 'today' ? 8 : timeRange === 'week' ? 7 : 30;
    const data = [];
    
    for (let i = 1; i <= points; i++) {
      data.push({
        period: timeRange === 'today' ? `${i * 3}:00` : 
                timeRange === 'week' ? `Day ${i}` : `Day ${i}`,
        value: Math.floor(Math.random() * 30) + 10
      });
    }
    
    return data;
  };
  
  const productionData = getProductionData();
  
  // Line chart config
  const lineConfig = {
    data: productionData,
    height: 120,
    xField: 'period',
    yField: 'value',
    point: {
      size: 3,
    },
    smooth: true,
    color: '#1890ff',
    tooltip: {
      showTitle: false,
    },
    lineStyle: {
      lineWidth: 3,
    },
  };
  
  // Quality chart data
  const qualityData = [
    { type: 'Good', value: metrics?.good_parts || 0 },
    { type: 'Defects', value: metrics?.defects || 0 },
  ];
  
  // Bar chart config
  const barConfig = {
    data: qualityData,
    height: 120,
    xField: 'type',
    yField: 'value',
    color: ({ type }) => {
      return type === 'Good' ? '#52c41a' : '#f5222d';
    },
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        fontSize: 12,
      },
    },
  };
  
  // Mock downtime reasons
  const downtimeReasons = [
    { reason: 'Tooling Change', minutes: 45 },
    { reason: 'Maintenance', minutes: 30 },
    { reason: 'Setup', minutes: 20 },
  ];

  return (
    <Card
      className="status-card h-full shadow-sm"
      bodyStyle={{ padding: '12px' }}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-blue-500" size={18} />
            <span className="font-semibold">Production Metrics</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type={timeRange === 'today' ? 'primary' : 'text'}
              size="small"
              onClick={() => setTimeRange('today')}
            >
              Today
            </Button>
            <Button
              type={timeRange === 'week' ? 'primary' : 'text'}
              size="small"
              onClick={() => setTimeRange('week')}
            >
              Week
            </Button>
            <Button
              type={timeRange === 'month' ? 'primary' : 'text'}
              size="small"
              onClick={() => setTimeRange('month')}
            >
              Month
            </Button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center items-center p-6">
          <Spin tip="Loading metrics..." />
        </div>
      ) : !metrics ? (
        <div className="text-center p-4 text-gray-500">
          <BarChart2 size={32} className="mx-auto mb-2 text-gray-400" />
          <p className="mb-0">No production metrics available</p>
          <p className="text-xs">Start production to see metrics</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* KPI Cards */}
          <Row gutter={8}>
            <Col span={8}>
              <div className="bg-blue-50 rounded-lg p-2 h-full">
                <div className="text-xs text-blue-700 mb-1">Efficiency</div>
                <div className="flex items-center justify-between">
                  <Progress
                    type="dashboard"
                    percent={calculateEfficiency()}
                    width={60}
                    format={percent => `${percent}%`}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#1890ff',
                    }}
                  />
                  <Tooltip title="Parts produced vs planned">
                    <TrendingUp className="text-blue-500" size={16} />
                  </Tooltip>
                </div>
              </div>
            </Col>
            
            <Col span={8}>
              <div className="bg-green-50 rounded-lg p-2 h-full">
                <div className="text-xs text-green-700 mb-1">Quality</div>
                <div className="flex items-center justify-between">
                  <Progress
                    type="dashboard"
                    percent={getQualityRate()}
                    width={60}
                    strokeColor={{
                      '0%': '#52c41a',
                      '100%': '#389e0d',
                    }}
                  />
                  <Tooltip title="Good parts vs total">
                    <Goal className="text-green-500" size={16} />
                  </Tooltip>
                </div>
              </div>
            </Col>
            
            <Col span={8}>
              <div className="bg-purple-50 rounded-lg p-2 h-full">
                <div className="text-xs text-purple-700 mb-1">OEE</div>
                <div className="flex items-center justify-between">
                  <Progress
                    type="dashboard"
                    percent={calculateOEE()}
                    width={60}
                    strokeColor={{
                      '0%': '#722ed1',
                      '100%': '#531dab',
                    }}
                  />
                  <Tooltip title="Overall Equipment Effectiveness">
                    <Percent className="text-purple-500" size={16} />
                  </Tooltip>
                </div>
              </div>
            </Col>
          </Row>
          
          {/* Metrics Tabs */}
          <Tabs defaultActiveKey="production" size="small" className="metrics-tabs">
            <TabPane tab="Production" key="production">
              <div className="bg-gray-50 p-2 rounded-lg">
                <Row gutter={[8, 8]} className="mb-2">
                  <Col span={8}>
                    <Statistic 
                      title={<span className="text-xs">Parts</span>}
                      value={metrics.good_parts || 0}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title={<span className="text-xs">Target</span>}
                      value={metrics.planned_production || 0}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title={<span className="text-xs">Rate/Hr</span>}
                      value={metrics.hourly_rate || 0}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                </Row>
                <div className="mt-2">
                  <Line {...lineConfig} />
                </div>
              </div>
            </TabPane>
            
            <TabPane tab="Quality" key="quality">
              <div className="bg-gray-50 p-2 rounded-lg">
                <Row gutter={[8, 8]} className="mb-2">
                  <Col span={8}>
                    <Statistic 
                      title={<span className="text-xs">Good Parts</span>}
                      value={metrics.good_parts || 0}
                      valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title={<span className="text-xs">Defects</span>}
                      value={metrics.defects || 0}
                      valueStyle={{ fontSize: '16px', color: '#f5222d' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title={<span className="text-xs">First Pass</span>}
                      value={metrics.first_pass_yield || 0}
                      suffix="%"
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                </Row>
                <div className="mt-2">
                  <Bar {...barConfig} />
                </div>
              </div>
            </TabPane>
            
            <TabPane tab="Uptime" key="uptime">
              <div className="bg-gray-50 p-2 rounded-lg">
                <Row gutter={[8, 8]} className="mb-2">
                  <Col span={8}>
                    <Statistic 
                      title={<span className="text-xs">Uptime</span>}
                      value={Math.round((metrics.uptime / metrics.total_time) * 100) || 0}
                      suffix="%"
                      valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title={<span className="text-xs">Downtime</span>}
                      value={metrics.downtime || 0}
                      suffix="min"
                      valueStyle={{ fontSize: '16px', color: '#f5222d' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title={<span className="text-xs">MTBF</span>}
                      value={metrics.mtbf || 0}
                      suffix="h"
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                </Row>
                <div className="mt-2">
                  <div className="text-xs font-medium mb-1">Downtime Reasons</div>
                  {downtimeReasons.map((item, index) => (
                    <div key={index} className="flex justify-between text-xs py-1 border-b border-gray-100">
                      <span>{item.reason}</span>
                      <span className="font-medium">{item.minutes} min</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabPane>
          </Tabs>
        </div>
      )}
    </Card>
  );
};

export default ProductionMetricsCard; 