import { create } from 'zustand';
import { formatDistanceToNow } from 'date-fns';
import { message } from 'antd';

// API endpoints
const API_BASE_URL = "http://172.19.224.1:8002";
const MPP_API_BASE_URL = "http://172.19.224.1:8002";
const WS_URL = "ws://172.19.224.1:8002/production_monitoring/ws/live-status/";

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
  rawMaterials: null,
  isLoadingRawMaterials: false,
  
  // Production data
  productionStats: null,
  
  // MPP Data
  operationMppData: null,
  isLoadingMppData: false,
  
  // UI state
  isJobSelectionModalVisible: false,
  isActivatingJob: false,
  isDeactivatingJob: false,
  isLoadingJobs: false,
  isLoadingOperations: false,
  jobActionType: null, // 'activate', 'deactivate'
  
  // Initialize dashboard
  initializeDashboard: async () => {

    get().closeWebSocket();

    set({ 
      isInitializing: true, 
      error: null,
      // Reset all job-related state on initialization
      selectedJob: null,
      selectedOperation: null,
      jobSource: null,
      inProgressJobs: [],
      scheduledJobs: [],
      availableJobs: []
    });
    
    try {
      // Clear any stale job data first
      // localStorage.removeItem('jobSource');
      // localStorage.removeItem('currentJobData');
      // localStorage.removeItem('activeOperation');
      
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
      
      // 4. Reset selection state
      set({
        selectedJob: null,
        selectedOperation: null,
        jobSource: null
      });
      
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

    const currentState = get();
    
    // Don't create new connection if already connecting/connected
    if (currentState.ws && (currentState.ws.readyState === WebSocket.CONNECTING || currentState.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already exists, skipping initialization');
      return;
    }
    
    // Close existing connection if any
    if (currentState.ws) {
      currentState.ws.close();
    }

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
      
      // Only attempt reconnect if we still have the same machineId and no existing connection
      setTimeout(() => {
        const currentState = get();
        if (currentState.machineId === machineId && !currentState.ws) {
          currentState.initializeWebSocket(machineId);
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

      localStorage.setItem('all_orders', JSON.stringify(data));
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
  fetchJobDetails: async (productionOrder) => {
    try {
      set({ isLoadingJobs: true });

      const currentMachine = JSON.parse(localStorage.getItem('currentMachine'));
      const work_center_id = currentMachine?.work_center_id;      

      const response = await fetch(`${MPP_API_BASE_URL}/api/v1/operatorlogs2/production-order-operations-status/${work_center_id}/${productionOrder}`, {
        headers: createAuthHeaders()
      });

      const jobDetails = await response.json();
      
      
      if (!response.ok) {
            const errorMessage =
            jobDetails?.detail || 'Failed to fetch job details';
            throw new Error(errorMessage);
          }
      

      
      if (jobDetails && jobDetails.operations) {
        // Filter operations where work_center_schedulable is true
        const currentMachine = JSON.parse(localStorage.getItem('currentMachine'));
        const schedulableOperations = jobDetails.operations.filter(op => 
          op.work_center_schedulable && op.machine_id === currentMachine.id
        );        
        // Sort operations by operation number
        const sortedOperations = [...schedulableOperations].sort((a, b) =>
          a.operation_number - b.operation_number
        );
        
        set({ availableOperations: sortedOperations });
        set({ jobDetails });
        
        return { success: true, data: jobDetails };
      } else {
        throw new Error('No job details found for this production order');
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
      
      // Activate the new job
      const activateResponse = await fetch(`${API_BASE_URL}/api/v1/logs/machine-raw-live/`, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({
          machine_id: machineId,
          operation_id: operationId
        })
      });
      
      if (!activateResponse.ok) {
        const errorData = await activateResponse.json();
        throw new Error(errorData.detail || 'Failed to activate job');
      }
      
      const activateData = await activateResponse.json();
      set({ jobSource: 'inprogress' });
      
      // Mark this as a user-selected job in localStorage
      localStorage.setItem('jobSource', 'inprogress');
      
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
      console.log('deactivateJob called'); // Debug log
      set({ isDeactivatingJob: true, jobActionType: 'deactivate' });
  
      const machineId = get().machineId;
      console.log('Machine ID:', machineId); // Debug log
  
      if (!machineId) {
        throw new Error('Machine ID not found');
      }
  
      // Find the active operation ID
      let operationId = 0;
  
      const activeOperation = localStorage.getItem('activeOperation');
      if (activeOperation) {
      try {
        const parsedOperation = JSON.parse(activeOperation);
        operationId = parsedOperation.operation_id || parsedOperation.id;
        console.log('Operation ID from localStorage:', operationId);
      } catch (error) {
        console.error('Error parsing activeOperation from localStorage:', error);
        throw new Error('Invalid operation data in localStorage');
      }
    }
  
      // If no active operation, just return success
      if (!operationId) {
        console.log('No operationId found, returning success'); // Debug log
        return { success: true };
      }
  
      // Deactivate the job in the database
      console.log('Sending deactivate request:', { machine_id: machineId, operation_id: operationId }); // Debug log
      const response = await fetch(`${API_BASE_URL}/api/v1/logs/machine-raw-live-deactive/`, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({
          machine_id: machineId,
          operation_id: operationId
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Deactivate API failed:', errorData); // Debug log
        throw new Error(errorData.detail?.message || errorData.detail || 'Failed to deactivate job');
      }
  
      // Database update successful, now clear localStorage
      console.log('Deactivate API successful, clearing localStorage'); // Debug log
      localStorage.removeItem('jobSource');
      localStorage.removeItem('currentJobData');
      localStorage.removeItem('activeOperation');
      localStorage.removeItem('user-selected-job');
  
      // Reset all job-related state
      set({
        selectedJob: null,
        selectedOperation: null,
        jobSource: null,
        inProgressJobs: [],
        scheduledJobs: [],
        availableJobs: [],
        jobDetails: null,
        jobDocuments: null,
        rawMaterials: null,
        productionStats: null,
        selectedJob: null,
        selectedOperation: null,
        availableOperations: [],
        jobSource: null,
        operationMppData: null,
        jobDocuments: null,
        rawMaterials: null,
        productionStats: null,
        isLoadingOperations: false,
        isLoadingMppData: false
      });
  
      console.log('shashank Job deactivated successfully'); // Existing log
      message.success('Job deactivated successfully');
  
      // Refresh machine operations
      console.log('Refreshing machine operations'); // Debug log
      await get().fetchMachineOperations(machineId, true);
  
      return { success: true };
    } catch (error) {
      console.error('Error deactivating job:', error); // Existing log
      message.error(`Failed to deactivate job: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      console.log('deactivateJob completed'); // Debug log
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
        operationId = get().selectedOperation.operation_id || get().selectedOperation.id;
      } else if (get().inProgressJobs.length > 0) {
        operationId = get().inProgressJobs[0].operation_id;
      }
      
      if (!operationId) {
        throw new Error('No operation selected');
      }
      
      // Check if the operation can log
      if (get().selectedOperation && get().selectedOperation.can_log === false) {
        throw new Error(get().selectedOperation.validation_reason || 'This operation cannot be logged at this time');
      }
      
      const payload = {
        operator_id: operatorId,
        operation_id: operationId,
        machine_id: get().machineId,
        ...logData
      };
      
      const response = await fetch(`${API_BASE_URL}/api/v1/operatorlogs2/operator-log`, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify(payload)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        // Handle the new error format
        if (responseData.detail && typeof responseData.detail === 'object') {
          if (responseData.detail.message) {
            throw new Error(responseData.detail.message);
          } else if (responseData.detail.validation_reason) {
            throw new Error(responseData.detail.validation_reason);
          }
        }
        throw new Error('Failed to submit operator log');
      }
      
      message.success('Production log submitted successfully');
      
      // Refresh production stats
      if (operationId) {
        await get().fetchProductionStats(operationId);
      }
      
      // Refresh job details to get updated completion status
      if (get().selectedJob && get().selectedJob.production_order) {
        await get().fetchJobDetails(get().selectedJob.production_order);
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
    if (job?.production_order) {
      get().fetchJobDetails(job.production_order);
      get().fetchJobDocuments(job.part_number);
    }
  },
  
  selectOperation: (operation) => {
    set({ selectedOperation: operation });
    
    // Fetch production stats if operation ID is available and can log
    if (operation?.id || operation?.operation_id) {
      const operationId = operation.id || operation.operation_id;
      get().fetchProductionStats(operationId);
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
  },
  
  // Fetch operation-specific MPP data
  fetchOperationMpp: async (partNumber, operationNumber) => {
    try {
      set({ isLoadingMppData: true, operationMppData: null });
      
      // First check if we have MPP document from the documents endpoint
      const documentsResponse = await fetch(
        `${MPP_API_BASE_URL}/api/v1/document-management/documents/by-part-number-all/${partNumber}`,
        {
          headers: createAuthHeaders()
        }
      );
      
      if (!documentsResponse.ok) {
        throw new Error('Failed to fetch MPP documents');
      }
      
      const documentsData = await documentsResponse.json();
      
      // If MPP document exists, return it
      if (documentsData?.mpp_document) {
        const mppDocument = documentsData.mpp_document;
        return { 
          success: true, 
          data: {
            type: 'pdf',
            documentId: mppDocument.id,
            downloadUrl: `${MPP_API_BASE_URL}/api/v1/document-management/documents/${mppDocument.id}/download-latest`,
            document: mppDocument
          }
        };
      }
      
      // Otherwise fetch operation-specific work instructions
      const mppResponse = await fetch(
        `${MPP_API_BASE_URL}/api/v1/mpp/by-part/${partNumber}/${operationNumber}`,
        {
          headers: createAuthHeaders()
        }
      );
      
      if (!mppResponse.ok) {
        throw new Error('Failed to fetch operation-specific MPP data');
      }
      
      const mppData = await mppResponse.json();
      
      if (mppData && mppData.length > 0) {
        set({ operationMppData: mppData[0] });
        return { 
          success: true, 
          data: {
            type: 'instructions',
            instructions: mppData[0]
          }
        };
      } else {
        return { 
          success: false, 
          error: 'No MPP data available for this operation' 
        };
      }
    } catch (error) {
      console.error('Error fetching operation MPP:', error);
      return { success: false, error: error.message };
    } finally {
      set({ isLoadingMppData: false });
    }
  },
  
  // Download document
  downloadDocument: async (documentId) => {
    try {
      const response = await fetch(
        `${MPP_API_BASE_URL}/api/v1/document-management/documents/${documentId}/download-latest`,
        {
          headers: createAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
     

      return { success: true };
    } catch (error) {
      console.error('Error downloading document:', error);
      message.error('Failed to download document');
      return { success: false, error: error.message };
    }
  },
  
  // Fetch production metrics
  fetchProductionMetrics: async (operationId, timeRange = 'today') => {
    try {
      // This function would call the API to get real metrics
      // For now, we'll simulate with mock data
      
      // In real implementation, we would make an API call like:
      // const response = await fetch(`${API_BASE_URL}/api/v1/metrics/operation/${operationId}?range=${timeRange}`, {
      //   headers: createAuthHeaders()
      // });
      // const data = await response.json();
      
      // Mock data for demo purposes
      const mockData = {
        operation_id: operationId,
        time_range: timeRange,
        actual_production: Math.floor(Math.random() * 80) + 20,
        planned_production: 100,
        good_parts: Math.floor(Math.random() * 70) + 20,
        defects: Math.floor(Math.random() * 10) + 1,
        uptime: Math.floor(Math.random() * 400) + 80,
        downtime: Math.floor(Math.random() * 120),
        total_time: 480, // 8 hours in minutes
        hourly_rate: Math.floor(Math.random() * 15) + 5,
        first_pass_yield: Math.floor(Math.random() * 20) + 80,
        mtbf: Math.floor(Math.random() * 40) + 20
      };
      
      // Add slight variations based on time range
      if (timeRange === 'week') {
        mockData.actual_production *= 5;
        mockData.planned_production *= 5;
        mockData.good_parts *= 5;
        mockData.defects *= 5;
        mockData.total_time *= 5;
      } else if (timeRange === 'month') {
        mockData.actual_production *= 20;
        mockData.planned_production *= 20;
        mockData.good_parts *= 20;
        mockData.defects *= 20;
        mockData.total_time *= 20;
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return mockData;
    } catch (error) {
      console.error('Error fetching production metrics:', error);
      message.error(`Failed to fetch metrics: ${error.message}`);
      return null;
    }
  },
  
  // Fetch raw materials for a production order
  fetchRawMaterials: async (productionOrder) => {
    try {
      set({ isLoadingRawMaterials: true });
      
      const response = await fetch(
        `${API_BASE_URL}/api/v1/planning/search_order2?production_order=${productionOrder}`,
        {
          headers: createAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch raw materials');
      }
      
      const data = await response.json();
      
      if (data.orders && data.orders.length > 0) {
        set({ rawMaterials: data.orders[0].raw_materials || [] });
      } else {
        set({ rawMaterials: [] });
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching raw materials:', error);
      message.error(`Failed to load raw materials: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      set({ isLoadingRawMaterials: false });
    }
  } , 

    resetStore: () => {
      set({
        selectedJob: null,
        selectedOperation: null,
        jobSource: null,
        inProgressJobs: [],
        scheduledJobs: [],
        availableJobs: [],
        jobDetails: null,
        jobDocuments: null,
        rawMaterials: null,
        productionStats: null,
        availableOperations: [],
        operationMppData: null,
        isLoadingOperations: false,
        isLoadingMppData: false
      });
    }
    
}));

export default useOperatorStore;  