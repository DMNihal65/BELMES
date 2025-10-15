import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Statistic, Progress, Timeline, 
  Input, Button, DatePicker, Empty, Spin, Alert,
  Table, Badge, Tooltip, Space
} from 'antd';
import { 
  Search, Clock, Target, Box, AlertTriangle,
  CheckCircle, BarChart2, Calendar, Layers
} from 'lucide-react';
import { Area, Column, Gauge } from '@ant-design/plots';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import axios from 'axios';

dayjs.extend(duration);
const { RangePicker } = DatePicker;

const ProductionOrderAnalysis = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchOrderData = async () => {
    if (!orderNumber) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (dateRange?.length === 2) {
        params.append('start_time', dateRange[0].format('YYYY-MM-DD HH:mm:ss'));
        params.append('end_time', dateRange[1].format('YYYY-MM-DD HH:mm:ss'));
      }

      const response = await axios.get(
        `http://172.19.224.1:8002/production_monitoring/order-production-analysis/${orderNumber}?${params.toString()}`
      );
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch order data. Please try again.');
      console.error('Error fetching order data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchOrderData} />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Search Controls */}
      <Card className="shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Input.Search
            placeholder="Enter Production Order Number"
            value={orderNumber}
            onChange={e => setOrderNumber(e.target.value)}
            onSearch={fetchOrderData}
            style={{ width: 250 }}
            enterButton
          />
          <RangePicker
            showTime
            value={dateRange}
            onChange={setDateRange}
            className="min-w-[300px]"
          />
          <Button 
            type="primary"
            onClick={fetchOrderData}
            icon={<Search size={16} />}
          >
            Analyze
          </Button>
        </div>
      </Card>

      {data ? (
        <>
          {/* Order Overview */}
          <Card className="shadow-sm">
            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <OrderInfoCard data={data} />
              </Col>
              <Col xs={24} md={16}>
                <QualityMetricsCard data={data} />
              </Col>
            </Row>
          </Card>

          {/* Production Progress */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Operation Progress" className="h-full">
                <OperationTimeline data={data.planned_vs_actual} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Efficiency Analysis" className="h-full">
                <EfficiencyGauge data={data.planned_vs_actual} />
              </Card>
            </Col>
          </Row>

          {/* Detailed Analysis */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Daily Production Trend">
                <DailyProductionChart data={data.daily_production} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Machine Distribution">
                <MachineProductionChart data={data.machine_wise_production} />
              </Card>
            </Col>
          </Row>

          {/* Operations Table */}
          <Card title="Operations Detail">
            <OperationsTable data={data.planned_vs_actual} />
          </Card>
        </>
      ) : (
        <Empty 
          description="Enter a production order number to view analysis" 
          className="my-12"
        />
      )}
    </div>
  );
};

// Subcomponents
const OrderInfoCard = ({ data }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold">{data.production_order}</h3>
      <p className="text-sm text-gray-500">{data.part_number}</p>
      <p className="text-sm text-gray-600">{data.part_description}</p>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Statistic 
        title="Setup Time"
        value={data.average_setup_time}
        suffix="min"
        prefix={<Clock size={16} className="text-blue-500" />}
      />
      <Statistic
        title="Production Time"
        value={data.average_production_time}
        suffix="min"
        prefix={<Target size={16} className="text-green-500" />}
      />
    </div>
  </div>
);

const QualityMetricsCard = ({ data }) => (
  <Row gutter={[16, 16]}>
    <Col span={8}>
      <Statistic
        title="Total Completed"
        value={data.total_completed}
        prefix={<Box size={16} className="text-blue-500" />}
      />
    </Col>
    <Col span={8}>
      <Statistic
        title="Total Rejected"
        value={data.total_rejected}
        prefix={<AlertTriangle size={16} className="text-red-500" />}
      />
    </Col>
    <Col span={8}>
      <Statistic
        title="Quality Rate"
        value={data.quality_rate}
        suffix="%"
        prefix={<CheckCircle size={16} className="text-green-500" />}
        valueStyle={{ color: data.quality_rate >= 90 ? '#10B981' : '#F59E0B' }}
      />
    </Col>
  </Row>
);

// Loading and Error States
const LoadingState = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Spin size="large" tip="Loading order data..." />
  </div>
);

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

// Operation Timeline Component
const OperationTimeline = ({ data }) => {
  return (
    <Timeline mode="left" className="max-h-[400px] overflow-y-auto p-4">
      {data.map((op, index) => {
        const efficiency = op.efficiency || 0;
        const color = efficiency >= 90 ? 'green' : efficiency >= 70 ? 'blue' : 'red';
        
        return (
          <Timeline.Item 
            key={index}
            color={color}
            label={dayjs(op.planned_start).format('MMM D, HH:mm')}
          >
            <div className="space-y-1">
              <div className="font-medium">{op.operation}</div>
              <div className="text-sm text-gray-500">
                Planned: {op.planned_quantity} | Completed: {op.completed_quantity}
              </div>
              <Progress 
                percent={efficiency} 
                size="small" 
                status={efficiency >= 90 ? "success" : efficiency >= 70 ? "active" : "exception"}
              />
            </div>
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
};

// Efficiency Gauge Component
const EfficiencyGauge = ({ data }) => {
  const averageEfficiency = data.reduce((acc, curr) => acc + curr.efficiency, 0) / data.length;
  
  const config = {
    percent: averageEfficiency / 100,
    range: {
      color: 'l(0) 0:#F87171 0.5:#60A5FA 1:#34D399',
    },
    indicator: {
      pointer: {
        style: {
          stroke: '#D1D5DB',
        },
      },
      pin: {
        style: {
          stroke: '#D1D5DB',
        },
      },
    },
    axis: {
      label: {
        formatter(v) {
          return Number(v) * 100;
        },
      },
      subTickLine: {
        count: 3,
      },
    },
    statistic: {
      content: {
        formatter: ({ percent }) => `${(percent * 100).toFixed(1)}%`,
        style: {
          fontSize: '24px',
        },
      },
      title: {
        content: 'Overall Efficiency',
      },
    },
  };

  return <Gauge {...config} height={300} />;
};

// Daily Production Chart Component
const DailyProductionChart = ({ data }) => {
  const chartData = Object.entries(data).map(([date, count]) => ({
    date,
    value: count
  })).sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

  const config = {
    data: chartData,
    xField: 'date',
    yField: 'value',
    xAxis: {
      type: 'time',
      tickCount: 5,
    },
    yAxis: {
      label: {
        formatter: (v) => `${v} units`,
      },
    },
    tooltip: {
      showMarkers: false,
    },
    areaStyle: () => ({
      fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
    }),
  };

  return <Area {...config} height={300} />;
};

// Machine Production Chart Component
const MachineProductionChart = ({ data }) => {
  const chartData = Object.entries(data).map(([machine, count]) => ({
    machine,
    value: count
  }));

  const config = {
    data: chartData,
    xField: 'machine',
    yField: 'value',
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    meta: {
      value: {
        alias: 'Production Count',
      },
    },
    color: '#1890FF',
  };

  return <Column {...config} height={300} />;
};

// Operations Table Component
const OperationsTable = ({ data }) => {
  const columns = [
    {
      title: 'Operation',
      dataIndex: 'operation',
      key: 'operation',
      fixed: 'left',
      width: 200,
    },
    {
      title: 'Planned Qty',
      dataIndex: 'planned_quantity',
      key: 'planned_quantity',
      width: 120,
      sorter: (a, b) => a.planned_quantity - b.planned_quantity,
    },
    {
      title: 'Completed Qty',
      dataIndex: 'completed_quantity',
      key: 'completed_quantity',
      width: 120,
      sorter: (a, b) => a.completed_quantity - b.completed_quantity,
    },
    {
      title: 'Planned Start',
      dataIndex: 'planned_start',
      key: 'planned_start',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.planned_start).diff(dayjs(b.planned_start)),
    },
    {
      title: 'Planned End',
      dataIndex: 'planned_end',
      key: 'planned_end',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Efficiency',
      dataIndex: 'efficiency',
      key: 'efficiency',
      width: 150,
      render: (value) => (
        <Tooltip title={`${value}%`}>
          <Progress 
            percent={value} 
            size="small" 
            status={value >= 90 ? "success" : value >= 70 ? "normal" : "exception"}
          />
        </Tooltip>
      ),
      sorter: (a, b) => a.efficiency - b.efficiency,
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const status = record.completed_quantity >= record.planned_quantity ? 'Completed' :
                      dayjs().isAfter(dayjs(record.planned_end)) ? 'Delayed' : 'In Progress';
        const color = status === 'Completed' ? 'green' : 
                     status === 'Delayed' ? 'red' : 'blue';
        return <Badge status={color} text={status} />;
      },
    }
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={data}
      rowKey={(record, index) => index}
      scroll={{ x: 1200 }}
      pagination={{
        pageSize: 5,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} operations`
      }}
    />
  );
};

export default ProductionOrderAnalysis; 