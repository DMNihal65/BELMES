import React, { useEffect } from 'react';
import { Tabs, Badge } from 'antd';
import MachineMaintenance from './MachineMaintenance';
import Components from './Components';
import OperatorRequests from './OperatorMaintenanceRequests';
import useMachineMaintenanceStore from '../../../store/maintenance';

const { TabPane } = Tabs;

export default function MaintenanceDashboard() {
  const { operatorTotalPendingRequests, fetchOperatorPendingRequests } = useMachineMaintenanceStore();

  useEffect(() => {
    // Fetch pending requests when component mounts
    fetchOperatorPendingRequests();
    
    // Set up an interval to refresh the count every minute
    const interval = setInterval(() => {
      fetchOperatorPendingRequests();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchOperatorPendingRequests]);

  const items = [
    {
      key: '1',
      label: 'Machine Maintenance',
      children: <MachineMaintenance />
    },
    {
      key: '2',
      label: 'Components',
      children: <Components />
    },
    {
      key: '4',
      label: (
        <Badge count={operatorTotalPendingRequests} offset={[10, 0]}>
          <span>Operator Requests</span>
        </Badge>
      ),
      children: <OperatorRequests />
    }
  ];

  return (
    <div className="w-full min-h-screen p-4 md:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[2000px] mx-auto">
        <Tabs 
          defaultActiveKey="1" 
          type="card" 
          size="large" 
          items={items}
          className="maintenance-dashboard-tabs"
        />
      </div>
    </div>
  );
} 