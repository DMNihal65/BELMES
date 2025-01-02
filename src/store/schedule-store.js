import { create } from 'zustand';

const useScheduleStore = create((set, get) => ({
  scheduleData: null,
  loading: false,
  error: null,
  selectedComponent: null,
  viewMode: 'Day',
  dateRange: null,
  
  // Fetch schedule data
  fetchScheduleData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.88:7722/schedule/');
      const data = await response.json();
      
      // Transform the data for Gantt chart
      const tasks = data.scheduled_operations.map((op, index) => ({
        id: `${op.component}-${op.description}-${index}`,
        name: `${op.component} - ${op.description}`,
        start: new Date(op.start_time),
        end: new Date(op.end_time),
        machine: op.machine,
        component: op.component,
        progress: calculateProgress(op, data.component_status[op.component]),
        type: 'task',
        quantity: op.quantity,
        styles: getTaskStyles(op, data.component_status[op.component])
      }));

      set({ 
        scheduleData: {
          ...data,
          tasks
        },
        loading: false 
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  setSelectedComponent: (component) => set({ selectedComponent: component }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setDateRange: (range) => set({ dateRange: range }),
  
  getComponentDetails: (componentId) => {
    const { scheduleData } = get();
    if (!scheduleData) return null;
    return scheduleData.component_status[componentId];
  },
  
  getDailyProduction: (componentId) => {
    const { scheduleData } = get();
    if (!scheduleData) return null;
    return scheduleData.daily_production[componentId];
  },

  filterScheduleByMachines: (machines) => {
    const { scheduleData } = get();
    if (!scheduleData) return null;
    
    return {
      ...scheduleData,
      scheduled_operations: scheduleData.scheduled_operations.filter(
        op => machines.length === 0 || machines.includes(op.machine)
      )
    };
  },

  filterScheduleByDateRange: (start, end) => {
    const { scheduleData } = get();
    if (!scheduleData) return null;
    
    return {
      ...scheduleData,
      scheduled_operations: scheduleData.scheduled_operations.filter(op => {
        const opStart = new Date(op.start_time);
        const opEnd = new Date(op.end_time);
        return opStart >= start && opEnd <= end;
      })
    };
  },

  getMachineUtilization: (machine) => {
    const { scheduleData } = get();
    if (!scheduleData) return 0;
    
    const machineOps = scheduleData.scheduled_operations.filter(
      op => op.machine === machine
    );
    
    if (machineOps.length === 0) return 0;
    
    const totalTime = machineOps.reduce((acc, op) => {
      const duration = new Date(op.end_time) - new Date(op.start_time);
      return acc + duration;
    }, 0);
    
    const workingHours = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    return (totalTime / workingHours) * 100;
  },

  getDelayedOperations: () => {
    const { scheduleData } = get();
    if (!scheduleData) return [];
    
    return scheduleData.scheduled_operations.filter(op => {
      const status = scheduleData.component_status[op.component];
      return status && new Date(op.end_time) > new Date(status.lead_time);
    });
  },

  getCurrentOperations: () => {
    const { scheduleData } = get();
    if (!scheduleData) return [];
    
    const now = new Date();
    return scheduleData.scheduled_operations.filter(op => {
      const start = new Date(op.start_time);
      const end = new Date(op.end_time);
      return start <= now && end >= now;
    });
  },

  getUpcomingOperations: () => {
    const { scheduleData } = get();
    if (!scheduleData) return [];
    
    const now = new Date();
    return scheduleData.scheduled_operations.filter(op => {
      const start = new Date(op.start_time);
      return start > now;
    }).slice(0, 5); // Get next 5 upcoming operations
  },

  rescheduleOperation: async (operationId, newStartTime, newEndTime, reason) => {
    // This would be implemented to call your backend API
    set({ loading: true });
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Update local state
      const { scheduleData } = get();
      // ... update logic ...
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  getOperationsByMachine: (machine) => {
    const { scheduleData } = get();
    if (!scheduleData) return [];
    return scheduleData.scheduled_operations.filter(op => op.machine === machine);
  },

  getOperationsByDateRange: (start, end) => {
    const { scheduleData } = get();
    if (!scheduleData) return [];
    return scheduleData.scheduled_operations.filter(op => {
      const opStart = new Date(op.start_time);
      const opEnd = new Date(op.end_time);
      return opStart >= start && opEnd <= end;
    });
  },

  getMachineWorkload: (machine) => {
    const { scheduleData } = get();
    if (!scheduleData) return { total: 0, completed: 0 };
    
    const machineOps = scheduleData.scheduled_operations.filter(op => op.machine === machine);
    const total = machineOps.length;
    const completed = machineOps.filter(op => {
      const status = scheduleData.component_status[op.component];
      return status && status.completed_quantity === status.total_quantity;
    }).length;
    
    return { total, completed };
  },

  getOperationConflicts: () => {
    const { scheduleData } = get();
    if (!scheduleData) return [];
    
    const conflicts = [];
    const operations = scheduleData.scheduled_operations;
    
    operations.forEach((op1, i) => {
      operations.slice(i + 1).forEach(op2 => {
        if (op1.machine === op2.machine) {
          const start1 = new Date(op1.start_time);
          const end1 = new Date(op1.end_time);
          const start2 = new Date(op2.start_time);
          const end2 = new Date(op2.end_time);
          
          if ((start1 <= end2 && end1 >= start2) || 
              (start2 <= end1 && end2 >= start1)) {
            conflicts.push({ op1, op2 });
          }
        }
      });
    });
    
    return conflicts;
  }
}));

// Helper function to calculate progress
const calculateProgress = (operation, status) => {
  if (!status) return 0;
  return (status.completed_quantity / status.total_quantity) * 100;
};

// Helper function to get task styles using Ant Design colors
const getTaskStyles = (operation, status) => {
  if (!status) return { 
    progressColor: '#1890ff', // Ant Design primary blue
    backgroundColor: '#e6f7ff'  // Ant Design blue background
  };
  
  if (status.on_time) {
    return { 
      progressColor: '#52c41a', // Ant Design success green
      backgroundColor: '#f6ffed'  // Ant Design success background
    };
  } else if (new Date(operation.end_time) > new Date(status.lead_time)) {
    return { 
      progressColor: '#ff4d4f', // Ant Design error red
      backgroundColor: '#fff1f0'  // Ant Design error background
    };
  }
  
  return { 
    progressColor: '#faad14', // Ant Design warning yellow
    backgroundColor: '#fffbe6'  // Ant Design warning background
  };
};

export default useScheduleStore;