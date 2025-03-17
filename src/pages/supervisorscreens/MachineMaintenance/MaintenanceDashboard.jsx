import React from 'react';
import { Tabs, Badge } from 'antd';
import MachineMaintenance from './MachineMaintenance';
import Notifications from './Notifications';
import useMachineMaintenanceStore from '../../../store/maintenance';

const { TabPane } = Tabs;

export default function MaintenanceDashboard() {
  const { 
    totalMachineNotifications, 
    totalComponentNotifications 
  } = useMachineMaintenanceStore();

  const totalNotifications = totalMachineNotifications + totalComponentNotifications;

  return (
    <div className="p-6">
      <Tabs defaultActiveKey="1" type="card" size="large">
        <TabPane tab="Machine Maintenance" key="1">
          <MachineMaintenance />
        </TabPane>
        <TabPane 
          tab={
            <Badge count={totalNotifications} offset={[10, 0]}>
              <span>Maintenance Logs</span>
            </Badge>
          } 
          key="2"
        >
          <Notifications />
        </TabPane>
      </Tabs>
    </div>
  );
} 