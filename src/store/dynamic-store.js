import { create } from 'zustand';
import axios from 'axios';

const useDynamicStore = create((set) => ({
  scheduleData: null,
  loading: false,
  error: null,

  clearScheduleData: () => {
    set({ scheduleData: null, loading: false, error: null });
  },

  fetchDynamicScheduleData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get('http://172.18.7.88:2299/api/v1/rescheduling/reschedule-actual-planned-combined');
      set({ 
        scheduleData: response.data,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.message || 'Failed to fetch schedule data',
        loading: false 
      });
    }
  },

  // Helper function to get operation-specific data
  getOperationData: (operationName) => {
    const state = useDynamicStore.getState();
    const { scheduleData } = state;

    if (!scheduleData) return null;

    return {
      planned: scheduleData.scheduled_operations.filter(op => op.operation_name === operationName),
      actual: scheduleData.production_logs.filter(log => log.operation_name === operationName)
    };
  },

  // Get unique operations from all data sources
  getUniqueOperations: () => {
    const state = useDynamicStore.getState();
    const { scheduleData } = state;

    if (!scheduleData) return [];

    const operations = new Set([
      ...scheduleData.scheduled_operations.map(op => op.operation_name),
      ...scheduleData.production_logs.map(log => log.operation_name)
    ]);

    return Array.from(operations).sort();
  },

  // Keep getMachineData for backward compatibility
  getMachineData: (machineName) => {
    const state = useDynamicStore.getState();
    const { scheduleData } = state;

    if (!scheduleData) return null;

    return {
      scheduledOperations: scheduleData.scheduled_operations.filter(op => op.machine === machineName),
      productionLogs: scheduleData.production_logs.filter(log => log.machine_name === machineName)
    };
  },

  // Get unique machines from all data sources
  getUniqueMachines: () => {
    const state = useDynamicStore.getState();
    const { scheduleData } = state;

    if (!scheduleData) return [];

    const machines = new Set([
      ...scheduleData.scheduled_operations.map(op => op.machine),
      ...scheduleData.production_logs.map(log => log.machine_name),
      ...scheduleData.updates.map(update => update.machine_id.toString())
    ]);

    return Array.from(machines);
  }
}));

export default useDynamicStore; 