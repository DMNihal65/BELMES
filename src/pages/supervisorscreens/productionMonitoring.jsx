import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tabs, Select, Button, Statistic, Space, Alert, DatePicker,Badge } from 'antd';
import { ReloadOutlined, CalendarOutlined } from '@ant-design/icons';
import { Activity, AlertTriangle, Clock } from 'lucide-react';
import ProductionGantt from '../../components/ProductionMonitoring/ganttchart';
import ProductionAlerts from '../../components/ProductionMonitoring/alerts';
import { message } from 'antd';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

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
  const [activeTab, setActiveTab] = useState('realtime');
  const [selectedMachines, setSelectedMachines] = useState(['all']);
  const [timeRange, setTimeRange] = useState('shift1');
  const [dateRange, setDateRange] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter machines based on selection
  const getFilteredMachines = () => {
    if (selectedMachines.includes('all')) return machineData;
    return machineData.filter(machine => selectedMachines.includes(machine.id));
  };

  // Calculate statistics based on filtered machines
  const getStatistics = () => {
    const filtered = getFilteredMachines();
    return {
      efficiency: filtered.reduce((acc, m) => acc + m.efficiency, 0) / filtered.length,
      activeMachines: filtered.filter(m => m.status === 'running').length,
      totalAlerts: filtered.reduce((acc, m) => acc + m.alerts, 0),
      productionRate: filtered.reduce((acc, m) => acc + m.actualUnits, 0) / 8 // 8 hours shift
    };
  };

  const stats = getStatistics();

  return (
    <div className="space-y-6">
      {/* Header with Machine Selection and Time Controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
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
              ...machineData.map(m => ({ value: m.id, label: `${m.name} (${m.id})` }))
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
      </div>

      {/* Key Statistics */}
      <Row gutter={16}>
        <Col span={6}>
          <Card bordered={false} className="hover:shadow-md transition-shadow">
            <Statistic
              title="Overall Efficiency"
              value={stats.efficiency}
              precision={1}
              valueStyle={{ color: stats.efficiency >= 85 ? '#3f8600' : '#cf1322' }}
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
              title="Active Alerts"
              value={stats.totalAlerts}
              valueStyle={{ color: stats.totalAlerts > 0 ? '#cf1322' : '#52c41a' }}
              prefix={<AlertTriangle size={16} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card className="shadow-lg">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="production-tabs"
        >
          <TabPane tab="Real-time Monitoring" key="realtime">
            <ProductionGantt 
              machineData={getFilteredMachines()}
              timeRange={timeRange}
              dateRange={dateRange}
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                Alerts {stats.totalAlerts > 0 && 
                  <Badge count={stats.totalAlerts} style={{ marginLeft: 8 }} />
                }
              </span>
            } 
            key="alerts"
          >
            <ProductionAlerts 
              machineData={getFilteredMachines()}
              timeRange={timeRange}
              dateRange={dateRange}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ProductionMonitoring;
