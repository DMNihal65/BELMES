import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import moment from 'moment';
import axios from 'axios';
import dayjs from 'dayjs';

// Helper functions
const getStatusColor = (status) => {
  const statusMap = {
    'RUNNING': '#52c41a',
    'IDLE': '#faad14',
    'STOPPED': '#ff4d4f',
    'MAINTENANCE': '#1890ff',
    'OFFLINE': '#d9d9d9'
  };
  return statusMap[status] || '#d9d9d9';
};

const calculateUptime = (lastUpdated) => {
  return moment(lastUpdated).fromNow();
};

const BASE_URL = 'http://172.18.7.89:4470/production_monitoring';
const WS_URL = 'ws://172.18.7.89:4470/production_monitoring/ws/live-status/';

const useProductionStore = create(
  devtools((set, get) => ({
    machines: [],
    productionLogs: [],
    scheduledOperations: [],
    isLoading: false,
    wsConnection: null,
    selectedDateRange: null,
    selectedMachines: [],
    connectionAttempts: 0,
    maxAttempts: 5,
    productionData: [],

    // WebSocket connection with reconnection logic
    initializeWebSocket: () => {
      const store = get();
      if (store.wsConnection?.readyState === WebSocket.OPEN) return;

      try {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('WebSocket Connected');
          set({ connectionAttempts: 0 });
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Check if data is an array or single object
            const machinesData = Array.isArray(data) ? data : [data];
            
            set({
              machines: machinesData.map(machine => ({
                machine_id: machine.machine_id || 0,
                machine_name: machine.machine_name || 'Unknown',
                status: machine.status || 'OFFLINE',
                last_updated: machine.last_updated || new Date().toISOString(),
                status_color: getStatusColor(machine.status),
                uptime: calculateUptime(machine.last_updated),
                job_in_progress: machine.job_in_progress || 0,
                job_status: machine.job_status || 0,
                part_count: machine.part_count || 0,
                // Handle nested production details
                production_details: {
                  production_order: machine.production_order || '-',
                  part_number: machine.part_number || '-',
                  part_description: machine.part_description || '-',
                  operation_number: machine.operation_number || '-',
                  operation_description: machine.operation_description || '-',
                  required_quantity: machine.required_quantity || 0,
                  launched_quantity: machine.launched_quantity || 0,
                  active_program: machine.active_program || '-',
                  selected_program: machine.selected_program || '-',
                  program_number: machine.program_number || '-',
                  job_status: machine.job_status || 0
                }
              }))
            });
          } catch (error) {
            console.error('Error parsing WebSocket data:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed');
          const store = get();
          if (store.connectionAttempts < store.maxAttempts) {
            setTimeout(() => {
              // console.log(`Attempting to reconnect (${store.connectionAttempts + 1}/${store.maxAttempts})`);
              set(state => ({ 
                connectionAttempts: state.connectionAttempts + 1 
              }));
              store.initializeWebSocket();
            }, 5000);
          }
        };

        set({ wsConnection: ws });
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
      }
    },

    // Fetch production schedule with query parameters
    fetchProductionSchedule: async (startDate, endDate, machine = 'All Machines') => {
      set({ isLoading: true });
      try {
        const start = startDate ? dayjs(startDate).format('YYYY-MM-DD') : null;
        const end = endDate ? dayjs(endDate).format('YYYY-MM-DD') : null;
        
        const response = await fetch(`${BASE_URL}/combined-schedule-production/`, {
          params: {
            start_date: start,
            end_date: end,
            machine: machine !== 'All Machines' ? machine : null
          }
        });

        const data = await response.json();
        
        // Ensure we're setting an array
        set({ 
          productionData: Array.isArray(data) ? data : [],
          isLoading: false 
        });
      } catch (error) {
        console.error('Error fetching production schedule:', error);
        set({ 
          productionData: [],
          isLoading: false 
        });
      }
    },

    // Update filters and refetch data
    setDateRange: (range) => set({ selectedDateRange: range }),

    setSelectedMachines: (machines) => {
      set({ selectedMachines: machines });
      get().fetchProductionSchedule();
    },

    // Cleanup
    cleanup: () => {
      const { wsConnection } = get();
      if (wsConnection) {
        wsConnection.close();
      }
      set({ 
        wsConnection: null,
        connectionAttempts: 0,
        machines: [],
        productionLogs: [],
        scheduledOperations: [],
        productionData: [],
        selectedDateRange: null,
        selectedMachines: []
      });
    }
  }))
);

export default useProductionStore; 