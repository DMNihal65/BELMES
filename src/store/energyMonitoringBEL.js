import { create } from 'zustand';
import axios from 'axios';

// Use a relative URL that will be handled by the proxy
const API_BASE_URL = '/api/bel';
const API_TIMEOUT = 5000;
const MAX_RETRIES = 1;

const useEnergyMonitoringBelStore = create((set, get) => ({
  // Machine data
  machineData: {},
  machineNames: [], // Store the machine names from the API
  isLoading: false,
  error: null,
  filteredHistoryData: null, // Add state for filtered history data
  
  // Fetch machine names from the API
  fetchMachineNames: async () => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Attempting to fetch machines from http://172.18.100.214:8006/ems/machines');
      
      const response = await fetchWithRetry('http://172.18.100.214:8006/ems/machines', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: API_TIMEOUT
      });
      
      console.log('API Response for machines:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Store the raw API response without transformation
        set({ machineNames: response.data, isLoading: false });
        return response.data;
      } else {
        // Fallback to mock data if API doesn't return expected format
        console.warn('API did not return expected array format for machines, using fallback data');
        const fallbackMachines = generateMockMachineList();
        set({ machineNames: fallbackMachines, isLoading: false });
        return fallbackMachines;
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
      
      // Fallback to mock data
      console.log('Using fallback machine data due to API error');
      const fallbackMachines = generateMockMachineList();
      set({ machineNames: fallbackMachines, isLoading: false, error: error.message });
      return fallbackMachines;
    }
  },
  
  // Fetch live data for a specific machine
  fetchMachineLiveData: async (machineId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Create URL with proxy if needed
      const isDevEnvironment = process.env.NODE_ENV === 'development';
      const baseUrl = isDevEnvironment 
        ? `/proxy/ems/live/${machineId}` // Use a proxy for development
        : `http://172.18.100.214:8006/ems/live/${machineId}`; // Direct access in production
      
      console.log(`Attempting to fetch data from ${baseUrl}`);
      
      const response = await fetchWithRetry(baseUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: API_TIMEOUT
      });
      
      console.log('API Response for live data:', response.data);
      
      if (response.data) {
        // Store the raw API response
        set({ 
          machineData: response.data,
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error('Empty data received');
      }
    } catch (error) {
      console.error('Error fetching machine live data:', error);
      
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
    
    return {
      phaseAVoltage: machineData.phase_a_voltage || 0,
      phaseBVoltage: machineData.phase_b_voltage || 0,
      phaseCVoltage: machineData.phase_c_voltage || 0,
      avgPhaseVoltage: machineData.avg_phase_voltage || 0,
      lineABVoltage: machineData.line_ab_voltage || 0,
      lineBCVoltage: machineData.line_bc_voltage || 0,
      lineCAVoltage: machineData.line_ca_voltage || 0,
      avgLineVoltage: machineData.avg_line_voltage || 0,
      phaseACurrent: machineData.phase_a_current || 0,
      phaseBCurrent: machineData.phase_b_current || 0,
      phaseCCurrent: machineData.phase_c_current || 0,
      avgThreePhaseCurrent: machineData.avg_three_phase_current || 0,
      powerFactor: machineData.power_factor || 0,
      frequency: machineData.frequency || 0,
      totalInstantaneousPower: machineData.total_instantaneous_power || 0,
      activeEnergyDelivered: machineData.active_energy_delivered || 0,
      status: machineData.status || 0,
      timestamp: machineData.timestamp || new Date().toISOString()
    };
  },
  
  // Clear machine data
  clearMachineData: () => {
    set({ machineData: {}, error: null });
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
      // Format dates for API
      const formattedStartDate = startDate.format('YYYY-MM-DD');
      const formattedEndDate = endDate.format('YYYY-MM-DD');
      
      // Map frontend parameter name to API parameter name
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
      
      // Create URL with proxy if needed
      const isDevEnvironment = process.env.NODE_ENV === 'development';
      const baseUrl = isDevEnvironment 
        ? `/proxy/ems/filtered_history_data/${machineId}?start_date=${formattedStartDate}&end_date=${formattedEndDate}&column_name=${apiParamName}` 
        : `http://172.18.100.214:8006/ems/filtered_history_data/${machineId}?start_date=${formattedStartDate}&end_date=${formattedEndDate}&column_name=${apiParamName}`;
      
      console.log(`Attempting to fetch filtered history data from ${baseUrl}`);
      
      try {
        const response = await fetchWithRetry(baseUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: API_TIMEOUT
        });
        
        console.log('API Response for filtered history data:', response.data);
        
        if (response.data && (response.data.data || response.data.length > 0)) {
          // Store the raw API response
          set({ 
            filteredHistoryData: response.data,
            isLoading: false 
          });
          return response.data;
        } else {
          console.log('Empty data received from API, falling back to mock data');
          throw new Error('Empty data received');
        }
      } catch (error) {
        console.error('API call failed, falling back to mock data:', error);
        throw error; // Propagate to the outer catch block
      }
    } catch (error) {
      console.error('Error in fetchFilteredHistoryData:', error);
      
      // Generate mock data for this specific machine
      console.log(`Using fallback filtered history data for machine ${machineId} and parameter ${parameterName}`);
      const mockData = generateMockFilteredHistoryData(machineId, parameterName);
      set({ 
        filteredHistoryData: mockData,
        isLoading: false, 
        error: error.message 
      });
      return mockData;
    }
  }
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
      status: 0
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
      status: 1
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