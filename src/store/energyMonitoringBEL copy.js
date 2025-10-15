import { create } from 'zustand';
import axios from 'axios';
import moment from 'moment';

// Use a relative URL that will be handled by the proxy
const API_BASE_URL = '/api/bel';
const API_TIMEOUT = 10000; // Increase timeout to 10 seconds
const MAX_RETRIES = 1;

// Use the correct WebSocket endpoint for machines data
// const WS_MACHINES_ENDPOINT = 'ws://172.19.224.1:8002/api/v1/energymonitoring/ws/machines_data';

// Update the WebSocket endpoint for shiftwise energy data
const WS_SHIFTWISE_ENERGY_ENDPOINT = 'http://172.19.224.1:8002/api/v1/energy-monitoring/shiftwise-energy-stream';

// Add the HTTP endpoint for historical data
// const HISTORY_API_ENDPOINT = 'http://172.19.224.1:8002/api/v1/energymonitoring/shiftwise_energy_history_by_date';

// Update the endpoint constant
const MACHINE_STATUS_ENDPOINT = 'http://172.19.224.1:8002/api/v1/energy-monitoring/machine-status-stream';

// Update the endpoint constant to use the specific epoch time
const COMBINED_HISTORY_ENDPOINT = 'http://172.19.224.1:8002/api/v1/energy-monitoring/combined-history/1746586800';

const useEnergyMonitoringBelStore = create((set, get) => ({
  // Machine data
  machineData: {},
  machineNames: [], // Store the machine names from the API
  isLoading: false,
  error: null,
  filteredHistoryData: null, // Add state for filtered history data
  websocket: null, // Add state for websocket connection
  
  // Add these to the store state
  allMachinesWebsocket: null,
  allMachinesEnergyData: [],
  
  eventSource: null,
  
  // Update fetchMachineNames to use SSE
  fetchMachineNames: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Close existing EventSource if any
      const existingEventSource = get().eventSource;
      if (existingEventSource) {
        existingEventSource.close();
      }

      // Create new EventSource with error handling
      const eventSource = new EventSource(MACHINE_STATUS_ENDPOINT);
      
      // Store the EventSource instance
      set({ eventSource });

      // Handle connection open
      eventSource.onopen = () => {
        console.log('SSE connection established');
        set({ isLoading: false });
      };

      // Handle incoming messages
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received SSE data:', data);
          
          if (Array.isArray(data)) {
            // Get current machine names from store
            const currentMachines = get().machineNames;
            
            // If this is the first load (no current machines), set all machines
            if (!currentMachines || currentMachines.length === 0) {
              const formattedMachines = data.map(machine => ({
                machine_id: machine.machine_id,
                machine_data: {
                  id: machine.machine_id,
                  work_center: 'N/A',
                  type: 'Default',
                  make: machine.machine_name,
                  model: 'Default'
                },
                status: machine.status,
                total_power: machine.total_power,
                energy_consumed: machine.energy_consumed,
                timestamp: machine.timestamp
              }));
              
              set({ machineNames: formattedMachines });
            } else {
              // For subsequent updates, only update changed machines
              const updatedMachines = currentMachines.map(currentMachine => {
                // Find if this machine has an update
                const updatedMachine = data.find(m => m.machine_id === currentMachine.machine_id);
                
                if (updatedMachine && updatedMachine.status !== currentMachine.status) {
                  // Only update if status has changed
                  return {
                    ...currentMachine,
                    status: updatedMachine.status,
                    total_power: updatedMachine.total_power,
                    energy_consumed: updatedMachine.energy_consumed,
                    timestamp: updatedMachine.timestamp
                  };
                }
                
                // Return unchanged machine
                return currentMachine;
              });
              
              set({ machineNames: updatedMachines });
            }
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      // Handle errors
      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        set({ error: 'Connection error', isLoading: false });
        
        // Fallback to mock data only if we don't have any data yet
        if (!get().machineNames || get().machineNames.length === 0) {
          const fallbackMachines = generateMockMachineList();
          set({ machineNames: fallbackMachines });
        }
      };

      return eventSource;
    } catch (error) {
      console.error('Error setting up SSE:', error);
      set({ error: error.message, isLoading: false });
      
      // Fallback to mock data only if we don't have any data yet
      if (!get().machineNames || get().machineNames.length === 0) {
        const fallbackMachines = generateMockMachineList();
        set({ machineNames: fallbackMachines });
      }
      return null;
    }
  },
  
  // Connect to WebSocket for live machine data
  connectWebSocket: (machineId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Close existing connection if any
      const existingSocket = get().websocket;
      if (existingSocket && existingSocket.readyState !== WebSocket.CLOSED) {
        console.log('Closing existing WebSocket connection');
        existingSocket.close();
      }
      
      // Create WebSocket connection
      const wsUrl = `ws://172.19.224.1:8002/api/v1/energymonitoring/ws/live_data`;
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        // Send initial message with machine_id to subscribe to updates
        socket.send(JSON.stringify({ machine_id: parseInt(machineId) }));
        socket._machineId = machineId;
        set({ isLoading: false, websocket: socket });
      };
      
      socket.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          console.log('Received WebSocket data:', response);
          
          // Check if response has the expected structure
          if (response && response.type === 'live_data' && response.data) {
            // Extract the actual machine data from the nested structure
            const data = response.data;
            console.log('Extracted machine data:', data);
            
            // Update store with the extracted data
            set({ machineData: data });
          } else {
            console.warn('Unexpected WebSocket data format:', response);
          }
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        set({ error: 'WebSocket connection error', isLoading: false });
        
        // Fall back to mock data if WebSocket fails
        const mockData = generateMockLiveData(machineId);
        set({ machineData: mockData });
      };
      
      socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        // Only set socket to null if it's the current socket
        if (get().websocket === socket) {
          set({ websocket: null });
        }
      };
      
      return socket;
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
      set({ error: error.message, isLoading: false });
      
      // Fall back to mock data
      const mockData = generateMockLiveData(machineId);
      set({ machineData: mockData });
      return null;
    }
  },
  
  // Disconnect WebSocket
  disconnectWebSocket: () => {
    const socket = get().websocket;
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      console.log('Manually closing WebSocket connection');
      socket.close();
    }
    set({ websocket: null });
  },
  
  // Fetch all machines data - this would need to be updated if there's a new endpoint for all machines
  fetchAllMachinesData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // For now, we'll just generate mock data for all machines
      // In a real implementation, you would fetch data for each machine or use a bulk endpoint
      console.log('Generating mock data for all machines');
      const mockData = generateAllMachinesMockData();
      
      set({ 
        allMachinesData: mockData,
        isLoading: false 
      });
      
      return mockData;
    } catch (error) {
      console.error('Error generating all machines data:', error);
      set({ 
        error: error.message || 'Failed to generate all machines data',
        isLoading: false 
      });
      return {};
    }
  },
  
  // Get specific parameters for a machine
  getMachineParameters: (machineId) => {
    const { machineData } = get();
    
    if (!machineData) {
      return null;
    }
    
    // Access the data either directly or from the nested structure
    const data = machineData.data || machineData;
    
    return {
      phaseAVoltage: data.phase_a_voltage || 0,
      phaseBVoltage: data.phase_b_voltage || 0,
      phaseCVoltage: data.phase_c_voltage || 0,
      avgPhaseVoltage: data.avg_phase_voltage || 0,
      lineABVoltage: data.line_ab_voltage || 0,
      lineBCVoltage: data.line_bc_voltage || 0,
      lineCAVoltage: data.line_ca_voltage || 0,
      avgLineVoltage: data.avg_line_voltage || 0,
      phaseACurrent: data.phase_a_current || 0,
      phaseBCurrent: data.phase_b_current || 0,
      phaseCCurrent: data.phase_c_current || 0,
      avgThreePhaseCurrent: data.avg_three_phase_current || 0,
      powerFactor: data.power_factor || 0,
      frequency: data.frequency || 0,
      totalInstantaneousPower: data.total_instantaneous_power || 0,
      activeEnergyDelivered: data.active_energy_delivered || 0,
      status: data.status || 0,
      timestamp: data.timestamp || new Date().toISOString()
    };
  },
  
  // Clear machine data
  clearMachineData: () => {
    // Disconnect WebSocket when clearing data
    const socket = get().websocket;
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      console.log('Closing WebSocket on clearMachineData');
      socket.close();
    }
    
    set({ machineData: {}, error: null, websocket: null });
  },
  
  // Add this to the store object
  historicalData: {},
  
  // Add this function to the store
  fetchMachineHistoricalData: async (machineId) => {
    set({ isLoading: true, error: null });
    
    try {
      // In a real implementation, you would fetch historical data from the API
      // For now, we'll just generate mock data
      console.log(`Would fetch historical data for machine ${machineId}`);
      
      // Generate mock historical data
      const mockData = generateMockHistoricalData(machineId);
      
      set({ 
        historicalData: mockData,
        isLoading: false 
      });
      
      return mockData;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      set({ 
        error: error.message || 'Failed to fetch historical data',
        isLoading: false 
      });
      return null;
    }
  },
  
  // Fetch filtered history data for a specific machine, parameter and date range
  fetchFilteredHistoryData: async (machineId, startDate, endDate, parameterName) => {
    set({ isLoading: true, error: null });
    
    try {
      const formattedStartDate = typeof startDate.format === 'function' ? 
        startDate.format('YYYY-MM-DD') : startDate;
      const formattedEndDate = typeof endDate.format === 'function' ? 
        endDate.format('YYYY-MM-DD') : endDate;
      
      const apiParamMap = {
        'phaseAVoltage': 'phase_a_voltage',
        'phaseBVoltage': 'phase_b_voltage',
        'phaseCVoltage': 'phase_c_voltage',
        'avgPhaseVoltage': 'avg_phase_voltage',
        'lineABVoltage': 'line_ab_voltage',
        'lineBCVoltage': 'line_bc_voltage',
        'lineCAVoltage': 'line_ca_voltage',
        'avgLineVoltage': 'avg_line_voltage',
        'phaseACurrent': 'phase_a_current',
        'phaseBCurrent': 'phase_b_current',
        'phaseCCurrent': 'phase_c_current',
        'avgThreePhaseCurrent': 'avg_three_phase_current',
        'powerFactor': 'power_factor',
        'frequency': 'frequency',
        'totalInstantaneousPower': 'total_instantaneous_power',
        'activeEnergyDelivered': 'active_energy_delivered'
      };
      
      const apiParamName = apiParamMap[parameterName] || parameterName;
      
      const baseUrl = `http://172.19.224.1:8002/api/v1/energymonitoring/filtered_history_data/${machineId}?start_date=${formattedStartDate}&end_date=${formattedEndDate}&column_name=${apiParamName}`;
      
      console.log(`Fetching filtered history data from ${baseUrl}`);
      
      try {
        const response = await axios.get(baseUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: API_TIMEOUT
        });
        
        console.log('API Response for filtered history data:', response.data);
        
        // Check if response data is empty or invalid
        if (!response.data || 
            (Array.isArray(response.data) && response.data.length === 0) || 
            Object.keys(response.data).length === 0) {
          throw new Error(`No data available for the selected date range: ${formattedStartDate} to ${formattedEndDate}`);
        }
        
        set({ 
          filteredHistoryData: response.data,
          isLoading: false 
        });
        return response.data;
        
      } catch (error) {
        if (error.response && error.response.status === 404) {
          throw new Error(`No data available for the selected date range: ${formattedStartDate} to ${formattedEndDate}`);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error in fetchFilteredHistoryData:', error);
      set({ 
        filteredHistoryData: [],
        isLoading: false, 
        error: error.message 
      });
      throw error; // Propagate the error to be handled by the component
    }
  },
  
  // Add this function back but have it use WebSocket data instead
  fetchMachineLiveData: async (machineId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Check if we already have a WebSocket connection
      const existingSocket = get().websocket;
      
      // If not connected, establish a WebSocket connection
      if (!existingSocket || existingSocket.readyState !== WebSocket.OPEN) {
        console.log('No active WebSocket connection, creating one');
        const socket = get().connectWebSocket(machineId);
        
        // Wait briefly for data to come in
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // If already connected to a different machine, reconnect
        if (existingSocket._machineId !== machineId) {
          console.log('Switching machine ID in WebSocket');
          existingSocket.send(JSON.stringify({ machine_id: parseInt(machineId) }));
          existingSocket._machineId = machineId;
        }
      }
      
      // Return current data from store (might be from WS or might be fallback)
      set({ isLoading: false });
      return get().machineData;
    } catch (error) {
      console.error('Error in fetchMachineLiveData:', error);
      
      // Generate mock data for this specific machine
      console.log(`Using fallback live data for machine ${machineId}`);
      const mockData = generateMockLiveData(machineId);
      set({ 
        machineData: mockData,
        isLoading: false, 
        error: error.message 
      });
      return mockData;
    }
  },
  
  // Connect to the shiftwise energy SSE
  connectShiftwiseEnergyWebSocket: () => {
    console.log('Connecting to SSE...');
    set({ isLoading: true, error: null });
    
    try {
      // Close existing connection if any
      const existingSocket = get().allMachinesWebsocket;
      if (existingSocket) {
        console.log('Closing existing shiftwise energy SSE connection');
        existingSocket.close();
      }

      // Clear existing data
      set({ allMachinesEnergyData: [] });

      // Create EventSource connection
      console.log('Creating new EventSource connection to:', WS_SHIFTWISE_ENERGY_ENDPOINT);
      const eventSource = new EventSource(WS_SHIFTWISE_ENERGY_ENDPOINT);
      
      // Store the EventSource instance
      set({ allMachinesWebsocket: eventSource });

      // Handle connection open
      eventSource.onopen = () => {
        console.log('Shiftwise energy SSE connection established');
        set({ isLoading: false, error: null });
      };

      // Handle incoming messages
      eventSource.onmessage = (event) => {
        try {
          console.log('Raw SSE data received:', event.data);
          // Parse the SSE data format which includes "data: " prefix
          const jsonStr = event.data.replace('data: ', '');
          const data = JSON.parse(jsonStr);
          console.log('Parsed shiftwise energy data:', data);
          
          if (Array.isArray(data)) {
            // Process the data to ensure all numeric values are properly parsed
            const processedData = data.map(machine => ({
              machine_id: machine.machine_id,
              machine_name: machine.machine_name,
              timestamp: machine.timestamp,
              first_shift: parseFloat(machine.first_shift),
              second_shift: parseFloat(machine.second_shift),
              third_shift: parseFloat(machine.third_shift),
              total_energy: parseFloat(machine.total_energy)
            }));
            console.log('Setting processed data:', processedData);
            set({ allMachinesEnergyData: processedData });
          }
        } catch (error) {
          console.error('Error parsing shiftwise energy data:', error);
        }
      };

      // Handle errors
      eventSource.onerror = (error) => {
        console.error('Shiftwise energy SSE Error:', error);
        set({ error: 'Connection error', isLoading: false });
      };

      return eventSource;
    } catch (error) {
      console.error('Error setting up shiftwise energy SSE:', error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
  
  // Disconnect SSE
  disconnectShiftwiseEnergyWebSocket: () => {
    const eventSource = get().allMachinesWebsocket;
    if (eventSource) {
      console.log('Closing shiftwise energy SSE connection');
      eventSource.close();
      set({ allMachinesWebsocket: null });
    }
  },
  
  // Get energy data for a specific machine
  getMachineEnergyData: (machineId) => {
    const { allMachinesEnergyData } = get();
    
    if (!allMachinesEnergyData || !Array.isArray(allMachinesEnergyData)) {
      return null;
    }
    
    return allMachinesEnergyData.find(machine => machine.machine_id === parseInt(machineId));
  },
  
  // Update the fetchShiftwiseEnergyHistoryByDate function
  fetchShiftwiseEnergyHistoryByDate: async (date) => {
    set({ isLoading: true, error: null });
    
    try {
      // Handle different date formats
      let momentDate;
      if (date && date._isAMomentObject) {
        momentDate = date;
      } else if (date && typeof date === 'string') {
        momentDate = moment(date);
      } else if (date && date.$d) {
        // Handle Ant Design DatePicker date object
        momentDate = moment(date.$d);
      } else {
        console.error('Invalid date format received:', date);
        throw new Error('Invalid date format');
      }

      // Ensure we have a valid moment date
      if (!momentDate.isValid()) {
        console.error('Invalid moment date:', momentDate);
        throw new Error('Invalid date');
      }

      // Set time to 8:30 AM in local time
      momentDate = momentDate.hours(8).minutes(30).seconds(0).milliseconds(0);

      // Convert to epoch timestamp
      const epochTimestamp = momentDate.unix();
      console.log(
        `Selected date and time: ${momentDate.format('YYYY-MM-DD HH:mm:ss')} (epoch: ${epochTimestamp})`
      );

      // Use the specific endpoint with the epoch time
      const response = await axios.get(`http://172.19.224.1:8002/api/v1/energy-monitoring/combined-history/${epochTimestamp}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('Historical energy data API response:', response.data);
      
      if (response.data && response.data.machines) {
        // Process the machines data
        const processedData = response.data.machines.map(machine => ({
          id: machine.machine_id,
          machine_name: machine.machine_name,
          energy: parseFloat(machine.total_energy || 0),
          max_energy: Math.max(40, parseFloat(machine.total_energy || 0) * 1.2), // Dynamic max based on highest value
          first_shift: parseFloat(machine.first_shift || 0),
          second_shift: parseFloat(machine.second_shift || 0),
          third_shift: parseFloat(machine.third_shift || 0),
          timestamp: response.data.timestamp,
          cost: parseFloat((machine.total_energy * 12.5).toFixed(2)) // Calculate cost based on energy
        }));
        
        // Store the data in the store
        set({ 
          allMachinesEnergyData: processedData,
          isLoading: false 
        });
        
        return processedData;
      } else {
        throw new Error('Invalid data format from API');
      }
      
    } catch (error) {
      console.error('Error fetching historical energy data:', error);
      
      // Generate mock historical data as fallback
      const mockData = generateMockHistoricalEnergyData(date);
      set({ 
        allMachinesEnergyData: mockData,
        isLoading: false, 
        error: error.message 
      });
      return mockData;
    }
  },
  
  // Update startMachineStatusPolling to use SSE
  startMachineStatusPolling: () => {
    const eventSource = get().fetchMachineNames();
    
    // Return cleanup function
    return () => {
      const currentEventSource = get().eventSource;
      if (currentEventSource) {
        currentEventSource.close();
        set({ eventSource: null });
      }
    };
  },

  // Add cleanup function
  cleanup: () => {
    const currentEventSource = get().eventSource;
    if (currentEventSource) {
      currentEventSource.close();
      set({ eventSource: null });
    }
  },

  machineParameters: null,
  parametersEventSource: null,
  parameterHistoryData: [], // Add this new state

  // Connect to parameters stream
  connectToParametersStream: (machineId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Close existing EventSource if any
      const existingEventSource = get().parametersEventSource;
      if (existingEventSource) {
        existingEventSource.close();
      }

      // Create new EventSource for parameters using the original endpoint
      const eventSource = new EventSource(`http://172.19.224.1:8002/api/v1/energy-monitoring/machine/${machineId}/parameters-stream`);
      
      // Store the EventSource instance
      set({ parametersEventSource: eventSource });

      // Handle connection open
      eventSource.onopen = () => {
        console.log('Parameters SSE connection established');
        set({ isLoading: false });
      };

      // Handle incoming messages
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received parameters data:', data);
          
          // Update only the changed parameters
          set(state => {
            const currentParams = state.machineParameters || {};
            return {
              machineParameters: {
                ...currentParams,
                ...data
              }
            };
          });
        } catch (error) {
          console.error('Error parsing parameters data:', error);
        }
      };

      // Handle errors
      eventSource.onerror = (error) => {
        console.error('Parameters SSE Error:', error);
        set({ error: 'Parameters connection error', isLoading: false });
      };

      return eventSource;
    } catch (error) {
      console.error('Error setting up parameters SSE:', error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  // Add new function to connect to parameter history stream
  connectToParameterHistoryStream: (machineId, parameter) => {
    set({ isLoading: true, error: null });
    
    try {
      // Create new EventSource for parameter history
      const eventSource = new EventSource(`http://172.19.224.1:8002/api/v1/energy-monitoring/machine/${machineId}/parameter/${parameter}/history-stream`);
      
      // Handle connection open
      eventSource.onopen = () => {
        console.log('Parameter history SSE connection established');
        set({ isLoading: false });
      };

      // Handle incoming messages
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received parameter history data:', data);
          
          if (data && data.data_points) {
            // Convert timestamps to local time format and update state
            const formattedData = data.data_points.map(point => ({
              timestamp: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              value: point.value
            }));

            set({ parameterHistoryData: formattedData });
          }
        } catch (error) {
          console.error('Error parsing parameter history data:', error);
        }
      };

      // Handle errors
      eventSource.onerror = (error) => {
        console.error('Parameter history SSE Error:', error);
        set({ error: 'Parameter history connection error', isLoading: false });
      };

      return eventSource;
    } catch (error) {
      console.error('Error setting up parameter history SSE:', error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  // Cleanup function for parameters stream
  cleanupParametersStream: () => {
    const eventSource = get().parametersEventSource;
    if (eventSource) {
      eventSource.close();
      set({ parametersEventSource: null, machineParameters: null, parameterHistoryData: [] });
    }
  },

  // Add a new state for tracking initial load
  isInitialLoad: true,
  machinesInitialized: false,

  // Add new function to fetch historical parameter data
  fetchParameterHistory: async (machineId, parameter, startTime, endTime) => {
    set({ isLoading: true, error: null });
    
    try {
      // Convert dates to Unix timestamps
      const startTimestamp = Math.floor(startTime.valueOf() / 1000);
      const endTimestamp = Math.floor(endTime.valueOf() / 1000);
      
      const url = `http://172.19.224.1:8002/api/v1/energy-monitoring/machine/${machineId}/parameter/${parameter}/history?start_time=${startTimestamp}&end_time=${endTimestamp}`;
      
      console.log('Fetching historical data from:', url);
      
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: API_TIMEOUT
      });
      
      if (response.data && response.data.data_points && response.data.data_points.length > 0) {
        // Convert timestamps to local time format
        const formattedData = response.data.data_points.map(point => ({
          timestamp: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: point.value
        }));
        
        set({ parameterHistoryData: formattedData });
        return formattedData;
      } else {
        // No data available for the selected time range
        set({ parameterHistoryData: [] });
        throw new Error('No data available for the selected time range');
      }
    } catch (error) {
      console.error('Error fetching parameter history:', error);
      set({ 
        error: error.message || 'No data available for the selected time range', 
        isLoading: false,
        parameterHistoryData: [] 
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Helper function to calculate runtime based on timestamp
function calculateRuntime(timestamp) {
  if (!timestamp) return 8; // Default value
  
  // In a real implementation, you would calculate the runtime based on the timestamp
  // For now, we'll just return a random value between 4 and 12 hours
  return Math.floor(Math.random() * 8) + 4;
}

// Helper function to calculate efficiency
function calculateEfficiency(machineData) {
  if (!machineData) return 85; // Default value
  
  // In a real implementation, you would calculate efficiency based on various parameters
  // For now, we'll use power factor as a base and add some randomness
  const baseFactor = machineData.power_factor || 0.85;
  return Math.floor(baseFactor * 100 * (Math.random() * 0.2 + 0.9));
}

// Helper function to calculate utilization
function calculateUtilization(machineData) {
  if (!machineData) return 75; // Default value
  
  // In a real implementation, you would calculate utilization based on various parameters
  // For now, we'll use a formula based on power and temperature
  const power = machineData.total_instantaneous_power || 5000;
  const temp = machineData.temperature || 50;
  
  // Higher power and moderate temperature indicate higher utilization
  const powerFactor = Math.min(power / 10000, 1); // Normalize power to 0-1 range
  const tempFactor = 1 - Math.abs((temp - 60) / 40); // Optimal temp around 60°C
  
  return Math.floor((powerFactor * 0.7 + tempFactor * 0.3) * 100);
}

// Helper function to generate mock data for a specific machine
function generateMockData(machineId) {
  // Create realistic mock data based on the API response format
  return {
    id: Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    machine_id: parseInt(machineId),
    phase_a_voltage: (Math.random() * 10 + 210).toFixed(2),
    phase_b_voltage: (Math.random() * 10 + 215).toFixed(2),
    phase_c_voltage: (Math.random() * 10 + 212).toFixed(2),
    avg_phase_voltage: (Math.random() * 10 + 215).toFixed(2),
    line_ab_voltage: (Math.random() * 20 + 380).toFixed(2),
    line_bc_voltage: (Math.random() * 20 + 380).toFixed(2),
    line_ca_voltage: (Math.random() * 20 + 380).toFixed(2),
    avg_line_voltage: (Math.random() * 20 + 385).toFixed(2),
    frequency: (Math.random() * 0.2 + 49.9).toFixed(2),
    total_instantaneous_power: (Math.random() * 4000 + 6000).toFixed(2),
    phase_a_current: (Math.random() * 5 + 8).toFixed(2),
    phase_b_current: (Math.random() * 10 + 12).toFixed(2),
    phase_c_current: (Math.random() * 8 + 10).toFixed(2),
    avg_three_phase_current: (Math.random() * 5 + 12).toFixed(2),
    power_factor: (Math.random() * 0.1 + 0.9).toFixed(2),
    active_energy_delivered: (Math.random() * 100 + 200).toFixed(2),
    status: getRandomStatus(),
    temperature: (Math.random() * 20 + 50).toFixed(2)
  };
}

// Helper function to generate mock data for all machines
function generateAllMachinesMockData() {
  const machineIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  
  return machineIds.reduce((acc, id) => {
    acc[id] = generateMockData(id);
    return acc;
  }, {});
}

// Helper function to get random status
function getRandomStatus() {
  const statuses = ['running', 'idle', 'maintenance', 'error', 'warning'];
  const weights = [0.5, 0.2, 0.1, 0.1, 0.1]; // Weighted probabilities
  
  const random = Math.random();
  let sum = 0;
  
  for (let i = 0; i < statuses.length; i++) {
    sum += weights[i];
    if (random < sum) {
      return statuses[i];
    }
  }
  
  return statuses[0];
}

// Update the fetchWithRetry function to be more aggressive
async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, options);
      if (response.data && Object.keys(response.data).length > 0) {
        return response;
      }
      console.log('Empty data received, retrying...');
      throw new Error('Empty data received');
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`Request failed, retrying... (${retries - attempt} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
    }
  }
}

// Add this helper function at the bottom of the file
function generateMockHistoricalData(machineId) {
  const timePoints = [];
  const now = new Date();
  
  // Generate 24 time points for the last 24 hours
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now);
    time.setHours(now.getHours() - i);
    timePoints.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }
  
  // Generate data for each parameter
  const parameters = [
    'phase_a_voltage', 'phase_b_voltage', 'phase_c_voltage', 'avg_phase_voltage',
    'line_ab_voltage', 'line_bc_voltage', 'line_ca_voltage', 'avg_line_voltage',
    'frequency', 'total_instantaneous_power', 'phase_a_current', 'phase_b_current',
    'phase_c_current', 'avg_three_phase_current', 'power_factor', 'active_energy_delivered'
  ];
  
  const result = {};
  
  // For each parameter, generate data points
  parameters.forEach(param => {
    // Get a base value for this parameter
    let baseValue;
    switch (param) {
      case 'phase_a_voltage':
      case 'phase_b_voltage':
      case 'phase_c_voltage':
        baseValue = 220;
        break;
      case 'avg_phase_voltage':
        baseValue = 220;
        break;
      case 'line_ab_voltage':
      case 'line_bc_voltage':
      case 'line_ca_voltage':
        baseValue = 380;
        break;
      case 'avg_line_voltage':
        baseValue = 380;
        break;
      case 'frequency':
        baseValue = 50;
        break;
      case 'total_instantaneous_power':
        baseValue = 7500;
        break;
      case 'phase_a_current':
      case 'phase_b_current':
      case 'phase_c_current':
        baseValue = 12;
        break;
      case 'avg_three_phase_current':
        baseValue = 12;
        break;
      case 'power_factor':
        baseValue = 0.95;
        break;
      case 'active_energy_delivered':
        baseValue = 400;
        break;
      default:
        baseValue = 100;
    }
    
    // Generate values with some random variation
    const values = timePoints.map(() => {
      const variation = (Math.random() * 0.2 - 0.1) * baseValue; // ±10% variation
      return Math.max(0, baseValue + variation).toFixed(2);
    });
    
    result[param] = values;
  });
  
  return {
    timePoints,
    parameters: result
  };
}

// Helper function to generate a list of mock machines to use as fallback
function generateMockMachineList() {
  return [
    { 
      machine_id: 1, 
      machine_data: { 
        id: 1, 
        work_center: 15, 
        type: "Default", 
        make: "m1", 
        model: "Default"
      },
      status: 0  // OFF (grey)
    },
    { 
      machine_id: 2, 
      machine_data: { 
        id: 2, 
        work_center: 16, 
        type: "Default", 
        make: "m2", 
        model: "Default" 
      },
      status: 1  // ON (yellow)
    },
    { 
      machine_id: 3, 
      machine_data: { 
        id: 3, 
        work_center: 17, 
        type: "Default", 
        make: "m3", 
        model: "Default" 
      },
      status: 2
    },
    { 
      machine_id: 4, 
      machine_data: { 
        id: 4, 
        work_center: 18, 
        type: "Default", 
        make: "m4", 
        model: "Default" 
      },
      status: 0
    },
    { 
      machine_id: 5, 
      machine_data: { 
        id: 5, 
        work_center: 19, 
        type: "Default", 
        make: "m5", 
        model: "Default"
      },
      status: 1
    },
    { 
      machine_id: 6, 
      machine_data: { 
        id: 6, 
        work_center: 20, 
        type: "Default", 
        make: "m6", 
        model: "Default" 
      },
      status: 2
    },
    { 
      machine_id: 7, 
      machine_data: { 
        id: 7, 
        work_center: 21, 
        type: "Default", 
        make: "m7", 
        model: "Default" 
      },
      status: 0
    },
    { 
      machine_id: 8, 
      machine_data: { 
        id: 8, 
        work_center: 22, 
        type: "Default", 
        make: "m8", 
        model: "Default" 
      },
      status: 1
    },
    { 
      machine_id: 9, 
      machine_data: { 
        id: 9, 
        work_center: 23, 
        type: "Default", 
        make: "m9", 
        model: "Default" 
      },
      status: 2
    },
    { 
      machine_id: 10, 
      machine_data: { 
        id: 10, 
        work_center: 24, 
        type: "Default", 
        make: "m10", 
        model: "Default" 
      },
      status: 0
    },
    { 
      machine_id: 11, 
      machine_data: { 
        id: 11, 
        work_center: 25, 
        type: "Default", 
        make: "m11", 
        model: "Default" 
      },
      status: 1
    },
    { 
      machine_id: 12, 
      machine_data: { 
        id: 12, 
        work_center: 26, 
        type: "Default", 
        make: "m12", 
        model: "Default" 
      },
      status: 2
    },
    { 
      machine_id: 13, 
      machine_data: { 
        id: 13, 
        work_center: 27, 
        type: "Default", 
        make: "m13", 
        model: "Default" 
      },
      status: 0
    },
    { 
      machine_id: 14, 
      machine_data: { 
        id: 14, 
        work_center: 28, 
        type: "Default", 
        make: "m14", 
        model: "Default" 
      },
      status: 1
    }
  ];
}

// Add this function to your store file
function generateMockLiveData(machineId) {
  return {
    machine_id: parseInt(machineId),
    timestamp: new Date().toISOString(),
    phase_a_voltage: (Math.random() * 10 + 220).toFixed(2),
    phase_b_voltage: (Math.random() * 10 + 220).toFixed(2),
    phase_c_voltage: (Math.random() * 10 + 220).toFixed(2),
    avg_phase_voltage: (Math.random() * 10 + 220).toFixed(2),
    line_ab_voltage: (Math.random() * 20 + 380).toFixed(2),
    line_bc_voltage: (Math.random() * 20 + 380).toFixed(2),
    line_ca_voltage: (Math.random() * 20 + 380).toFixed(2),
    avg_line_voltage: (Math.random() * 20 + 380).toFixed(2),
    phase_a_current: (Math.random() * 5 + 8).toFixed(2),
    phase_b_current: (Math.random() * 5 + 8).toFixed(2),
    phase_c_current: (Math.random() * 5 + 8).toFixed(2),
    avg_three_phase_current: (Math.random() * 5 + 8).toFixed(2),
    power_factor: (Math.random() * 0.2 + 0.8).toFixed(2),
    frequency: (Math.random() * 0.1 + 50).toFixed(2),
    total_instantaneous_power: (Math.random() * 10 + 5).toFixed(2),
    active_energy_delivered: (Math.random() * 100 + 200).toFixed(2),
    status: machineId % 3 // For mock data, cycle between 0, 1, 2
  };
}

export default useEnergyMonitoringBelStore; 

// Helper function to generate mock filtered history data
function generateMockFilteredHistoryData(machineId, parameterName) {
  console.log('Generating mock filtered history data for:', { machineId, parameterName });
  
  // Create a 24-hour time series with readings every 30 minutes
  const dataPoints = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 1); // 24 hours back
  
  // Map the parameter name from frontend format to API format
  const apiParamMap = {
    'phaseAVoltage': 'phase_a_voltage',
    'phaseBVoltage': 'phase_b_voltage',
    'phaseCVoltage': 'phase_c_voltage',
    'avgPhaseVoltage': 'avg_phase_voltage',
    'lineABVoltage': 'line_ab_voltage',
    'lineBCVoltage': 'line_bc_voltage',
    'lineCAVoltage': 'line_ca_voltage',
    'avgLineVoltage': 'avg_line_voltage',
    'phaseACurrent': 'phase_a_current',
    'phaseBCurrent': 'phase_b_current',
    'phaseCCurrent': 'phase_c_current',
    'avgThreePhaseCurrent': 'avg_three_phase_current',
    'powerFactor': 'power_factor',
    'frequency': 'frequency',
    'totalInstantaneousPower': 'total_instantaneous_power',
    'activeEnergyDelivered': 'active_energy_delivered'
  };
  
  // Get base value ranges for different parameter types
  let baseValue, minVariation, maxVariation;
  
  switch(apiParamMap[parameterName] || parameterName) {
    case 'phase_a_voltage':
    case 'phase_b_voltage':
    case 'phase_c_voltage':
    case 'avg_phase_voltage':
      baseValue = 220;
      minVariation = -10;
      maxVariation = 10;
      break;
    case 'line_ab_voltage':
    case 'line_bc_voltage':
    case 'line_ca_voltage':
    case 'avg_line_voltage':
      baseValue = 380;
      minVariation = -15;
      maxVariation = 15;
      break;
    case 'phase_a_current':
    case 'phase_b_current':
    case 'phase_c_current':
    case 'avg_three_phase_current':
      baseValue = 10;
      minVariation = -3;
      maxVariation = 5;
      break;
    case 'power_factor':
      baseValue = 0.92;
      minVariation = -0.1;
      maxVariation = 0.08;
      break;
    case 'frequency':
      baseValue = 50;
      minVariation = -0.2;
      maxVariation = 0.2;
      break;
    case 'total_instantaneous_power':
      baseValue = 8;
      minVariation = -3;
      maxVariation = 4;
      break;
    case 'active_energy_delivered':
      baseValue = 350;
      minVariation = -50;
      maxVariation = 100;
      break;
    default:
      console.log('Using default values for unknown parameter:', parameterName);
      baseValue = 100;
      minVariation = -20;
      maxVariation = 20;
  }
  
  // Generate data points every 30 minutes for 24 hours
  for (let i = 0; i < 48; i++) {
    const timestamp = new Date(startDate);
    timestamp.setMinutes(timestamp.getMinutes() + (i * 30));
    
    // Add some randomness with trends
    const hourOfDay = timestamp.getHours();
    let trendFactor = 0;
    
    // Add a daily pattern - higher during work hours, lower at night
    if (hourOfDay >= 9 && hourOfDay < 18) {
      trendFactor = 0.7; // Higher during work hours
    } else if (hourOfDay >= 18 && hourOfDay < 22) {
      trendFactor = 0.3; // Moderate in evening
    } else {
      trendFactor = -0.3; // Lower at night
    }
    
    // Calculate the value with randomness and trend
    const randomVariation = minVariation + Math.random() * (maxVariation - minVariation);
    const trendVariation = trendFactor * Math.abs(maxVariation - minVariation) * 0.5;
    const value = baseValue + randomVariation + trendVariation;
    
    // Ensure the value makes sense (not negative for most parameters)
    const finalValue = parameterName === 'powerFactor' ? 
      Math.max(0, Math.min(1, value)) : 
      Math.max(0, value);
    
    dataPoints.push({
      timestamp: timestamp.toISOString(),
      value: Number(finalValue.toFixed(2))
    });
  }
  
  // Ensure we have at least some data
  if (dataPoints.length === 0) {
    console.warn('No data points generated, adding fallback points');
    for (let i = 0; i < 5; i++) {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - i);
      dataPoints.push({
        timestamp: timestamp.toISOString(),
        value: baseValue + (Math.random() * 10 - 5)
      });
    }
  }
  
  const result = {
    machine_id: parseInt(machineId),
    parameter: apiParamMap[parameterName] || parameterName,
    data: dataPoints
  };
  
  console.log('Generated mock data with', dataPoints.length, 'points');
  console.log('First data point:', dataPoints[0]);
  console.log('Last data point:', dataPoints[dataPoints.length - 1]);
  
  return result;
}

// Add this helper function at the bottom of the file
function generateMockShiftwiseEnergyData() {
  return Array.from({ length: 7 }, (_, index) => ({
    machine_id: index + 1,
    total_energy: (Math.random() * 1).toFixed(3),
    first_shift: (Math.random() * 1).toFixed(3),
    second_shift: 0,
    third_shift: 0,
    timestamp: new Date().toISOString()
  }));
}

// Update helper function for mock historical data if not already present
function generateMockHistoricalEnergyData(date) {
  const formattedDate = typeof date.format === 'function' ? 
    date.format('YYYY-MM-DD') : date;
  
  console.log(`Generating mock historical data for date: ${formattedDate}`);
  
  return Array.from({ length: 7 }, (_, index) => ({
    machine_id: index + 1,
    total_energy: parseFloat((Math.random() * 1.5).toFixed(3)),
    first_shift: parseFloat((Math.random() * 0.9).toFixed(3)),
    second_shift: parseFloat((Math.random() * 0.4).toFixed(3)),
    third_shift: parseFloat((Math.random() * 0.2).toFixed(3)),
    timestamp: formattedDate + 'T00:00:00.000Z'
  }));
} 