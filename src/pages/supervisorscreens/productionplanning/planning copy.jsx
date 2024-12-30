import React, { useState } from 'react';
import {
  Card, Row, Col, Button, Space, Select, DatePicker,
  Tabs, Progress, Tooltip, Badge
} from 'antd';
import {
  ReloadOutlined, CalendarOutlined
} from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import CapacityOverview from '../../../components/ProductionPlanning/CapacityOverview';
import MachineUtilization from '../../../components/ProductionPlanning/MachineUtilization';
import PlanningCalendar from '../../../components/ProductionPlanning/PlanningCalendar';
import CapacityAllocationModal from '../../../components/ProductionPlanning/CapacityAllocationModal';
import { mockMachineData, mockCapacityData } from '../../../data/mockPlanningData';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const Planning = () => {
  const [selectedMachines, setSelectedMachines] = useState(['all']);
  const [selectedPartNumbers, setSelectedPartNumbers] = useState(['all']);
  const [dateRange, setDateRange] = useState(null);
  const [viewMode, setViewMode] = useState('day');
  const [isAllocationModalVisible, setIsAllocationModalVisible] = useState(false);

  // Get filtered data based on selections
  const getFilteredData = () => {
    let machines = selectedMachines.includes('all') 
      ? mockMachineData 
      : mockMachineData.filter(m => selectedMachines.includes(m.id));

    return machines.map(machine => ({
      ...machine,
      capacityData: mockCapacityData
        .filter(c => c.machineId === machine.id)
        .filter(c => {
          if (!dateRange) return true;
          const [start, end] = dateRange;
          const date = new Date(c.date);
          return date >= start && date <= end;
        })
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="shadow-sm">
        <div className="flex justify-between items-center">
          <Space size="large">
            <Select
              mode="multiple"
              style={{ width: '300px' }}
              placeholder="Select Machines"
              value={selectedMachines}
              onChange={setSelectedMachines}
              options={[
                { value: 'all', label: 'All Machines' },
                ...mockMachineData.map(m => ({
                  value: m.id,
                  label: `${m.name} (${m.id})`
                }))
              ]}
            />
            <Select
              mode="multiple"
              style={{ width: '300px' }}
              placeholder="Select Part Numbers"
              value={selectedPartNumbers}
              onChange={setSelectedPartNumbers}
              options={[
                { value: 'all', label: 'All Parts' },
                // Add part number options
              ]}
            />
            <RangePicker 
              value={dateRange}
              onChange={setDateRange}
            />
          </Space>
          <Space>
            <Select
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'day', label: 'Daily View' },
                { value: 'week', label: 'Weekly View' },
                { value: 'month', label: 'Monthly View' },
              ]}
            />
            <Button 
              type="primary"
              onClick={() => setIsAllocationModalVisible(true)}
            >
              Allocate Capacity
            </Button>
          </Space>
        </div>
      </Card>

      {/* Main Content */}
      <Tabs defaultActiveKey="overview" className="bg-white p-4 rounded-lg shadow-sm">
        <TabPane tab="Capacity Overview" key="overview">
          <CapacityOverview 
            data={getFilteredData()}
            viewMode={viewMode}
          />
        </TabPane>
        <TabPane tab="Machine Utilization" key="utilization">
          <MachineUtilization 
            data={getFilteredData()}
            viewMode={viewMode}
          />
        </TabPane>
        <TabPane tab="Planning Calendar" key="calendar">
          <PlanningCalendar 
            data={getFilteredData()}
            viewMode={viewMode}
          />
        </TabPane>
      </Tabs>

      {/* Capacity Allocation Modal */}
      <CapacityAllocationModal
        visible={isAllocationModalVisible}
        onCancel={() => setIsAllocationModalVisible(false)}
        machines={getFilteredData()}
      />
    </div>
  );
};

export default Planning;