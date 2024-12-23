import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Table, Badge, Select, Button, Statistic, Space, Alert, Tabs } from '@/components/ui/card';
import { Activity, AlertTriangle, Clock, Tool, Settings, BarChart2, Maximize2, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import ProductionGanttChart from './ProductionGanttChart';
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
      <Card className="h-full">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">{machine.name}</h3>
              <p className="text-sm text-gray-500">{machine.controller}</p>
            </div>
            <Badge 
              className={`${status === 'running' ? 'bg-green-500' : 'bg-yellow-500'} text-white px-2 py-1 rounded-full`}
            >
              {status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Tool className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-sm text-gray-500">Current Job</div>
                <div className="font-medium">{currentJob.partNumber}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              <div>
                <div className="text-sm text-gray-500">Cycle Time</div>
                <div className="font-medium">
                  {currentJob.cycleTime.actual}/{currentJob.cycleTime.planned}min
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Production Progress</span>
              <span>{currentJob.completedQty}/{currentJob.plannedQty}</span>
            </div>
            <Progress 
              value={(currentJob.completedQty/currentJob.plannedQty) * 100}
              className="h-2 bg-gray-200"
            >
              <div 
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(currentJob.completedQty/currentJob.plannedQty) * 100}%` }}
              />
            </Progress>
          </div>

          {machine.alerts.length > 0 && (
            <div className="mt-4">
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="ml-2">{machine.alerts.length} active alerts</span>
              </Alert>
            </div>
          )}
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
        <Space className="flex items-center gap-4">
          <Select
            value={selectedMachine}
            onValueChange={setSelectedMachine}
            className="w-[200px]"
          >
            <Select.Trigger>
              <Select.Value placeholder="Select Machine" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All Machines</Select.Item>
              {machineData.map(machine => (
                <Select.Item key={machine.id} value={machine.id}>
                  {machine.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
            className="w-[120px]"
          >
            <Select.Trigger>
              <Select.Value placeholder="Time Range" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="shift">Current Shift</Select.Item>
              <Select.Item value="day">Today</Select.Item>
              <Select.Item value="week">This Week</Select.Item>
            </Select.Content>
          </Select>

          <Button variant="outline" size="icon">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </Space>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="analytics">Production Analytics</Tabs.Trigger>
          <Tabs.Trigger value="quality">Quality Control</Tabs.Trigger>
          <Tabs.Trigger value="maintenance">Maintenance</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <ProductionGanttChart 
                data={formatGanttData()}
                machineData={machineData}
                selectedMachine={selectedMachine}
              />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Machine Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {(selectedMachine === 'all' 
                      ? machineData 
                      : machineData.filter(m => m.id === selectedMachine)
                    ).map(machine => (
                      <MachineStatus key={machine.id} machine={machine} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="analytics">
          <div className="mt-6">
            {/* Add analytics content here */}
          </div>
        </Tabs.Content>

        <Tabs.Content value="quality">
          <div className="mt-6">
            {/* Add quality control content here */}
          </div>
        </Tabs.Content>

        <Tabs.Content value="maintenance">
          <div className="mt-6">
            {/* Add maintenance content here */}
          </div>
        </Tabs.Content>
      </Tabs>
    </div>
  );
};

export default ProductionMonitoring;