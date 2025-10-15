import { create } from 'zustand';
import moment from 'moment';
import { throttle } from 'lodash';
import axios from 'axios';

const MAX_DATA_POINTS = 20; // Increase the number of points to show more history


// Create axios instance with custom config
const api = axios.create({
    // Use relative URLs to avoid CORS issues - these will go through the development proxy
    baseURL: '/api',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

// Define some dummy data for when the API is unavailable
const DUMMY_MACHINES = [
  { id: 1, machine_name: "CNC Machine 1", workshop_name: "Workshop A" },
  { id: 2, machine_name: "Lathe Machine 2", workshop_name: "Workshop A" },
  { id: 3, machine_name: "Milling Machine 3", workshop_name: "Workshop B" },
  { id: 4, machine_name: "Drill Press 4", workshop_name: "Workshop B" },
  { id: 5, machine_name: "Grinder 5", workshop_name: "Workshop C" }
];

// Helper functions for localStorage
const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

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
  selectedDate: loadFromLocalStorage('selectedDate', moment().format('YYYY-MM-DD')),
  showReport: false,
  reportData: null,
  weeklyEnergyData: [],
  workshopProductionData: [],
  totalEnergyCosts: {
    weekly_cost: 0,
    monthly_cost: 0
  },
  machineId: null,
  defaultMachineId: 1,
  graphData: loadFromLocalStorage('graphData', []),

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
      const response = await fetch('/api/v5/shift_live_data/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Enrich data with machine names if available
      const enrichedData = data.map(item => ({
        ...item,
        id: Number(item.id),
        machine_name: get().machines.find(m => Number(m.id) === Number(item.id))?.machine_name || `Machine ${item.id}`,
      }));

      set({ 
        shiftLiveData: enrichedData,
        selectedDate: null // Clear selected date when fetching live data
      });
      return enrichedData;
    } catch (error) {
      console.error('Error fetching shift live data:', error);
      set({ shiftLiveData: [] });
      throw error;
    }
  },

  fetchShiftHistoricalData: async (date) => {
    try {
      const response = await fetch(`/api/v5/shift_live_history/?date=${date}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Historical data received:', data); // Debug log
      
      // Use the machine_name directly from the API response
      const enrichedData = data.map(item => ({
        ...item,
        id: Number(item.id),
        // No need to look up machine name as it's already in the response
        machine_name: item.machine_name // Use the machine_name from API response
      }));

      set({ 
        shiftLiveData: enrichedData,
        selectedDate: date
      });
      return enrichedData;
    } catch (error) {
      console.error('Error fetching historical shift data:', error);
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

  setShowReport: (show) => {
    set({ showReport: show });
  },

  fetchReportData: async (date) => {
    try {
      // You can add actual report data fetching logic here if needed
      set({ 
        reportData: {
          date: date,
          // Add other report data as needed
        }
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      set({ reportData: null });
    }
  },

  fetchDailyEnergyConsumption: async (date) => {
    set({ loading: true });
    try {
      const formattedDate = moment(date).format('YYYY-MM-DD');
      const response = await fetch(`/api/v5/daily_energy_consumption?date=${formattedDate}`, {
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
      console.log('Received data:', data);

      set({ 
        weeklyEnergyData: data.daily_energy_consumption || [],
        loading: false,
        error: null
      });

      return data.daily_energy_consumption;

    } catch (error) {
      console.error('Error in fetchDailyEnergyConsumption:', error);
      set({ 
        error: error.message, 
        loading: false,
        weeklyEnergyData: []
      });
      throw error;
    }
  },

  fetchWorkshopProductionData: async (date) => {
    set({ loading: true });
    try {
        const formattedDate = moment(date).format('YYYY-MM-DD');
        const response = await fetch(`/api/v5/get_graph_data?date=${formattedDate}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw API response:', data);

        // Check if data is in the expected format
        if (!data || !data.dataPoints || !Array.isArray(data.dataPoints)) {
            console.error('Invalid data format received:', data);
            throw new Error('Invalid data format received from server');
        }

        const transformedData = data.dataPoints.map(point => ({
            x: Number(point.value[0]),
            x2: Number(point.value[1]),
            y: parseInt(point.machine_id) - 1,
            status: point.name,
            color: point.name === 'PRODUCTION' ? '#006400' : 
                   point.name === 'ON' ? '#FF8C00' : '#808080'
        }));

        console.log('Transformed data:', transformedData);

        set({ 
            workshopProductionData: transformedData,
            loading: false,
            error: null 
        });
        
        return transformedData;
    } catch (error) {
        console.error('Error fetching workshop production data:', error);
        set({ 
            workshopProductionData: [],
            loading: false,
            error: error.message 
        });
        return [];
    }
},

  fetchTotalEnergyCosts: async (date) => {
    set({ loading: true });
    
    return new Promise((resolve, reject) => {
        const formattedDate = moment(date).format('YYYY-MM-DD');
        const xhr = new XMLHttpRequest();
        
        xhr.open('GET', `http://172.19.224.1:8002/api/v5/total_energy_costs?date=${formattedDate}`, true);
        
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    console.log('Total energy costs data:', data);
                    
                    set({ 
                        totalEnergyCosts: {
                            weekly_cost: Number(data.total_weekly_cost) || 0,
                            monthly_cost: Number(data.total_monthly_cost) || 0
                        },
                        loading: false,
                        error: null
                    });
                    
                    resolve(data);
                } catch (error) {
                    console.error('Error parsing response:', error);
                    set({ 
                        totalEnergyCosts: {
                            weekly_cost: 0,
                            monthly_cost: 0
                        },
                        loading: false,
                        error: 'Error parsing response'
                    });
                    reject(error);
                }
            } else {
                console.error('Server returned:', xhr.status, xhr.statusText);
                set({ 
                    totalEnergyCosts: {
                        weekly_cost: 0,
                        monthly_cost: 0
                    },
                    loading: false,
                    error: `Server error: ${xhr.status}`
                });
                reject(new Error(`Server error: ${xhr.status}`));
            }
        };
        
        xhr.onerror = function() {
            console.error('Request failed:', xhr.statusText);
            set({ 
                totalEnergyCosts: {
                    weekly_cost: 0,
                    monthly_cost: 0
                },
                loading: false,
                error: 'Network error'
            });
            reject(new Error('Network error'));
        };
        
        xhr.send();
    });
},

  fetchMachineProductionData: async (machineId, date) => {
    try {
        const formattedDate = moment(date).format('YYYY-MM-DD');
        const response = await fetch(`/api/v5/get_production_data?date=${formattedDate}&machine_id=${machineId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Production data received:', data);
        
        return data; // Return the raw data structure with dataPoints
    } catch (error) {
        console.error('Error fetching machine production data:', error);
        return { dataPoints: [] };
    }
},

  fetchGraphData: async (date) => {
    try {
      set({ loading: true });
      const formattedDate = moment(date).format('YYYY-MM-DD');
      
      const response = await fetch(`/api/v5/get_graph_data?date=${formattedDate}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const dataPoints = data.dataPoints || [];

      const transformedData = dataPoints.map(point => ({
        x: point.value[0],
        x2: point.value[1],
        y: point.machine_id - 1,
        status: point.name,
        color: point.name === 'PRODUCTION' ? '#006400' : 
               point.name === 'ON' ? '#FF8C00' : '#808080'
      }));

      // Save to localStorage
      saveToLocalStorage('graphData', transformedData);
      saveToLocalStorage('selectedDate', formattedDate);

      set({ 
        graphData: transformedData,
        selectedDate: formattedDate,
        loading: false,
        error: null
      });

      return transformedData;
    } catch (error) {
      console.error('Error fetching graph data:', error);
      set({ 
        graphData: [],
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Add a method to clear the stored data if needed
  clearStoredData: () => {
    localStorage.removeItem('graphData');
    localStorage.removeItem('selectedDate');
    set({ 
      graphData: [],
      selectedDate: moment().format('YYYY-MM-DD')
    });
  }
}));

export default useEnergyStore; 