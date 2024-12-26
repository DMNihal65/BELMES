import React, { useEffect, useState } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import { message, Tooltip, Badge, Spin, Progress, Card, Space, Tag } from 'antd';
import { CheckCircleOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import "gantt-task-react/dist/index.css";

const ProductionGantt = ({ machineData, timeRange, dateRange }) => {
  const [tasks, setTasks] = useState([{
    start: new Date(),
    end: new Date(),
    name: 'Loading...',
    id: 'loading',
    type: 'task',
    progress: 0,
    styles: { progressColor: '#f0f0f0', backgroundColor: '#f0f0f0' }
  }]);

  // Helper function to get time range values
  const getTimeRangeValues = (range, customRange) => {
    const startTime = new Date();
    const endTime = new Date();

    switch (range) {
      case 'shift1':
        startTime.setHours(6, 0, 0);
        endTime.setHours(14, 0, 0);
        break;
      case 'shift2':
        startTime.setHours(14, 0, 0);
        endTime.setHours(22, 0, 0);
        break;
      case 'shift3':
        startTime.setHours(22, 0, 0);
        endTime.setHours(6, 0, 0);
        endTime.setDate(endTime.getDate() + 1);
        break;
      case 'custom':
        if (customRange && customRange.length === 2) {
          return [customRange[0].toDate(), customRange[1].toDate()];
        }
        // Fall through to default if custom range is invalid
      default:
        startTime.setHours(8, 0, 0);
        endTime.setHours(16, 0, 0);
    }
    return [startTime, endTime];
  };

  // Helper function to get status color
  const getStatusColor = (efficiency, status) => {
    if (status === 'idle') return '#d9d9d9';
    return efficiency >= 85 ? '#15803d' : efficiency >= 70 ? '#ca8a04' : '#dc2626';
  };

  useEffect(() => {
    if (!machineData || machineData.length === 0) return;

    try {
      const convertedTasks = machineData.map((machine, index) => {
        const [startTime, endTime] = getTimeRangeValues(timeRange, dateRange);
        const progress = Math.min((machine.actualUnits / machine.plannedUnits) * 100, 100);
        
        return {
          start: startTime,
          end: endTime,
          name: `${machine.name} - ${machine.currentJob}`,
          id: machine.id,
          type: 'task',
          progress: progress,
          styles: {
            progressColor: getStatusColor(machine.efficiency, machine.status),
            backgroundColor: 'rgba(0,0,0,0.05)',
          },
          ...machine,
        };
      });

      setTasks(convertedTasks);
    } catch (error) {
      console.error('Error converting machine data to tasks:', error);
      message.error('Error loading production schedule');
    }
  }, [machineData, timeRange, dateRange]);

  // Custom tooltip content
  const TooltipContent = ({ task }) => {
    if (task.id === 'loading') return null;
    
    const getStatusIcon = (status, efficiency) => {
      if (status === 'idle') return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      return efficiency >= 85 
        ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
        : <WarningOutlined style={{ color: '#faad14' }} />;
    };

    return (
      <Card size="small" className="gantt-tooltip" style={{ width: 300 }}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold m-0">{task.name}</h4>
            {getStatusIcon(task.status, task.efficiency)}
          </div>
          
          <div className="border-t pt-2">
            <Space direction="vertical" className="w-full">
              <div className="flex justify-between">
                <span>Status:</span>
                <Tag color={task.status === 'running' ? 'success' : 'warning'}>
                  {task.status.toUpperCase()}
                </Tag>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span>Progress:</span>
                  <span>{task.progress.toFixed(1)}%</span>
                </div>
                <Progress 
                  percent={task.progress} 
                  size="small" 
                  status={task.progress >= 100 ? 'success' : 'active'}
                />
              </div>

              <div className="flex justify-between">
                <span>Efficiency:</span>
                <Progress
                  type="circle"
                  percent={task.efficiency}
                  width={40}
                  status={task.efficiency >= 85 ? 'success' : 'normal'}
                />
              </div>

              <div className="flex justify-between">
                <span>Production:</span>
                <span className="font-medium">
                  {task.actualUnits} / {task.plannedUnits} units
                </span>
              </div>

              {task.alerts > 0 && (
                <div className="bg-red-50 p-2 rounded">
                  <Badge 
                    count={task.alerts} 
                    className="mr-2"
                  />
                  <span className="text-red-600">Active Alerts</span>
                </div>
              )}
            </Space>
          </div>
        </div>
      </Card>
    );
  };

  // Handlers for attempted interactions - defined here
  const handleInteraction = () => {
    message.warning('Schedule modifications are not allowed in view mode');
    return false;
  };

  const ganttOptions = {
    viewMode: ViewMode.Hour,
    locale: 'en-GB',
    headerHeight: 50,
    columnWidth: 65,
    listCellWidth: '245px',
    ganttHeight: 300,
    barFill: 75,
    barCornerRadius: 4,
    handleWidth: 0,
    timeStep: 1800000,
    todayColor: 'rgba(252, 211, 77, 0.15)',
    viewDate: new Date(),
    barBackgroundColor: 'transparent',
    projectProgressBackgroundColor: 'rgba(0,0,0,0.05)',
    arrowColor: 'grey',
    fontFamily: "'Inter', sans-serif",
    preStepsCount: 1,
  };

  if (!machineData || machineData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading production schedule..." />
      </div>
    );
  }

  return (
    <div className="production-gantt">
      <style jsx>{`
        .production-gantt :global(.bar-wrapper) {
          cursor: default !important;
        }
        .production-gantt :global(.bar-wrapper:hover) {
          border-color: transparent !important;
        }
        .gantt-tooltip {
          background: white;
          border-radius: 6px;
          box-shadow: 0 3px 6px -4px rgba(0,0,0,0.12),
                      0 6px 16px 0 rgba(0,0,0,0.08),
                      0 9px 28px 8px rgba(0,0,0,0.05);
        }
      `}</style>
      
      <Gantt
        tasks={tasks}
        {...ganttOptions}
        onDateChange={handleInteraction}
        onProgressChange={handleInteraction}
        onDoubleClick={handleInteraction}
        onTaskMove={handleInteraction}
        TooltipContent={TooltipContent}
      />
    </div>
  );
};

export default ProductionGantt;