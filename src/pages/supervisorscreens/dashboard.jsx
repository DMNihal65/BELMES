import React, { useState, useEffect, Suspense } from 'react';
import { Card, Row, Col, Table, Badge, Progress, Statistic, Timeline, Select, Button, Dropdown, Menu, Alert, Modal, List } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, BellOutlined, FilterOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useSpring, animated } from 'react-spring';
import { 
  ChartBarIcon, 
  ClockIcon, 
  CogIcon, 
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/solid';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { Machine } from '../../components/3DComponents/Machine';

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

const notifications = [
  { id: 1, message: 'Machine DMG-001 requires maintenance', type: 'warning', time: '10 mins ago' },
  { id: 2, message: 'Production target achieved for PART-789', type: 'success', time: '30 mins ago' },
];

const machines = [
  {
    id: 'CNC001',
    name: 'Mazak H 100',
    status: 'running',
    position: [-12, 0, -12],
    Power: 5.2,
    energy: 125.5,
  },
  {
    id: 'CNC002',
    name: 'HMT Stallion 200',
    status: 'idle',
    position: [0, 0, -12],
    Power: 3.1,
    energy: 98.2,
  },
];

const FactoryFloor = ({ machines }) => {
  return (
    <group>
      <Grid 
        args={[50, 50]} 
        cellSize={5}
        cellThickness={1}
        cellColor="#6b7280"
        sectionSize={5}
        fadeDistance={50}
        fadeStrength={1}
      />
      {machines.map((machine) => (
        <Machine
          key={machine.id}
          position={machine.position}
          status={machine.status}
          data={machine}
        />
      ))}
    </group>
  );
};

const SupervisorDashboard = () => {
  const [timeRange, setTimeRange] = useState('today');
  const [chartInstances, setChartInstances] = useState({});
  const [parent] = useAutoAnimate();
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Machine DMG-001 requires maintenance', type: 'warning', time: '10 mins ago' },
    { id: 2, message: 'Production target achieved for PART-789', type: 'success', time: '30 mins ago' },
  ]);
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [notificationDropdownVisible, setNotificationDropdownVisible] = useState(false);

  const handleViewAllNotifications = () => {
    setNotificationDropdownVisible(false); // Close dropdown
    setIsNotificationModalVisible(true); // Open modal
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  };

  const statsProps = useSpring({
    from: { number: 0 },
    to: { number: 85.7 },
    config: { duration: 2000 }
  });

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
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header Section */}
      {/* <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-2 px-4 bg-white border-b"
      >
        <div className="flex justify-end">
          <div className="flex space-x-2">
            <Button size="small" icon={<FilterOutlined />}>Filter</Button>
          </div>
        </div>
      </motion.div> */}

      <div className="flex-1 p-0 overflow-hidden">
        {/* Quick Stats Row */}
        <Row gutter={[8, 8]} className="mb-2 px-2" ref={parent}>
          <Col span={6}>
            <motion.div {...fadeIn}>
              <Card 
                bordered={false}
                className="hover:shadow-lg transition-shadow duration-300"
                bodyStyle={{ padding: '8px' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 mb-1">Overall OEE</p>
                    <animated.h2 className="text-2xl font-bold text-gray-800">
                      {statsProps.number.to(n => `${n.toFixed(1)}%`)}
                    </animated.h2>
                  </div>
                  <div className="w-10 h-10">
                    <ChartBarIcon className="w-full h-full text-blue-500" />
                  </div>
                </div>
                <div className="h-[30px] mt-2">
                  <ReactECharts
                    option={getSparklineOption([40, 45, 50, 55, 60, 45, 85], '#3f8600', 'line')}
                    style={{ height: '100%', width: '100%' }}
                    onChartReady={(chart) => onChartReady(chart, 'oee')}
                    notMerge={true}
                    lazyUpdate={true}
                  />
                </div>
              </Card>
            </motion.div>
          </Col>

          <Col span={6}>
            <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
              <Card 
                bordered={false}
                className="hover:shadow-lg transition-shadow duration-300"
                bodyStyle={{ padding: '8px' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 mb-1">Active Machines</p>
                    <h2 className="text-2xl font-bold text-gray-800">15/18</h2>
                  </div>
                  <div className="w-10 h-10">
                    <CogIcon className="w-full h-full text-green-500" />
                  </div>
                </div>
                <div className="mt-2">
                  <Progress percent={83} size="small" status="active" />
                </div>
              </Card>
            </motion.div>
          </Col>

          <Col span={6}>
            <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
              <Card 
                bordered={false}
                className="hover:shadow-lg transition-shadow duration-300"
                bodyStyle={{ padding: '8px' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 mb-1">Production Rate</p>
                    <div className="flex items-center">
                      <h2 className="text-2xl font-bold text-gray-800 mr-2">98.5%</h2>
                      <Badge status="success" text="On Target" />
                    </div>
                  </div>
                  <div className="w-10 h-10">
                    <ClockIcon className="w-full h-full text-purple-500" />
                  </div>
                </div>
                <div className="h-[30px] mt-2">
                  <ReactECharts
                    option={getSparklineOption([88, 92, 95, 89, 94, 98, 98.5], '#9333ea', 'line')}
                    style={{ height: '100%', width: '100%' }}
                    onChartReady={(chart) => onChartReady(chart, 'productionRate')}
                    notMerge={true}
                    lazyUpdate={true}
                  />
                </div>
              </Card>
            </motion.div>
          </Col>

          <Col span={6}>
            <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
              <Card 
                bordered={false}
                className="hover:shadow-lg transition-shadow duration-300"
                bodyStyle={{ padding: '8px' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 mb-1">Alerts</p>
                    <h2 className="text-2xl font-bold text-yellow-500">3</h2>
                  </div>
                  <div className="w-10 h-10">
                    <ExclamationCircleIcon className="w-full h-full text-yellow-500" />
                  </div>
                </div>
                <div className="mt-2">
                  <Alert 
                    message="3 machines require attention" 
                    type="warning" 
                    showIcon 
                    className="text-sm py-1 px-2"
                  />
                </div>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Main Content Area */}
        <Row gutter={[8, 8]} className="px-2 h-[calc(100vh-160px)]">
          {/* Factory Overview Card */}
          <Col span={12} className="h-full">
            <Card
              bordered={false}
              className="hover:shadow-lg transition-shadow duration-300 h-full"
              bodyStyle={{ padding: '12px', height: 'calc(100% - 48px)', overflow: 'hidden' }}
              title={
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold">Factory Floor View</span>
                  <div className="flex items-center space-x-2">
                    <Dropdown 
                      overlay={
                        <Menu className="w-80">
                          <div className="px-4 py-2 border-b">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Notifications</span>
                              <Button type="link" size="small">Clear all</Button>
                            </div>
                          </div>
                          {notifications.map(notif => (
                            <Menu.Item key={notif.id}>
                              <div className="flex items-center p-2">
                                {notif.type === 'warning' ? 
                                  <ExclamationCircleIcon className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" /> :
                                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                                }
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{notif.message}</p>
                                  <p className="text-xs text-gray-500">{notif.time}</p>
                                </div>
                              </div>
                            </Menu.Item>
                          ))}
                          <div className="px-4 py-2 border-t">
                            <Button 
                              type="link" 
                              block 
                              onClick={handleViewAllNotifications}
                            >
                              View all notifications
                            </Button>
                          </div>
                        </Menu>
                      }
                      trigger={['click']}
                      placement="bottomRight"
                      visible={notificationDropdownVisible}
                      onVisibleChange={setNotificationDropdownVisible}
                    >
                      <Badge count={notifications.length} size="small">
                        <Button 
                          icon={<BellOutlined />} 
                          size="small"
                          className="flex items-center justify-center"
                        />
                      </Badge>
                    </Dropdown>
                  </div>
                </div>
              }
            >
              <div className="h-full w-full relative">
                <Canvas shadows camera={{ position: [20, 20, 20], fov: 50 }}>
                  <color attach="background" args={['#f8fafc']} />
                  <OrbitControls 
                    maxPolarAngle={Math.PI / 2.1}
                    minDistance={10}
                    maxDistance={100}
                    enableDamping
                    dampingFactor={0.05}
                    target={[0, 0, 0]}
                    enabled={true}
                  />
                  <ambientLight intensity={0.7} />
                  <directionalLight
                    position={[10, 10, 10]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                  />
                  <Suspense fallback={null}>
                    <FactoryFloor machines={machines} />
                    <Environment preset="warehouse" />
                    <gridHelper 
                      args={[100, 100, '#94a3b8', '#cbd5e1']}
                      position={[0, 0.02, 0]}
                    />
                  </Suspense>
                </Canvas>
                <div className="absolute top-4 right-4 bg-white/90 p-4 rounded-lg shadow-lg">
                  <h3 className="font-bold mb-2">Machine Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span>Running</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <span>Idle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span>Stopped</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          {/* Charts and Table */}
          <Col span={12} className="h-full">
            <Row gutter={[8, 8]} className="h-full">
              <Col span={24} style={{ height: '50%' }}>
                <Card
                  title={
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold">Machine Status Overview</span>
                      <Select
                        defaultValue="today"
                        style={{ width: 100 }}
                        onChange={setTimeRange}
                        size="small"
                        options={[
                          { value: 'today', label: 'Today' },
                          { value: 'week', label: 'This Week' },
                          { value: 'month', label: 'This Month' }
                        ]}
                      />
                    </div>
                  }
                  bordered={false}
                  className="hover:shadow-lg transition-shadow duration-300 h-full"
                  bodyStyle={{ padding: '12px', height: 'calc(100% - 48px)' }}
                >
                  <ReactECharts
                    option={machineStatusOption}
                    style={{ height: '100%', width: '100%' }}
                    onChartReady={(chart) => onChartReady(chart, 'machineStatus')}
                    notMerge={true}
                    lazyUpdate={true}
                  />
                </Card>
              </Col>
              <Col span={24} style={{ height: '50%' }}>
                <Card
                  title={
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold">Active Machines</span>
                      <Button icon={<FilterOutlined />} size="small">Filter</Button>
                    </div>
                  }
                  bordered={false}
                  className="hover:shadow-lg transition-shadow duration-300 h-full"
                  bodyStyle={{ padding: '12px', height: 'calc(100% - 48px)', overflow: 'hidden' }}
                >
                  <div className="h-full overflow-auto">
                    <Table
                      columns={columns}
                      dataSource={machineData}
                      pagination={false}
                      size="small"
                      scroll={{ y: true }}
                      className="h-full"
                    />
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {/* Notifications Modal */}
      <Modal
        title={
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">All Notifications</span>
            <Button type="link" size="small" onClick={() => setIsNotificationModalVisible(false)}>
              Close
            </Button>
          </div>
        }
        open={isNotificationModalVisible}
        footer={null}
        onCancel={() => setIsNotificationModalVisible(false)}
        width={600}
      >
        <div className="max-h-[60vh] overflow-auto">
          <List
            dataSource={notifications}
            renderItem={(notif) => (
              <List.Item className="py-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3 w-full">
                  {notif.type === 'warning' ? 
                    <ExclamationCircleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" /> :
                    <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                  </div>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CloseOutlined />}
                    className="text-gray-400 hover:text-gray-600"
                  />
                </div>
              </List.Item>
            )}
          />
        </div>
      </Modal>
    </div>
  );
};

export default SupervisorDashboard;