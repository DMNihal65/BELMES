import React, { useEffect, useState } from 'react';
import { Card, Tooltip, Badge, Statistic, Tag, Row, Col, Progress, Button, Modal } from 'antd';
import { Gauge, Activity, Clock, AlertTriangle, Info, Power, Cpu, AlertCircle, HelpCircle } from 'lucide-react';
import useOperatorStore from '../../../store/operator-store';
import { ToolFilled } from '@ant-design/icons';
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
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

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
    'PRODUCTION': <ToolFilled className="text-green-500" style={{ fontSize: '24px' }} />,
    'IDLE': <Cpu className="text-amber-500" size={24} />,
    'ON': <Cpu className="text-amber-500" size={24} />,
    'OFF': <Power className="text-red-500" size={24} />
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

  return (
    <>
      <Card 
        className={`status-card h-full shadow-sm ${getStatusClassName(machineStatus?.status)}`}
        bodyStyle={{ padding: '12px' }}
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="text-sky-500" size={18} />
              <span className="font-semibold">Machine Status</span>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
                <Badge status={isConnected ? 'success' : 'error'} />
              </Tooltip>
              <Button 
                type="text" 
                danger 
                icon={<AlertCircle size={16} />} 
                size="small"
                onClick={() => setIssueModalVisible(true)}
              >
                Issue
              </Button>
            </div>
          </div>
        }
      >
        {connectionError && (
          <div className="mb-3 bg-red-50 p-2 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-600 text-xs">
              <AlertTriangle size={14} />
              <span>{connectionError}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Machine Name, Status & Image */}
          <div className="bg-sky-50 p-3 rounded-lg border border-sky-100">
            <Row gutter={12} align="middle">
              <Col span={8}>
                <div className="flex justify-center">
                  <img 
                    src={getMachineImage()} 
                    alt="Machine" 
                    className="h-16 object-contain"
                  />
                </div>
              </Col>
              <Col span={16}>
                <div className="text-base font-medium truncate text-sky-900">{machineStatus?.machine_name || 'Loading...'}</div>
                <Tag color={getStatusColor(machineStatus?.status)} className="mt-1 text-sm px-2 py-0.5">
                  {machineStatus?.status || 'Unknown'}
                </Tag>
                <div className="text-xs text-gray-500 mt-1">
                  <Clock size={10} className="inline mr-1" />
                  Updated: {machineStatus?.lastUpdatedFormatted || 'N/A'}
                </div>
              </Col>
            </Row>
          </div>
          
          {/* Machine Utilization */}
          <div className="bg-sky-50 p-3 rounded-lg border border-sky-100">
            <Row gutter={12} align="middle">
              <Col span={16}>
                <div className="text-xs text-sky-800 mb-1 font-medium">Utilization</div>
                <Progress 
                  percent={getUtilization()} 
                  strokeColor={{
                    '0%': '#38bdf8',
                    '100%': '#0284c7',
                  }}
                  status="active"
                  size="small"
                />
              </Col>
              <Col span={8} className="text-right">
                <div className="text-xs text-sky-800 font-medium">Idle Time</div>
                <div className="text-sm font-medium text-amber-500">{formatIdleTime(idleTime)}</div>
              </Col>
            </Row>
          </div>
          
          {/* Program & Part Counter in Compact Row */}
          <Row gutter={8}>
            {/* Active Program */}
            <Col span={machineStatus?.active_program ? 16 : 0}>
              {machineStatus?.active_program && (
                <div className="bg-sky-50 p-2 rounded-lg h-full border border-sky-100">
                  <div className="text-xs text-sky-800 mb-1 font-medium">Program</div>
                  <Tooltip title={machineStatus.active_program}>
                    <div className="font-medium text-xs truncate">{machineStatus.active_program}</div>
                  </Tooltip>
                </div>
              )}
            </Col>
            
            {/* Part Counter */}
            <Col span={machineStatus?.active_program ? 8 : 24}>
              <div className="bg-sky-50 p-2 rounded-lg h-full border border-sky-100">
                <div className="text-xs text-sky-800 mb-1 font-medium">Part Count</div>
                <div className="flex items-center justify-between">
                  <Statistic 
                    value={machineStatus?.part_count || 0} 
                    suffix={machineStatus?.required_quantity ? `/${machineStatus.required_quantity}` : ''}
                    valueStyle={{ fontSize: '16px', color: '#0284c7' }}
                  />
                  <Activity className="text-sky-500" size={16} />
                </div>
              </div>
            </Col>
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
