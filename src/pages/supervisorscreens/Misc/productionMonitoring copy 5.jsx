import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Table, Badge, Select, Button, Statistic, Space, Alert, Tabs } from 'antd';
import { Activity, AlertTriangle, Clock,  Settings, BarChart2, Maximize2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import ProductionGantt from './ProductionGanttChart';
import ProductionGanttChart from '../../../components/ProductionMonitoring/ganttchart';
import { ToolFilled } from '@ant-design/icons';

const { TabPane } = Tabs;

const ProductionMonitoring = () => {
  const [selectedMachine, setSelectedMachine] = useState('all');
  const [timeRange, setTimeRange] = useState('shift');
  const [loading, setLoading] = useState(false);
  const [machineData, setMachineData] = useState([
    {
      id: 'DMG-001',
      name: 'DMG DMU 60 eVo linear',
      controller: 'Heidenhain iTNC 640',
      status: 'running',
      oeeMetrics: {
        availability: 95,
        performance: 88,
        quality: 98,
        overall: 82
      },
      currentJob: {
        jobId: 'JOB-2024-001',
        partNumber: 'PART-001',
        partDesc: 'Motor Casing',
        plannedQty: 100,
        completedQty: 85,
        rejectedQty: 2,
        startTime: '08:00',
        estimatedEndTime: '16:00',
        cycleTime: {
          planned: 45,
          actual: 42
        }
      },
      productionData: {
        planned: [100, 200, 300, 400, 500, 600, 700, 800],
        actual: [90, 185, 290, 380, 470, 580, 650, 750]
      },
      alerts: [
        { id: 1, type: 'warning', message: 'Tool wear detection' },
        { id: 2, type: 'info', message: 'Maintenance due in 48 hours' }
      ]
    },
    {
      id: 'DMG-002',
      name: 'DMG DMU 60T mB',
      controller: 'Heidenhain iTNC 530',
      status: 'idle',
      oeeMetrics: {
        availability: 88,
        performance: 82,
        quality: 95,
        overall: 76
      },
      currentJob: {
        jobId: 'JOB-2024-002',
        partNumber: 'PART-002',
        partDesc: 'Top Cover',
        plannedQty: 150,
        completedQty: 120,
        rejectedQty: 3,
        startTime: '08:00',
        estimatedEndTime: '16:00',
        cycleTime: {
          planned: 30,
          actual: 33
        }
      },
      productionData: {
        planned: [150, 300, 450, 600, 750, 900, 1050, 1200],
        actual: [140, 280, 420, 560, 700, 840, 980, 1120]
      },
      alerts: [
        { id: 3, type: 'error', message: 'Machine needs calibration' }
      ]
    }
  ]);

  // Generate time slots for the Gantt chart
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const startTime = new Date(now.setHours(8, 0, 0, 0));
    
    for (let i = 0; i < 8; i++) {
      slots.push(new Date(startTime.getTime() + i * 3600000));
    }
    return slots;
  };

  // Format machine data for Gantt chart
  const formatGanttData = () => {
    const timeSlots = generateTimeSlots();
    return timeSlots.map((slot, index) => {
      const dataPoint = {
        time: slot,
      };

      machineData.forEach(machine => {
        if (selectedMachine === 'all' || selectedMachine === machine.id) {
          dataPoint[`${machine.id}_planned`] = machine.productionData.planned[index];
          dataPoint[`${machine.id}_actual`] = machine.productionData.actual[index];
        }
      });

      return dataPoint;
    });
  };

  // Machine Status Component
  const MachineStatus = ({ machine }) => {
    const { currentJob, status } = machine;
    
    return (
      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">{machine.name}</h3>
              <p className="text-sm text-gray-500">{machine.controller}</p>
            </div>
            <Badge 
              status={status === 'running' ? 'success' : 'warning'} 
              text={status.toUpperCase()}
            />
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Current Job"
                value={currentJob.partNumber}
                prefix={<ToolFilled className="w-4 h-4" />}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Cycle Time"
                value={`${currentJob.cycleTime.actual}/${currentJob.cycleTime.planned}`}
                prefix={<Clock className="w-4 h-4" />}
                suffix="min"
              />
            </Col>
          </Row>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Production Progress</span>
              <span>{currentJob.completedQty}/{currentJob.plannedQty}</span>
            </div>
            <Progress 
              percent={(currentJob.completedQty/currentJob.plannedQty) * 100}
              status={status === 'running' ? 'active' : 'exception'}
            />
          </div>

          {machine.alerts.length > 0 && (
            <Alert
              message={`${machine.alerts.length} active alerts`}
              type="warning"
              showIcon
              icon={<AlertTriangle className="w-4 h-4" />}
            />
          )}
        </div>
      </Card>
    );
  };

  // OEE Chart Component
  const OEEChart = ({ machine }) => {
    const metrics = [
      { name: 'Availability', value: machine.oeeMetrics.availability, color: '#52c41a' },
      { name: 'Performance', value: machine.oeeMetrics.performance, color: '#1890ff' },
      { name: 'Quality', value: machine.oeeMetrics.quality, color: '#722ed1' },
      { name: 'Overall OEE', value: machine.oeeMetrics.overall, color: '#fa8c16' }
    ];

    return (
      <Card title="OEE Metrics">
        <div className="space-y-4">
          {metrics.map(metric => (
            <div key={metric.name}>
              <div className="flex justify-between mb-1">
                <span>{metric.name}</span>
                <span>{metric.value}%</span>
              </div>
              <Progress
                percent={metric.value}
                strokeColor={metric.color}
                showInfo={false}
              />
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="p-6">
      {/* Header with Machine Selection */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Production Monitoring</h1>
          <p className="text-gray-500">Real-time machine status and performance tracking</p>
        </div>
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder="Select Machine"
            value={selectedMachine}
            onChange={setSelectedMachine}
            options={[
              { value: 'all', label: 'All Machines' },
              ...machineData.map(m => ({ value: m.id, label: m.name }))
            ]}
          />
          <Select
            style={{ width: 120 }}
            value={timeRange}
            onChange={setTimeRange}
            options={[
              { value: 'shift', label: 'Current Shift' },
              { value: 'day', label: 'Today' },
              { value: 'week', label: 'This Week' }
            ]}
          />
          <Button icon={<Maximize2 className="w-4 h-4" />} />
        </Space>
      </div>

      {/* Main Content */}
      <Tabs defaultActiveKey="overview">
        <TabPane tab="Overview" key="overview">
          <Row gutter={[16, 16]}>
            <Col span={16}>
              <ProductionGanttChart 
                data={formatGanttData()}
                machineData={machineData}
                selectedMachine={selectedMachine}
              />
            </Col>
            <Col span={8}>
              <Space direction="vertical" className="w-full">
                {(selectedMachine === 'all' 
                  ? machineData 
                  : machineData.filter(m => m.id === selectedMachine)
                ).map(machine => (
                  <React.Fragment key={machine.id}>
                    <MachineStatus machine={machine} />
                    <OEEChart machine={machine} />
                  </React.Fragment>
                ))}
              </Space>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Production Analytics" key="analytics">
          {/* Add analytics content */}
        </TabPane>

        <TabPane tab="Quality Control" key="quality">
          {/* Add quality control content */}
        </TabPane>

        <TabPane tab="Maintenance" key="maintenance">
          {/* Add maintenance content */}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ProductionMonitoring;