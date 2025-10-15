import { create } from 'zustand';

const WEBSOCKET_URL = 'ws://172.19.224.1:8002/production_monitoring/ws/live-status/';
const OEE_API_URL = 'http://172.19.224.1:8002/production_monitoring/machine-oee-analysis';

const useDashboardStore = create((set, get) => ({
  machineData: [],
  websocket: null,
  isConnected: false,
  error: null,
  oeeData: null,

  // Fetch OEE data for a specific machine
  fetchOEEData: async (machineId) => {
    try {
      const today = new Date();
      const currentShift = getCurrentShift(today);
      const formattedDate = today.toISOString().split('T')[0];

      const response = await fetch(
        `${OEE_API_URL}/${machineId}?date=${formattedDate}&shift=${currentShift}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch OEE data');
      }

      const data = await response.json();
      set({ oeeData: data, error: null });
      return data;
    } catch (err) {
      console.error('Error fetching OEE data:', err);
      set({ error: 'Error fetching OEE data' });
      return null;
    }
  },

  // Initialize WebSocket connection
  initializeWebSocket: () => {
    try {
      const ws = new WebSocket(WEBSOCKET_URL);

      ws.onopen = () => {
        console.log('WebSocket Connected');
        set({ isConnected: true, error: null });
      };

      ws.onmessage = (event) => {
        try {
          console.log('Raw WebSocket data received:', event.data);
          
          const data = JSON.parse(event.data);
          console.log('Parsed WebSocket data:', data);
          
          // Check if last_updated fields exist
          if (Array.isArray(data)) {
            data.forEach((machine, index) => {
              if (machine.last_updated) {
                console.log(`Machine ${index} (${machine.machine_name}) has last_updated:`, machine.last_updated);
              } else {
                console.warn(`Machine ${index} (${machine.machine_name}) is missing last_updated field!`);
              }
            });
          }
          
          set({ machineData: data, error: null });
        } catch (err) {
          console.error('Error parsing WebSocket data:', err);
          set({ error: 'Error parsing WebSocket data' });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        set({ error: 'WebSocket connection error' });
      };

      ws.onclose = () => {
        console.log('WebSocket Disconnected');
        set({ isConnected: false });
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          useDashboardStore.getState().initializeWebSocket();
        }, 5000);
      };

      set({ websocket: ws });
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      set({ error: 'Error initializing WebSocket connection' });
    }
  },

  // Clean up WebSocket connection
  cleanup: () => {
    const { websocket } = useDashboardStore.getState();
    if (websocket) {
      websocket.close();
      set({ websocket: null, isConnected: false });
    }
  },

  // Map WebSocket data to machine format
  getMappedMachineData: () => {
    const { machineData } = useDashboardStore.getState();
    
    // If machineData is empty or not an array, return empty array
    if (!machineData || !Array.isArray(machineData) || machineData.length === 0) {
      console.warn('getMappedMachineData: machineData is empty or invalid');
      return [];
    }
    
    console.log('Raw machineData before mapping:', machineData);
    
    // Map the incoming WebSocket data to match our machine data format
    return machineData.map(wsData => {
      // Log the last_updated field from the WebSocket data
      console.log(`Mapping machine ${wsData.machine_id} (${wsData.machine_name})`);
      console.log('-> last_updated from WebSocket:', wsData.last_updated);
      
      // Make sure last_updated is properly passed regardless of its format
      let lastUpdated = wsData.last_updated;
      
      // Try to ensure it's a string if it's another format (like a Date object)
      if (lastUpdated && typeof lastUpdated !== 'string') {
        try {
          lastUpdated = lastUpdated.toString();
          console.log('-> Converted last_updated to string:', lastUpdated);
        } catch (e) {
          console.error('-> Failed to convert last_updated to string:', e);
        }
      }
      
      // Create the mapped object
      const mappedMachine = {
        id: wsData.machine_id?.toString() || 'unknown',
        name: wsData.machine_name || 'Unnamed Machine',
        status: mapMachineStatus(wsData.status),
        currentProgram: wsData.program_number || wsData.active_program || 'N/A',
        partNumber: wsData.part_number || 'N/A',
        totalCount: wsData.part_count || 0,
        targetCount: wsData.required_quantity || 0,
        operator: 'N/A', // WebSocket data doesn't provide operator info
        startTime: formatLastUpdated(wsData.last_updated),
        estimatedCompletion: 'N/A',
        cycleTime: 'N/A',
        downtime: '0%',
        oee: calculateOEE(wsData),
        productionOrder: wsData.production_order || 'N/A',
        operationDescription: wsData.operation_description || 'N/A',
        operationNumber: wsData.operation_number || 'N/A',
        launchedQuantity: wsData.launched_quantity || 0,
        partDescription: wsData.part_description || 'N/A',
        jobStatus: wsData.job_status || 'N/A',
        lastUpdated: lastUpdated, // Use our processed variable
        
        // Include all original data for debugging
        rawData: wsData
      };
      
      console.log(`-> Mapped machine object for ${wsData.machine_name}:`, mappedMachine);
      console.log(`-> lastUpdated value in mapped object:`, mappedMachine.lastUpdated);
      
      return mappedMachine;
    });
  }
}));

// Helper functions
const mapMachineStatus = (status) => {
  switch (status?.toUpperCase()) {
    case 'ON':
      return 'ON';
    case 'PRODUCTION':
      return 'PRODUCTION';
    case 'OFF':
    case 'STOPPED':
      return 'OFF';
    default:
      return 'OFF';
  }
};

const formatLastUpdated = (timestamp) => {
  console.log('formatLastUpdated called with:', timestamp);
  
  if (!timestamp) {
    console.warn('formatLastUpdated: timestamp is empty or null');
    return 'N/A';
  }
  
  try {
    const date = new Date(timestamp);
    console.log('formatLastUpdated parsed date:', date);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('formatLastUpdated: Invalid date detected:', timestamp);
      return 'Invalid';
    }
    
    const formattedTime = date.toLocaleTimeString();
    console.log('formatLastUpdated result:', formattedTime);
    return formattedTime;
  } catch (error) {
    console.error('formatLastUpdated error:', error);
    return 'Error';
  }
};

const calculateOEE = (machineData) => {
  // Simplified OEE calculation - you can implement your own logic
  if (machineData.status?.toUpperCase() === 'PRODUCTION') {
    return Math.floor(Math.random() * (95 - 85 + 1) + 85); // Random value between 85-95 for running machines
  } else if (machineData.status?.toUpperCase() === 'ON') {
    return Math.floor(Math.random() * (85 - 75 + 1) + 75); // Random value between 75-85 for ON machines
  }
  return Math.floor(Math.random() * (75 - 60 + 1) + 60); // Random value between 60-75 for OFF machines
};

const getCurrentShift = (date) => {
  const hours = date.getHours();
  if (hours >= 6 && hours < 14) return 1; // First shift: 6 AM - 2 PM
  if (hours >= 14 && hours < 22) return 2; // Second shift: 2 PM - 10 PM
  return 3; // Third shift: 10 PM - 6 AM
};

export default useDashboardStore;