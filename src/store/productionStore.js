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

const BASE_URL = 'http://172.19.224.1:8002/production_monitoring';
const WS_URL = 'ws://172.19.224.1:8002/production_monitoring/ws/live-status/';

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
    workcenters: [],
    allWorkcenters: [],

    // Add new KPI Dashboard state
    kpiData: null,
    kpiLoading: false,
    kpiError: null,
    kpiDateRange: [dayjs().subtract(24, 'hour'), dayjs()],
    kpiSelectedMachines: ['all'],
    kpiTimeframe: '24h',
    kpiAutoRefresh: false,
    kpiRefreshInterval: null,

    // Add new analytics state
    analyticsData: {
      machineTimelines: [],
      dailyProduction: [],
      dateRange: [dayjs().subtract(7, 'days'), dayjs()],
      isLoading: false,
      error: null
    },

    // OEE Dashboard state
oeeData: {
  shiftSummary: [],
  machineAnalysis: null,
  isLoading: false,
  error: null,
  dateRange: dayjs(), // Single date instead of array
  selectedMachine: null,
  selectedShift: null
},

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
            // Filter out machines with 'default' in their name
            const filteredMachines = machinesData.filter(machine =>
              machine.machine_name && !machine.machine_name.toLowerCase().includes('default')
            );
            set({
              machines: filteredMachines.map(machine => ({
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

    // Fetch work centres for filtering machines
    fetchWorkCenters: async () => {
      try {
        const response = await axios.get('http://172.19.224.1:8002/api/v1/master-order/workcenters/?skip=0&limit=100');
        const workcenters = response.data;
        
        // No longer filtering by is_schedulable
        set({
          workcenters: workcenters,
          allWorkcenters: workcenters
        });
        
        return workcenters;
      } catch (error) {
        console.error('Error fetching work centres:', error);
        return [];
      }
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
        selectedMachines: [],
        workcenters: [],
        allWorkcenters: []
      });
    },

    // KPI Dashboard actions
    fetchKPIData: async () => {
      const { kpiDateRange, kpiSelectedMachines } = get();
      
      try {
        set({ kpiLoading: true });
        const params = new URLSearchParams();
        
        if (kpiDateRange?.length === 2) {
          params.append('start_date', kpiDateRange[0].format('YYYY-MM-DD HH:mm:ss'));
          params.append('end_date', kpiDateRange[1].format('YYYY-MM-DD HH:mm:ss'));
        }
        
        if (kpiSelectedMachines.length && !kpiSelectedMachines.includes('all')) {
          params.append('machines', kpiSelectedMachines.join(','));
        }

        const response = await axios.get(
          `${BASE_URL}/production-kpi-dashboard/?${params.toString()}`
        );

        set({ 
          kpiData: response.data,
          kpiError: null
        });
      } catch (error) {
        console.error('Error fetching KPI data:', error);
        set({ 
          kpiError: 'Failed to fetch KPI data. Please try again later.'
        });
      } finally {
        set({ kpiLoading: false });
      }
    },

    setKPIDateRange: (range) => {
      set({ kpiDateRange: range });
      get().fetchKPIData();
    },

    setKPITimeframe: (timeframe) => {
      set({ kpiTimeframe: timeframe });
      const now = dayjs();
      
      let newRange;
      switch (timeframe) {
        case '24h':
          newRange = [now.subtract(24, 'hour'), now];
          break;
        case '7d':
          newRange = [now.subtract(7, 'day'), now];
          break;
        case '30d':
          newRange = [now.subtract(30, 'day'), now];
          break;
        case 'custom':
          return; // Keep current range
        default:
          newRange = [now.subtract(24, 'hour'), now];
      }
      
      get().setKPIDateRange(newRange);
    },

    setKPISelectedMachines: (machines) => {
      set({ kpiSelectedMachines: machines });
      get().fetchKPIData();
    },

    toggleKPIAutoRefresh: () => {
      const { kpiAutoRefresh, kpiRefreshInterval } = get();
      
      if (kpiAutoRefresh && kpiRefreshInterval) {
        clearInterval(kpiRefreshInterval);
        set({ 
          kpiAutoRefresh: false,
          kpiRefreshInterval: null
        });
      } else {
        const interval = setInterval(() => {
          get().fetchKPIData();
        }, 60000); // Refresh every minute
        
        set({ 
          kpiAutoRefresh: true,
          kpiRefreshInterval: interval
        });
      }
    },

    cleanupKPI: () => {
      const { kpiRefreshInterval } = get();
      if (kpiRefreshInterval) {
        clearInterval(kpiRefreshInterval);
      }
      set({
        kpiData: null,
        kpiLoading: false,
        kpiError: null,
        kpiRefreshInterval: null,
        kpiAutoRefresh: false
      });
    },

    // Fetch machine status timeline data
    // New function to fetch machine timeline data
    fetchMachineStatusTimeline: async (startDate, endDate) => {
      set({ isLoading: true });
      try {
        const start = startDate ? dayjs(startDate).format('YYYY-MM-DD') : null;
        const end = endDate ? dayjs(endDate).format('YYYY-MM-DD') : null;
        
        const response = await axios.get(`${BASE_URL}/all-machines-status-timeline/`, {
          params: {
            start_date: start,
            end_date: end
          }
        });

        const ALLOWED_MACHINES = [
          {id: 1, name: "CNCM-DMU-60MB 5 Axis"},
          {id: 2, name: "CNCM-Deckel Maho"},
          {id: 3, name: "CNCM-DMU 60eVo Linear"},
          {id: 4, name: "CNCM-DMU-60T"},
          {id: 5, name: "CNCM-VCP800W Duro"},
          {id: 6, name: "NEWC-Makino"},
          {id: 7, name: "NEWC-Robofil 240"},
          {id: 8, name: "CNCT-Pilatus 20T-L3"},
          {id: 9, name: "CNCT-SCH-110"},
          {id: 10, name: "CNCT-SCH-125 CCN"},
          {id: 11, name: "CNCT-SCH-180 CCN-RT"},
          {id: 12, name: "CNCT-TUR26"},
          {id: 13, name: "CNCT-NU7B"},
          {id: 14, name: "CNCM-CTX Beta 1250TC4A"}
        ];

        const ALLOWED_MACHINE_IDS = new Set(ALLOWED_MACHINES.map(m => m.id));

        let timelineData = response.data;
        if (timelineData && Array.isArray(timelineData.machines)) {
          timelineData = {
            ...timelineData,
            machines: timelineData.machines.filter(m => ALLOWED_MACHINE_IDS.has(m.id))
          };
        }

        if (timelineData && Array.isArray(timelineData.timeline_data) && Array.isArray(timelineData.machines)) {
          timelineData = {
            ...timelineData,
            timeline_data: timelineData.timeline_data.filter(item => ALLOWED_MACHINE_IDS.has(item.machine_id))
          };
        }

        set({ 
          analyticsData: {
            ...get().analyticsData,
            timelineData: timelineData,
            isLoading: false,
            error: null
          }
        });
      } catch (error) {
        console.error('Error fetching machine status timeline:', error);
        set(state => ({ 
          analyticsData: {
            ...state.analyticsData,
            error: 'Failed to fetch timeline data',
            isLoading: false
          }
        }));
      }
    },

    // Fetch daily production data
    fetchDailyProduction: async (startDate, endDate) => {
      set(state => ({
        analyticsData: {
          ...state.analyticsData,
          isLoading: true,
          error: null
        }
      }));

      try {
        const response = await axios.get(
          `${BASE_URL}/daily-production-range/`, {
            params: {
              start_date: dayjs(startDate).format('YYYY-MM-DD'),
              end_date: dayjs(endDate).format('YYYY-MM-DD')
            }
          }
        );

        set(state => ({
          analyticsData: {
            ...state.analyticsData,
            dailyProduction: response.data.daily_production,
            isLoading: false
          }
        }));
      } catch (error) {
        console.error('Error fetching daily production:', error);
        set(state => ({
          analyticsData: {
            ...state.analyticsData,
            error: 'Failed to fetch daily production data',
            isLoading: false
          }
        }));
      }
    },

    // Update analytics date range
    setAnalyticsDateRange: (range) => {
      const [startDate, endDate] = range;
      set(state => ({
        analyticsData: {
          ...state.analyticsData,
          dateRange: range
        }
      }));
      
      // Fetch both datasets with new date range
      get().fetchMachineStatusTimeline(startDate, endDate);
      get().fetchDailyProduction(startDate, endDate);
    },

  fetchShiftSummary: async () => {
  const { oeeData } = get();
  const selectedDate = dayjs(oeeData.dateRange).format('YYYY-MM-DD');
  
  set(state => ({
    oeeData: {
      ...state.oeeData,
      isLoading: true,
      error: null
    }
  }));

  try {
    const params = new URLSearchParams();
    params.append('date', selectedDate);
    
    if (oeeData.selectedShift !== null && oeeData.selectedShift !== 'all') {
      params.append('shift', oeeData.selectedShift);
    } else {
      params.append('shift', 'all');
    }
    
    if (oeeData.selectedMachine !== null && oeeData.selectedMachine !== 'all') {
      params.append('machine_id', oeeData.selectedMachine);
    }

    const response = await axios.get(
      `${BASE_URL}/detailed-shift-summary/?${params.toString()}`
    );

    set(state => ({
      oeeData: {
        ...state.oeeData,
        shiftSummary: response.data,
        isLoading: false
      }
    }));
  } catch (error) {
    console.error('Error fetching shift summary:', error);
    set(state => ({
      oeeData: {
        ...state.oeeData,
        error: 'Failed to fetch shift summary data',
        isLoading: false
      }
    }));
  }
},


 fetchMachineOEEAnalysis: async (machineId) => {
  const { oeeData } = get();
  const selectedDate = dayjs(oeeData.dateRange).format('YYYY-MM-DD');
  
  set(state => ({
    oeeData: {
      ...state.oeeData,
      isLoading: true,
      error: null
    }
  }));

  try {
    const params = new URLSearchParams();
    params.append('date', selectedDate);
    
    if (oeeData.selectedShift !== null && oeeData.selectedShift !== 'all') {
      params.append('shift', oeeData.selectedShift);
    } else {
      params.append('shift', 'all');
    }

    const response = await axios.get(
      `${BASE_URL}/machine-oee-analysis/${machineId}?${params.toString()}`
    );

    set(state => ({
      oeeData: {
        ...state.oeeData,
        machineAnalysis: response.data,
        isLoading: false
      }
    }));
  } catch (error) {
    console.error('Error fetching machine OEE analysis:', error);
    set(state => ({
      oeeData: {
        ...state.oeeData,
        error: 'Failed to fetch machine OEE analysis',
        isLoading: false
      }
        }));
      }
    },

    // Update OEE date range
setOEEDateRange: (date) => {
  set(state => ({
    oeeData: {
      ...state.oeeData,
      dateRange: date // Single date
    }
  }));
      
      // Fetch updated data
      get().fetchShiftSummary();
      
      // If a machine is selected, fetch its analysis too
      // If a machine is selected, fetch its analysis too
      if (get().oeeData.selectedMachine) {
    get().fetchMachineOEEAnalysis(get().oeeData.selectedMachine);
  }
},

    // Set selected machine for OEE
    setOEESelectedMachine: (machineId) => {
      set(state => ({
        oeeData: {
          ...state.oeeData,
          selectedMachine: machineId
        }
      }));
      
      if (machineId) {
        get().fetchMachineOEEAnalysis(machineId);
      } else {
        set(state => ({
          oeeData: {
            ...state.oeeData,
            machineAnalysis: null
          }
        }));
      }
      
      get().fetchShiftSummary();
    },

    // Set selected shift for OEE
    setOEESelectedShift: (shift) => {
      set(state => ({
        oeeData: {
          ...state.oeeData,
          selectedShift: shift
        }
      }));
      
      get().fetchShiftSummary();
      
      if (get().oeeData.selectedMachine) {
        get().fetchMachineOEEAnalysis(get().oeeData.selectedMachine);
      }
    },

    // Update this function in the store
    fetchOverallOEEMetrics: async (startDate, endDate) => {
      try {
        const start = startDate ? dayjs(startDate).format('YYYY-MM-DD') : dayjs().subtract(7, 'days').format('YYYY-MM-DD');
        const end = endDate ? dayjs(endDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
        
        const response = await axios.get(
          `${BASE_URL}/overall-oee-analytics/?start_date=${start}&end_date=${end}`
        );
        
        set(state => ({
          overallOEEMetrics: {
            oee: response.data.overall_oee || 0,
            availability: response.data.overall_availability || 0,
            performance: response.data.overall_performance || 0,
            quality: response.data.overall_quality || 0,
            lastUpdated: new Date(),
            startDate: start,
            endDate: end
          }
        }));
      } catch (error) {
        console.error('Error fetching overall OEE metrics:', error);
      }
    },

    // Add this to the initial state
    overallOEEMetrics: {
      oee: 0,
      availability: 0,
      performance: 0,
      quality: 0,
      lastUpdated: null,
      startDate: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD')
    }
  }))
);

export default useProductionStore;