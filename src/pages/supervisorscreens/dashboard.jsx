import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Timeline, Select, Badge, Progress, Typography, Space, Table, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, ToolOutlined, 
         AlertOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import MachineModel3D from '../../components/MachineModel3D';

const { Title, Text } = Typography;

// Mock data
const machineData = [
  {
    id: 'DMG-001',
    name: 'DMG DMU 60 eVo liner',
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
    timelineData: [
      { time: '09:00', status: 'Started', description: 'Started processing Order #12345' },
      { time: '10:30', status: 'Running', description: 'Processing batch 1/3' },
      { time: '12:00', status: 'Paused', description: 'Scheduled maintenance check' },
      { time: '12:30', status: 'Running', description: 'Resumed processing' },
    ]
  },
  {
    id: 'DMG-002',
    name: 'DMG DMU 60T mB',
    status: 'idle',
    oee: 75,
    currentProgram: 'OP-5678',
    partNumber: 'PART-456',
    totalCount: 89,
    targetCount: 150,
    operator: 'Jane Smith',
    startTime: '09:00 AM',
    estimatedCompletion: '05:30 PM',
    cycleTime: '38 min',
    downtime: '5%',
    timelineData: [
      { time: '08:00', status: 'Idle', description: 'No scheduled jobs' },
      { time: '11:00', status: 'Maintenance', description: 'Routine checkup' },
      { time: '13:00', status: 'Idle', description: 'Awaiting next job' },
    ]
  },
  {
    id: 'HMC-001',
    name: 'Horizontal Machine Center 01',
    status: 'running',
    oee: 92,
    currentProgram: 'OP-9012',
    partNumber: 'PART-123',
    totalCount: 178,
    targetCount: 200,
    operator: 'Mike Johnson',
    startTime: '07:30 AM',
    estimatedCompletion: '03:30 PM',
    cycleTime: '42 min',
    downtime: '1%',
    timelineData: [
      { time: '07:00', status: 'Error', description: 'Tool wear detected' },
      { time: '07:30', status: 'Maintenance', description: 'Tool replacement' },
      { time: '09:00', status: 'Testing', description: 'Post-maintenance checks' },
    ]
  }
];

const columns = [
  {
    title: 'Machine Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status) => {
      let color = 'default';
      let icon = null;

      switch (status.toLowerCase()) {
        case 'running':
          color = 'success';
          icon = <CheckCircleOutlined />;
          break;
        case 'idle':
          color = 'warning';
          icon = <ClockCircleOutlined />;
          break;
        case 'maintenance':
          color = 'error';
          icon = <AlertOutlined />;
          break;
        default:
          break;
      }

      return (
        <Tag color={color} icon={icon}>
          {status.toUpperCase()}
        </Tag>
      );
    },
  },
  {
    title: 'OEE',
    dataIndex: 'oee',
    key: 'oee',
    render: (oee) => (
      <Progress
        percent={oee}
        size="small"
        status={oee < 70 ? 'exception' : 'success'}
      />
    ),
  },
  {
    title: 'Current Program',
    dataIndex: 'currentProgram',
    key: 'currentProgram',
  },
  {
    title: 'Next Maintenance',
    dataIndex: 'nextMaintenance',
    key: 'nextMaintenance',
  },
];

const SupervisorDashboard = () => {
  const [timeRange, setTimeRange] = useState('today');
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [chartInstances, setChartInstances] = useState({});

  // Find machine data when a machine is selected in the 3D view
  const handleMachineSelect = (machine) => {
    const machineDetails = machineData.find(m => m.id === machine.id);
    setSelectedMachine(machineDetails);
  };

  // Render the 3D Factory Overview with machine data
  const renderFactoryOverview = () => {
    return (
      <Card className="mb-4">
        <MachineModel3D
          machineData={machineData.map(m => ({
            id: m.id,
            name: m.name,
            position: m.id === 'DMG-001' ? [-8, 0, 0] : 
                     m.id === 'DMG-002' ? [8, 0, 0] : [0, 0, 0],
            status: m.status
          }))}
          onMachineSelect={handleMachineSelect}
        />
      </Card>
    );
  };

  // Render the machine timeline with details
  const renderMachineTimeline = () => {
    if (!selectedMachine) {
      return (
        <div className="text-center text-gray-500 py-4">
          Click on a machine to view its details and timeline
        </div>
      );
    }

    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={4} className="!mb-1">{selectedMachine.name}</Title>
            <Space>
              <Text>ID: {selectedMachine.id}</Text>
              <Tag color={
                selectedMachine.status === 'running' ? 'success' :
                selectedMachine.status === 'idle' ? 'warning' : 'error'
              }>
                {selectedMachine.status.toUpperCase()}
              </Tag>
            </Space>
          </div>
          <Space direction="vertical" align="end">
            <Statistic 
              title="OEE"
              value={selectedMachine.oee}
              suffix="%"
              valueStyle={{ color: selectedMachine.oee >= 80 ? '#3f8600' : '#cf1322' }}
            />
          </Space>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col span={6}>
            <Statistic 
              title="Current Program"
              value={selectedMachine.currentProgram}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Part Number"
              value={selectedMachine.partNumber}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Cycle Time"
              value={selectedMachine.cycleTime}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Production"
              value={selectedMachine.totalCount}
              suffix={`/ ${selectedMachine.targetCount}`}
            />
          </Col>
        </Row>

        <Timeline mode="left">
          {selectedMachine.timelineData.map((item, index) => (
            <Timeline.Item 
              key={index}
              color={
                item.status.toLowerCase() === 'running' ? 'green' :
                item.status.toLowerCase() === 'error' ? 'red' :
                item.status.toLowerCase() === 'maintenance' ? 'orange' : 'blue'
              }
              label={item.time}
            >
              <div>
                <Text strong>{item.status}</Text>
                <div>{item.description}</div>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </>
    );
  };

  // Cleanup function for charts
  useEffect(() => {
    return () => {
      Object.values(chartInstances).forEach(instance => {
        if (instance && instance.isDisposed && !instance.isDisposed()) {
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

  const onChartReady = (chart, id) => {
    setChartInstances(prev => ({
      ...prev,
      [id]: chart
    }));
  };

  // Calculate summary statistics
  const totalMachines = machineData.length;
  const runningMachines = machineData.filter(m => m.status === 'running').length;
  const averageOEE = machineData.reduce((acc, curr) => acc + curr.oee, 0) / totalMachines;
  const totalParts = machineData.reduce((acc, curr) => acc + curr.totalCount, 0);
  const targetParts = machineData.reduce((acc, curr) => acc + curr.targetCount, 0);

  return (
    <div className="p-6 space-y-6">
      <Title level={2}>Supervisor Dashboard</Title>

      
      {/* Machine Status Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="h-full hover:shadow-lg transition-shadow">
            <Statistic
              title={<Text strong>Overall OEE</Text>}
              value={averageOEE}
              precision={1}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="%"
            />
            <Progress 
              percent={averageOEE} 
              status="active" 
              strokeColor={{ 
                '0%': '#108ee9',
                '100%': '#3f8600',
              }}
              className="mt-2"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="h-full hover:shadow-lg transition-shadow">
            <Statistic
              title={<Text strong>Production Progress</Text>}
              value={totalParts}
              suffix={`/ ${targetParts}`}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress 
              percent={(totalParts/targetParts) * 100} 
              status="active"
              className="mt-2"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="h-full hover:shadow-lg transition-shadow">
            <Statistic
              title={<Text strong>Machine Status</Text>}
              value={runningMachines}
              suffix={`/ ${totalMachines}`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<SyncOutlined spin={runningMachines > 0} />}
            />
            <div className="mt-4 flex justify-between">
              <Badge status="success" text={`${runningMachines} Running`} />
              <Badge status="warning" text={`${machineData.filter(m => m.status === 'idle').length} Idle`} />
              <Badge status="error" text={`${machineData.filter(m => m.status === 'down').length} Down`} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="h-full hover:shadow-lg transition-shadow">
            <Statistic
              title={<Text strong>Average Cycle Time</Text>}
              value={42}
              suffix="min"
              valueStyle={{ color: '#722ed1' }}
              prefix={<ClockCircleOutlined />}
            />
            <div className="h-[40px]">
              <ReactECharts
                option={getSparklineOption([38, 40, 39, 42, 40, 43, 42], '#722ed1', 'line')}
                style={{ height: '100%', width: '100%' }}
                onChartReady={(chart) => onChartReady(chart, 'cycleTime')}
                notMerge={true}
                lazyUpdate={true}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content Area */}
      <Row gutter={[16, 16]} className="min-h-[calc(100vh-300px)]">
        {/* Left Column - 3D Machine Models */}
        <Col xs={24} lg={16}>
          {renderFactoryOverview()}
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={81}>
          {/* Machine Status Timeline */}
          <Card 
            title="Machine Status Timeline" 
            className="h-full"
            extra={
              selectedMachine && (
                <Select 
                  value={timeRange} 
                  onChange={setTimeRange}
                  style={{ width: 120 }}
                >
                  <Select.Option value="today">Today</Select.Option>
                  <Select.Option value="week">This Week</Select.Option>
                  <Select.Option value="month">This Month</Select.Option>
                </Select>
              )
            }
          >
            {renderMachineTimeline()}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SupervisorDashboard;