import React from 'react';
import { Card, Badge, Button, Progress, Space, Tag } from 'antd';
import { Activity, AlertTriangle, Clock } from 'lucide-react';
import { ToolFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';  // Import useNavigate

const OperatorDashboard = () => {
  const navigate = useNavigate();  // Initialize navigate

  const assignedMachines = [
    {
      id: 'DMG-001',
      name: 'DMG DMU 60 eVo linear',
      status: 'running',
      currentJob: {
        jobId: 'JOB-2024-001',
        partNumber: 'PART-001',
        partDesc: 'Motor Casing',
        progress: 75,
        startTime: '08:00 AM',
        uptime: '5h 30m',
        cycleTime: '45m / 40m'
      },
      alerts: 2
    },
    {
      id: 'DMG-002',
      name: 'DMG DMU 60T mB',
      status: 'idle',
      currentJob: {
        jobId: 'JOB-2024-002',
        partNumber: 'PART-002',
        partDesc: 'Top Cover',
        progress: 0,
        startTime: 'Not Started',
        uptime: '0h',
        cycleTime: '30m / 0m'
      },
      alerts: 1
    }
  ];

  const getStatusConfig = (status) => {
    const configs = {
      running: { color: 'green', text: 'Running' },
      idle: { color: 'gold', text: 'Idle' },
      maintenance: { color: 'blue', text: 'Maintenance' },
      error: { color: 'red', text: 'Error' }
    };
    return configs[status] || configs.idle;
  };

  const handleViewDetails = (jobId) => {
    navigate(`/operator/job-details`, { state: { jobId } }); // Navigate to JobDetails with jobId as state
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Operator Dashboard</h1>
        <Space>
          <Tag color="blue" className="px-3 py-1">
            <span className="text-sm">Morning Shift</span>
          </Tag>
          <Tag color="green" className="px-3 py-1">
            <span className="text-sm">{assignedMachines.length} Active Jobs</span>
          </Tag>
        </Space>
      </div>

      {/* Machines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignedMachines.map((machine) => (
          <Card
            key={machine.id}
            className="hover:shadow-lg transition-shadow"
            title={
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-800">{machine.name}</h3>
                  <p className="text-sm text-gray-500">ID: {machine.id}</p>
                </div>
                <Badge 
                  status={getStatusConfig(machine.status).color} 
                  text={getStatusConfig(machine.status).text}
                />
              </div>
            }
          >
            <div className="space-y-6">
              {/* Current Job Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Job ID:</span>
                    <span className="font-medium">{machine.currentJob.jobId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Part Number:</span>
                    <span className="font-medium">{machine.currentJob.partNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Description:</span>
                    <span className="font-medium">{machine.currentJob.partDesc}</span>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-xs text-gray-500">Uptime</div>
                    <div className="font-medium">{machine.currentJob.uptime}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-xs text-gray-500">Cycle Time</div>
                    <div className="font-medium">{machine.currentJob.cycleTime}</div>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-medium">{machine.currentJob.progress}%</span>
                </div>
                <Progress 
                  percent={machine.currentJob.progress} 
                  showInfo={false} 
                  strokeColor={{ '0%': '#1890ff', '100%': '#52c41a' }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button 
                  type="primary"
                  className="flex-1 flex items-center justify-center gap-2"
                  icon={<ToolFilled className="w-4 h-4" />}
                  onClick={() => handleViewDetails(machine.currentJob.jobId)}  // Add onClick to navigate
                >
                  View Details
                </Button>
                {machine.alerts > 0 && (
                  <Button 
                    danger 
                    className="flex items-center gap-2"
                    icon={<AlertTriangle className="w-4 h-4" />}
                  >
                    {machine.alerts}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OperatorDashboard;
