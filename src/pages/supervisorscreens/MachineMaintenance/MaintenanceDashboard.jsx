import React from 'react';
import { Tabs, Badge } from 'antd';
import MachineMaintenance from './MachineMaintenance';
import Components from './Components';
import MaintenanceRequests from './MaintenanceRequests';
import OperatorRequests from './OperatorMaintenanceRequests';
import useMachineMaintenanceStore from '../../../store/maintenance';

const { TabPane } = Tabs;

export default function MaintenanceDashboard() {
  const { totalPendingRequests, operatorTotalPendingRequests } = useMachineMaintenanceStore();

  return (
    <div className="p-6">
      <Tabs defaultActiveKey="1" type="card" size="large">
        <TabPane tab="Machine Maintenance" key="1">
          <MachineMaintenance />
        </TabPane>
        <TabPane tab="Components" key="2">
          <Components />
        </TabPane>
        <TabPane 
          tab={
            <Badge count={operatorTotalPendingRequests} offset={[10, 0]}>
              <span>Operator Requests</span>
            </Badge>
          } 
          key="4"
        >
          <OperatorRequests />
        </TabPane>
      </Tabs>
    </div>
  );
} 