import { create } from 'zustand';
import dayjs from 'dayjs';
import axios from 'axios';

// Sample machine data
const MACHINES = [
  { id: 'MMC1-M1', name: 'MMC1-M1' },
  { id: 'CNCT-m2', name: 'CNCT-m2' },
  { id: 'CNCM-m3', name: 'CNCM-m3' },
  { id: 'SMFD-m4', name: 'SMFD-m4' },
  { id: 'SMPD-m5', name: 'SMPD-m5' },
  { id: 'QFAB-m6', name: 'QFAB-m6' },
  { id: 'FAB-C-PC-m9', name: 'FAB-C-PC-m9' }
];

const BASE_URL = 'http://172.18.7.89:4470';

const useGanttStore = create((set, get) => ({
  dateRange: [dayjs().startOf('day'), dayjs().endOf('day')],
  selectedMachine: 'all',
  ganttData: [],
  isLoading: false,
  error: null,
  viewMode: 'daily',
  lastRefresh: null,

  fetchGanttData: async (forceRefresh = false) => {
    const { dateRange, selectedMachine, lastRefresh } = get();
    
    // Prevent multiple rapid refreshes
    if (!forceRefresh && lastRefresh && dayjs().diff(lastRefresh, 'seconds') < 10) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const queryParams = new URLSearchParams();
      
      if (selectedMachine !== 'all') {
        queryParams.append('machine_id', selectedMachine);
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        queryParams.append('start_date', dateRange[0].format('YYYY-MM-DD HH:mm:ss'));
        queryParams.append('end_date', dateRange[1].format('YYYY-MM-DD HH:mm:ss'));
      }

      const url = `${BASE_URL}/production_monitoring/combined-schedule-production/?${queryParams.toString()}`;
      const response = await axios.get(url);
      const { production_logs = [], scheduled_operations = [] } = response.data;

      // Transform and validate data
      const productionItems = production_logs
        .filter(log => log.start_time && log.end_time)
        .map(log => ({
          id: `prod-${log.id}`,
          machine: log.machine_name,
          type: 'production',
          start_time: dayjs(log.start_time).isValid() ? log.start_time : null,
          end_time: dayjs(log.end_time).isValid() ? log.end_time : null,
          component: log.part_number,
          description: log.operation_description,
          quantity: log.quantity_completed,
          operator: log.operator_name,
          po: log.production_order,
          notes: log.notes,
          status: log.status
        }))
        .filter(item => item.start_time && item.end_time);

      const scheduledItems = scheduled_operations
        .filter(op => op.start_time && op.end_time)
        .map(op => ({
          id: `sch-${op.id || Math.random()}`,
          machine: op.machine,
          type: 'scheduled',
          start_time: dayjs(op.start_time).isValid() ? op.start_time : null,
          end_time: dayjs(op.end_time).isValid() ? op.end_time : null,
          component: op.component,
          description: op.description,
          quantity: op.quantity,
          po: op.production_order,
          status: op.status
        }))
        .filter(item => item.start_time && item.end_time);

      set({ 
        ganttData: [...productionItems, ...scheduledItems],
        isLoading: false,
        lastRefresh: dayjs(),
        error: null
      });

    } catch (error) {
      console.error('Error fetching gantt data:', error);
      set({ 
        error: 'Failed to fetch data. Please try again.',
        isLoading: false,
        ganttData: []
      });
    }
  },

  setDateRange: (range) => {
    if (!range || !range[0] || !range[1]) {
      range = [dayjs().startOf('day'), dayjs().endOf('day')];
    }
    set({ dateRange: range });
  },

  setSelectedMachine: (machine) => {
    set({ selectedMachine: machine });
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  resetData: () => {
    set({
      dateRange: [dayjs().startOf('day'), dayjs().endOf('day')],
      selectedMachine: 'all',
      error: null,
      lastRefresh: null
    });
    get().fetchGanttData(true);
  }
}));

export default useGanttStore; 