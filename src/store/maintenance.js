import { create } from 'zustand';
import axios from 'axios';

const SUPERVISOR_BASE_URL = 'http://172.18.7.85:4787/api/v1/maintainance';
const OPERATOR_BASE_URL = 'http://172.18.7.85:4787/api/v1/operator';

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
  notifications: [],

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
      const response = await axios.get(`${SUPERVISOR_BASE_URL}/machine-status/`);
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

      console.log('Sending request data:', requestData); // Add logging to verify data

      const response = await axios.put(
        `${SUPERVISOR_BASE_URL}/machine-status/${machineId}`,
        requestData
      );

      // Refresh machine statuses after update
      const fetchResponse = await axios.get(`${SUPERVISOR_BASE_URL}/machine-status/`);
      const machinesWithIds = fetchResponse.data.statuses.map(machine => ({
        ...machine,
        id: extractMachineId(machine.machine_make),
        description: machine.description?.trim() || '' // Ensure consistent description handling
      }));
      
      set({
        machines: machinesWithIds,
        totalMachines: fetchResponse.data.total_machines,
        loading: false
      });

      return response.data;
    } catch (error) {
      console.error('Error updating machine status:', error); // Add error logging
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
      throw error;
    }
  },

  // Fetch machine status notifications
  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${OPERATOR_BASE_URL}/Machine-status-Notification`);
      set({
        notifications: response.data.messages || [],
        loading: false
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
    }
  },

  // Update notification status
  updateNotificationStatus: async (machineId, timestamp, read, retain) => {
    set({ loading: true, error: null });
    try {
      // Ensure timestamp is properly encoded for URL
      const encodedTimestamp = encodeURIComponent(timestamp);
      
      // Make PUT request with path parameters and query parameters
      const response = await axios.put(
        `${OPERATOR_BASE_URL}/Machine-status-Notification/${machineId}/${encodedTimestamp}`,
        null,  // no body needed
        {
          params: {
            read: read,
            retain: retain
          }
        }
      );

      if (response.data.message === "Message status updated successfully") {
        // Refresh notifications after successful update
        await get().fetchNotifications();
      }

      return response.data;
    } catch (error) {
      console.error('Error updating notification status:', error);
      set({ 
        error: error.response?.data?.detail || error.message, 
        loading: false 
      });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));

export default useMachineMaintenanceStore;
