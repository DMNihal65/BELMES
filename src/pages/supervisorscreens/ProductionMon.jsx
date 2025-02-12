import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, Row, Col, Tabs, Select, Button, Statistic, Space, Alert, 
  DatePicker, Badge, Table, Progress, Tag, Tooltip, Modal
} from 'antd';
import { 
  ReloadOutlined, CalendarOutlined, ToolOutlined, 
  HistoryOutlined, BarChartOutlined, AlertOutlined,
  CheckCircleOutlined, ClockCircleOutlined, StopOutlined,
  ZoomInOutlined, ZoomOutOutlined, 
  FullscreenOutlined, SyncOutlined 
} from '@ant-design/icons';
import { Activity, AlertTriangle, Clock, Cpu, Settings } from 'lucide-react';
import { DataSet, Timeline } from 'vis-timeline/standalone';
import moment from 'moment';
import { Line, Bar } from '@ant-design/plots';

// Import components
import MachineList from '../../components/ProductionMonitoring/MachineList';
import OEEDashboard from '../../components/ProductionMonitoring/OEEDashboard';
import ProductionHistory from '../../components/ProductionMonitoring/ProductionHistory';
import MaintenanceSchedule from '../../components/ProductionMonitoring/MaintenanceSchedule';
import EnhancedAlerts from '../../components/ProductionMonitoring/EnhancedAlerts';
import MachineDetailsModal from '../../components/ProductionMonitoring/MachineDetailsModal';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Mock data definitions
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
    oee: {
      availability: 95,
      performance: 92,
      quality: 98,
      overall: 85.6
    },
    currentOperation: 'Milling',
    operator: 'John Doe',
    maintenanceStatus: 'Good',
    nextMaintenance: '2024-04-15',
    downtime: {
      planned: 120,
      unplanned: 45
    },
    lastUpdated: '2024-03-20T10:30:00Z'
  },
  // Add more machines with complete data...
];

const historicalData = [
  {
    date: '2024-03-19',
    oee: 87,
    production: 150,
    downtime: 45,
    quality: 98
  },
  {
    date: '2024-03-20',
    oee: 89,
    production: 165,
    downtime: 30,
    quality: 99
  },
  // Add more historical data...
];

// First, let's define better mock production data
const productionSchedule = [
  {
    machineId: 'DMG-001',
    jobs: [
      {
        jobId: 'JOB-001',
        component: 'Engine Block',
        operations: [
          {
            id: 'OP-001',
            name: 'Face Milling',
            plannedStart: '08:00',
            plannedDuration: 120, // minutes
            actualStart: '08:15',
            actualDuration: 135,
            status: 'completed'
          },
          {
            id: 'OP-002',
            name: 'Drilling',
            plannedStart: '10:00',
            plannedDuration: 90,
            actualStart: '10:30',
            actualDuration: 95,
            status: 'completed'
          },
          {
            id: 'OP-003',
            name: 'Boring',
            plannedStart: '11:30',
            plannedDuration: 150,
            actualStart: '12:05',
            actualDuration: 160,
            status: 'in-progress'
          }
        ]
      }
    ]
  },
  {
    machineId: 'DMG-002',
    jobs: [
      {
        jobId: 'JOB-002',
        component: 'Transmission Housing',
        operations: [
          {
            id: 'OP-004',
            name: 'Rough Milling',
            plannedStart: '08:00',
            plannedDuration: 180,
            actualStart: '08:00',
            actualDuration: 195,
            status: 'completed'
          },
          {
            id: 'OP-005',
            name: 'Finish Milling',
            plannedStart: '11:00',
            plannedDuration: 120,
            actualStart: '11:15',
            actualDuration: 130,
            status: 'in-progress'
          }
        ]
      }
    ]
  },
  {
    machineId: 'HMC-001',
    jobs: [
      {
        jobId: 'JOB-003',
        component: 'Cylinder Head',
        operations: [
          {
            id: 'OP-006',
            name: 'Surface Grinding',
            plannedStart: '08:00',
            plannedDuration: 150,
            actualStart: '08:10',
            actualDuration: 145,
            status: 'completed'
          },
          {
            id: 'OP-007',
            name: 'Valve Seat Machining',
            plannedStart: '10:30',
            plannedDuration: 210,
            actualStart: '10:35',
            actualDuration: 225,
            status: 'in-progress'
          }
        ]
      }
    ]
  }
];

// Update the timeline data generation function
const generateTimelineData = (startDate, endDate, timeRange) => {
  const baseDate = moment().startOf('day');
  
  return productionSchedule.flatMap(machine => {
    return machine.jobs.flatMap(job => {
      return job.operations.flatMap(operation => {
        // Generate planned timeline item
        const plannedStart = moment(baseDate)
          .add(moment(operation.plannedStart, 'HH:mm').hours(), 'hours')
          .add(moment(operation.plannedStart, 'HH:mm').minutes(), 'minutes');
        
        const plannedEnd = moment(plannedStart).add(operation.plannedDuration, 'minutes');

        // Generate actual timeline item
        const actualStart = moment(baseDate)
          .add(moment(operation.actualStart, 'HH:mm').hours(), 'hours')
          .add(moment(operation.actualStart, 'HH:mm').minutes(), 'minutes');
        
        const actualEnd = moment(actualStart).add(operation.actualDuration, 'minutes');

        return [
          {
            id: `${operation.id}-planned`,
            group: machine.machineId,
            content: `${job.component} - ${operation.name} (Planned)`,
            start: plannedStart.toDate(),
            end: plannedEnd.toDate(),
            type: 'range',
            className: 'planned-task',
            title: `Planned: ${operation.name}\nDuration: ${operation.plannedDuration} min`,
            style: `background-color: rgba(33, 150, 243, 0.3); 
                   border: 1px solid #2196F3; 
                   color: #1976D2;
                   font-weight: 500;`
          },
          {
            id: `${operation.id}-actual`,
            group: machine.machineId,
            content: `${job.component} - ${operation.name} (Actual)`,
            start: actualStart.toDate(),
            end: actualEnd.toDate(),
            type: 'range',
            className: `actual-task ${operation.status}`,
            title: `Actual: ${operation.name}\nDuration: ${operation.actualDuration} min\nStatus: ${operation.status}`,
            style: `background-color: ${operation.status === 'completed' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 152, 0, 0.3)'};
                   border: 1px solid ${operation.status === 'completed' ? '#4CAF50' : '#FF9800'};
                   color: ${operation.status === 'completed' ? '#2E7D32' : '#E65100'};
                   font-weight: 500;`
          }
        ];
      });
    });
  });
};

// Update the timeline options
const getTimelineOptions = () => {
  const baseOptions = {
    stack: true,
    showCurrentTime: true,
    zoomable: true,
    editable: false,
    margin: {
      item: 20,
      axis: 40
    },
    orientation: 'top',
    timeAxis: { scale: 'hour', step: 1 },
    start: moment().startOf('day').add(7, 'hours').toDate(),
    end: moment().startOf('day').add(17, 'hours').toDate(),
    tooltip: {
      followMouse: true,
      overflowMethod: 'cap'
    },
    verticalScroll: true,
    maxHeight: 400,
    zoomMin: 1000 * 60 * 60, // 1 hour in milliseconds
    zoomMax: 1000 * 60 * 60 * 24 // 24 hours in milliseconds
  };

  return baseOptions;
};

const ProductionMonitoring = () => {
  // State declarations
  const [activeTab, setActiveTab] = useState('realtime');
  const [selectedMachines, setSelectedMachines] = useState(['all']);
  const [timeRange, setTimeRange] = useState('shift1');
  const [dateRange, setDateRange] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showMachineDetails, setShowMachineDetails] = useState(false);
  const [timelineView, setTimelineView] = useState('daily');
  const [timelineRange, setTimelineRange] = useState([moment().startOf('day'), moment().endOf('day')]);
  const [timelineData, setTimelineData] = useState(() => generateTimelineData(null, null, timeRange));

  // Add refs for timeline
  const timelineRef = useRef(null);
  const timelineContainerRef = useRef(null);

  // Function to initialize timeline
  const initializeTimeline = () => {
    if (!timelineContainerRef.current) return;

    try {
      // Create items from production schedule
      const items = new DataSet(
        productionSchedule.flatMap(machine => 
          machine.jobs.flatMap(job => 
            job.operations.flatMap(operation => [
              {
                id: `${operation.id}-planned`,
                group: machine.machineId,
                content: `
                  <div class="timeline-item">
                    <div class="item-header">${job.component}</div>
                    <div class="item-desc">${operation.name}</div>
                    <div class="item-time">Planned: ${operation.plannedDuration}min</div>
                  </div>
                `,
                start: moment(moment().format('YYYY-MM-DD') + ' ' + operation.plannedStart).toDate(),
                end: moment(moment().format('YYYY-MM-DD') + ' ' + operation.plannedStart)
                  .add(operation.plannedDuration, 'minutes').toDate(),
                className: 'planned-task',
                type: 'range',
                subgroup: 'planned'
              },
              {
                id: `${operation.id}-actual`,
                group: machine.machineId,
                content: `
                  <div class="timeline-item">
                    <div class="item-header">${job.component}</div>
                    <div class="item-desc">${operation.name}</div>
                    <div class="item-time">Actual: ${operation.actualDuration}min</div>
                  </div>
                `,
                start: moment(moment().format('YYYY-MM-DD') + ' ' + operation.actualStart).toDate(),
                end: moment(moment().format('YYYY-MM-DD') + ' ' + operation.actualStart)
                  .add(operation.actualDuration, 'minutes').toDate(),
                className: `actual-task ${operation.status}`,
                type: 'range',
                subgroup: 'actual'
              }
            ])
          )
        )
      );

      // Create groups
      const groups = new DataSet(
        productionSchedule.map(machine => ({
          id: machine.machineId,
          content: machine.machineId,
          subgroupStack: {
            planned: true,
            actual: true
          }
        }))
      );

      // Configure options
      const options = {
        stack: false,
        horizontalScroll: true,
        zoomKey: 'ctrlKey',
        orientation: 'top',
        height: '500px',
        margin: {
          item: { horizontal: 10, vertical: 5 },
          axis: 5
        },
        start: moment().startOf('day').add(6, 'hours').toDate(),
        end: moment().startOf('day').add(22, 'hours').toDate(),
        editable: false,
        tooltip: {
          followMouse: true,
          overflowMethod: 'cap',
          template: function(item) {
            const operation = productionSchedule
              .flatMap(m => m.jobs)
              .flatMap(j => j.operations)
              .find(op => `${op.id}-${item.subgroup}` === item.id);

            if (!operation) return '';

            const isPlanned = item.subgroup === 'planned';
            const duration = isPlanned ? operation.plannedDuration : operation.actualDuration;
            const startTime = isPlanned ? operation.plannedStart : operation.actualStart;
            const delay = moment(operation.actualStart, 'HH:mm')
              .diff(moment(operation.plannedStart, 'HH:mm'), 'minutes');

            return `
              <div class="timeline-tooltip">
                <div class="tooltip-header">
                  <span class="component">${operation.name}</span>
                  <span class="type">${isPlanned ? 'Planned' : 'Actual'}</span>
                </div>
                <div class="tooltip-body">
                  <div>Duration: ${duration} minutes</div>
                  <div>Start Time: ${startTime}</div>
                  ${!isPlanned ? `
                    <div class="delay-info ${delay > 0 ? 'delayed' : 'early'}">
                      ${delay > 0 ? `Delayed by ${delay} minutes` : `Early by ${Math.abs(delay)} minutes`}
                    </div>
                  ` : ''}
                  <div>Status: ${operation.status}</div>
                </div>
              </div>
            `;
          }
        },
        timeAxis: { scale: 'hour', step: 1 }
      };

      // Cleanup previous timeline
      if (timelineRef.current) {
        timelineRef.current.destroy();
      }

      // Create new timeline
      timelineRef.current = new Timeline(
        timelineContainerRef.current,
        items,
        groups,
        options
      );

    } catch (error) {
      console.error('Error initializing timeline:', error);
    }
  };

  // Initialize timeline on component mount and data changes
  useEffect(() => {
    initializeTimeline();
  }, [timeRange, selectedMachines, dateRange]);

  // Timeline controls component
  const TimelineControls = () => (
    <Space className="mb-4">
      <Select
        value={timelineView}
        onChange={setTimelineView}
        style={{ width: 120 }}
      >
        <Option value="daily">Daily View</Option>
        <Option value="weekly">Weekly View</Option>
        <Option value="monthly">Monthly View</Option>
      </Select>
      <RangePicker
        showTime
        value={timelineRange}
        onChange={setTimelineRange}
      />
      <Button.Group>
        <Tooltip title="Zoom In">
          <Button 
            icon={<ZoomInOutlined />} 
            onClick={() => timelineRef.current?.zoomIn(0.5)} 
          />
        </Tooltip>
        <Tooltip title="Zoom Out">
          <Button 
            icon={<ZoomOutOutlined />} 
            onClick={() => timelineRef.current?.zoomOut(0.5)} 
          />
        </Tooltip>
        <Tooltip title="Fit Timeline">
          <Button 
            icon={<FullscreenOutlined />} 
            onClick={() => timelineRef.current?.fit()} 
          />
        </Tooltip>
      </Button.Group>
      <Button 
        type="primary"
        icon={<SyncOutlined />}
        onClick={() => initializeTimeline()}
      >
        Refresh
      </Button>
    </Space>
  );

  // Filter machines based on selection
  const getFilteredMachines = () => {
    if (selectedMachines.includes('all')) return machineData;
    return machineData.filter(machine => selectedMachines.includes(machine.id));
  };

  // Enhanced statistics calculation
  const getStatistics = () => {
    try {
      const filtered = getFilteredMachines();
      const validMachines = filtered.filter(m => m.oee?.overall);
      
      return {
        efficiency: validMachines.length > 0 
          ? validMachines.reduce((acc, m) => acc + m.efficiency, 0) / validMachines.length 
          : 0,
        activeMachines: filtered.filter(m => m.status === 'running').length,
        totalAlerts: filtered.reduce((acc, m) => acc + (m.alerts || 0), 0),
        productionRate: filtered.reduce((acc, m) => acc + (m.actualUnits || 0), 0) / 8,
        averageOEE: validMachines.length > 0 
          ? validMachines.reduce((acc, m) => acc + m.oee.overall, 0) / validMachines.length 
          : 0,
        totalDowntime: filtered.reduce((acc, m) => 
          acc + ((m.downtime?.planned || 0) + (m.downtime?.unplanned || 0)), 0)
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return {
        efficiency: 0,
        activeMachines: 0,
        totalAlerts: 0,
        productionRate: 0,
        averageOEE: 0,
        totalDowntime: 0
      };
    }
  };

  // Add loading state handling
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setTimelineData(generateTimelineData(timelineRange[0], timelineRange[1], timeRange));
      setLoading(false);
    }, 1000);
  }, [selectedMachines, timeRange, dateRange, timelineRange]);

  const stats = getStatistics();

  return (
    <div className="space-y-6">
      {/* Header with Machine Selection and Time Controls */}
      {/* <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
       
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Production Monitoring</h1>
          <Select
            mode="multiple"
            style={{ width: '300px' }}
            placeholder="Select Machines"
            defaultValue={['all']}
            onChange={setSelectedMachines}
            options={[
              { value: 'all', label: 'All Machines' },
              ...machineData.map(m => ({ value: m.id, label: `${m.name} (${m.id})` })),
            ]}
          />
        </div>
        <Space size="large">
          <Select
            value={timeRange}
            style={{ width: '120px' }}
            onChange={setTimeRange}
            options={[
              { value: 'shift1', label: 'Shift 1' },
              { value: 'shift2', label: 'Shift 2' },
              { value: 'shift3', label: 'Shift 3' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          {timeRange === 'custom' && (
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              onChange={setDateRange}
            />
          )}
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Space>
      </div> */}

 
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic
              title="Overall OEE"
              value={stats.averageOEE}
              precision={1}
              valueStyle={{ color: stats.averageOEE >= 85 ? '#3f8600' : '#cf1322' }}
              prefix={<Activity size={16} />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic
              title="Production Rate"
              value={stats.productionRate}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<Clock size={16} />}
              suffix="units/hr"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic
              title="Active Machines"
              value={stats.activeMachines}
              suffix={`/ ${getFilteredMachines().length}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic
              title="Total Downtime"
              value={stats.totalDowntime}
              valueStyle={{ color: stats.totalDowntime > 180 ? '#cf1322' : '#52c41a' }}
              prefix={<ClockCircleOutlined />}
              suffix="min"
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content with Enhanced Tabs */}
      <Card className="shadow-lg">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="production-tabs"
        >
          <TabPane tab="Real-time Monitoring" key="realtime">
            <div className="mb-4">
              <TimelineControls />
              <div 
                ref={timelineContainerRef} 
                className="schedule-timeline"
                style={{ 
                  height: '500px',
                  backgroundColor: '#fff',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              />
            </div>
            <MachineList 
              machines={getFilteredMachines()} 
              onMachineSelect={(machine) => {
                setSelectedMachine(machine);
                setShowMachineDetails(true);
              }}
            />
          </TabPane>
          
          <TabPane tab="OEE Analysis" key="oee">
            <OEEDashboard 
              machines={getFilteredMachines()} 
              historicalData={historicalData}
            />
          </TabPane>

          <TabPane tab="Production History" key="history">
            <ProductionHistory data={historicalData} />
          </TabPane>
{/* 
          <TabPane tab="Maintenance" key="maintenance">
            <MaintenanceSchedule machines={getFilteredMachines()} />
          </TabPane> */}

          <TabPane 
            tab={
              <span>
                Alerts{' '}
                {stats.totalAlerts > 0 && (
                  <Badge count={stats.totalAlerts} style={{ marginLeft: 8 }} />
                )}
              </span>
            }
            key="alerts"
          >
            <EnhancedAlerts machines={getFilteredMachines()} />
          </TabPane>
        </Tabs>
      </Card>

      {/* Machine Details Modal */}
      <MachineDetailsModal 
        machine={selectedMachine}
        visible={showMachineDetails}
        onClose={() => setShowMachineDetails(false)}
      />
    </div>
  );
};

// Styles
const styles = `
  .timeline-item {
    padding: 4px 8px;
    font-size: 12px;
  }
  
  .timeline-item .item-header {
    font-weight: bold;
    margin-bottom: 2px;
  }
  
  .timeline-item .item-desc {
    color: rgba(0, 0, 0, 0.65);
  }
  
  .timeline-item .item-time {
    font-size: 11px;
    color: rgba(0, 0, 0, 0.45);
  }
  
  .timeline-tooltip {
    background: white;
    padding: 8px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  .timeline-tooltip .tooltip-header {
    font-weight: bold;
    margin-bottom: 4px;
    padding-bottom: 4px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .timeline-tooltip .tooltip-body {
    font-size: 12px;
  }
  
  .timeline-tooltip .delay-info {
    margin-top: 4px;
    padding: 2px 4px;
    border-radius: 2px;
  }
  
  .timeline-tooltip .delay-info.delayed {
    background: #fff1f0;
    color: #cf1322;
  }
  
  .timeline-tooltip .delay-info.early {
    background: #f6ffed;
    color: #52c41a;
  }
  
  .vis-timeline {
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    background-color: white;
  }
  
  .vis-item {
    border-radius: 3px;
    cursor: pointer;
  }
  
  .vis-item.planned-task {
    background-color: rgba(24, 144, 255, 0.1);
    border: 1px solid #1890ff;
    color: #1890ff;
    z-index: 1;
  }
  
  .vis-item.actual-task {
    background-color: rgba(82, 196, 26, 0.1);
    border: 1px solid #52c41a;
    color: #52c41a;
    z-index: 2;
  }
  
  .vis-item.actual-task.in-progress {
    background-color: rgba(250, 173, 20, 0.1);
    border: 1px solid #faad14;
    color: #faad14;
  }
  
  .vis-panel.vis-center {
    border-left: 1px solid #f0f0f0;
  }
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default ProductionMonitoring;