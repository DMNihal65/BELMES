import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import moment from 'moment';

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
const WS_URL = 'ws://172.18.7.89:4470/production_monitoring/ws/live-status2/';

const useProductionStore = create(
  devtools((set, get) => ({
    machines: [],
    productionLogs: [],
    scheduledOperations: [],
    isLoading: false,
    wsConnection: null,
    selectedDateRange: [moment().startOf('day'), moment().endOf('day')],
    selectedMachines: [],
    connectionAttempts: 0,
    maxAttempts: 5,

    // WebSocket connection with reconnection logic
    initializeWebSocket: () => {
      const store = get();
      if (store.wsConnection?.readyState === WebSocket.OPEN) return;

      try {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('WebSocket Connected');
          set({ connectionAttempts: 0 }); // Reset attempts on successful connection
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.machines) {
              set({
                machines: data.machines.map(machine => ({
                  ...machine,
                  status_color: getStatusColor(machine.status),
                  uptime: calculateUptime(machine.last_updated)
                }))
              });
            }
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
              console.log(`Attempting to reconnect (${store.connectionAttempts + 1}/${store.maxAttempts})`);
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
    fetchProductionSchedule: async () => {
      const { selectedDateRange, selectedMachines } = get();
      set({ isLoading: true });

      try {
        const params = new URLSearchParams({
          start_date: selectedDateRange[0]?.toISOString(),
          end_date: selectedDateRange[1]?.toISOString(),
          ...(selectedMachines.length && { machine_ids: selectedMachines.join(',') })
        });

        const response = await fetch(
          `${BASE_URL}/combined-schedule-production/?${params}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        set({ 
          productionLogs: data.production_logs,
          scheduledOperations: data.scheduled_operations,
          isLoading: false 
        });
      } catch (error) {
        console.error('Error fetching schedule:', error);
        set({ 
          isLoading: false,
          productionLogs: [],
          scheduledOperations: []
        });
      }
    },

    // Update filters and refetch data
    setDateRange: (range) => {
      set({ selectedDateRange: range });
      get().fetchProductionSchedule();
    },

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
        scheduledOperations: []
      });
    }
  }))
);

export default useProductionStore; 