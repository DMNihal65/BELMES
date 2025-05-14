import React, { useState, useEffect } from 'react';
import { Tabs, Button, Typography } from 'antd';
import { ArrowLeftOutlined, LineChartOutlined, BarChartOutlined, SettingOutlined } from '@ant-design/icons';
import RealTimeGraph from './RealTimeGraph';
// import DetailGraph from './DetailGraph';
// import ProductionTab from './ProductionTab';
import useEnergyMonitoringBelStore from '../../../store/energyMonitoringBel';

const { Title } = Typography;

const MachineOverlay = ({ machineId, machineName, onBack }) => {
  const { clearMachineData, connectWebSocket, disconnectWebSocket } = useEnergyMonitoringBelStore();
  const [activeTab, setActiveTab] = useState('1'); // Use consistent key format

  // Connect to WebSocket when component mounts and disconnect when unmounting
  useEffect(() => {
    console.log(`Initializing WebSocket for machine ${machineId}`);
    const socket = connectWebSocket(machineId);
    
    // Clean up function to disconnect when unmounting
    return () => {
      console.log(`Cleaning up WebSocket for machine ${machineId}`);
      disconnectWebSocket();
      clearMachineData();
    };
  }, [machineId, connectWebSocket, disconnectWebSocket, clearMachineData]);

  const handleBack = () => {
    clearMachineData();
    onBack();
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Define items for the Tabs component
  const items = [
    {
      key: '1',
      label: (
        <span>
          <LineChartOutlined /> Overview
        </span>
      ),
      children: <RealTimeGraph machineId={machineId} machineName={machineName} />,
    },
    /* Comment out these tabs until the components are ready
    {
      key: '2',
      label: (
        <span>
          <BarChartOutlined /> Detail Graph
        </span>
      ),
      children: <DetailGraph machineId={machineId} machineName={machineName} />,
    },
    {
      key: '3',
      label: (
        <span>
          <SettingOutlined /> Production
        </span>
      ),
      children: <ProductionTab machineId={machineId} machineName={machineName} />,
    },
    */
  ];

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f0f2f5', 
      height: '100vh', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          type="primary" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
        >
          Back
        </Button>
        <Title level={3} style={{ margin: 0 }}>{machineName || `Machine ${machineId}`}</Title>
        <div style={{ width: '80px' }}></div> {/* Spacer for alignment */}
      </div>
      
      {/* Content with fixed height and no scrolling */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        gap: '16px'
      }}>
        <Tabs 
          activeKey={activeTab}
          onChange={handleTabChange}
          items={items}
          style={{ overflow: 'hidden' }}
        />
      </div>
    </div>
  );
};

export default MachineOverlay; 