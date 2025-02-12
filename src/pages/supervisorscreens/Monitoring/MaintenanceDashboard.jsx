import React, { useState } from 'react';
import { Tabs, Card } from 'antd';
import {
  LayoutDashboard, Settings, Calendar, ClipboardList,
  History, Package2, BarChart2, Files
} from 'lucide-react';

// Import tab components
import MaintenanceOverview from './MaintenanceTabs/Overview';
import Equipment from './MaintenanceTabs/Equipment';
import Schedule from './MaintenanceTabs/Schedule';
import WorkOrders from './MaintenanceTabs/WorkOrders';
import MaintenanceHistory from './MaintenanceTabs/History';
import SparePartsInventory from './MaintenanceTabs/Inventory';
import MaintenanceAnalytics from './MaintenanceTabs/Analytics';
import Documents from './MaintenanceTabs/Documents';

const { TabPane } = Tabs;

const MaintenanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span className="flex items-center gap-2">
          <LayoutDashboard size={16} />
          Overview
        </span>
      ),
      children: <MaintenanceOverview />
    },
    {
      key: 'machines',
      label: (
        <span className="flex items-center gap-2">
          <Settings size={16} />
          Equipment
        </span>
      ),
      children: <Equipment />
    },
    {
      key: 'schedule',
      label: (
        <span className="flex items-center gap-2">
          <Calendar size={16} />
          Schedule
        </span>
      ),
      children: <Schedule />
    },
    {
      key: 'workorders',
      label: (
        <span className="flex items-center gap-2">
          <ClipboardList size={16} />
          Work Orders
        </span>
      ),
      children: <WorkOrders />
    },
    {
      key: 'history',
      label: (
        <span className="flex items-center gap-2">
          <History size={16} />
          History
        </span>
      ),
      children: <MaintenanceHistory />
    },
    {
      key: 'inventory',
      label: (
        <span className="flex items-center gap-2">
          <Package2 size={16} />
          Spare Parts
        </span>
      ),
      children: <SparePartsInventory />
    },
    {
      key: 'analytics',
      label: (
        <span className="flex items-center gap-2">
          <BarChart2 size={16} />
          Analytics
        </span>
      ),
      children: <MaintenanceAnalytics />
    },
    {
      key: 'documents',
      label: (
        <span className="flex items-center gap-2">
          <Files size={16} />
          Documents
        </span>
      ),
      children: <Documents />
    }
  ];

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          size="large"
          className="maintenance-tabs"
          tabBarGutter={8}
          tabBarStyle={{
            marginBottom: 24,
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: 0
          }}
        />
      </Card>
    </div>
  );
};

export default MaintenanceDashboard; 