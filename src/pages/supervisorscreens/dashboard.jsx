import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Progress, Statistic, Timeline, Select } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

// Mock data
const machineData = [
  {
    id: 'DMG-001',
    name: 'DMG DMU 60 eVo linear',
    status: 'running',
    oee: 87,
    currentProgram: 'OP-1234',
    partNumber: 'PART-789',
    totalCount: 145,
    targetCount: 200,
    operator: 'John Doe',
    startTime: '08:00 AM',
    estimatedCompletion: '04:30 PM',
    cycleTime: '45 min',
    downtime: '2%',
  },
  {
    id: 'DMG-001',
    name: 'DMG DMU 60 eVo linear',
    status: 'running',
    oee: 87,
    currentProgram: 'OP-1234',
    partNumber: 'PART-789',
    totalCount: 145,
    targetCount: 200,
    operator: 'John Doe',
    startTime: '08:00 AM',
    estimatedCompletion: '04:30 PM',
    cycleTime: '45 min',
    downtime: '2%',
  },
];

const SupervisorDashboard = () => {
  const [timeRange, setTimeRange] = useState('today');
  const [chartInstances, setChartInstances] = useState({});

  // Cleanup function for charts
  useEffect(() => {
    return () => {
      Object.values(chartInstances).forEach(instance => {
        if (instance && instance.dispose) {
          instance.dispose();
        }
      });
    };
  }, [chartInstances]);

  // Sparkline options for mini charts
  const getSparklineOption = (data, color, type = 'line') => ({
    animation: false,
    grid: {
      left: 2,
      right: 2,
      top: 2,
      bottom: 2,
    },
    xAxis: {
      type: 'category',
      show: false,
      boundaryGap: false,
      data: Array.from({ length: data.length }, (_, i) => i.toString()),
    },
    yAxis: {
      type: 'value',
      show: false,
      min: Math.min(...data) * 0.9,
      max: Math.max(...data) * 1.1,
    },
    series: [{
      data: data,
      type: type,
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color: color,
        width: 2,
      },
      itemStyle: {
        color: color,
      },
      areaStyle: type === 'line' ? {
        color: color,
        opacity: 0.2,
      } : undefined,
    }],
    tooltip: {
      show: false,
    },
  });

  // Machine Status Overview Chart
  const machineStatusOption = {
    tooltip: { 
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['Running', 'Idle', 'Down'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM'],
      axisLabel: {
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 20
    },
    series: [
      {
        name: 'Running',
        type: 'line',
        data: [12, 13, 15, 14, 13, 15],
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3
        }
      },
      {
        name: 'Idle',
        type: 'line',
        data: [5, 4, 3, 4, 5, 3],
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3
        }
      },
      {
        name: 'Down',
        type: 'line',
        data: [2, 1, 2, 1, 2, 1],
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3
        }
      }
    ]
  };

  // Table columns configuration
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
          status={status === 'running' ? 'success' : status === 'idle' ? 'warning' : 'error'}
          text={status.charAt(0).toUpperCase() + status.slice(1)}
        />
      ),
    },
    {
      title: 'Current Job',
      dataIndex: 'currentProgram',
      key: 'currentProgram',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div className="text-xs text-gray-500">Part: {record.partNumber}</div>
        </div>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <div>
          <Progress 
            percent={Math.round((record.totalCount / record.targetCount) * 100)} 
            size="small" 
            status="active"
          />
          <div className="text-xs text-gray-500">
            {record.totalCount} / {record.targetCount} parts
          </div>
        </div>
      ),
    },
    {
      title: 'OEE',
      dataIndex: 'oee',
      key: 'oee',
      render: (oee) => (
        <Progress
          type="circle"
          percent={oee}
          width={50}
          format={(percent) => `${percent}%`}
          status={oee >= 85 ? 'success' : oee >= 70 ? 'normal' : 'exception'}
        />
      ),
    },
  ];

  const onChartReady = (chart, id) => {
    setChartInstances(prev => ({
      ...prev,
      [id]: chart
    }));
  };

  return (
    <div className="p-6 h-screen bg-gray-50">
      {/* Top Stats Row */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Overall OEE"
              value={85.7}
              precision={1}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="%"
            />
            <div className="h-[40px]">
              <ReactECharts
                option={getSparklineOption([40, 45, 50, 55, 60, 45, 85], '#3f8600', 'line')}
                style={{ height: '100%', width: '100%' }}
                onChartReady={(chart) => onChartReady(chart, 'oee')}
                notMerge={true}
                lazyUpdate={true}
              />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Parts Today"
              value={2847}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
            />
            <div className="h-[40px]">
              <ReactECharts
                option={getSparklineOption([28, 35, 40, 45, 50, 55, 60], '#3f8600', 'bar')}
                style={{ height: '100%', width: '100%' }}
                onChartReady={(chart) => onChartReady(chart, 'totalParts')}
                notMerge={true}
                lazyUpdate={true}
              />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Active Machines"
              value={12}
              suffix="/ 15"
            />
            <Progress percent={80} size="small" showInfo={false} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Efficiency"
              value={92.3}
              precision={1}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
              suffix="%"
            />
            <div className="h-[40px]">
              <ReactECharts
                option={getSparklineOption([90, 92, 91, 94, 90, 92, 92], '#cf1322', 'line')}
                style={{ height: '100%', width: '100%' }}
                onChartReady={(chart) => onChartReady(chart, 'efficiency')}
                notMerge={true}
                lazyUpdate={true}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content Area */}
      <Row gutter={16} className="h-[calc(100vh-200px)]">
        {/* Left Column - Machine List */}
        <Col span={16}>
          <Card 
            title="Machine Overview" 
            extra={
              <Select defaultValue="today" style={{ width: 120 }} onChange={setTimeRange}>
                <Select.Option value="today">Today</Select.Option>
                <Select.Option value="week">This Week</Select.Option>
                <Select.Option value="month">This Month</Select.Option>
              </Select>
            }
            className="h-full"
          >
            <Table 
              columns={columns} 
              dataSource={machineData}
              pagination={false}
              scroll={{ y: 'calc(100vh - 400px)' }}
            />
          </Card>
        </Col>

        {/* Right Column - Charts & Timeline */}
        <Col span={8} className="h-full">
          <Row gutter={[0, 16]} className="h-full">
            <Col span={24} className="h-1/2">
              <Card title="Machine Status Timeline" className="h-full">
                <ReactECharts option={machineStatusOption} style={{ height: '100%' }} />
              </Card>
            </Col>
            <Col span={24} className="h-1/2">
              <Card title="Recent Events" className="h-full overflow-auto">
                <Timeline
                  items={[
                    { color: 'green', children: 'DMG-001 started Job OP-1234' },
                    { color: 'red', children: 'VMC-001 reported error: Tool breakage' },
                    { color: 'blue', children: 'New job scheduled for HMC-001' },
                    { color: 'gray', children: 'Maintenance due for DMG-002' },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default SupervisorDashboard;