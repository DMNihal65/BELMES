import { create } from 'zustand';
import axios from 'axios';

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
  availableProductionOrders: [],
  comparisonMetrics: null,
  comparisonLoading: false,
  leadTimeData: [],
  leadTimeLoading: false,
  leadTimeError: null,
  workCenters: [],
  productionStatusData: {
    daily_production: [],
    total_planned: {},
    total_completed: {},
  },
  productionStatusLoading: false,
  productionStatusError: null,
  combinedScheduleData: null,
  combinedScheduleLoading: false,
  combinedScheduleError: null,
  
  // Fetch latest schedule data (for initial load)
  fetchScheduleData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://172.19.224.1:8002/api/v1/scheduling/schedule/latest');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Extract unique production orders
      const uniqueProductionOrders = [...new Set(data.scheduled_operations.map(op => op.production_order))];
      
      // Store work centres data
      const workCenters = data.work_centers || [];
      
      // Create a mapping of machines to their work centres
      const machineToWorkCenter = {};
      workCenters.forEach(wc => {
        wc.machines.forEach(machine => {
          machineToWorkCenter[machine.id] = {
            work_center_code: wc.work_center_code,
            work_center_name: wc.work_center_name,
            machine_name: machine.name,
            machine_id: machine.id,
            display_name: `${wc.work_center_code} - ${machine.name}`
          };
        });
      });

      // Transform the data for Gantt chart
      const tasks = data.scheduled_operations.map((op, index) => ({
        id: `${op.component}-${op.description}-${index}`,
        name: `${op.component} - ${op.description}`,
        start: new Date(op.start_time),
        end: new Date(op.end_time),
        machine: op.machine,
        work_center: machineToWorkCenter[op.machine],
        component: op.component,
        production_order: op.production_order,
        progress: calculateProgress(op, data.component_status?.[op.component]),
        type: 'task',
        quantity: op.quantity,
        styles: getTaskStyles(op, data.component_status?.[op.component])
      }));

      set({ 
        scheduleData: {
          ...data,
          tasks,
          metrics: {
            ...data.metrics,
            earlyDelays: data.early_complete,
            delayedDelays: data.delayed_complete
          }
        },
        workCenters,
        availableProductionOrders: uniqueProductionOrders,
        loading: false 
      });
    } catch (error) {
      console.error('Failed to fetch latest schedule:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Update schedule (generate new schedule)
  updateSchedule: async () => {
    set({ loading: true, error: null });
    try {
      // Call the update endpoint
      const updateResponse = await fetch('http://172.19.224.1:8002/api/v1/scheduling/schedule/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: ''
      });

      if (!updateResponse.ok) {
        throw new Error(`Failed to update schedule: ${updateResponse.status}`);
      }

      // After successful update, fetch the latest schedule
      const latestResponse = await fetch('http://172.19.224.1:8002/api/v1/scheduling/schedule/latest');
      if (!latestResponse.ok) {
        throw new Error(`Failed to fetch latest schedule: ${latestResponse.status}`);
      }
      
      const data = await latestResponse.json();

      // Extract unique production orders
      const uniqueProductionOrders = [...new Set(data.scheduled_operations.map(op => op.production_order))];
      
      // Store work centres data
      const workCenters = data.work_centers || [];
      
      // Create a mapping of machines to their work centres
      const machineToWorkCenter = {};
      workCenters.forEach(wc => {
        wc.machines.forEach(machine => {
          machineToWorkCenter[machine.id] = {
            work_center_code: wc.work_center_code,
            work_center_name: wc.work_center_name,
            machine_name: machine.name,
            machine_id: machine.id,
            display_name: `${wc.work_center_code} - ${machine.name}`
          };
        });
      });

      // Transform the data for Gantt chart
      const tasks = data.scheduled_operations.map((op, index) => ({
        id: `${op.component}-${op.description}-${index}`,
        name: `${op.component} - ${op.description}`,
        start: new Date(op.start_time),
        end: new Date(op.end_time),
        machine: op.machine,
        work_center: machineToWorkCenter[op.machine],
        component: op.component,
        production_order: op.production_order,
        progress: calculateProgress(op, data.component_status?.[op.component]),
        type: 'task',
        quantity: op.quantity,
        styles: getTaskStyles(op, data.component_status?.[op.component])
      }));

      set({ 
        scheduleData: {
          ...data,
          tasks,
          metrics: {
            ...data.metrics,
            earlyDelays: data.early_complete,
            delayedDelays: data.delayed_complete
          }
        },
        workCenters,
        availableProductionOrders: uniqueProductionOrders,
        loading: false 
      });

      return true; // Indicate success
    } catch (error) {
      console.error('Failed to update schedule:', error);
      set({ error: error.message, loading: false });
      return false; // Indicate failure
    }
  },

  fetchLeadTimeData: async () => {
    set({ leadTimeLoading: true, leadTimeError: null });
    try {
      const response = await axios.get('http://172.19.224.1:8002/api/v1/component_status/');
      const formattedData = [
        ...response.data.early_complete,
        ...response.data.delayed_complete
      ].map(item => ({
        component: item.component,
        leadTime: new Date(item.lead_time).getTime(),
        scheduledEndTime: new Date(item.scheduled_end_time).getTime(),
        onTime: item.on_time,
        completed_quantity: item.completed_quantity,
        total_quantity: item.total_quantity,
        lead_time_provided: item.lead_time_provided,
        delay: item.delay
      }));

      // Calculate the minimum date and set the yAxisMin if needed in the store
      const minDate = Math.min(...formattedData.map(item => Math.min(item.leadTime, item.scheduledEndTime)));
      const oneDayBefore = minDate - 24 * 60 * 60 * 1000; // Subtract one day in milliseconds

      set({ 
        leadTimeData: formattedData, 
        leadTimeLoading: false,
        leadTimeYAxisMin: oneDayBefore // Optional: Store yAxisMin if needed
      });
    } catch (error) {
      set({ leadTimeError: error.message, leadTimeLoading: false });
    }
  },

  getDailyProduction: (componentId) => {
    const { scheduleData } = get();
    if (!scheduleData || !scheduleData.daily_production) return null;
    const productionData = scheduleData.daily_production[componentId] || [];
    
    return productionData.map(item => ({
      date: item.scheduled_end_time,
      partno: componentId,
      quantity: item.completed_quantity || 0,
    }));
  },
  
  getComponentDetails: (componentId) => {
    const { scheduleData } = get();
    if (!scheduleData || !scheduleData.component_status) return null;
    return scheduleData.component_status[componentId] || {};
  },

  setSelectedComponent: (component) => set({ selectedComponent: component }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setDateRange: (range) => set({ dateRange: range }),
  
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
      const status = scheduleData.component_status?.[op.component];
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
    }).slice(0, 5);
  },

  rescheduleOperation: async (operationId, newStartTime, newEndTime, reason) => {
    set({ loading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { scheduleData } = get();
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
      const status = scheduleData.component_status?.[op.component];
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
      throw error;
    }
  },

  getScheduleComparison: () => {
    const { scheduleData, plannedSchedule, forecastSchedule } = get();
    
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
        const status = scheduleData.component_status?.[op.component];
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
      criticalDelays: delays.filter(d => d.delay > 24)
    };
  },

  fetchProductionStatus: async (partNumber, startEpoch, endEpoch) => {
    set({ productionStatusLoading: true, productionStatusError: null });
    try {
      let url = `http://172.19.224.1:8002/api/v1/production/daily/?start_epoch=${startEpoch}&end_epoch=${endEpoch}`;
      if (partNumber) {
        url += `&part_number=${partNumber}`;
      }
      const response = await axios.get(url);
      set({ 
        productionStatusData: response.data,
        productionStatusLoading: false 
      });
    } catch (error) {
      set({ 
        productionStatusError: error.message, 
        productionStatusLoading: false 
      });
    }
  },

  fetchWeeklyProductionStatus: async (partNumber, startEpoch, endEpoch) => {
    set({ productionStatusLoading: true, productionStatusError: null });
    try {
      let url = `http://172.19.224.1:8002/api/v1/production/weekly/?start_epoch=${startEpoch}&end_epoch=${endEpoch}`;
      if (partNumber) {
        url += `&part_number=${partNumber}`;
      }
      const response = await axios.get(url);
      set({ 
        productionStatusData: {
          daily_production: response.data.weekly_production,
          total_planned: response.data.total_planned,
          total_completed: response.data.total_completed,
        },
        productionStatusLoading: false 
      });
    } catch (error) {
      set({ 
        productionStatusError: error.message, 
        productionStatusLoading: false 
      });
    }
  },

  fetchMonthlyProductionStatus: async (partNumber, startEpoch, endEpoch) => {
    set({ productionStatusLoading: true, productionStatusError: null });
    try {
      let url = `http://172.19.224.1:8002/api/v1/production/monthly/?start_epoch=${startEpoch}&end_epoch=${endEpoch}`;
      if (partNumber) {
        url += `&part_number=${partNumber}`;
      }
      const response = await axios.get(url);
      set({ 
        productionStatusData: {
          daily_production: response.data.monthly_production,
          total_planned: response.data.total_planned,
          total_completed: response.data.total_completed,
        },
        productionStatusLoading: false 
      });
    } catch (error) {
      set({ 
        productionStatusError: error.message, 
        productionStatusLoading: false 
      });
    }
  },

  clearProductionStatus: () => {
    set({
      productionStatusData: {
        daily_production: [],
        total_planned: {},
        total_completed: {},
      },
      productionStatusError: null,
      productionStatusLoading: false
    });
  },

  fetchPartNumberSuggestions: async (searchText) => {
    try {
      const endEpoch = Math.floor(Date.now() / 1000);
      const startEpoch = endEpoch - (365 * 24 * 60 * 60);
      
      const response = await axios.get(`http://172.19.224.1:8002/api/v1/production/daily/?start_epoch=${startEpoch}&end_epoch=${endEpoch}`);
      const allPartNumbers = response.data.daily_production || [];
      
      const uniquePartNumbers = [...new Set(allPartNumbers.map(item => item.part_number))];
      
      return uniquePartNumbers
        .filter(pn => pn && pn.toLowerCase().includes(searchText.toLowerCase()))
        .map(pn => ({
          value: pn,
          label: pn
        }));
    } catch (error) {
      console.error('Error fetching part number suggestions:', error);
      return [];
    }
  },

  fetchCombinedScheduleData: async () => {
    set({ combinedScheduleLoading: true, combinedScheduleError: null });
    try {
      const response = await axios.get('http://172.19.224.1:8002/api/v1/rescheduling/reschedule-actual-planned-combined');
      set({ 
        combinedScheduleData: response.data,
        combinedScheduleLoading: false 
      });
      return response.data;
    } catch (error) {
      set({ 
        combinedScheduleError: error.message, 
        combinedScheduleLoading: false 
      });
      throw error;
    }
  },
}));

// Helper function to calculate progress
const calculateProgress = (operation, status) => {
  if (!status) return 0;
  return (status.completed_quantity / status.total_quantity) * 100;
};

// Helper function to get task styles using Ant Design colors
const getTaskStyles = (operation, status) => {
  if (!status) return { 
    progressColor: '#1890ff',
    backgroundColor: '#e6f7ff'
  };
  
  if (status.on_time) {
    return { 
      progressColor: '#52c41a',
      backgroundColor: '#f6ffed'
    };
  } else if (new Date(operation.end_time) > new Date(status.lead_time)) {
    return { 
      progressColor: '#ff4d4f',
      backgroundColor: '#fff1f0'
    };
  }
  
  return { 
    progressColor: '#faad14',
    backgroundColor: '#fffbe6'
  };
};

const calculateDelay = (endTime, leadTime) => {
  const end = new Date(endTime);
  const lead = new Date(leadTime);
  return Math.round((end - lead) / (1000 * 60 * 60));
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
    const deviation = (actualStart - plannedStart) / (1000 * 60 * 60);

    return {
      machine: actualOp.machine,
      component: actualOp.component,
      description: actualOp.description,
      plannedStart: plannedStart,
      actualStart: actualStart,
      deviation: Math.round(deviation * 10) / 10
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
    const duration = new Date(op.end_time) - new Daste(op.start_time);
    return acc + duration / (1000 * 60 * 60);
  }, 0);

  return (totalPlannedHours / totalActualHours) * 100;
};

export default useScheduleStore;
