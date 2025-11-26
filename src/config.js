// API Configuration
const API_CONFIG = {
  // Base URL for all API requests - uses proxy in development
  baseUrl: '/api',
  
  // API Endpoints
  endpoints: {
    machines: '/v5/machines/',
    machineStates: '/v5/all_machine_states',
    liveData: (machineId) => `/v5/live_recent/${machineId}`,
    machineHistory: (machineId) => `/v5/get_machine_history/${machineId}`,
    productionData: '/v5/get_production_data',
    energySummary: '/v5/energy_summary/',
  },
  
  // Enable fake data for development/testing without a backend
  useFakeData: true
};

export default API_CONFIG; 