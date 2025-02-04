import { create } from 'zustand';

const useWorkcenterStore = create((set) => ({
  workcenters: [],
  workcenterCodes: [], // State for unique workcenter codes
  machineNames: [], // State for unique machine names
  isLoading: false,
  error: null,

  fetchWorkcenters: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.88:7721/master-order/all-machines/');
      if (!response.ok) {
        throw new Error('Failed to fetch workcenters');
      }
      const data = await response.json();
      console.log('Fetched workcenters:', data); // Log the fetched data

      set({ workcenters: data, isLoading: false });

      // Extract unique workcenter codes and machine names
      const uniqueCodes = [...new Set(data.map(item => item.work_center.code))];
      const uniqueTypes = [...new Set(data.map(item => item.type))];

      console.log('Unique Workcenter Codes:', uniqueCodes); // Log unique codes
      console.log('Unique Machine Names:', uniqueTypes); // Log unique types

      set({ workcenterCodes: uniqueCodes, machineNames: uniqueTypes });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateWorkcenter: async (updatedItem) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`http://172.18.7.88:7721/master-order/machines/${updatedItem.work_center_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedItem),
      });

      if (!response.ok) {
        throw new Error('Failed to update workcenter');
      }

      await fetchWorkcenters(); // Refetch workcenters after update
      set({ isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },
}));

export default useWorkcenterStore;