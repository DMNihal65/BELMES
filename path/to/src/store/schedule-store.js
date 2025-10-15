import axios from 'axios';

const useScheduleStore = create((set, get) => ({
  // ... existing state and actions ...

  // New state variables for Lead Time Analytics
  leadTimeData: [],
  leadTimeLoading: false,
  leadTimeError: null,

  // New action to fetch Lead Time data
  fetchLeadTimeData: async () => {
    set({ leadTimeLoading: true, leadTimeError: null });
    try {
      const response = await axios.get('http://172.19.224.1:8002/component_status/');
      const formattedData = [
        ...response.data.early_complete,
        ...response.data.delayed_complete
      ].map(item => ({
        component: item.component,
        leadTime: new Date(item.lead_time).getTime(),
        scheduledEndTime: new Date(item.scheduled_end_time).getTime(),
        onTime: item.on_time
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

  // ... existing state and actions ...
}));

// ... existing helper functions ...

export default useScheduleStore; 