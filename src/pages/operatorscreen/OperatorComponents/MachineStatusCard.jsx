import React, { useEffect, useState } from 'react';
import { Card, Tooltip, Badge, Statistic, Tag, Row, Col, Progress } from 'antd';
import { Gauge, Activity, Clock, AlertTriangle, Info, Power, Cpu } from 'lucide-react';
import useOperatorStore from '../../../store/operator-store';
import { ToolFilled } from '@ant-design/icons';

const MachineStatusCard = () => {
  const {
    machineStatus,
    isConnected,
    connectionError,
    idleTime,
    formatIdleTime
  } = useOperatorStore();
  
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
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
    'PRODUCTION': <ToolFilled className="text-green-500" size={28} />,
    'IDLE': <Cpu className="text-amber-500" size={28} />,
    'ON': <Cpu className="text-amber-500" size={28} />,
    'OFF': <Power className="text-red-500" size={28} />
  };

  return (
    <Card 
      className={`status-card h-full ${getStatusClassName(machineStatus?.status)}`}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="text-blue-500" size={18} />
            <span className="font-semibold">Machine Status</span>
          </div>
          <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
            <Badge status={isConnected ? 'success' : 'error'} />
          </Tooltip>
        </div>
      }
    >
      {connectionError && (
        <div className="mb-4 bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={16} />
            <span>{connectionError}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Machine Name & Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <Row gutter={16} align="middle">
            <Col span={8}>
              {statusIconMap[machineStatus?.status] || <Cpu size={28} className="text-gray-400" />}
            </Col>
            <Col span={16}>
              <div className="text-lg font-medium truncate">{machineStatus?.machine_name || 'Loading...'}</div>
              <Tag color={getStatusColor(machineStatus?.status)} className="mt-1 text-base px-3 py-1">
                {machineStatus?.status || 'Unknown'}
              </Tag>
            </Col>
          </Row>
        </div>
        
        {/* Machine Utilization */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-xs text-gray-500 mb-2">Machine Utilization</div>
          <Progress 
            percent={getUtilization()} 
            strokeColor={{
              '0%': '#ffc53d',
              '100%': '#52c41a',
            }}
            status="active"
          />
          <div className="flex justify-between mt-2 text-xs">
            <div className="text-gray-500">Idle Time: {formatIdleTime(idleTime)}</div>
            <div className="text-gray-500">
              <Clock size={12} className="inline mr-1" />
              Last Updated: {machineStatus?.lastUpdatedFormatted || 'N/A'}
            </div>
          </div>
        </div>
        
        {/* Job Information */}
        {machineStatus?.job_in_progress && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-xs text-gray-500 mb-2">Current Job</div>
            <div className="font-medium text-blue-800">{machineStatus.job_in_progress}</div>
            
            {machineStatus.production_order && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Order</div>
                  <div className="font-medium">{machineStatus.production_order}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Part #</div>
                  <div className="font-medium">{machineStatus.part_number}</div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Active Program & Part Counter */}
        <Row gutter={12}>
          {/* Current Program */}
          <Col span={machineStatus?.active_program ? 12 : 0}>
            {machineStatus?.active_program && (
              <div className="bg-gray-50 p-3 rounded-lg h-full">
                <div className="text-xs text-gray-500 mb-1">Program</div>
                <Tooltip title={machineStatus.active_program}>
                  <div className="font-medium text-xs truncate">{machineStatus.active_program}</div>
                </Tooltip>
              </div>
            )}
          </Col>
          
          {/* Part Counter */}
          <Col span={machineStatus?.active_program ? 12 : 24}>
            <div className="bg-gray-50 p-3 rounded-lg h-full">
              <div className="text-xs text-gray-500 mb-1">Part Count</div>
              <div className="flex items-center justify-between">
                <Statistic 
                  value={machineStatus?.part_count || 0} 
                  suffix={machineStatus?.required_quantity ? `/ ${machineStatus.required_quantity}` : ''}
                  valueStyle={{ fontSize: '18px' }}
                />
                <Activity className="text-blue-500" size={20} />
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </Card>
  );
};

export default MachineStatusCard; 
