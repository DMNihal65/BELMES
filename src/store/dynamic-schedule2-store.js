import { create } from 'zustand';
import axios from 'axios';
import { message } from 'antd';

const useDynamicSchedule2Store = create((set, get) => ({
  scheduleData: null,
  loading: false,
  error: null,
  viewMode: 'timeline',
  conflicts: [],

  setViewMode: (mode) => set({ viewMode: mode }),

  fetchScheduleData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get('http://172.19.224.1:8002/api/schedule/data');
      set({ 
        scheduleData: response.data,
        loading: false 
      });
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      set({ 
        error: 'Failed to fetch schedule data. Please try again later.',
        loading: false 
      });
    }
  },

  filterScheduleByMachines: (machines) => {
    const { scheduleData } = get();
    if (!scheduleData) return null;

    return {
      ...scheduleData,
      scheduled_operations: scheduleData.scheduled_operations.filter(
        op => machines.includes(op.machine)
      )
    };
  },

  filterScheduleByDateRange: (startDate, endDate) => {
    const { scheduleData } = get();
    if (!scheduleData) return null;

    return {
      ...scheduleData,
      scheduled_operations: scheduleData.scheduled_operations.filter(op => {
        const opStart = new Date(op.start_time);
        const opEnd = new Date(op.end_time);
        return opStart >= startDate && opEnd <= endDate;
      })
    };
  },

  getMachineUtilization: (machineId) => {
    const { scheduleData } = get();
    if (!scheduleData) return 0;

    const machineOps = scheduleData.scheduled_operations.filter(
      op => op.machine === machineId
    );

    if (machineOps.length === 0) return 0;

    const totalTime = machineOps.reduce((acc, op) => {
      const start = new Date(op.start_time);
      const end = new Date(op.end_time);
      return acc + (end - start);
    }, 0);

    const workingHoursPerDay = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const daysInPeriod = 30; // Assuming 30 days period
    const totalAvailableTime = workingHoursPerDay * daysInPeriod;

    return (totalTime / totalAvailableTime) * 100;
  },

  rescheduleOperation: async (operationId, newStartTime, newEndTime, reason) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post('/api/schedule/reschedule', {
        operationId,
        newStartTime,
        newEndTime,
        reason
      });
      
      if (response.data.success) {
        message.success('Operation rescheduled successfully');
        get().fetchScheduleData(); // Refresh data
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to reschedule operation');
      }
    } catch (error) {
      console.error('Error rescheduling operation:', error);
      set({ 
        error: 'Failed to reschedule operation. Please try again later.',
        loading: false 
      });
      return false;
    }
  }
}));

export default useDynamicSchedule2Store;