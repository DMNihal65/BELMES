import React from 'react';
import { Card, Row, Col, Statistic, Button, Timeline, List, Tag, Progress } from 'antd';
import {
  WrenchIcon, AlertTriangle, CheckCircle2, Clock,
  Calendar as CalendarIcon, FileText, AlertOctagon,
  Settings, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MaintenanceOverview = () => {
  const maintenanceStats = {
    totalMachines: 24,
    scheduledMaintenance: 8,
    ongoingMaintenance: 3,
    completedToday: 5,
    upcomingTasks: 12,
    criticalAlerts: 2,
    mtbf: '168h', // Mean Time Between Failures
    mttr: '4.5h'  // Mean Time To Repair
  };

  const upcomingMaintenance = [
    { id: 1, machine: 'CNC Machine 01', type: 'Preventive', date: '2024-03-15', priority: 'high' },
    { id: 2, machine: 'Lathe Machine 03', type: 'Routine', date: '2024-03-16', priority: 'medium' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Quick Actions */}
      <div className="flex gap-4 mb-6">
        <Button type="primary" icon={<WrenchIcon size={16} />}>
          Schedule Maintenance
        </Button>
        <Button icon={<AlertTriangle size={16} />}>
          Report Issue
        </Button>
        <Button icon={<FileText size={16} />}>
          Generate Report
        </Button>
      </div>

      {/* Stats Overview */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card bordered={false} className="h-full">
            <Statistic 
              title="Equipment Health Score"
              value={85}
              suffix="%"
              prefix={<Settings size={20} />}
            />
            <Progress percent={85} status="active" strokeColor="#1890ff" />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Statistic 
                  title="MTBF"
                  value={maintenanceStats.mtbf}
                  prefix={<Clock size={16} />}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="MTTR"
                  value={maintenanceStats.mttr}
                  prefix={<Activity size={16} />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic 
              title="Scheduled Tasks"
              value={maintenanceStats.scheduledMaintenance}
              prefix={<CalendarIcon size={20} />}
            />
            <div className="mt-2">
              <Tag color="blue">{maintenanceStats.upcomingTasks} Upcoming</Tag>
              <Tag color="orange">{maintenanceStats.ongoingMaintenance} In Progress</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic 
              title="Critical Issues"
              value={maintenanceStats.criticalAlerts}
              prefix={<AlertOctagon size={20} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <Button type="link" danger className="mt-2">
              View Alerts
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card 
            title="Equipment Status"
            className="h-full"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Equipment Status Cards */}
              <Card className="bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">CNC Machines</span>
                  <Tag color="green">Operational</Tag>
                </div>
                <Progress percent={92} size="small" />
                <div className="mt-2 text-sm text-gray-500">
                  Next maintenance in 5 days
                </div>
              </Card>
              {/* Add more equipment cards */}
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card 
            title="Recent Activities"
            className="h-full"
          >
            <Timeline
              items={[
                {
                  color: 'green',
                  children: 'Preventive maintenance completed on CNC Machine 01',
                },
                {
                  color: 'blue',
                  children: 'Scheduled maintenance for Lathe Machine 03',
                },
                {
                  color: 'red',
                  children: 'Critical alert: Hydraulic pressure low on Machine 05',
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MaintenanceOverview; 