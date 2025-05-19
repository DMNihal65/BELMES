import { create } from 'zustand';
import { formatDistanceToNow } from 'date-fns';
import { message } from 'antd';

// API endpoints
const API_BASE_URL = "http://172.18.7.88:5458";
const MPP_API_BASE_URL = "http://172.18.7.88:5458";
const WS_URL = "ws://172.18.7.88:5458/production_monitoring/ws/live-status/";

// Helper function to get authentication token
const getAuthToken = () => {
  // Get authentication token from localStorage
  const authStorage = localStorage.getItem('auth-storage');
  let authToken = localStorage.getItem('token');
  
  if (!authToken && authStorage) {
    try {
      const parsedAuthStorage = JSON.parse(authStorage);
      authToken = parsedAuthStorage?.state?.token;
    } catch (error) {
      console.error('Error parsing auth storage:', error);
    }
  }
  
  return authToken;
};

// Helper function to create authenticated request headers
const createAuthHeaders = (contentType = 'application/json') => {
  const authToken = getAuthToken();
  const headers = {
    'Content-Type': contentType,
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return headers;
};

// Helper function to transform order response to job data format
const createJobDataFromOrderResponse = (orderData) => {
  if (!orderData) return null;
  
  return {
    id: orderData.id || orderData.order_id,
    part_number: orderData.part_number || '',
    part_description: orderData.part_description || orderData.material_description || '',
    production_order: orderData.production_order || '',
    sale_order: orderData.sale_order || orderData.sales_order || '',
    wbs_element: orderData.wbs_element || '',
    required_quantity: orderData.required_quantity || orderData.required_qty || 0,
    launched_quantity: orderData.launched_quantity || orderData.launched_qty || 0,
    total_operations: orderData.total_operations || 0,
    plant_id: orderData.plant_id || '',
    project: orderData.project || null,
    operations: orderData.operations || []
  };
};

const useOperatorStore = create((set, get) => ({
  // Dashboard state
  isInitializing: true,
  error: null,
  
  // WebSocket connection
  ws: null,
  isConnected: false,
  connectionError: null,
  
  // Machine status
  machineStatus: null,
  machineId: null,
  idleTime: 0,
  idleStartTime: null,
  
  // Current selection state
  selectedJob: null,
  selectedOperation: null,
  jobSource: null, // 'inprogress', 'scheduled', or 'custom'
  
  // Job lists
  availableJobs: [],
  inProgressJobs: [],
  scheduledJobs: [],
  
  // Operation lists
  availableOperations: [],
  
  // Job details
  jobDetails: null,
  jobDocuments: null,
  
  // Production data
  productionStats: null,
  
  // UI state
  isJobSelectionModalVisible: false,
  isActivatingJob: false,
  isDeactivatingJob: false,
  isLoadingJobs: false,
  isLoadingOperations: false,
  jobActionType: null, // 'activate', 'deactivate'
  
  // Initialize dashboard
  initializeDashboard: async () => {
    set({ isInitializing: true, error: null });
    
    try {
      // 1. Get machine ID from localStorage
      const storedMachine = localStorage.getItem('currentMachine');
      if (!storedMachine) {
        throw new Error('No machine selected. Please select a machine first.');
      }
      
      const machineData = JSON.parse(storedMachine);
      const machineId = machineData.id;
      
      if (!machineId) {
        throw new Error('Invalid machine data. Please select a machine again.');
      }
      
      set({ machineId });
      
      // 2. Initialize WebSocket connection
      get().initializeWebSocket(machineId);
      
      // 3. Fetch machine operations
      await get().fetchMachineOperations(machineId);
      
      // 4. Check if there's a previously selected job in localStorage
      const jobSource = localStorage.getItem('jobSource');
      const storedJobData = localStorage.getItem('currentJobData');
      const storedOperation = localStorage.getItem('activeOperation');
      
      if (jobSource === 'user-selected' && storedJobData && storedOperation) {
        // Restore previously selected job
        try {
          const parsedJobData = JSON.parse(storedJobData);
          const parsedOperation = JSON.parse(storedOperation);
          
          set({
            selectedJob: parsedJobData,
            selectedOperation: parsedOperation,
            jobSource: 'custom'
          });
          
          // Fetch detailed job data
          await get().fetchJobDetails(parsedJobData.part_number);
          
          // Fetch job documents
          await get().fetchJobDocuments(parsedJobData.part_number);
          
          // Fetch production stats
          if (parsedOperation?.id) {
            await get().fetchProductionStats(parsedOperation.id);
          }
        } catch (error) {
          console.error('Error restoring job from localStorage:', error);
        }
      } else if (get().inProgressJobs.length > 0) {
        // Use in-progress job as default selection
        const inProgressJob = get().inProgressJobs[0];
        
        set({
          selectedJob: inProgressJob,
          selectedOperation: inProgressJob,
          jobSource: 'inprogress'
        });
        
        // Fetch detailed job data
        await get().fetchJobDetails(inProgressJob.part_number);
        
        // Fetch job documents
        await get().fetchJobDocuments(inProgressJob.part_number);
        
        // Fetch production stats
        if (inProgressJob?.operation_id) {
          await get().fetchProductionStats(inProgressJob.operation_id);
        }
      }
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      set({ error: error.message });
    } finally {
      set({ isInitializing: false });
    }
  },
  
  // WebSocket functions
  initializeWebSocket: (machineId) => {
    // Close existing connection if any
    if (get().ws) {
      get().ws.close();
    }
    
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        set({ isConnected: true, connectionError: null, ws });
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Find the status for our machine
          const machineStatus = data.find(status => status.machine_id === machineId);
          
          if (machineStatus) {
            // Update idle time if machine is IDLE
            let idleTime = get().idleTime;
            let idleStartTime = get().idleStartTime;
            
            if (machineStatus.status === 'IDLE' || machineStatus.status === 'ON') {
              if (!idleStartTime) {
                idleStartTime = new Date();
              }
              idleTime = Math.floor((new Date() - idleStartTime) / 1000);
            } else {
              idleStartTime = null;
              idleTime = 0;
            }
            
            // Format last updated time
            if (machineStatus.last_updated) {
              machineStatus.lastUpdatedFormatted = formatDistanceToNow(
                new Date(machineStatus.last_updated),
                { addSuffix: true }
              );
            }
            
            set({ machineStatus, idleTime, idleStartTime });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        set({ connectionError: 'Connection error', isConnected: false });
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        set({ isConnected: false });
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (get().machineId) {
            get().initializeWebSocket(get().machineId);
          }
        }, 5000);
      };
      
      set({ ws });
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      set({ connectionError: error.message, isConnected: false });
    }
  },
  
  closeWebSocket: () => {
    if (get().ws) {
      get().ws.close();
      set({ ws: null, isConnected: false });
    }
  },
  
  // Fetch machine operations
  fetchMachineOperations: async (machineId, allowOverride = false) => {
    try {
      set({ isLoadingJobs: true });
      
      // Don't override user-selected job unless specifically requested
      const jobSource = localStorage.getItem('jobSource');
      if (jobSource === 'user-selected' && !allowOverride) {
        console.log('Skipping automatic job update - user has manually selected a job');
        set({ isLoadingJobs: false });
        return { success: false, reason: 'user-selected-job' };
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/operator/machines/${machineId}/operations`, {
        headers: createAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch machine operations');
      }
      
      const data = await response.json();
      
      // Transform order data using helper function if needed
      const availableJobs = data.orders ? data.orders.map(order => createJobDataFromOrderResponse(order)) : [];
      
      // Update state with fetched data
      set({
        inProgressJobs: data.operations.inprogress || [],
        scheduledJobs: data.operations.scheduled || [],
        availableJobs: availableJobs
      });
      
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching machine operations:', error);
      set({ error: `Failed to load jobs: ${error.message}` });
      return { success: false, error: error.message };
    } finally {
      set({ isLoadingJobs: false });
    }
  },
  
  // Fetch all available jobs
  fetchAvailableJobs: async () => {
    try {
      set({ isLoadingJobs: true });
      
      const response = await fetch(`${MPP_API_BASE_URL}/api/v1/planning/all_orders`, {
        headers: createAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch available jobs');
      }
      
      const data = await response.json();
      // Transform job data using helper function
      const formattedJobs = data.map(job => createJobDataFromOrderResponse(job));
      set({ availableJobs: formattedJobs });
      
      return { success: true, data: formattedJobs };
    } catch (error) {
      console.error('Error fetching available jobs:', error);
      set({ error: `Failed to load available jobs: ${error.message}` });
      return { success: false, error: error.message };
    } finally {
      set({ isLoadingJobs: false });
    }
  },
  
  // Fetch job details by part number
  fetchJobDetails: async (partNumber) => {
    try {
      set({ isLoadingJobs: true });
      
      const response = await fetch(`${MPP_API_BASE_URL}/api/v1/planning/search_order?part_number=${partNumber}`, {
        headers: createAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      
      const data = await response.json();
      
      if (data.orders && data.orders.length > 0) {
        const jobDetails = data.orders[0];
        
        // Update operations list
        if (jobDetails.operations) {
          // Sort operations by operation number
          const sortedOperations = [...jobDetails.operations].sort((a, b) => 
            a.operation_number - b.operation_number
          );
          
          set({ availableOperations: sortedOperations });
        }
        
        set({ jobDetails });
        return { success: true, data: jobDetails };
      } else {
        throw new Error('No job details found for this part number');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      set({ error: `Failed to load job details: ${error.message}` });
      return { success: false, error: error.message };
    } finally {
      set({ isLoadingJobs: false });
    }
  },
  
  // Fetch job documents
  fetchJobDocuments: async (partNumber) => {
    try {
      const response = await fetch(
        `${MPP_API_BASE_URL}/api/v1/document-management/documents/by-part-number-all/${partNumber}`,
        {
          headers: createAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch job documents');
      }
      
      const data = await response.json();
      set({ jobDocuments: data });
      
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching job documents:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Fetch production stats for an operation
  fetchProductionStats: async (operationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/logs/quantities/${operationId}`, {
        headers: createAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch production stats');
      }
      
      const data = await response.json();
      set({ productionStats: data });
      
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching production stats:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Activate a job
  activateJob: async (operationId) => {
    try {
      set({ isActivatingJob: true, jobActionType: 'activate' });
      
      const machineId = get().machineId;
      
      if (!machineId) {
        throw new Error('Machine ID not found');
      }
      
      // Check if there's an active job that needs to be deactivated first
      const hasActiveJob = get().inProgressJobs.length > 0;
      
      if (hasActiveJob) {
        const deactivateResult = await get().deactivateJob();
        
        if (!deactivateResult.success) {
          throw new Error('Failed to deactivate current job');
        }
      }
      
      // Activate the new job
      const activateResponse = await fetch(`${API_BASE_URL}/api/v1/logs/machine-raw-live/`, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({
          machine_id: machineId,
          operation_id: operationId
        })
      });
      
      const activateData = await activateResponse.json();
      
      if (!activateResponse.ok) {
        throw new Error(activateData.detail || 'Failed to activate job');
      }
      
      // Mark this as a user-selected job in localStorage
      localStorage.setItem('jobSource', 'user-selected');
      
      // Store the job data and operation in localStorage
      localStorage.setItem('currentJobData', JSON.stringify(get().selectedJob));
      localStorage.setItem('activeOperation', JSON.stringify(get().selectedOperation));
      
      message.success('Job activated successfully');
      
      // Refresh machine operations
      await get().fetchMachineOperations(machineId, false);
      
      // Close job selection modal
      set({ isJobSelectionModalVisible: false });
      
      return { success: true };
    } catch (error) {
      console.error('Error activating job:', error);
      message.error(`Failed to activate job: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      set({ isActivatingJob: false, jobActionType: null });
    }
  },
  
  // Deactivate current job
  deactivateJob: async () => {
    try {
      set({ isDeactivatingJob: true, jobActionType: 'deactivate' });
      
      const machineId = get().machineId;
      
      if (!machineId) {
        throw new Error('Machine ID not found');
      }
      
      // Find the active operation ID
      let operationId = 0;
      
      // First check if there's an active operation in inProgressJobs
      if (get().inProgressJobs.length > 0) {
        operationId = get().inProgressJobs[0].operation_id;
      } 
      // If selectedOperation exists
      else if (get().selectedOperation && get().selectedOperation.id) {
        operationId = get().selectedOperation.id;
      }
      
      // Deactivate the job
      const response = await fetch(`${MPP_API_BASE_URL}/api/v1/logs/machine-raw-live-deactive/`, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({
          machine_id: machineId,
          operation_id: operationId
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to deactivate job');
      }
      
      message.success('Job deactivated successfully');
      
      // Reset the job source
      localStorage.removeItem('jobSource');
      
      // Refresh machine operations
      await get().fetchMachineOperations(machineId, true);
      
      return { success: true };
    } catch (error) {
      console.error('Error deactivating job:', error);
      message.error(`Failed to deactivate job: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      set({ isDeactivatingJob: false, jobActionType: null });
    }
  },
  
  // Submit operator log
  submitOperatorLog: async (logData) => {
    try {
      // Get operator ID from localStorage
      const authStorageData = localStorage.getItem('auth-storage');
      let operatorId = 0;
      
      if (authStorageData) {
        try {
          const authData = JSON.parse(authStorageData);
          operatorId = authData?.state?.user_id || authData?.user_id || 0;
        } catch (error) {
          console.error('Error parsing auth storage data:', error);
        }
      }
      
      // Get operation ID
      let operationId = 0;
      
      if (get().selectedOperation) {
        operationId = get().selectedOperation.id;
      } else if (get().inProgressJobs.length > 0) {
        operationId = get().inProgressJobs[0].operation_id;
      }
      
      if (!operationId) {
        throw new Error('No operation selected');
      }
      
      const payload = {
        operator_id: operatorId,
        operation_id: operationId,
        machine_id: get().machineId,
        ...logData
      };
      
      const response = await fetch(`${API_BASE_URL}/api/v1/logs/operator-log`, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit operator log');
      }
      
      const responseData = await response.json();
      
      message.success('Production log submitted successfully');
      
      // Refresh production stats
      if (operationId) {
        await get().fetchProductionStats(operationId);
      }
      
      return { success: true, data: responseData };
    } catch (error) {
      console.error('Error submitting operator log:', error);
      message.error(`Failed to submit log: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  // Select job and operation
  selectJob: (job) => {
    set({ selectedJob: job });
    
    // Fetch job details if part number is available
    if (job?.part_number) {
      get().fetchJobDetails(job.part_number);
      get().fetchJobDocuments(job.part_number);
    }
  },
  
  selectOperation: (operation) => {
    set({ selectedOperation: operation });
    
    // Fetch production stats if operation ID is available
    if (operation?.id) {
      get().fetchProductionStats(operation.id);
    }
  },
  
  setJobSelectionModalVisible: (visible) => {
    set({ isJobSelectionModalVisible: visible });
    
    // If opening modal, fetch available jobs
    if (visible) {
      get().fetchAvailableJobs();
    }
  },
  
  formatIdleTime: (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}));

export default useOperatorStore; 