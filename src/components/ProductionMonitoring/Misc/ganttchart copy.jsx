import React, { useEffect, useState } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import { message, Tooltip, Badge, Spin } from 'antd';
import "gantt-task-react/dist/index.css";

const ProductionGantt = ({ machineData }) => {
  const [tasks, setTasks] = useState([{
    start: new Date(),
    end: new Date(),
    name: 'Loading...',
    id: 'loading',
    type: 'task',
    progress: 0,
    styles: { progressColor: '#f0f0f0', backgroundColor: '#f0f0f0' }
  }]);

  useEffect(() => {
    if (!machineData || machineData.length === 0) return;

    try {
      const convertedTasks = machineData.map((machine, index) => {
        const startTime = new Date();
        startTime.setHours(8, 0, 0);
        const endTime = new Date();
        endTime.setHours(16, 0, 0);
        
        // Calculate progress percentage
        const progress = Math.min((machine.actualUnits / machine.plannedUnits) * 100, 100);
        
        // Determine status color
        const getStatusColor = (efficiency, status) => {
          if (status === 'idle') return '#d9d9d9';
          return efficiency >= 85 ? '#15803d' : efficiency >= 70 ? '#ca8a04' : '#dc2626';
        };

        return {
          start: startTime,
          end: endTime,
          name: `${machine.name} - ${machine.currentJob}`,
          id: machine.id,
          type: 'task',
          progress: progress,
          styles: {
            progressColor: getStatusColor(machine.efficiency, machine.status),
            backgroundColor: '#f0f0f0',
          },
          status: machine.status,
          efficiency: machine.efficiency,
          plannedUnits: machine.plannedUnits,
          actualUnits: machine.actualUnits,
          alerts: machine.alerts,
        };
      });

      setTasks(convertedTasks);
    } catch (error) {
      console.error('Error converting machine data to tasks:', error);
      message.error('Error loading production schedule');
    }
  }, [machineData]);

  // Custom tooltip content
  const TooltipContent = ({ task }) => {
    if (task.id === 'loading') return null;
    
    return (
      <div className="p-2">
        <h4 className="font-bold mb-2">{task.name}</h4>
        <div className="space-y-1">
          <div>
            <Badge 
              status={task.status === 'running' ? 'success' : 'warning'} 
              text={`Status: ${task.status}`}
            />
          </div>
          <div>Progress: {task.progress.toFixed(1)}%</div>
          <div>Efficiency: {task.efficiency}%</div>
          <div>
            Production: {task.actualUnits} / {task.plannedUnits} units
          </div>
          {task.alerts > 0 && (
            <div className="text-red-500">
              Alerts: {task.alerts}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Handlers for attempted interactions
  const handleInteraction = () => {
    message.warning('Schedule modifications are not allowed in view mode');
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
    handleWidth: 0, // Disable resize handles
    timeStep: 1800000, // 30 minutes in milliseconds
    todayColor: 'rgba(252, 211, 77, 0.15)', // Highlight current time
    viewDate: new Date(),
  };

  if (!machineData || machineData.length === 0) {
    return <Spin tip="Loading production schedule..." />;
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
      `}</style>
      
      <Gantt
        tasks={tasks}
        {...ganttOptions}
        onDateChange={handleInteraction}
        onProgressChange={handleInteraction}
        onDoubleClick={handleInteraction}
        onTaskMove={handleInteraction}
        TooltipContent={TooltipContent}
        barBackgroundColor="transparent"
        projectProgressBackgroundColor="rgba(0,0,0,0.05)"
        arrowColor="grey"
        fontFamily="'Inter', sans-serif"
      />
    </div>
  );
};

export default ProductionGantt;