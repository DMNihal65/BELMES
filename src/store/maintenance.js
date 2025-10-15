
import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from '../store/auth-store';

const SUPERVISOR_BASE_URL = 'http://172.19.224.1:8002/api/v1/maintainance';
const OPERATOR_BASE_URL = 'http://172.19.224.1:8002/api/v1/operator';
const MASTER_ORDER_URL = 'http://172.19.224.1:8002/api/v1/master-order';

// Helper function to sort notifications by date
const sortNotifications = (notifications) => {
  return [...notifications].sort((a, b) => {
    const dateA = new Date(a.updated_at).getTime();
    const dateB = new Date(b.updated_at).getTime();
    return dateB - dateA; // Newest first
  });
};

const extractMachineId = (machineMake) => {
  // Extract numeric ID from machine make (e.g., "m1" -> 1)
  const matches = machineMake.match(/\d+/);
  return matches ? parseInt(matches[0]) : null;
};

const useMachineMaintenanceStore = create((set, get) => ({
  machines: [],
  totalMachines: 0,
  statuses: [],
  loading: false,
  error: null,
  pendingRequests: [],
  totalPendingRequests: 0,
  operatorPendingRequests: [],
  operatorTotalPendingRequests: 0,
  
  // New state for notifications
  machineNotifications: [],
  componentNotifications: [],
  totalMachineNotifications: 0,
  totalComponentNotifications: 0,
  notificationsLimit: 10,


  machineIssues: [],
  totalMachineIssues: 0,

  machineCalibrationLogs: [],
  totalMachineCalibrationLogs: 0,

  // Operator: Fetch all machine statuses
  fetchOperatorMachineStatuses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${OPERATOR_BASE_URL}/machine-status/`);
      const machinesWithIds = response.data.statuses.map(machine => ({
        ...machine,
        id: extractMachineId(machine.machine_make),
        description: machine.description || ''
      }));
      set({
        machines: machinesWithIds,
        totalMachines: response.data.total_machines,
        loading: false
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
    }
  },

  // Operator: Request machine status change
  requestMachineStatusChange: async (machineId, data) => {
    set({ loading: true, error: null });
    try {
      const requestData = {
        status_id: data.status_id,
        available_from: data.available_from,
        description: data.description?.trim() || ''
      };

      const response = await axios.put(
        `${OPERATOR_BASE_URL}/machine-status/${machineId}/request-change`,
        requestData
      );

      // Refresh machine statuses after request
      await get().fetchOperatorMachineStatuses();

      return response.data;
    } catch (error) {
      console.error('Error requesting machine status change:', error);
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
      throw error;
    }
  },

  // Operator: Fetch pending maintenance requests
  fetchOperatorPendingRequests: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${OPERATOR_BASE_URL}/pending-changes/`);
      set({
        operatorPendingRequests: response.data.pending_changes,
        operatorTotalPendingRequests: response.data.total_pending,
        loading: false
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
    }
  },

  // Operator: Approve maintenance request
  approveOperatorRequest: async (machineId) => {
    set({ loading: true, error: null });
    try {
      await axios.post(`${OPERATOR_BASE_URL}/approve-change/${machineId}`);
      // Refresh pending requests after approval
      await get().fetchOperatorPendingRequests();
      // Refresh machine statuses to reflect changes
      await get().fetchOperatorMachineStatuses();
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
      throw error;
    }
  },

  // Operator: Reject maintenance request
  rejectOperatorRequest: async (machineId, reason) => {
    set({ loading: true, error: null });
    try {
      await axios.post(`${OPERATOR_BASE_URL}/reject-change/${machineId}?reason=${encodeURIComponent(reason)}`);
      // Refresh pending requests after rejection
      await get().fetchOperatorPendingRequests();
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
      throw error;
    }
  },

  // Supervisor functions below
  // Fetch all machine statuses (Supervisor)
  fetchMachineStatuses: async () => {
    set({ loading: true, error: null });
    try {
      // Only fetch from the machine-status endpoint
      const statusResponse = await axios.get(`${SUPERVISOR_BASE_URL}/machine-status/`);
      // Map/format as needed for the table
      const machinesWithStatus = (statusResponse.data.statuses || []).map(machineStatus => ({
        ...machineStatus,
        machine_id: machineStatus.machine_id, // Ensure machine_id is present
        machine_make: machineStatus.machine_make, // Use machine_make from status data
        id: machineStatus.machine_id, // For consistency
        description: machineStatus.description || '' // Ensure description is never undefined or null
      }));
      set({
        machines: machinesWithStatus,
        totalMachines: machinesWithStatus.length,
        loading: false
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
    }
  },

  // Fetch available statuses (ON/OFF)
  fetchAvailableStatuses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${SUPERVISOR_BASE_URL}/status-table`);
      set({
        statuses: response.data.statuses,
        loading: false
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
    }
  },

  // Update machine status
  updateMachineStatus: async (machineId, data) => {
    set({ loading: true, error: null });
    try {
      // Ensure description is properly formatted
      const description = data.description?.trim() || '';
      const requestData = {
        status_id: data.status_id,
        available_from: data.available_from,
        description: description
      };

      // Add available_to only if status is OFF (status_id 2)
      if (data.status_id === 2 && data.available_to) {
        requestData.available_to = data.available_to;
      } else if (data.status_id === 1) {
        // If status is ON, we can explicitly set available_to to null or rely on backend to handle it.
        // For now, let's send it as null, or the same as available_from if the API requires it.
        // Based on the provided API PUT an ON status does not seem to send available_to, 
        // but GET for ON status returns it, so let's match available_from for now if status is ON
        requestData.available_to = data.available_from; 
      }
  
      console.log('Sendingggg request data:', requestData);
  
      const response = await axios.put(
        `${SUPERVISOR_BASE_URL}/machine-status/${machineId}`,
        requestData
      );
  
      // Fetch fresh data from machine-status endpoint only
      const statusResponse = await axios.get(`${SUPERVISOR_BASE_URL}/machine-status/`);
      
      // Map/format as needed for the table (same logic as fetchMachineStatuses)
      const machinesWithStatus = (statusResponse.data.statuses || []).map(machineStatus => ({
        ...machineStatus,
        machine_id: machineStatus.machine_id, // Ensure machine_id is present
        machine_make: machineStatus.machine_make, // Use machine_make from status data
        id: machineStatus.machine_id, // For consistency
        description: machineStatus.description || '' // Ensure description is never undefined or null
      }));
  
      set({
        machines: machinesWithStatus,
        totalMachines: machinesWithStatus.length,
        loading: false
      });
  
      return response.data;
    } catch (error) {
      console.error('Error updating machine status:', error);
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
      throw error;
    }
  },

  // Fetch machine notifications
  fetchMachineNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const { notificationsLimit } = get();
      // Only add limit parameter if not -1 (All)
      const limitQuery = notificationsLimit === -1 ? '' : `?limit=${notificationsLimit}`;
      
      const response = await axios.get(
        `${SUPERVISOR_BASE_URL}/supervisor/machine-notifications/${limitQuery}`
      );
      
      const sortedNotifications = sortNotifications(response.data.notifications || []);
      
      set({
        machineNotifications: sortedNotifications,
        totalMachineNotifications: response.data.total_notifications || sortedNotifications.length,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching machine notifications:', error);
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
    }
  },

  // Fetch component notifications
  fetchComponentNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const { notificationsLimit } = get();
      // Only add limit parameter if not -1 (All)
      const limitQuery = notificationsLimit === -1 ? '' : `?limit=${notificationsLimit}`;
      
      const response = await axios.get(
        `${SUPERVISOR_BASE_URL}/supervisor/raw-material-notifications/${limitQuery}`
      );
      
      const sortedNotifications = sortNotifications(response.data.notifications || []);
      
      set({
        componentNotifications: sortedNotifications,
        totalComponentNotifications: response.data.total_notifications || sortedNotifications.length,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching component notifications:', error);
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
    }
  },

  // Set notifications limit
  setNotificationsLimit: (limit) => {
    set({ notificationsLimit: limit });
    const { fetchMachineNotifications, fetchComponentNotifications } = get();
    // Refetch data with new limit
    fetchMachineNotifications();
    fetchComponentNotifications();
  },

   // New function to fetch downtimes
   fetchDowntimes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${SUPERVISOR_BASE_URL}/downtimes`);
      set({ loading: false });
      return response.data; // Return the fetched downtimes
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
      throw error;
    }
  },

// Acknowledge downtime
acknowledgeDowntime: async (id) => {
  set({ loading: true, error: null });
  try {
    const response = await axios.put(`${SUPERVISOR_BASE_URL}/supervisor/downtimes/${id}/acknowledge`);
    set({ loading: false });
    return response.data;
  } catch (error) {
    set({ 
      error: error.response?.data?.detail || error.message, 
      loading: false 
    });
    throw error;
  }
},

// Close downtime
closeDowntime: async (id, actionTaken) => {
  set({ loading: true, error: null });
  try {
    const response = await axios.put(`${SUPERVISOR_BASE_URL}/supervisor/downtimes/${id}/close`, {
      action_taken: actionTaken
    });
    set({ loading: false });
    return response.data;
  } catch (error) {
    set({ 
      error: error.response?.data?.detail || error.message, 
      loading: false 
    });
    throw error;
  }
},

// Fetch machine performance metrics
fetchMachinePerformanceMetrics: async () => {
  set({ loading: true, error: null });
  try {
    const response = await axios.get(`${SUPERVISOR_BASE_URL}/metrics/machine-performance`);
    set({ loading: false });
    return response.data;
  } catch (error) {
    set({ 
      error: error.response?.data?.detail || error.message, 
      loading: false 
    });
    throw error;
  }
},


fetchOeeIssues: async () => {
  set({ loading: true, error: null });
  try {
    const response = await axios.get(`${OPERATOR_BASE_URL}/issues/`);
    set({
      machineIssues: response.data.issues,
      totalMachineIssues: response.data.issues.length,
      loading: false
    });
  } catch (error) {
    set({ 
      error: error.response?.data?.detail || error.message, 
      loading: false 
    });
    throw error;
  }
},


// Fetch all machines for calibration

fetchAllMachines: async () => {

  set({ loading: true, error: null });

  try {

    const response = await axios.get('http://172.19.224.1:8002/api/v1/master-order/all-machines/');

    set({ loading: false });

    return response.data;
  
  }
  catch{
    console.log("Error Fetching Machines")
  }
},

// Operator: Fetch machine calibration logs
fetchMachineCalibrationLogs: async (skip = 0) => {
  set({ loading: true, error: null });
  try {
    const response = await axios.get(`http://172.19.224.1:8002/api/v1/newlogs/machine-calibration-logs?skip=${skip}`);
    set({
      machineCalibrationLogs: response.data,
      totalMachineCalibrationLogs: response.data.length,
      loading: false
    });
  } catch (error) {
    set({ 
      error: error.response?.data?.detail || error.message, 
      loading: false 
    });
    throw error;
  }
},
  
}));

export default useMachineMaintenanceStore;