import { create } from 'zustand';

const useMaintenanceStore = create((set) => ({
  machines: [],
  maintenanceSchedules: [],
  documents: [],
  downtimeRecords: [],
  isLoading: false,
  error: null,

  // Fetch machines
  fetchMachines: async () => {
    set({ isLoading: true });
    try {
      // Replace with your API endpoint
      const response = await fetch('your-api/machines');
      const data = await response.json();
      set({ machines: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Fetch maintenance schedules
  fetchSchedules: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('your-api/maintenance-schedules');
      const data = await response.json();
      set({ maintenanceSchedules: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Add more actions as needed
}));

export default useMaintenanceStore; 