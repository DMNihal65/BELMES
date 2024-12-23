import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Table, Badge, Select, Button, Statistic, Space, Alert } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined } from '@ant-design/icons';
import { Activity, AlertTriangle, Clock } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import ProductionGantt from '../../../components/ProductionMonitoring/ganttchart';
import { message } from 'antd';

// Mock data for machines and their production schedules
const machineData = [
  {
    id: 'DMG-001',
    name: 'DMG DMU 60 eVo linear',
    currentJob: 'PART-001',
    efficiency: 92,
    status: 'running',
    plannedUnits: 100,
    actualUnits: 85,
    startTime: '08:00',
    endTime: '16:00',
    alerts: 1,
  },
  {
    id: 'DMG-002',
    name: 'DMG DMU 60T mB',
    currentJob: 'PART-002',
    efficiency: 88,
    status: 'running',
    plannedUnits: 150,
    actualUnits: 120,
    startTime: '08:00',
    endTime: '16:00',
    alerts: 0,
  },
  {
    id: 'HMC-001',
    name: 'Horizontal Machining Center 01',
    currentJob: 'PART-003',
    efficiency: 78,
    status: 'idle',
    plannedUnits: 80,
    actualUnits: 45,
    startTime: '08:00',
    endTime: '16:00',
    alerts: 2,
  },
];

const ProductionMonitoring = () => {
  const [timeRange, setTimeRange] = useState('today');
  const [ganttData, setGanttData] = useState([]);
  const [realTimeData, setRealTimeData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate Gantt chart data
  useEffect(() => {
    const generateGanttData = () => {
      try {
        setLoading(true);
        const currentTime = new Date();
        const data = machineData.map((machine, index) => {
          const startTime = new Date();
          startTime.setHours(8, 0, 0);
          const endTime = new Date();
          endTime.setHours(16, 0, 0);
          
          return {
            name: machine.name,
            planned: [startTime.getTime(), endTime.getTime(), machine.plannedUnits],
            actual: [startTime.getTime(), currentTime.getTime(), machine.actualUnits],
            itemStyle: { normal: { color: index % 2 === 0 ? '#91cc75' : '#fac858' } },
          };
        });
        setGanttData(data);
      } catch (error) {
        console.error('Error generating Gantt data:', error);
        message.error('Error updating production data');
      } finally {
        setLoading(false);
      }
    };

    generateGanttData();
    const interval = setInterval(generateGanttData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Updated Gantt chart options
  const ganttChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const planned = params[0];
        const actual = params[1];
        return `
          <div>
            <p><b>${planned.name}</b></p>
            <p>Planned: ${planned.value[2]} units</p>
            <p>Actual: ${actual.value[2]} units</p>
            <p>Time: ${new Date(actual.value[1]).toLocaleTimeString()}</p>
          </div>
        `;
      }
    },
    legend: {
      data: ['Planned', 'Actual'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      min: new Date(new Date().setHours(8, 0, 0)).getTime(),
      max: new Date(new Date().setHours(16, 0, 0)).getTime(),
      axisLabel: {
        formatter: (value) => {
          return new Date(value).toLocaleTimeString();
        }
      }
    },
    yAxis: {
      type: 'category',
      data: ganttData.map(item => item.name)
    },
    series: [
      {
        name: 'Planned',
        type: 'bar',
        stack: 'total',
        itemStyle: {
          color: '#91cc75',
          opacity: 0.3
        },
        data: ganttData.map(item => ({
          value: item.planned,
          itemStyle: item.itemStyle
        }))
      },
      {
        name: 'Actual',
        type: 'bar',
        stack: 'total',
        itemStyle: {
          color: '#5470c6'
        },
        data: ganttData.map(item => ({
          value: item.actual,
          itemStyle: item.itemStyle
        }))
      }
    ]
  };

  // Add new features - Production Trends Chart
  const productionTrendsOption = {
    title: {
      text: 'Production Trends'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Target', 'Actual']
    },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Target',
        type: 'line',
        data: [150, 150, 150, 150, 150],
        lineStyle: { color: '#91cc75' }
      },
      {
        name: 'Actual',
        type: 'line',
        data: [120, 132, 145, 160, 148],
        lineStyle: { color: '#5470c6' }
      }
    ]
  };

  // Table columns
  const columns = [
    {
      title: 'Machine',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.id}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge
          status={status === 'running' ? 'success' : 'warning'}
          text={status.charAt(0).toUpperCase() + status.slice(1)}
        />
      ),
    },
    {
      title: 'Current Job',
      dataIndex: 'currentJob',
      key: 'currentJob',
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <div>
          <Progress
            percent={Math.round((record.actualUnits / record.plannedUnits) * 100)}
            size="small"
            status={record.alerts > 0 ? 'exception' : 'active'}
          />
          <div className="text-xs text-gray-500">
            {record.actualUnits} / {record.plannedUnits} units
          </div>
        </div>
      ),
    },
    {
      title: 'Efficiency',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (efficiency) => (
        <Progress
          type="circle"
          percent={efficiency}
          width={50}
          format={(percent) => `${percent}%`}
          status={efficiency >= 85 ? 'success' : efficiency >= 70 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: 'Alerts',
      dataIndex: 'alerts',
      key: 'alerts',
      render: (alerts) => (
        alerts > 0 ? (
          <Badge count={alerts} style={{ backgroundColor: alerts > 1 ? '#f5222d' : '#faad14' }} />
        ) : (
          <Badge count={0} showZero style={{ backgroundColor: '#52c41a' }} />
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Production Monitoring</h1>
        <Space>
          <Select
            defaultValue="today"
            style={{ width: 120 }}
            onChange={setTimeRange}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
            ]}
          />
          <Button icon={<ReloadOutlined />}>Refresh</Button>
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={16}>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Overall Efficiency"
              value={86.3}
              precision={1}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Production Rate"
              value={250}
              valueStyle={{ color: '#3f8600' }}
              prefix={<Activity size={16} />}
              suffix="units/hr"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Active Machines"
              value={2}
              suffix="/ 3"
              prefix={<Clock size={16} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Alerts"
              value={3}
              valueStyle={{ color: '#cf1322' }}
              prefix={<AlertTriangle size={16} />}
            />
          </Card>
        </Col>
      </Row>

      {/* New Feature: Quick Actions */}
      <Row gutter={16}>
        <Col span={24}>
          <Card title="Quick Actions">
            <Space size="middle">
              <Button type="primary" icon={<ReloadOutlined />}>
                Refresh Data
              </Button>
              <Button icon={<AlertTriangle size={16} />}>
                View All Alerts
              </Button>
              <Button>Download Report</Button>
              <Select
                defaultValue="shift1"
                style={{ width: 120 }}
                options={[
                  { value: 'shift1', label: 'Shift 1' },
                  { value: 'shift2', label: 'Shift 2' },
                  { value: 'shift3', label: 'Shift 3' },
                ]}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Alerts Section */}
      {machineData.some(machine => machine.alerts > 0) && (
        <Alert
          message="Production Alerts"
          description="There are active alerts that require attention. Please check the machine status below."
          type="warning"
          showIcon
          closable
        />
      )}

      {/* Production Charts Section */}
      <Row gutter={16}>
        <Col >
          <Card 
            title="Production Schedule vs Actual Progress"
            className="mb-6"
            extra={
              <Space>
                <Select
                  defaultValue="hour"
                  style={{ width: 120 }}
                  options={[
                    { value: 'hour', label: 'Hourly View' },
                    { value: 'shift', label: 'Shift View' },
                    { value: 'day', label: 'Daily View' },
                  ]}
                />
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={() => window.location.reload()}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Space>
            }
          >
            <ProductionGantt machineData={machineData} />
          </Card>
        </Col>
        {/* <Col span={12}>
          <Card title="Production Trends">
            <ReactECharts
              option={productionTrendsOption}
              style={{ height: '400px' }}
            />
          </Card>
        </Col> */}
      </Row>

      {/* New Feature: Production Metrics */}
      <Card title="Production Metrics">
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Average Cycle Time"
              value={45}
              suffix="min"
              precision={1}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Quality Rate"
              value={98.5}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Downtime"
              value={2.5}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Machine Status Table */}
      <Card title="Machine Status">
        <Table
          columns={columns}
          dataSource={machineData}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default ProductionMonitoring;
