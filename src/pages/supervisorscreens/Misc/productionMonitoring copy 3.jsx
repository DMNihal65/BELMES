import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Table, Badge, Select, Button, Statistic, Space, Alert, Tabs } from 'antd';
import { Activity, AlertTriangle, Clock, Settings, BarChart2, Maximize2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ToolFilled } from '@ant-design/icons';
import ProductionGanttChart from '../../../components/ProductionMonitoring/ganttchart';

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
      alerts: [
        { id: 1, type: 'warning', message: 'Tool wear detection' },
        { id: 2, type: 'info', message: 'Maintenance due in 48 hours' }
      ]
    },
    // Add more machine data here
  ]);

  // Enhanced OEE Chart Component
  const OEEChart = ({ data }) => {
    const metrics = [
      { name: 'Availability', value: data.oeeMetrics.availability, color: '#52c41a' },
      { name: 'Performance', value: data.oeeMetrics.performance, color: '#1890ff' },
      { name: 'Quality', value: data.oeeMetrics.quality, color: '#722ed1' },
      { name: 'Overall OEE', value: data.oeeMetrics.overall, color: '#fa8c16' }
    ];

    return (
      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.name} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{metric.name}</span>
              <span>{metric.value}%</span>
            </div>
            <Progress 
              percent={metric.value} 
              strokeColor={metric.color}
              size="small"
              showInfo={false}
            />
          </div>
        ))}
      </div>
    );
  };

  // Machine Status Component
  const MachineStatus = ({ machine }) => {
    const { currentJob, status } = machine;
    
    return (
      <Card className="h-full">
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

          <div className="grid grid-cols-2 gap-4">
            <Statistic 
              title="Current Job"
              value={currentJob.partNumber}
              prefix={<ToolFilled className="w-4 h-4" />}
            />
            <Statistic 
              title="Cycle Time"
              value={`${currentJob.cycleTime.actual}/${currentJob.cycleTime.planned}`}
              prefix={<Clock className="w-4 h-4" />}
              suffix="min"
            />
          </div>

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
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with Machine Selection */}
      <div className="flex justify-between items-center">
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
          <Button 
            type="primary"
            icon={<Maximize2 className="w-4 h-4" />}
          >
            Full Screen
          </Button>
        </Space>
      </div>

      {/* Main Content */}
      <Tabs defaultActiveKey="overview" type="card">
        <TabPane tab="Overview" key="overview">
          <Row gutter={[16, 16]}>
            <Col span={16}>
              <Card title="Real-time Production Status">
                {selectedMachine === 'all' ? (
                  <div className="grid grid-cols-2 gap-4">
                    {machineData.map(machine => (
                      <MachineStatus key={machine.id} machine={machine} />
                    ))}
                  </div>
                ) : (
                  <MachineStatus 
                    machine={machineData.find(m => m.id === selectedMachine)} 
                  />
                )}
              </Card>
            </Col>
            <Col span={8}>
              <Card title="OEE Metrics">
                <OEEChart 
                  data={selectedMachine === 'all' 
                    ? machineData[0] 
                    : machineData.find(m => m.id === selectedMachine)
                  } 
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Production Analytics" key="analytics">
          {/* Add production analytics components */}
          <ProductionGanttChart machineData={machineData} selectedMachine={selectedMachine} timeRange={timeRange} />
        </TabPane>

        <TabPane tab="Quality Control" key="quality">
          {/* Add quality control components */}
        </TabPane>

        <TabPane tab="Maintenance" key="maintenance">
          {/* Add maintenance tracking components */}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ProductionMonitoring;