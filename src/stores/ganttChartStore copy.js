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

const DEFAULT_DATE_RANGE = [dayjs().startOf('day'), dayjs().endOf('day')];

const useGanttStore = create((set, get) => ({
  dateRange: null,
  selectedMachine: 'all',
  ganttData: [],
  isLoading: false,
  error: null,
  viewMode: 'daily',

  fetchGanttData: async (forceRefresh = false) => {
    const { dateRange, selectedMachine } = get();
    set({ isLoading: true, error: null });

    try {
      let params = {
        machine_id: selectedMachine === 'all' ? undefined : selectedMachine,
      };

      // Add date params only if dateRange is selected
      if (dateRange && dateRange[0] && dateRange[1]) {
        params = {
          ...params,
          start_date: dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
          end_date: dateRange[1].format('YYYY-MM-DD HH:mm:ss'),
        };
      }

      const response = await axios.get(
        `${BASE_URL}/production_monitoring/combined-schedule-production/`,
        { params }
      );

      const { production_logs = [], scheduled_operations = [] } = response.data;

      const combinedData = [
        ...production_logs.map(log => ({
          ...log,
          type: 'production',
          id: `prod-${log.id}`
        })),
        ...scheduled_operations.map((op, index) => ({
          ...op,
          type: 'scheduled',
          id: `sch-${index}`
        }))
      ];

      set({ 
        ganttData: combinedData,
        isLoading: false 
      });

    } catch (error) {
      console.error('Error fetching gantt data:', error);
      set({ 
        error: error.message || 'Failed to fetch data',
        isLoading: false,
        ganttData: []
      });
    }
  },

  setDateRange: (range) => {
    set({ dateRange: range });
  },

  setSelectedMachine: (machine) => {
    set({ selectedMachine: machine });
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  submitQuery: () => {
    get().fetchGanttData(true);
  },

  resetData: () => {
    set({
      dateRange: null,
      selectedMachine: 'all',
      error: null
    });
    get().fetchGanttData();
  }
}));

export default useGanttStore; 