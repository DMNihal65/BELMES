import React from 'react';
import { Tabs, Badge , Table } from 'antd';
import {BarChartOutlined, AlertOutlined} from '@ant-design/icons'
import MachineMaintenance from './MachineMaintenance';
import Notifications from './Notifications';
import useMachineMaintenanceStore from '../../../store/maintenance';
import DowntimeTickets from './DowntimeTickets';
import TicketAnalytics from './TicketAnalytics';
import MachineCalibrationDueDates from './MachineCalibrationDueDates';
import AssetLogs from './AssetLogs';

const { TabPane } = Tabs;


const OEEIssues = () => {
  const { machineIssues, fetchOeeIssues, loading } = useMachineMaintenanceStore();

  React.useEffect(() => {
    fetchOeeIssues();
  }, [fetchOeeIssues]);

  const columns = [
    {
      title: 'Sl No',
      dataIndex: 'id',
      key: 'id',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Machine Name',
      dataIndex: 'machine_name',
      key: 'machine_name',
    },
    {
      title: 'Start Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'End Time',
      dataIndex: 'end_timestamp',
      key: 'end_timestamp',
      render: (text) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: 'Reported By',
      dataIndex: 'reported_by',
      key: 'reported_by',
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={machineIssues}
      loading={loading}
      rowKey="id"
      pagination={{ pageSize: 10 }}
      className="bg-white p-4"
    />
  );
};


const MachineCalibration = () => {
  const { machineCalibrationLogs, fetchMachineCalibrationLogs, loading } = useMachineMaintenanceStore();

  React.useEffect(() => {
    fetchMachineCalibrationLogs();
  }, [fetchMachineCalibrationLogs]);

  const columns = [
    {
      title: 'Sl No',
      dataIndex: 'id',
      key: 'id',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Machine Name',
      dataIndex: ['machine_details', 'make'],
      key: 'machine_name',
    },
    {
      title: 'Machine Type',
      dataIndex: ['machine_details', 'type'],
      key: 'machine_type',
    },
    {
      title: 'Due Date',
      dataIndex: 'calibration_due_date',
      key: 'calibration_due_date',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Notification Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => new Date(text).toLocaleString(),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={machineCalibrationLogs}
      loading={loading}
      rowKey="id"
      pagination={{ pageSize: 10 }}
      className="bg-white p-4"
    />
  );
};



export default function MaintenanceDashboard() {
  const { 
    totalMachineNotifications, 
    totalComponentNotifications
  } = useMachineMaintenanceStore();

  const totalNotifications = totalMachineNotifications + totalComponentNotifications;

  return (
    <div className="p-6 ">
      <Tabs defaultActiveKey="1" type="card" size="large">
        {/* <TabPane tab="Machine Maintenance" key="1">
          <MachineMaintenance />
        </TabPane> */}
         <TabPane tab="Assets Logs" key="1">
          <AssetLogs />
        </TabPane>
       
        <TabPane tab="KPIs" key="3">
          <Tabs defaultActiveKey="1" className='bg-white p-4'>
            {/* <TabPane tab="Tickets" key="1">
              <Tickets />
            </TabPane> */}
            <TabPane 
              tab={
                <span className="flex items-center gap-1">
                  <BarChartOutlined />
                  Analytics
                </span>
              } 
              key="1"
            >
              <TicketAnalytics />
            </TabPane>
          </Tabs>
        </TabPane>
        <TabPane tab="Downtime Tickets" key="4">
          <Tabs defaultActiveKey="1" className='bg-white p-4'>
          <TabPane 
            tab={
              <span className="flex items-center gap-1">
                <AlertOutlined />
                Downtime Tickets
              </span>
            } 
            key="1"
          >
            <DowntimeTickets />
          </TabPane>
          </Tabs>
        </TabPane>
        <TabPane tab="OEE Issues" key="5">
          <OEEIssues />
        </TabPane>

        {/* <TabPane tab="Machine Calibration" key="6">
          <MachineCalibration />
        </TabPane> */}
        <TabPane tab="Machine Calibration Due" key="7">
          <MachineCalibrationDueDates />
        </TabPane>
        <TabPane 
          tab={
         
              <span>Maintenance Logs</span>
           
          } 
          key="8"
        >
          <Notifications />
        </TabPane>
       
      </Tabs>
    </div>
  );
} 