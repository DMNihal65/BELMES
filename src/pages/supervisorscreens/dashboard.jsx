import React, { useState, Suspense, useEffect } from 'react';
import { Card, Row, Col, Statistic, Tabs, Progress, Badge, Collapse, Tag, Empty, Alert, Button, Tooltip, Radio } from 'antd';
import { 
  ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, 
  CheckCircleOutlined, ToolOutlined, DashboardOutlined, 
  CodeSandboxOutlined, BarcodeOutlined, BarChartOutlined, 
  MonitorOutlined, FileTextOutlined, ProjectOutlined, 
  FullscreenOutlined, CompassOutlined, DesktopOutlined,
  AppstoreOutlined, BorderHorizontalOutlined
} from '@ant-design/icons';
import useDashboardStore from '../../store/dashboard';

// Import 3D components
import FactoryScene from '../../components/3d/FactoryScene';

// Main Dashboard Component
const SupervisorDashboard = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [cameraView, setCameraView] = useState('overview');
  const { initializeWebSocket, cleanup, getMappedMachineData, isConnected, error } = useDashboardStore();

  // Initialize WebSocket connection
  useEffect(() => {
    initializeWebSocket();
    return () => cleanup();
  }, []);

  // Get the mapped machine data and categorize it
  const machines = getMappedMachineData().map((machine, index) => {
    // Assign machine types based on naming convention or other attributes
    // This is just a placeholder logic - adjust according to your actual data
    let type = 'milling';
    
    if (machine.name?.toLowerCase().includes('turn') || 
        machine.partDescription?.toLowerCase().includes('lathe') ||
        index % 3 === 0) {
      type = 'turning';
    } else if (machine.name?.toLowerCase().includes('edm') || 
               machine.name?.toLowerCase().includes('wire') ||
               index % 7 === 6) {
      type = 'edm';
    }
    
    return {
      ...machine,
      type
    };
  });

  // Handle machine selection
  const handleMachineSelect = (machine) => {
    setSelectedMachine(machine);
    setCameraView('focusMachine');
  };

  // Camera view options
  const cameraViewOptions = [
    { label: <Tooltip title="Overview"><DesktopOutlined /></Tooltip>, value: 'overview' },
    { label: <Tooltip title="Top Down"><BorderHorizontalOutlined /></Tooltip>, value: 'topDown' },
    { label: <Tooltip title="First Person"><CompassOutlined /></Tooltip>, value: 'firstPerson' },
    { label: <Tooltip title="Turning Section"><ToolOutlined /></Tooltip>, value: 'turningSection' },
    { label: <Tooltip title="Milling Section"><AppstoreOutlined /></Tooltip>, value: 'millingSection' },
    { label: <Tooltip title="EDM Room"><ProjectOutlined /></Tooltip>, value: 'edmRoom' },
  ];

  return (
    <div className="p-6 h-screen bg-gray-100">
      {/* Connection Status */}
      {error && (
        <Alert
          message="Connection Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      )}
      {!isConnected && !error && (
        <Alert
          message="Connecting..."
          description="Attempting to connect to machine monitoring system..."
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      {/* Main Content Area */}
      <Row gutter={16} className="h-[calc(100vh-160px)]">
        {/* Factory Overview */}
        <Col span={16}>
          <Card 
            title={
              <div className="flex justify-between items-center">
                <span>Factory Shop Floor</span>
                <Radio.Group 
                  options={cameraViewOptions} 
                  onChange={(e) => setCameraView(e.target.value)}
                  value={cameraView}
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                />
              </div>
            }
            className="h-full"
            bodyStyle={{ 
              padding: 0, 
              height: 'calc(100% - 57px)',
              position: 'relative'
            }}
          >
            <Suspense fallback={<div className="h-full flex items-center justify-center">Loading 3D Factory...</div>}>
              <FactoryScene 
                machines={machines}
                onMachineSelect={handleMachineSelect}
                selectedMachine={selectedMachine}
                cameraView={cameraView}
              />
            </Suspense>
          </Card>
        </Col>

        {/* Machine Details */}
        <Col span={8}>
          <MachineDetails 
            selectedMachine={selectedMachine || (machines.length > 0 ? machines[0] : null)} 
            onZoomToMachine={() => {
              if (selectedMachine) {
                setCameraView('focusMachine');
              }
            }}
          />
        </Col>
      </Row>
    </div>
  );
};

// Update the Machine Details section with improved UI
const MachineDetails = ({ selectedMachine, onZoomToMachine }) => {
  const { fetchOEEData, oeeData } = useDashboardStore();

  useEffect(() => {
    if (selectedMachine?.id) {
      fetchOEEData(selectedMachine.id);
    }
  }, [selectedMachine?.id]);

  if (!selectedMachine) {
    return (
      <Card className="h-full">
        <Empty description="No machine selected" />
      </Card>
    );
  }

  // Format the last updated time
  const formatDateTime = (dateString) => {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      
      return date.toLocaleString(undefined, options);
    } catch (error) {
      return 'Date error';
    }
  };

  // Calculate completion percentage
  const completionPercentage = 
    selectedMachine.targetCount > 0 
      ? Math.round((selectedMachine.totalCount / selectedMachine.targetCount) * 100) 
      : 0;

  return (
    <Card 
      title={
        <div className="flex justify-between items-center">
          <span>{selectedMachine.name}</span>
          <Tooltip title="Focus on this machine">
            <Button 
              type="primary" 
              size="small" 
              icon={<FullscreenOutlined />} 
              onClick={onZoomToMachine}
            />
          </Tooltip>
        </div>
      }
      className="h-full"
      bodyStyle={{ height: 'calc(100% - 57px)', padding: '16px', overflow: 'auto' }}
      extra={
        <Tag color={
          selectedMachine.status === 'PRODUCTION' ? 'success' : 
          selectedMachine.status === 'ON' ? 'warning' : 
          'default'
        }>
          {selectedMachine.status}
        </Tag>
      }
    >
      <div className="space-y-4">
        {/* Status Summary */}
        {/* <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl shadow-sm border border-blue-100"> */}
          {/* <div className="grid grid-cols-3 gap-3">
            <Statistic
              title="OEE"
              value={oeeData?.average_oee || selectedMachine.oee || 0}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
              prefix={<DashboardOutlined />}
            />
            <Statistic
              title="Parts Complete"
              value={selectedMachine.totalCount || 0}
              valueStyle={{ color: selectedMachine.status === 'PRODUCTION' ? '#52c41a' : '#666' }}
              prefix={<CodeSandboxOutlined />}
            />
            <Statistic
              title="Target"
              value={selectedMachine.targetCount || 0}
              valueStyle={{ color: '#722ed1' }}
              prefix={<BarChartOutlined />}
            />
          </div> */}

          {/* Progress bar */}
          {/* <div className="mt-3">
            <div className="flex justify-between items-center text-xs mb-1">
              <span>Production Progress</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress 
              percent={completionPercentage} 
              status={
                selectedMachine.status === 'OFF' ? 'normal' :
                completionPercentage >= 100 ? 'success' :
                selectedMachine.status === 'PRODUCTION' ? 'active' : 'normal'
              }
              strokeColor={
                selectedMachine.status === 'PRODUCTION' ? 
                  {from: '#10b981', to: '#059669'} : 
                  undefined
              }
            />
          </div> */}
        {/* </div> */}

        {/* OEE Components */}
        {oeeData && (
          <Card 
            size="small"
            title={
              <span className="text-sm font-semibold text-gray-700 flex items-center">
                <DashboardOutlined className="mr-1" />
                OEE Analysis
              </span>
            }
            className="shadow-sm"
            bodyStyle={{ padding: '12px' }}
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <Progress
                  type="dashboard"
                  percent={oeeData.average_availability || 0}
                  width={80}
                  strokeColor="#1890ff"
                />
                <div className="text-xs mt-1">Availability</div>
              </div>
              <div className="text-center">
                <Progress
                  type="dashboard"
                  percent={oeeData.average_performance || 0}
                  width={80}
                  strokeColor="#52c41a"
                />
                <div className="text-xs mt-1">Performance</div>
              </div>
              <div className="text-center">
                <Progress
                  type="dashboard"
                  percent={oeeData.average_quality || 0}
                  width={80}
                  strokeColor="#722ed1"
                />
                <div className="text-xs mt-1">Quality</div>
              </div>
            </div>
          </Card>
        )}

        {/* Program and Part Details */}
        <Collapse 
          defaultActiveKey={['1']} 
          ghost
          className="bg-white shadow-sm rounded-md"
        >
          <Collapse.Panel 
            header={
              <span className="text-sm font-semibold text-gray-700 flex items-center">
                <CodeSandboxOutlined className="mr-2" />
                Program & Part Details
              </span>
            } 
            key="1"
          >
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <div className="text-gray-500">Program Number</div>
                <div className="font-medium">{selectedMachine.currentProgram || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Part Number</div>
                <div className="font-medium">{selectedMachine.partNumber || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Operation Number</div>
                <div className="font-medium">{selectedMachine.operationNumber || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Production Order</div>
                <div className="font-medium">{selectedMachine.productionOrder || 'N/A'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500">Part Description</div>
                <div className="font-medium">{selectedMachine.partDescription || 'N/A'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500">Operation Description</div>
                <div className="font-medium">{selectedMachine.operationDescription || 'N/A'}</div>
              </div>
            </div>
          </Collapse.Panel>
        </Collapse>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 flex items-center justify-end mt-2">
          <ClockCircleOutlined className="mr-1" />
          Last updated: {formatDateTime(selectedMachine.lastUpdated || selectedMachine.last_updated)}
        </div>
      </div>
    </Card>
  );
};

export default SupervisorDashboard;