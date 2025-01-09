import { create } from 'zustand';

const MOCK_COMPARISON_DATA = {
  planned: {
    scheduled_operations: [
      {
        component: "212800970195",
        description: "cutting",
        machine: "MMC1",
        start_time: "2024-12-24T09:00:00",
        end_time: "2024-12-24T10:06:00",
        quantity: "Batch(10)",
        status: "completed"
      },
      {
        component: "213511100114",
        description: "CUTTING",
        machine: "MMC1",
        start_time: "2024-12-24T10:45:36",
        end_time: "2024-12-24T15:57:36",
        quantity: "Batch(10)",
        status: "in_progress"
      }
    ]
  },
  forecast: {
    scheduled_operations: [
      {
        component: "212800970195",
        description: "cutting",
        machine: "MMC1",
        start_time: "2024-12-24T09:30:00",
        end_time: "2024-12-24T10:36:00",
        quantity: "Batch(10)"
      },
      {
        component: "213511100114",
        description: "CUTTING",
        machine: "MMC1",
        start_time: "2024-12-24T11:00:00",
        end_time: "2024-12-24T16:00:00",
        quantity: "Batch(10)"
      }
    ]
  },
  metrics: {
    adherence: 85.5,
    utilization: 92.3,
    onTime: 78.6,
    efficiency: 88.9,
    bottlenecks: [
      {
        machine: "MMC1",
        utilizationRate: 95.2,
        queueTime: 12.5,
        waitingJobs: 5,
        avgProcessTime: 2.3
      },
      {
        machine: "CNCM",
        utilizationRate: 88.7,
        queueTime: 8.2,
        waitingJobs: 3,
        avgProcessTime: 1.8
      }
    ],
    resourceUtilization: {
      MMC1: [85, 90, 95, 88, 92, 87, 89],
      CNCM: [78, 82, 85, 80, 83, 79, 81],
      CNCT: [70, 75, 72, 78, 73, 71, 74]
    },
    workloadDistribution: {
      MMC1: { planned: 45, actual: 48 },
      CNCM: { planned: 35, actual: 32 },
      CNCT: { planned: 20, actual: 22 }
    }
  }
};

const useScheduleStore = create((set, get) => ({
  scheduleData: null,
  loading: false,
  error: null,
  selectedComponent: null,
  viewMode: 'Day',
  dateRange: null,
  plannedSchedule: null,
  forecastSchedule: null,
  scheduleHistory: [],
  comparisonMetrics: null,
  comparisonLoading: false,
  
  // Fetch schedule data
  fetchScheduleData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.88:7721/schedule-batch/');
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
  },

  fetchScheduleComparison: async () => {
    set({ comparisonLoading: true });
    try {
      // Mock API response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set the data
      set({ 
        plannedSchedule: MOCK_COMPARISON_DATA.planned,
        forecastSchedule: MOCK_COMPARISON_DATA.forecast,
        comparisonMetrics: MOCK_COMPARISON_DATA.metrics,
        comparisonLoading: false
      });
    } catch (error) {
      set({ 
        error: error.message, 
        comparisonLoading: false 
      });
      throw error; // Re-throw to handle in component
    }
  },

  getScheduleComparison: () => {
    const { scheduleData, plannedSchedule, forecastSchedule } = get();
    
    // Use mock data if actual data is not available
    const actualData = scheduleData || MOCK_COMPARISON_DATA.planned;
    
    if (!plannedSchedule || !forecastSchedule) return null;

    return {
      actual: actualData,
      planned: plannedSchedule,
      forecast: forecastSchedule,
      deviations: calculateDeviations(actualData, plannedSchedule),
      efficiency: calculateEfficiency(actualData, plannedSchedule)
    };
  },

  getDelayAnalysis: () => {
    const { scheduleData } = get();
    if (!scheduleData) return null;

    const delays = scheduleData.scheduled_operations
      .filter(op => {
        const status = scheduleData.component_status[op.component];
        return status && new Date(op.end_time) > new Date(status.lead_time);
      })
      .map(op => ({
        component: op.component,
        machine: op.machine,
        description: op.description,
        plannedEnd: new Date(op.end_time),
        actualEnd: new Date(scheduleData.component_status[op.component].lead_time),
        delay: calculateDelay(op.end_time, scheduleData.component_status[op.component].lead_time)
      }));

    return {
      delays,
      totalDelays: delays.length,
      averageDelay: delays.reduce((acc, curr) => acc + curr.delay, 0) / delays.length,
      criticalDelays: delays.filter(d => d.delay > 24) // Delays more than 24 hours
    };
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

const calculateDelay = (endTime, leadTime) => {
  const end = new Date(endTime);
  const lead = new Date(leadTime);
  return Math.round((end - lead) / (1000 * 60 * 60)); // Convert to hours
};

const calculateDeviations = (actual, planned) => {
  if (!actual || !planned) return [];
  
  return actual.scheduled_operations.map(actualOp => {
    const plannedOp = planned.scheduled_operations.find(
      p => p.component === actualOp.component && p.description === actualOp.description
    );
    
    if (!plannedOp) return null;

    const actualStart = new Date(actualOp.start_time);
    const plannedStart = new Date(plannedOp.start_time);
    const deviation = (actualStart - plannedStart) / (1000 * 60 * 60); // Hours

    return {
      machine: actualOp.machine,
      component: actualOp.component,
      description: actualOp.description,
      plannedStart: plannedStart,
      actualStart: actualStart,
      deviation: Math.round(deviation * 10) / 10 // Round to 1 decimal
    };
  }).filter(Boolean);
};

const calculateEfficiency = (actual, planned) => {
  if (!actual || !planned) return 0;
  
  const totalPlannedHours = planned.scheduled_operations.reduce((acc, op) => {
    const duration = new Date(op.end_time) - new Date(op.start_time);
    return acc + duration / (1000 * 60 * 60);
  }, 0);

  const totalActualHours = actual.scheduled_operations.reduce((acc, op) => {
    const duration = new Date(op.end_time) - new Date(op.start_time);
    return acc + duration / (1000 * 60 * 60);
  }, 0);

  return (totalPlannedHours / totalActualHours) * 100;
};

const calculateDelayDistribution = (delays) => {
  if (!delays) return [0, 0, 0, 0, 0];
  
  const distribution = [0, 0, 0, 0, 0]; // [0-4h, 4-8h, 8-16h, 16-24h, >24h]
  
  delays.forEach(delay => {
    const hours = delay.delay;
    if (hours <= 4) distribution[0]++;
    else if (hours <= 8) distribution[1]++;
    else if (hours <= 16) distribution[2]++;
    else if (hours <= 24) distribution[3]++;
    else distribution[4]++;
  });
  
  return distribution;
};

const getDelayColor = (hours) => {
  if (hours <= 4) return 'blue';
  if (hours <= 8) return 'orange';
  if (hours <= 16) return 'gold';
  if (hours <= 24) return 'volcano';
  return 'red';
};

export default useScheduleStore;