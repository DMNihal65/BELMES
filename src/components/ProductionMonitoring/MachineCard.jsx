import React from 'react';
import { Card, Progress, Badge, Tooltip, Avatar, Tag, Popover } from 'antd';
import { Clock, AlertCircle, Activity, Zap, ChevronsUp, Info, Settings, CheckCircle, AlertTriangle, PowerOff, Power } from 'lucide-react';
import { 
  ToolOutlined, CheckCircleOutlined, ClockCircleOutlined, 
  ThunderboltOutlined, RightOutlined, ExclamationCircleOutlined,
  InfoCircleOutlined, WarningOutlined, FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Initialize dayjs plugins
dayjs.extend(relativeTime);

// Machine type icons/images mapping
const MACHINE_ICONS = {
  'MMC': { icon: <Settings className="h-8 w-8" />, color: '#1890ff' },
  'CNC': { icon: <ToolOutlined className="h-8 w-8" />, color: '#52c41a' },
  'SMF': { icon: <Activity className="h-8 w-8" />, color: '#722ed1' },
  'SMP': { icon: <Activity className="h-8 w-8" />, color: '#eb2f96' },
  'QFA': { icon: <ToolOutlined className="h-8 w-8" />, color: '#fa8c16' },
  'FAB': { icon: <Settings className="h-8 w-8" />, color: '#13c2c2' },
  'default': { icon: <Settings className="h-8 w-8" />, color: '#8c8c8c' }
};

// Status icons mapping
const STATUS_ICONS = {
  'RUNNING': <CheckCircle className="h-5 w-5" />,
  'IDLE': <Clock className="h-5 w-5" />,
  'STOPPED': <AlertTriangle className="h-5 w-5" />,
  'MAINTENANCE': <ToolOutlined className="h-5 w-5" />,
  'OFFLINE': <PowerOff className="h-5 w-5" />,
  'default': <Power className="h-5 w-5" />
};

// Status colors mapping
const STATUS_COLORS = {
  'RUNNING': '#52c41a',
  'IDLE': '#faad14',
  'STOPPED': '#ff4d4f',
  'MAINTENANCE': '#1890ff',
  'OFFLINE': '#d9d9d9',
  'default': '#8c8c8c'
};

const getMachineIcon = (machineName) => {
  // Extract machine type from name (e.g., 'MMC1-M1' -> 'MMC')
  const machineType = machineName?.substring(0, 3).toUpperCase();
  return MACHINE_ICONS[machineType] || MACHINE_ICONS.default;
};

const getStatusInfo = (status) => {
  return {
    icon: STATUS_ICONS[status] || STATUS_ICONS.default,
    color: STATUS_COLORS[status] || STATUS_COLORS.default
  };
};

const MachineCard = ({ machine, onClick, viewMode = 'grid', statusColor }) => {
  // Generate consistent random OEE data based on machine ID
  const getConsistentRandomValue = (baseValue, machineId, variance = 15) => {
    // Create a deterministic seed using the machine ID
    const seed = machineId ? [...machineId.toString()].reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    
    // Generate a pseudo-random value with the seed
    const randomFactor = ((seed % 100) / 100) * variance;
    return Math.min(100, Math.max(50, baseValue + randomFactor - (variance / 2)));
  };
  
  const machineId = machine.machine_id || 0;
  
  const oeeData = {
    availability: getConsistentRandomValue(85, machineId, 15),
    performance: getConsistentRandomValue(80, machineId, 20),
    quality: getConsistentRandomValue(90, machineId, 10),
  };
  
  const oeeScore = Math.floor((oeeData.availability * oeeData.performance * oeeData.quality) / 10000);
  
  // Determine if machine has any issues or warnings
  const hasWarning = machine.status === 'IDLE' || machine.status === 'MAINTENANCE';
  const hasError = machine.status === 'STOPPED' || machine.status === 'OFFLINE';

  const machineIcon = getMachineIcon(machine.machine_name);
  const statusInfo = getStatusInfo(machine.status);
  const uptime = dayjs(machine.last_updated).fromNow();

  // Get machine image based on machine type (mock function)
  const getMachineAvatar = (machineId) => {
    const machineTypes = {
      CNC: '/api/placeholder/40/40',
      MILL: '/api/placeholder/40/40',
      LASER: '/api/placeholder/40/40',
      ROBOT: '/api/placeholder/40/40',
    };
    
    // Extract machine type from ID (assuming format like "CNC-001")
    // const type = machineId?.split('-')[0] || 'CNC';
    // return machineTypes[type] || '/api/placeholder/40/40';
  };

  // Format last updated time using dayjs instead of moment
  const lastUpdated = machine.last_updated ? dayjs(machine.last_updated).fromNow() : 'Unknown';

  // Get badge status color
  const getBadgeStatus = (status) => {
    switch (status) {
      case 'RUNNING':
        return 'success';
      case 'PRODUCTION':
        return 'processing';
      case 'MAINTENANCE':
        return 'warning';
      case 'STOPPED':
        return 'error';
      case 'IDLE':
        return 'warning';
      case 'OFFLINE':
        return 'default';
      default:
        return 'default';
    }
  };

  // Get job status
  const jobStatus = machine.job_status === 1 ? (
    <span className="text-green-600 flex items-center text-xs">
      <CheckCircleOutlined className="mr-1" /> Active Job
    </span>
  ) : (
    <span className="text-gray-500 flex items-center text-xs">
      <ClockCircleOutlined className="mr-1" /> No Active Job
    </span>
  );
  
  // Progress percentage (if data available)
  const progressPercentage = machine.production_details?.required_quantity > 0 
    ? (machine.part_count / machine.production_details.required_quantity) * 100
    : 0;
    
  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className={`cursor-pointer rounded-lg shadow-sm hover:shadow-md 
          transition-all p-4 border-l-4 ${statusColor ? statusColor.replace('bg-', 'border-') : 'border-gray-300'} bg-white`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar 
              src={getMachineAvatar(machine.machine_id)}
              size={40}
              shape="square"
            />
            <div>
              <div className="flex items-center">
                <h3 className="font-medium text-gray-900 mr-2">{machine.machine_name}</h3>
                <Badge status={getBadgeStatus(machine.status)} text={machine.status} />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span>ID: {machine.machine_id}</span>
                <span>•</span>
                {jobStatus}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="text-sm text-gray-600">
              {machine.production_details.part_number || 'No Part'} 
              {machine.production_details.required_quantity > 0 && 
                <Tag color="blue" className="ml-2">
                  {machine.part_count}/{machine.production_details.required_quantity}
                </Tag>
              }
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              <ClockCircleOutlined className="mr-1" /> 
              Updated {lastUpdated}
              <RightOutlined className="ml-3 text-blue-500" />
            </div>
          </div>
        </div>
        
        {progressPercentage > 0 && (
          <div className="mt-3">
            <Progress 
              percent={progressPercentage.toFixed(1)} 
              size="small" 
              status={progressPercentage >= 100 ? "success" : "active"}
            />
          </div>
        )}
      </div>
    );
  }
  
  // Grid view
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer hover:shadow-md transition-all ${hasError ? 'border-red-300' : hasWarning ? 'border-yellow-300' : ''}`}
      bodyStyle={{ padding: '16px' }}
      bordered={true}
      extra={
        <div className="flex items-center">
          {hasError && (
            <Tooltip title="Machine requires attention">
              <ExclamationCircleOutlined className="text-red-500 mr-2" />
            </Tooltip>
          )}
          {hasWarning && !hasError && (
            <Tooltip title="Warning">
              <WarningOutlined className="text-yellow-500 mr-2" />
            </Tooltip>
          )}
          <Badge 
            status={getBadgeStatus(machine.status)} 
            text={machine.status} 
          />
        </div>
      }
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar src={getMachineAvatar(machine.machine_id)} size={24} shape="square" />
            <span className="font-medium">{machine.machine_name}</span>
          </div>
          {machine.production_details.production_order && (
            <Tooltip title="Production Order">
              <Tag color="blue" className="text-xs">
                <FileTextOutlined className="mr-1" />
                {machine.production_details.production_order}
              </Tag>
            </Tooltip>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Tooltip title="Machine ID">
            <div className="overflow-hidden text-ellipsis">
              <span className="text-gray-500">ID:</span>
              <span className="ml-1 font-medium text-gray-700">{machine.machine_id}</span>
            </div>
          </Tooltip>
          
          <Tooltip title="Part Number">
            <div className="overflow-hidden text-ellipsis text-right">
              <span className="text-gray-500">Part:</span>
              <span className="ml-1 font-medium text-gray-700">
                {machine.production_details.part_number || '-'}
              </span>
            </div>
          </Tooltip>
          
          <Tooltip title="Production Status">
            <div>
              {jobStatus}
            </div>
          </Tooltip>
          
          <Tooltip title="Parts Count">
            <div className="text-right">
              <span className="text-gray-500">Parts:</span>
              <span className="ml-1 font-medium text-gray-700">{machine.part_count || 0}</span>
            </div>
          </Tooltip>
        </div>
        
        {/* OEE Score */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center text-xs font-medium text-gray-600">
              <ThunderboltOutlined className="mr-1 text-yellow-500" /> OEE Score
            </div>
            <span className="text-xs text-gray-500">{oeeScore}%</span>
          </div>
          <Progress 
            percent={oeeScore} 
            size="small" 
            strokeColor={{
              '0%': '#1890ff',
              '100%': '#52c41a',
            }}
          />
        </div>
        
        {/* Production Progress (if applicable) */}
        {progressPercentage > 0 && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center text-xs font-medium text-gray-600">
                <Activity size={12} className="mr-1 text-blue-500" /> Production Progress
              </div>
              <span className="text-xs text-gray-500">{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress 
              percent={progressPercentage} 
              size="small"
              status={progressPercentage >= 100 ? "success" : "active"}
            />
          </div>
        )}
        
        <div className="text-xs text-gray-500 flex justify-between pt-2 border-t border-gray-100">
          <span className="flex items-center">
            <Clock size={12} className="mr-1" /> {lastUpdated}
          </span>
          <Popover 
            content={
              <div className="w-48">
                <div className="text-sm font-medium mb-1">Machine Information</div>
                <div className="text-xs text-gray-500">
                  <div>Type: {machine.machine_type || 'CNC'}</div>
                  <div>Uptime: {machine.uptime || '0h'}</div>
                  <div>Job Status: {machine.job_status === 1 ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
            } 
            title="Quick Info"
          >
            <InfoCircleOutlined className="text-blue-500 cursor-help" />
          </Popover>
        </div>
      </div>
    </Card>
  );
};

export default MachineCard;