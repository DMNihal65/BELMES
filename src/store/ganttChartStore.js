// store/ganttChartStore.js
import { create } from 'zustand';
import dayjs from 'dayjs';
import axios from 'axios';

const BASE_URL = 'http://172.19.224.1:8002';

// Helper function to find min/max dates
const findDateRange = (items) => {
  if (!items.length) return null;
  
  let earliest = dayjs(items[0].start_time);
  let latest = dayjs(items[0].end_time);
  
  items.forEach(item => {
    const start = dayjs(item.start_time);
    const end = dayjs(item.end_time);
    
    if (start.isBefore(earliest)) earliest = start;
    if (end.isAfter(latest)) latest = end;
  });
  
  return {
    earliest: earliest.format('YYYY-MM-DD HH:mm:ss'),
    latest: latest.format('YYYY-MM-DD HH:mm:ss')
  };
};

const useGanttStore = create((set, get) => ({
  dateRange: [dayjs().startOf('day'), dayjs().endOf('day')],
  selectedMachine: 'all',
  ganttData: [], // This will be the data displayed in the chart
  allGanttData: [], // This will store all data for the date range
  machines: [], // This will store the list of unique, valid machines
  isLoading: false,
  error: null,
  lastRefresh: null,

  fetchGanttData: async (forceRefresh = false, customDateRange = null) => {
    const { dateRange } = get();
    const rangeToUse = customDateRange || dateRange;
    
    set({ isLoading: true, error: null });

    try {
      const queryParams = new URLSearchParams();
      
      // We will now always fetch all machines for the given date range
      // and filter on the client. The 'machine_id' param is removed from the query.

      // Use provided date range or current store date range
      if (!forceRefresh && rangeToUse?.[0] && rangeToUse?.[1]) {
        const startDate = dayjs(rangeToUse[0]);
        const endDate = dayjs(rangeToUse[1]);

        if (!startDate.isValid() || !endDate.isValid()) {
          throw new Error('Invalid date range');
        }

        queryParams.append('start_date', startDate.format('YYYY-MM-DD HH:mm:ss'));
        queryParams.append('end_date', endDate.format('YYYY-MM-DD HH:mm:ss'));
      }

      const url = `${BASE_URL}/production_monitoring/combined-schedule-production/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Fetching from URL:', url);

      const response = await axios.get(url);
      console.log('Raw API response:', response.data);

      // Ensure we have arrays even if the API returns null/undefined
      const { production_logs = [], scheduled_operations = [] } = response.data || {};

      // Log raw data
      console.log('Raw data counts:', {
        production_logs: production_logs?.length || 0,
        scheduled_operations: scheduled_operations?.length || 0
      });

      // Transform production logs
      const productionItems = (production_logs || [])
        .filter(log => {
          const hasRequiredFields = log.start_time && log.end_time && log.machine_name;
          const isValidDates = dayjs(log.start_time).isValid() && dayjs(log.end_time).isValid();
          if (!hasRequiredFields || !isValidDates) {
            console.log('Filtered out production log:', log);
          }
          return hasRequiredFields && isValidDates;
        })
        .map(log => ({
          id: `prod-${log.id}`,
          machine: log.machine_name,
          type: 'production',
          start_time: log.start_time,
          end_time: log.end_time,
          component: log.part_number,
          description: log.operation_description,
          quantity: log.quantity_completed,
          operator: log.operator_name,
          po: log.production_order,
          notes: log.notes,
          status: log.status
        }));

      // Transform scheduled operations
      const scheduledItems = (scheduled_operations || [])
        .filter(op => {
          const hasRequiredFields = op.start_time && op.end_time && op.machine;
          const isValidDates = dayjs(op.start_time).isValid() && dayjs(op.end_time).isValid();
          if (!hasRequiredFields || !isValidDates) {
            console.log('Filtered out scheduled operation:', op);
          }
          return hasRequiredFields && isValidDates;
        })
        .map(op => ({
          id: `sch-${op.id || Math.random()}`,
          machine: op.machine,
          type: 'scheduled',
          start_time: op.start_time,
          end_time: op.end_time,
          component: op.component,
          description: op.description,
          quantity: op.quantity,
          po: op.production_order,
          status: op.status
        }));
      
      const combinedData = [...productionItems, ...scheduledItems];

      // Filter out "Default" machines from the entire dataset, checking if the name includes "default"
      const allDataFiltered = combinedData.filter(item => 
        item.machine && !item.machine.toLowerCase().includes('default')
      );

      // Get unique machine names from the filtered data
      const uniqueMachines = [...new Set(allDataFiltered.map(item => item.machine))].sort();
      
      console.log('Final data analysis:', {
        totalItems: allDataFiltered.length,
        uniqueMachines: uniqueMachines,
        dateRange: findDateRange(allDataFiltered)
      });

      set({ 
        allGanttData: allDataFiltered, // Store all valid data
        ganttData: allDataFiltered, // Initially display all valid data
        machines: uniqueMachines, // Set the dynamic machine list
        selectedMachine: 'all', // Reset selection to 'all'
        isLoading: false,
        lastRefresh: dayjs(),
        error: null
      });

    } catch (error) {
      console.error('Error fetching gantt data:', error);
      set({ 
        error: error.message || 'Failed to fetch data. Please try again.',
        isLoading: false,
        ganttData: [],
        allGanttData: [],
        machines: []
      });
    }
  },

  setDateRange: (range) => {
    if (!range || !Array.isArray(range) || range.length !== 2) {
      console.log('Invalid range provided to setDateRange:', range);
      return;
    }

    const [start, end] = range;
    console.log('Setting new date range:', {
      start: start.format('YYYY-MM-DD HH:mm:ss'),
      end: end.format('YYYY-MM-DD HH:mm:ss')
    });

    set({ dateRange: [start, end] });
  },

  setSelectedMachine: (machine) => {
    const { allGanttData } = get();
    // Filter the displayed data on the client side
    const newGanttData = machine === 'all'
      ? allGanttData
      : allGanttData.filter(item => item.machine === machine);

    set({ 
      selectedMachine: machine,
      ganttData: newGanttData
    });
  },

  resetData: () => {
    const defaultRange = [dayjs().startOf('day'), dayjs().endOf('day')];
    set({
      dateRange: defaultRange,
      selectedMachine: 'all',
      error: null,
      lastRefresh: null,
      ganttData: [],
      allGanttData: [],
      machines: []
    });
    // Refetch all data for the default range
    get().fetchGanttData();
  }
}));

export default useGanttStore;