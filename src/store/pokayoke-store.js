import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://172.19.224.1:8002';

const usePokayokeStore = create((set, get) => ({
  // Checklists state
  checklists: [],
  checklist: null,
  checklistItems: [],
  loading: false,
  error: null,
  
  // Machine assignments state
  machineAssignments: [],
  
  // Machines state
  machines: [],
  
  // Logs state
  completionLogs: [],
  currentLog: null,
  totalLogs: 0,
  
  // Filters
  filters: {
    machine_id: null,
    production_order: '',
    part_number: '',
    operator_id: '',
    from_date: null,
    to_date: null,
    page: 1,
    page_size: 20,
    active_only: true,
  },
  
  // Set loading state
  setLoading: (isLoading) => set({ loading: isLoading }),
  
  // Set error state
  setError: (error) => set({ error }),
  
  // Set filters
  setFilters: (newFilters) => set({ 
    filters: { ...get().filters, ...newFilters } 
  }),
  
  // Reset filters
  resetFilters: () => set({ 
    filters: {
      machine_id: null,
      production_order: '',
      part_number: '',
      operator_id: '',
      from_date: null,
      to_date: null,
      page: 1,
      page_size: 20,
      active_only: true,
    }
  }),
  
  // Fetch all machines
  fetchMachines: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await axios.get(`${API_BASE_URL}/api/v1/master-order/all-machines/`);
      
      set({ 
        machines: response.data, 
        loading: false 
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching machines:", error);
      set({ 
        error: error.response?.data?.message || "Failed to fetch machines", 
        loading: false 
      });
      return [];
    }
  },
  
  // Fetch all checklists
  fetchChecklists: async () => {
    try {
      set({ loading: true, error: null });
      const { active_only } = get().filters;
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/pokayoke/checklists/`, {
        params: { active_only },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ checklists: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error("Error fetching checklists:", error);
      set({ 
        error: error.response?.data?.message || "Failed to fetch checklists", 
        loading: false 
      });
      return [];
    }
  },
  
  // Fetch a specific checklist
  fetchChecklist: async (id) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/pokayoke/checklists/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ checklist: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error(`Error fetching checklist ${id}:`, error);
      set({ 
        error: error.response?.data?.message || "Failed to fetch checklist", 
        loading: false 
      });
      return null;
    }
  },
  
  // Create a new checklist
  createChecklist: async (checklistData) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE_URL}/pokayoke/checklists/`, checklistData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedChecklists = [...get().checklists, response.data];
      set({ checklists: updatedChecklists, loading: false });
      return response.data;
    } catch (error) {
      console.error("Error creating checklist:", error);
      set({ 
        error: error.response?.data?.message || "Failed to create checklist", 
        loading: false 
      });
      return null;
    }
  },
  
  // Add item to existing checklist
  addChecklistItem: async (itemData) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE_URL}/pokayoke/checklists/items/`, itemData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await get().fetchChecklist(itemData.checklist_id);
      set({ loading: false });
      return response.data;
    } catch (error) {
      console.error("Error adding checklist item:", error);
      set({ 
        error: error.response?.data?.message || "Failed to add checklist item", 
        loading: false 
      });
      return null;
    }
  },

  // Delete (deactivate) a checklist
  deleteChecklist: async (checklistId) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`${API_BASE_URL}/pokayoke/checklists/${checklistId}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove the deleted checklist from the state
      const updatedChecklists = get().checklists.filter(checklist => checklist.id !== checklistId);
      set({ checklists: updatedChecklists, loading: false });
      
      return response.data;
    } catch (error) {
      console.error("Error deleting checklist:", error);
      set({ 
        error: error.response?.data?.message || "Failed to delete checklist", 
        loading: false 
      });
      return null;
    }
  },

  // Delete (deactivate) a machine assignment
  deleteAssignment: async (assignmentId) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`${API_BASE_URL}/pokayoke/assignments/${assignmentId}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove the deleted assignment from the state
      const updatedAssignments = get().machineAssignments.filter(assignment => assignment.id !== assignmentId);
      set({ machineAssignments: updatedAssignments, loading: false });
      
      return response.data;
    } catch (error) {
      console.error("Error deleting assignment:", error);
      set({ 
        error: error.response?.data?.message || "Failed to delete assignment", 
        loading: false 
      });
      return null;
    }
  },
  
  // Assign checklist to machine
  assignChecklistToMachine: async (assignmentData) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE_URL}/pokayoke/assignments/`, assignmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await get().fetchMachineAssignments(assignmentData.machine_id);
      set({ loading: false });
      return response.data;
    } catch (error) {
      console.error("Error assigning checklist to machine:", error);
      set({ 
        error: error.response?.data?.message || "Failed to assign checklist to machine", 
        loading: false 
      });
      return null;
    }
  },
  
  // Fetch checklists assigned to a machine
  fetchMachineAssignments: async (machineId) => {
    try {
      set({ loading: true, error: null });
      const { active_only } = get().filters;
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/pokayoke/assignments/machine/${machineId}`, {
        params: { active_only },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ machineAssignments: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error(`Error fetching machine assignments for machine ${machineId}:`, error);
      set({ 
        error: error.response?.data?.message || "Failed to fetch machine assignments", 
        loading: false 
      });
      return [];
    }
  },
  
  // Fetch checklist completion logs
  fetchChecklistLogs: async () => {
    try {
      set({ loading: true, error: null });
      const filters = get().filters;
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/pokayoke/logs/`, {
        params: filters,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ 
        completionLogs: response.data.logs || response.data, 
        totalLogs: response.data.total || response.data.length,
        loading: false 
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching checklist logs:", error);
      set({ 
        error: error.response?.data?.message || "Failed to fetch checklist logs", 
        loading: false 
      });
      return [];
    }
  },
  
  // Fetch detailed log
  fetchLogDetails: async (logId) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/pokayoke/logs/${logId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ currentLog: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error(`Error fetching log details for log ${logId}:`, error);
      set({ 
        error: error.response?.data?.message || "Failed to fetch log details", 
        loading: false 
      });
      return null;
    }
  }
}));

export default usePokayokeStore; 