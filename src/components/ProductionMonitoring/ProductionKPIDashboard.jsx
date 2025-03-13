import React, { useEffect } from 'react';
import { 
  Card, Row, Col, Space, DatePicker, Select, Button, 
  Tooltip, Radio, Empty, Spin, Alert, Badge, Progress, Statistic 
} from 'antd';
import { 
  Box, CheckCircle, Activity, Clock, RefreshCw 
} from 'lucide-react';
import { Area, Pie } from '@ant-design/plots';
import dayjs from 'dayjs';
import useProductionStore from '../../store/productionStore';

const { RangePicker } = DatePicker;

const ProductionKPIDashboard = () => {
  const { 
    kpiData,
    kpiLoading,
    kpiError,
    kpiDateRange,
    kpiSelectedMachines,
    kpiTimeframe,
    kpiAutoRefresh,
    fetchKPIData,
    setKPIDateRange,
    setKPITimeframe,
    setKPISelectedMachines,
    toggleKPIAutoRefresh,
    cleanupKPI
  } = useProductionStore();

  useEffect(() => {
    fetchKPIData();
    return () => cleanupKPI();
  }, []);

  if (kpiLoading) {
    return <LoadingState />;
  }

  if (kpiError) {
    return <ErrorState error={kpiError} onRetry={fetchKPIData} />;
  }

  if (!kpiData) {
    return <Empty description="No KPI data available" />;
  }

  const { overall_metrics, machine_kpis, period_start, period_end } = kpiData;

  return (
    <div className="space-y-6 p-6">
      {/* Controls Section */}
      <Card className="shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Radio.Group 
            value={kpiTimeframe} 
            onChange={e => setKPITimeframe(e.target.value)}
          >
            <Radio.Button value="24h">24 Hours</Radio.Button>
            <Radio.Button value="7d">7 Days</Radio.Button>
            <Radio.Button value="30d">30 Days</Radio.Button>
            <Radio.Button value="custom">Custom</Radio.Button>
          </Radio.Group>

          <RangePicker
            showTime
            value={kpiDateRange}
            onChange={setKPIDateRange}
            disabled={kpiTimeframe !== 'custom'}
            className="min-w-[300px]"
          />

          <Select
            mode="multiple"
            placeholder="Select Machines"
            value={kpiSelectedMachines}
            onChange={setKPISelectedMachines}
            style={{ minWidth: 200 }}
            options={[
              { value: 'all', label: 'All Machines' },
              ...machine_kpis.map(m => ({ 
                value: m.machine_id, 
                label: m.machine_name 
              }))
            ]}
          />

          <Space>
            <Tooltip title="Refresh Data">
              <Button 
                icon={<RefreshCw size={16} />} 
                onClick={fetchKPIData}
                loading={kpiLoading}
              />
            </Tooltip>
            <Tooltip title={kpiAutoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}>
              <Button
                type={kpiAutoRefresh ? 'primary' : 'default'}
                onClick={toggleKPIAutoRefresh}
                icon={<Clock size={16} />}
              />
            </Tooltip>
          </Space>
        </div>
      </Card>

      {/* Overall Metrics Section */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card className="h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Production Overview</h3>
              <div className="text-sm text-gray-500">
                {dayjs(period_start).format('MMM D, HH:mm')} - {dayjs(period_end).format('MMM D, HH:mm')}
              </div>
            </div>
            <ProductionTrendChart data={kpiData.production_trend} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="h-full">
            <h3 className="text-lg font-semibold mb-4">Overall Performance</h3>
            <Space direction="vertical" className="w-full">
              <MetricCard
                title="Total Production"
                value={overall_metrics.total_production}
                icon={<Box />}
                trend={10}
                suffix="units"
              />
              <MetricCard
                title="Quality Rate"
                value={overall_metrics.quality_rate}
                icon={<CheckCircle />}
                trend={5}
                suffix="%"
                color="green"
              />
              <MetricCard
                title="Plant Utilization"
                value={overall_metrics.plant_utilization}
                icon={<Activity />}
                trend={-2}
                suffix="%"
                color="blue"
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Machine Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {machine_kpis.map(machine => (
          <MachinePerformanceCard key={machine.machine_id} machine={machine} />
        ))}
      </div>

      {/* Performance Distribution */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Status Distribution">
            <StatusDistributionChart data={machine_kpis} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Quality Analysis">
            <QualityMetricsChart data={machine_kpis} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Loading State Component
const LoadingState = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Spin size="large" tip="Loading KPI data..." />
  </div>
);

// Error State Component
const ErrorState = ({ error, onRetry }) => (
  <Alert
    message="Error"
    description={error}
    type="error"
    showIcon
    className="m-4"
    action={
      <Button type="primary" onClick={onRetry}>
        Try Again
      </Button>
    }
  />
);

// Production Trend Chart Component
const ProductionTrendChart = ({ data = [] }) => {
  // Transform data for the chart
  const chartData = data.flatMap(item => ([
    {
      timestamp: item.timestamp,
      value: item.metrics.production_rate,
      type: 'Production Rate',
      metric: 'production'
    },
    {
      timestamp: item.timestamp,
      value: item.metrics.quality_rate,
      type: 'Quality Rate',
      metric: 'quality'
    },
    {
      timestamp: item.timestamp,
      value: item.metrics.utilization_rate,
      type: 'Utilization Rate',
      metric: 'utilization'
    },
    {
      timestamp: item.timestamp,
      value: item.metrics.target_achievement,
      type: 'Target Achievement',
      metric: 'target'
    }
  ]));

  const config = {
    data: chartData,
    xField: 'timestamp',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: true,
    legend: { position: 'top' },
    xAxis: {
      type: 'time',
      tickCount: 8,
    },
    yAxis: {
      label: {
        formatter: (v) => `${v}%`,
      },
      min: 0,
      max: 100,
    },
    tooltip: {
      showMarkers: true,
      shared: true,
      showCrosshairs: true,
      crosshairs: {
        type: 'x',
      },
    },
    color: ['#10B981', '#3B82F6', '#6366F1', '#F59E0B'],
    theme: {
      geometries: {
        line: {
          lineWidth: 2,
        },
      },
    },
    annotations: [
      {
        type: 'line',
        start: ['min', 80],
        end: ['max', 80],
        style: {
          stroke: '#E5E7EB',
          lineDash: [4, 4],
        },
      }
    ]
  };

  return (
    <div>
      <Area {...config} height={300} />
      <div className="flex justify-center gap-4 mt-4">
        <Badge color="#10B981" text="Production Rate" />
        <Badge color="#3B82F6" text="Quality Rate" />
        <Badge color="#6366F1" text="Utilization Rate" />
        <Badge color="#F59E0B" text="Target Achievement" />
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, icon, trend, suffix, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100 w-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? value.toFixed(1) : value}
            {suffix && <span className="text-sm text-gray-500 ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Machine Performance Card Component
const MachinePerformanceCard = ({ machine }) => {
  const getStatusColor = (status) => {
    const colors = {
      'PRODUCTION': '#10B981',
      'ON': '#3B82F6',
      'OFF': '#6B7280',
      'MAINTENANCE': '#F59E0B',
      'ERROR': '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  return (
    <Card 
      title={
        <div className="flex items-center justify-between">
          <span>{machine.machine_name}</span>
          <Badge 
            status={machine.utilization_rate > 0 ? "processing" : "default"} 
            text={machine.utilization_rate > 0 ? "Active" : "Inactive"}
          />
        </div>
      }
      className="shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="space-y-4">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Statistic 
              title="Production" 
              value={machine.total_production} 
              suffix="units"
            />
          </Col>
          <Col span={12}>
            <Statistic 
              title="Quality Rate" 
              value={machine.quality_rate} 
              suffix="%" 
              valueStyle={{ color: machine.quality_rate >= 90 ? '#10B981' : '#F59E0B' }}
            />
          </Col>
        </Row>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">Utilization</span>
            <span className="text-sm font-medium">{machine.utilization_rate.toFixed(1)}%</span>
          </div>
          <Progress 
            percent={machine.utilization_rate} 
            size="small" 
            status={machine.utilization_rate >= 80 ? "success" : "active"}
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">Target Achievement</span>
            <span className="text-sm font-medium">
              {(machine.target_achievement * 100).toFixed(1)}%
            </span>
          </div>
          <Progress 
            percent={machine.target_achievement * 100} 
            size="small"
            status={machine.target_achievement >= 0.9 ? "success" : "active"}
          />
        </div>

        {Object.keys(machine.status_distribution).length > 0 && (
          <div>
            <div className="text-sm text-gray-600 mb-2">Status Distribution</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(machine.status_distribution).map(([status, value]) => (
                <Badge 
                  key={status}
                  color={getStatusColor(status)}
                  text={
                    <span className="text-sm">
                      {status}: {value.toFixed(1)}%
                    </span>
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Status Distribution Chart Component
const StatusDistributionChart = ({ data }) => {
  const chartData = data.reduce((acc, machine) => {
    Object.entries(machine.status_distribution).forEach(([status, value]) => {
      const existingStatus = acc.find(item => item.status === status);
      if (existingStatus) {
        existingStatus.value += value;
      } else {
        acc.push({ status, value });
      }
    });
    return acc;
  }, []);

  const config = {
    data: chartData,
    angleField: 'value',
    colorField: 'status',
    radius: 0.8,
    label: {
      type: 'outer',
      formatter: (datum) => `${datum.status}: ${datum.value.toFixed(1)}%`,
    },
    interactions: [{ type: 'element-active' }],
  };

  return <Pie {...config} height={300} />;
};

// Quality Metrics Chart Component
const QualityMetricsChart = ({ data }) => {
  const chartData = data.map(machine => ({
    machine: machine.machine_name,
    quality: machine.quality_rate,
    utilization: machine.utilization_rate,
    target: machine.target_achievement * 100
  }));

  const config = {
    data: chartData,
    xField: 'machine',
    yField: 'value',
    seriesField: 'metric',
    isGroup: true,
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
  };

  return <Area {...config} height={300} />;
};

export default ProductionKPIDashboard; 