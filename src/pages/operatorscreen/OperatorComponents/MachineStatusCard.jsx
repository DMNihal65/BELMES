import React, { useEffect, useState } from 'react';
import { Card, Tooltip, Badge, Statistic, Tag, Row, Col, Progress, Button, Modal } from 'antd';
import { Gauge, Activity, Clock, AlertTriangle, Info, Power, Cpu, AlertCircle, HelpCircle, Bolt, Zap } from 'lucide-react';
import useOperatorStore from '../../../store/operator-store';
import { ThunderboltOutlined, ToolFilled } from '@ant-design/icons';
import MachineIssueModal from '../../operatorscreens/MachineIssueModal';

// DMG Mori machine image for all types
const machineImages = {

  default: '/dmg.png',
  milling: '/dmg.png',
  turning: '/dmg.png',
  grinding: '/dmg.png'

};



const MachineStatusCard = () => {
  const {
    machineStatus,
    isConnected,
    connectionError,
    idleTime,
    formatIdleTime
  } = useOperatorStore();
  
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  
useEffect(() => {
  const storedMachine = localStorage.getItem('currentMachine');
  const parsedMachine = storedMachine ? JSON.parse(storedMachine) : null; 

  // Only initialize if not already connected and machine exists
  if(parsedMachine?.id && !isConnected && !useOperatorStore.getState().ws){
    useOperatorStore.getState().initializeWebSocket(parsedMachine.id);
  }
}, []); // Remove isConnected dependency to prevent re-runs

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRODUCTION':
        return 'success';
      case 'IDLE':
      case 'ON':
        return 'warning';
      case 'OFF':
        return 'error';
      default:
        return 'default';
    }
  };
  
  const getStatusClassName = (status) => {
    switch (status) {
      case 'PRODUCTION':
        return 'machine-status-running';
      case 'IDLE':
      case 'ON':
        return 'machine-status-idle';
      case 'OFF':
        return 'machine-status-off';
      default:
        return '';
    }
  };

  // Get utilization percentage
  const getUtilization = () => {
    if (!machineStatus) return 0;
    // Simple utilization based on status
    switch (machineStatus.status) {
      case 'PRODUCTION':
        return 90;
      case 'IDLE':
      case 'ON':
        return 40;
      case 'OFF':
      default:
        return 0;
    }
  };

  const statusIconMap = {
    'PRODUCTION': <Zap className="text-green-500" style={{ fontSize: '32px' }} />,
    'IDLE': <Cpu className="text-amber-500" size={32} />,
    'ON': <Cpu className="text-amber-500" size={32} />,
    'OFF': <Power className="text-red-500" size={32} />
  };
  
  // Determine machine type based on name (replace with actual logic)
  const getMachineType = () => {
    if (!machineStatus?.machine_name) return 'default';
    const name = machineStatus.machine_name.toLowerCase();
    if (name.includes('mill')) return 'milling';
    if (name.includes('turn') || name.includes('lathe')) return 'turning';
    if (name.includes('grind')) return 'grinding';
    return 'default';
  };
  
  // Get machine image
const getMachineImage = () => {

    const type = getMachineType();
    return machineImages[type] || machineImages.default;

  };
  

  // Background color based on status
  const getStatusBackgroundColor = (status) => {
    switch (status) {
      case 'PRODUCTION':
        return 'bg-green-50';
      case 'IDLE':
      case 'ON':
        return 'bg-amber-50';
      case 'OFF':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <>
      <Card 
        className={`status-card h-full shadow-sm ${getStatusClassName(machineStatus?.status)}`}
        bodyStyle={{ padding: '12px' }}
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="text-sky-500" size={20} />
              <span className="font-semibold text-base">Machine Status</span>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
                <Badge status={isConnected ? 'success' : 'error'} />
              </Tooltip>
              <Button 
                type="text" 
                danger 
                icon={<AlertCircle size={18} />} 
                size="middle"
                onClick={() => setIssueModalVisible(true)}
              >
                Report Issue
              </Button>
            </div>
          </div>
        }
      >
        {connectionError && (
          <div className="mb-3 bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle size={16} />
              <span>{connectionError}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Machine Image and Status Section */}
          <div className="flex bg-gradient-to-r from-sky-50 to-white border border-sky-100 rounded-lg overflow-hidden">
            <div className="w-1/2 p-4 flex flex-col justify-between">
              <div>
                <div className="text-xl font-bold text-sky-900 truncate">
                  {machineStatus?.machine_name || 'Loading...'}
                </div>
                <div className="text-2xl font-bold mt-3">
                  <Tag color={getStatusColor(machineStatus?.status)} className="text-base px-3 py-1">
                    {machineStatus?.status || 'Unknown'}
                  </Tag>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-500">
                  <Clock size={14} className="inline mr-1" />
                  Updated: {machineStatus?.lastUpdatedFormatted || 'N/A'}
                </div>
              </div>
            </div>
            <div className="w-1/2 relative">
              <div className="absolute top-1 right-1">
                {statusIconMap[machineStatus?.status] || statusIconMap.OFF}
              </div>
              <img 
                src={getMachineImage()} 
                alt="CNC Machine" 
                className="h-full w-full object-contain p-2"
              />
            </div>
          </div>
          
        
          {/* Program, Part Counter, and Idle Time in Compact Row */}
          <Row gutter={10}>
            {/* Active Program */}
            <Col span={8}>
              <div className="bg-sky-50 p-3 rounded-lg border border-sky-100 h-full">
                <div className="text-sm text-sky-800 mb-2 font-medium">Active Program</div>
                <Tooltip title={machineStatus?.active_program || 'No program active'}>
                  <div className="font-bold text-base truncate">{machineStatus?.active_program || 'None'}</div>
                </Tooltip>
              </div>
            </Col>
            {/* Part Count */}
            <Col span={8}>
              <div className="bg-sky-50 p-3 rounded-lg border border-sky-100 h-full flex flex-col justify-between">
                <div className="text-sm text-sky-800 font-medium">Part Count</div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600 mt-2">{machineStatus?.part_count !== undefined ? machineStatus.part_count : 'N/A'}</div>
                </div>
              </div>
            </Col>
            {/* Idle Time */}
            {/* <Col span={8}>
              <div className="bg-sky-50 p-3 rounded-lg border border-sky-100 h-full flex flex-col justify-between">
                <div className="text-sm text-sky-800 font-medium">Idle Time</div>
                <div className="text-center">
                  <div className="text-xl font-bold text-amber-500 mt-2">{formatIdleTime(idleTime)}</div>
                </div>
              </div>
            </Col> */}
          </Row>
          
        </div>
      </Card>
      
      {/* Machine Issue Modal */}
      <MachineIssueModal 
        visible={issueModalVisible}
        onClose={() => setIssueModalVisible(false)}
      />
    </>
  );
};

export default MachineStatusCard; 
