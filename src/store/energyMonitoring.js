import { create } from 'zustand';
import moment from 'moment';
import { throttle } from 'lodash';

const MAX_DATA_POINTS = 20; // Increase the number of points to show more history

const BASE_URL = 'http://172.18.7.91:7777/api/v5';

const useEnergyStore = create((set, get) => ({
  totalEnergy: 0,
  totalCost: 0,
  machines: [],
  loading: false,
  error: null,
  machineDetails: null,
  liveData: {},
  productionData: {},
  machineStates: {},
  detailData: {},
  productionStatus: null,
  averageEnergyData: null,
  historicalData: {
    timestamps: [],
    currents: [],
  },
  energyData: [],
  lastUpdate: null,
  shiftLiveData: [],
  selectedDate: null,

  fetchEnergyData: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/v5/energy_summary/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      set({ 
        totalEnergy: data.total_energy,
        totalCost: data.total_cost,
        loading: false, 
        error: null 
      });
    } catch (error) {
      console.error('Error fetching energy data:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchMachines: async () => {
    try {
      const response = await fetch(
        `/api/v5/machines/`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      set({ machines: Array.isArray(data) ? data : [] });
      return data;
    } catch (error) {
      console.error('Error fetching machines:', error);
      set({ machines: [] });
      throw error;
    }
  },

  fetchMachineDetails: async (machineId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v5/live_recent/${machineId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process the data to ensure we have all required fields
      const processedData = {
        current: data.current || 0,
        power: data.power || 0,
        energy: data.energy || 0,
        machine_name: data.machine_name || `Machine ${machineId}`,
        ...data
      };

      set({ 
        machineDetails: processedData,
        loading: false, 
        error: null 
      });
      return processedData;
    } catch (error) {
      console.error('Error fetching machine details:', error);
      set({ 
        error: 'Failed to fetch machine details. Please try again later.', 
        loading: false,
        machineDetails: null 
      });
      throw error;
    }
  },

  updateHistoricalData: (machineId, newData) => {
    set(state => {
      const currentTimestamp = moment(newData.timestamp).format('HH:mm:ss');
      
      // Keep existing data and add new point
      const timestamps = [...state.historicalData.timestamps, currentTimestamp];
      const currents = [...state.historicalData.currents, newData.current];

      // Only trim if we exceed MAX_DATA_POINTS
      const startIndex = Math.max(0, timestamps.length - MAX_DATA_POINTS);
      
      return {
        historicalData: {
          timestamps: timestamps.slice(startIndex),
          currents: currents.slice(startIndex),
        },
        energyData: [newData.energy || 0],
        liveData: {
          ...state.liveData,
          [machineId]: newData
        }
      };
    });
  },

  fetchLiveData: async (machineId) => {
    try {
      const response = await fetch(
        `/api/v5/live_recent/${machineId}`,  // Updated URL
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      get().updateHistoricalData(machineId, data);
    } catch (error) {
      console.error('Error fetching live data:', error);
    }
  },

  fetchProductionData: throttle(async (machineId) => {
    try {
      const today = moment().format('YYYY-MM-DD');
      const response = await fetch(`/api/v5/get_production_data?date=${today}&machine_id=${machineId}`);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      set((state) => ({
        productionData: {
          ...state.productionData,
          [machineId]: data
        }
      }), false);
    } catch (error) {
      console.error('Error fetching production data:', error);
      set((state) => ({
        productionData: {
          ...state.productionData,
          [machineId]: { dataPoints: [] }
        }
      }), false);
    }
  }, 10000, { trailing: true }),

  fetchMachineStates: throttle(async () => {
    try {
      const response = await fetch('/api/v5/all_machine_states', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      // Process the data to create a map of machine states
      const machineStatesMap = {};
      data.forEach(machine => {
        machineStatesMap[machine.machine_id] = {
          status: machine.state,
          lastUpdated: machine.timestamp
        };
      });

      set({ machineStates: machineStatesMap });
    } catch (error) {
      console.error('Error fetching machine states:', error);
    }
  }, 10000),

  fetchDetailData: async (machineId, timeRange) => {
    try {
      const endTime = moment();
      let startTime;
      
      switch(timeRange) {
        case 'hour':
          startTime = moment().subtract(1, 'hour');
          break;
        case 'day':
          startTime = moment().subtract(1, 'day');
          break;
        case 'week':
          startTime = moment().subtract(7, 'days');
          break;
        default:
          startTime = moment().subtract(1, 'hour');
      }

      const response = await fetch(
        `/api/v5/get_machine_history/${machineId}?` + 
        `start_time=${startTime.format('YYYY-MM-DD HH:mm:ss')}&` +
        `end_time=${endTime.format('YYYY-MM-DD HH:mm:ss')}`
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      // Transform the data to match the expected format
      const formattedData = {
        data: data.map(item => ({
          timestamp: moment(item.timestamp).format('YYYY-MM-DD HH:mm:ss'),
          current: parseFloat(item.current) || 0,
          power: parseFloat(item.power) || 0,
          energy: parseFloat(item.energy) || 0
        }))
      };

      // Sort data by timestamp
      formattedData.data.sort((a, b) => moment(a.timestamp).valueOf() - moment(b.timestamp).valueOf());
      
      set({ detailData: formattedData });
    } catch (error) {
      console.error('Error fetching detail data:', error);
      set({ detailData: { data: [] } });
    }
  },

  fetchProductionStatus: async (machineId, date) => {
    try {
      const response = await fetch(
        `/production-api/v5/get_production_data?date=${date}&machine_id=${machineId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      set({ productionStatus: data });
    } catch (error) {
      console.error('Error fetching production status:', error);
      set({ productionStatus: null });
    }
  },

  fetchAverageEnergy: async (machineId, date) => {
    try {
      const formattedDate = moment(date).format('DD-MM-YYYY');
      const response = await fetch(
        `/api/v5/average_energy_time/?machine_name=${machineId}&date=${formattedDate}`,  // Updated URL
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      set({ averageEnergyData: data });
    } catch (error) {
      console.error('Error fetching average energy:', error);
      set({ averageEnergyData: null });
    }
  },

  fetchShiftLiveData: async () => {
    try {
      const response = await fetch(
        `/api/v5/shift_live_data/`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Enrich data with machine names if available
      const enrichedData = data.map(item => ({
        ...item,
        id: Number(item.id),
        machine_name: get().machines.find(m => Number(m.id) === Number(item.id))?.machine_name || `Machine ${item.id}`,
      }));

      set({ shiftLiveData: enrichedData });
      return enrichedData;
    } catch (error) {
      console.error('Error fetching shift live data:', error);
      set({ shiftLiveData: [] });
      throw error;
    }
  },

  fetchShiftHistoricalData: async (date) => {
    try {
      const response = await fetch(`${BASE_URL}/shift_live_history/?date=${date}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const enrichedData = data.map(item => ({
        ...item,
        id: Number(item.id),
        machine_name: get().machines.find(m => Number(m.id) === Number(item.id))?.machine_name || `Machine ${item.id}`,
      }));

      set({ 
        shiftLiveData: enrichedData,
        selectedDate: date
      });
      console.log('Set date in fetchShiftHistoricalData:', date);
      return enrichedData;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      set({ shiftLiveData: [] });
      throw error;
    }
  },

  setSelectedDate: (date) => {
    console.log('Setting date in store:', date);
    set({ selectedDate: date });
  },
  
  clearSelectedDate: () => {
    console.log('Clearing date in store');
    set({ selectedDate: null });
  },
}));

export default useEnergyStore; 