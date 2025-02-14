import { create } from 'zustand';
import axios from 'axios';

const BASE_URL = 'http://172.18.7.88:7738/api/v1/operations';

const extractMachineId = (machineMake) => {
  // Extract numeric ID from machine make (e.g., "m1" -> 1)
  const matches = machineMake.match(/\d+/);
  return matches ? parseInt(matches[0]) : null;
};

const useMachineMaintenanceStore = create((set) => ({
  machines: [],
  totalMachines: 0,
  statuses: [],
  loading: false,
  error: null,

  // Fetch all machine statuses
  fetchMachineStatuses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${BASE_URL}/machine-status/`);
      const machinesWithIds = response.data.statuses.map(machine => ({
        ...machine,
        id: extractMachineId(machine.machine_make)
      }));
      set({
        machines: machinesWithIds,
        totalMachines: response.data.total_machines,
        loading: false
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
    }
  },

  // Fetch available statuses (ON/OFF)
  fetchAvailableStatuses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${BASE_URL}/status-table`);
      set({
        statuses: response.data.statuses,
        loading: false
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
    }
  },

  // Update machine status
  updateMachineStatus: async (machineId, data) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(
        `${BASE_URL}/machine-status/${machineId}`,
        data
      );

      // Refresh machine statuses after update
      const fetchResponse = await axios.get(`${BASE_URL}/machine-status/`);
      const machinesWithIds = fetchResponse.data.statuses.map(machine => ({
        ...machine,
        id: extractMachineId(machine.machine_make)
      }));
      
      set({
        machines: machinesWithIds,
        totalMachines: fetchResponse.data.total_machines,
        loading: false
      });

      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
      throw error;
    }
  },
}));

export default useMachineMaintenanceStore;
