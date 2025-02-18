import React from 'react';
import { Tabs } from 'antd';
import MachineMaintenance from './MachineMaintenance';
import Components from './Components';

const { TabPane } = Tabs;

export default function MaintenanceDashboard() {
  return (
    <div className="p-6">
      <Tabs defaultActiveKey="1" type="card" size="large">
        <TabPane tab="Machine Maintenance" key="1">
          <MachineMaintenance />
        </TabPane>
        <TabPane tab="Components" key="2">
          <Components />
        </TabPane>
      </Tabs>
    </div>
  );
} 