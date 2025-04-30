import { create } from 'zustand';
import useAuthStore from './auth-store';

const useWebSocketStore = create((set, get) => ({
  machineStatus: null,
  isConnected: false,
  error: null,
  socket: null,
  lastUpdate: null,
  idleStartTime: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  reconnectDelay: 3000,
  maintenanceLoading: false,
  machineOperations: null,
  jobData: null,
  operationDocuments: null,
  documentLoading: false,
  documentError: null,

  initializeWebSocket: (machineId) => {
    if (!machineId) {
      const storedMachine = localStorage.getItem('currentMachine');
      if (storedMachine) {
        try {
          const machineData = JSON.parse(storedMachine);
          machineId = machineData.id;
        } catch (error) {
          console.error('Error parsing stored machine data:', error);
          return;
        }
      }
    }

    // Restore machine status from localStorage on initialization
    const storedStatus = localStorage.getItem('machineStatus');
    if (storedStatus) {
      try {
        const parsedStatus = JSON.parse(storedStatus);
        set({ 
          machineStatus: {
            ...parsedStatus,
            last_updated: new Date(parsedStatus.last_updated).toISOString()
          }
        });
      } catch (error) {
        console.error('Error restoring machine status:', error);
      }
    }

    const ws = new WebSocket('ws://172.18.7.88:4422/production_monitoring/ws/live-status/');
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const storedMachine = localStorage.getItem('currentMachine');
        const machineData = storedMachine ? JSON.parse(storedMachine) : null;
        const machineId = machineData?.id;

        const currentMachineData = data.find(machine => 
          machine.machine_id === parseInt(machineId)
        );

        if (currentMachineData) {
          const newStatus = currentMachineData.status;
          const isInProduction = currentMachineData.job_in_progress !== null;

          // Updated idle timer logic
          if (newStatus === 'ON' && !isInProduction) {
            // Start idle timer only when machine is ON and not in production
            console.log('Starting idle timer - Machine ON but not in production');
            if (!get().idleStartTime) {
              set({ idleStartTime: Date.now() });
            }
          } else if (newStatus === 'OFF') {
            // Stop timer when machine is OFF
            console.log('Stopping idle timer - Machine OFF');
            set({ idleStartTime: null });
          } else if (isInProduction || newStatus === 'PRODUCTION') {
            // Reset timer when in production
            console.log('Resetting idle timer - Machine in production');
            set({ idleStartTime: null });
          }

          // Format the machine status data with all fields
          const formattedStatus = {
            machine_id: currentMachineData.machine_id,
            machine_name: currentMachineData.machine_name,
            status: currentMachineData.status || 'N/A',
            active_program: currentMachineData.active_program || 'x', // Keep 'x' as is
            job_in_progress: currentMachineData.job_in_progress,
            job_status: currentMachineData.job_status,
            launched_quantity: currentMachineData.launched_quantity,
            last_updated: currentMachineData.last_updated,
            operation_description: currentMachineData.operation_description,
            operation_number: currentMachineData.operation_number,
            part_count: currentMachineData.part_count,
            part_description: currentMachineData.part_description,
            part_number: currentMachineData.part_number,
            production_order: currentMachineData.production_order,
            program_number: currentMachineData.program_number,
            required_quantity: currentMachineData.required_quantity,
            selected_program: currentMachineData.selected_program
          };

          // Update state while preserving other data
          set(state => ({ 
            machineStatus: {
              ...state.machineStatus, // Keep existing state
              ...formattedStatus // Update with new data
            },
            lastUpdate: new Date().toISOString()
          }));

          // Store in localStorage for persistence
          localStorage.setItem('machineStatus', JSON.stringify(formattedStatus));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onopen = () => {
      console.log('WebSocket Connected Successfully');
      set({ 
        isConnected: true, 
        socket: ws, 
        error: null,
        reconnectAttempts: 0
      });
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      set({ error: 'Connection error' });
    };

    ws.onclose = (event) => {
      console.log(`WebSocket Disconnected: ${event.code} ${event.reason}`);
      set({ isConnected: false, socket: null });
      
      // Only attempt to reconnect if it wasn't intentionally closed
      const { reconnectAttempts, maxReconnectAttempts, reconnectDelay } = get();
      
      if (reconnectAttempts < maxReconnectAttempts) {
        console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttempts})...`);
        setTimeout(() => {
          set(state => ({ reconnectAttempts: state.reconnectAttempts + 1 }));
          get().initializeWebSocket(machineId);
        }, reconnectDelay);
      } else {
        set({ error: 'Maximum reconnection attempts reached' });
      }
    };

    set({ socket: ws });
  },

  closeWebSocket: () => {
    const { socket } = get();
    if (socket) {
      console.log('Closing WebSocket connection');
      socket.close(1000, 'User navigated away');
      set({ 
        socket: null, 
        isConnected: false,
        machineStatus: null,
        error: null,
        idleStartTime: null,
        reconnectAttempts: 0
      });
    }
  },

  getIdleTime: () => {
    const { idleStartTime } = get();
    if (!idleStartTime) return 0;
    return Math.floor((Date.now() - idleStartTime) / 1000);
  },

  resetConnection: () => {
    const { socket } = get();
    if (socket) {
      socket.close(1000, 'Connection reset by user');
    }
    set({ 
      reconnectAttempts: 0,
      error: null
    });
  },

  fetchMachineOperations: async (machineId) => {
    try {
      set({ loading: true });
      
      // Ensure we have a valid machine ID
      if (!machineId) {
        const storedMachine = localStorage.getItem('currentMachine');
        if (storedMachine) {
          const machineData = JSON.parse(storedMachine);
          machineId = machineData?.id;
        }
        
        if (!machineId) {
          throw new Error('No machine ID available');
        }
      }

      const response = await fetch(
        `http://172.18.7.88:4422/api/v1/operator/machines/${machineId}/operations`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch machine operations: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Format operations data
      const formattedOperations = {
        completed: data.operations.completed.map(op => ({
          ...op,
          status: 'completed',
          planned_start_time: op.schedule_info.planned_start_time,
          planned_end_time: op.schedule_info.planned_end_time
        })),
        inprogress: data.operations.inprogress.map(op => ({
          ...op,
          status: 'inprogress',
          planned_start_time: op.schedule_info.planned_start_time,
          planned_end_time: op.schedule_info.planned_end_time
        })),
        scheduled: data.operations.scheduled.map(op => ({
          ...op,
          status: 'scheduled',
          planned_start_time: op.schedule_info.planned_start_time,
          planned_end_time: op.schedule_info.planned_end_time
        }))
      };

      // Store operations data
      localStorage.setItem('operationsData', JSON.stringify(formattedOperations));
      
      let currentJob = null;
      if (data.orders && data.orders.length > 0) {
        const order = data.orders[0];
        currentJob = {
          jobId: `JOB-${order.production_order}`,
          part_number: order.part_number,
          production_order: order.production_order,
          sale_order: order.sales_order,
          wbs_element: order.wbs_element,
          part_description: order.material_description,
          total_operations: order.project_details.total_operations,
          required_quantity: order.required_qty,
          launched_quantity: order.launched_qty,
          plant_id: '1154',
          project: {
            id: order.order_id,
            name: order.project_details.project_name,
            priority: order.priority,
            delivery_date: new Date().toISOString()
          },
          partNumber: order.part_number,
          partName: order.material_description,
          batchSize: order.required_qty,
          priority: order.priority > 3 ? 'High' : 'Normal',
          jobDetails: {
            customer: order.sales_order.split('/')[0] || 'BEL',
            orderNumber: order.production_order,
            dueDate: new Date().toISOString(),
            orderQuantity: order.required_qty,
            completedQuantity: Math.floor(order.required_qty * 0.6),
            remainingQuantity: Math.ceil(order.required_qty * 0.4),
            partnumber: order.part_number,
            partname: order.material_description,
            parameters: {
              orderNumber: order.production_order,
              customer: order.sales_order.split('/')[0] || 'BEL',
              dueDate: new Date().toISOString()
            }
          },
          machine: {
            ...data.machine,
            status: 'IDLE',
            efficiency: 92,
            currentCycle: '02:45',
            nextMaintenance: '4hrs',
            alerts: 0,
            totalParts: order.required_qty,
            completedParts: Math.floor(order.required_qty * 0.6)
          },
          quality: {
            inspectionPoints: 5,
            completedInspections: 3,
            lastInspection: '11:30 AM',
            deviations: 0
          }
        };

        // Store job data
        localStorage.setItem('currentJobData', JSON.stringify(currentJob));
      }

      set({ 
        machineOperations: formattedOperations,
        jobData: currentJob,
        loading: false 
      });

      return {
        success: true,
        data: {
          operations: formattedOperations,
          orders: data.orders,
          jobData: currentJob
        }
      };
    } catch (error) {
      console.error('Error fetching machine operations:', error);
      
      // Try to load from localStorage on error
      const storedOperations = localStorage.getItem('operationsData');
      const storedJobData = localStorage.getItem('currentJobData');
      
      if (storedOperations && storedJobData) {
        const parsedOperations = JSON.parse(storedOperations);
        const parsedJobData = JSON.parse(storedJobData);
        
        set({
          machineOperations: parsedOperations,
          jobData: parsedJobData,
          loading: false
        });
        
        return {
          success: true,
          data: {
            operations: parsedOperations,
            jobData: parsedJobData,
            orders: [parsedJobData] // Include orders for consistency
          }
        };
      }
      
      set({ loading: false });
      throw error;
    }
  },

  submitMachineIssue: async (machineId, payload) => {
    try {
      set({ maintenanceLoading: true });
      console.log(`Submitting machine issue for machine ID: ${machineId}`, payload);
      
      const response = await fetch(
        `http://172.18.7.88:4422/api/v1/maintainance/operator/machine-update/${machineId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: payload.description,
            is_on: payload.machineStatus === 'ON'
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit machine issue: ${errorText}`);
      }

      const data = await response.json();
      console.log('Machine issue submission response:', data);
      
      return {
        success: true,
        data,
        message: 'Machine status updated successfully'
      };
    } catch (error) {
      console.error('Error submitting machine issue:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update machine status'
      };
    } finally {
      set({ maintenanceLoading: false });
    }
  },

  submitComponentIssue: async (partNumber, payload) => {
    if (!partNumber) {
      console.error('No part number provided for component issue');
      return {
        success: false,
        error: 'No part number available',
        message: 'Failed to update component status: No part number available'
      };
    }
    
    try {
      set({ maintenanceLoading: true });
      console.log(`Submitting component issue for part number: ${partNumber}`, payload);
      
      const response = await fetch(
        `http://172.18.7.88:4422/api/v1/maintainance/operator/raw-material-update/${partNumber}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: payload.description,
            is_available: payload.componentStatus === 'available'
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit component issue: ${errorText}`);
      }

      const data = await response.json();
      console.log('Component issue submission response:', data);
      
      return {
        success: true,
        data,
        message: 'Component status updated successfully'
      };
    } catch (error) {
      console.error('Error submitting component issue:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update component status'
      };
    } finally {
      set({ maintenanceLoading: false });
    }
  },

  fetchDocuments: async (partNumber) => {
    try {
      set({ loading: true });
      const token = useAuthStore.getState().token;

      const response = await fetch(
        `http://172.18.7.88:4422/api/v1/document-management/documents/by-part-number-all/${partNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      set({ 
        documents: {
          mpp: data.mpp_document,
          oarc: data.oarc_document,
          engineering: data.engineering_drawing_document,
          ipid: data.ipid_document
        },
        loading: false 
      });
      return data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      set({ loading: false });
      return null;
    }
  },

  downloadDocument: async (partNumber, docType) => {
    try {
      const token = useAuthStore.getState().token;

      const response = await fetch(
        `http://172.18.7.88:4422/api/v1/document-management/documents/download-latest/${partNumber}/${docType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docType}_${partNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  },

  fetchMppDetails: async (partNumber, operationNumber) => {
    try {
      const response = await fetch(
        `http://172.18.7.88:4422/api/v1/mpp/by-part/${partNumber}/${operationNumber}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch MPP details');
      }

      const data = await response.json();
      return {
        success: true,
        data: data[0] || null // Get first entry if exists
      };
    } catch (error) {
      console.error('Error fetching MPP details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  fetchOperationDocuments: async (partNumber, operationNumber) => {
    try {
      set({ documentLoading: true, documentError: null });
      
      if (!partNumber) {
        throw new Error('Part number is required');
      }

      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Fetch documents first
      const response = await fetch(
        `http://172.18.7.88:4422/api/v1/document-management/documents/by-part-number-all/${partNumber}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if all document types are null and there are no documents in all_documents array
      const hasDocuments = data.mpp_document || 
                          data.ipid_document || 
                          data.engineering_drawing_document || 
                          data.oarc_document || 
                          data.fixture_document ||
                          (data.all_documents && data.all_documents.length > 0);
      
      let mppData = null;
      
      // If operation number is provided, always try to fetch MPP data regardless of document status
      if (operationNumber) {
        try {
          console.log(`Fetching MPP data for part ${partNumber}, operation ${operationNumber}`);
          const mppResponse = await fetch(
            `http://172.18.7.88:4422/api/v1/mpp/by-part/${partNumber}/${operationNumber}`
          );
          
          if (mppResponse.ok) {
            const mppResult = await mppResponse.json();
            if (mppResult && mppResult.length > 0) {
              mppData = mppResult[0]; // Get first entry
              console.log('MPP data fetched successfully:', mppData);
            }
          }
        } catch (mppError) {
          console.error('Error fetching MPP details:', mppError);
          // Don't throw, just log the error and continue with null mppData
        }
      }

      const formattedDocs = {
        mpp: data.mpp_document || null,
        ipid: data.ipid_document || null,
        engineering: data.engineering_drawing_document || null,
        oarc: data.oarc_document || null,
        fixture: data.fixture_document || null,
        hasDocuments: hasDocuments,
        mppData: mppData // Add MPP data to the response
      };

      set({ 
        operationDocuments: formattedDocs,
        documentLoading: false 
      });

      return {
        success: true,
        data: formattedDocs
      };
    } catch (error) {
      console.error('Error fetching operation documents:', error);
      set({ 
        documentError: error.message,
        documentLoading: false 
      });
      return {
        success: false,
        error: error.message
      };
    }
  },

  clearOperationDocuments: () => {
    set({ 
      operationDocuments: null,
      documentError: null 
    });
  },

  fetchOperationDetails: async (machineId, operationNumber, partNumber) => {
    try {
      set({ loading: true, documentError: null });
      
      const token = useAuthStore.getState().token;

      // Fetch both operation and document data in parallel
      const [operationsResponse, documentsResponse] = await Promise.all([
        fetch(`http://172.18.7.88:4422/api/v1/operator/machines/${machineId}/operations`),
        fetch(
          `http://172.18.7.88:4422/api/v1/document-management/documents/by-part-number-all/${partNumber}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        )
      ]);

      if (!operationsResponse.ok || !documentsResponse.ok) {
        throw new Error('Failed to fetch operation details');
      }

      const [operationsData, documentsData] = await Promise.all([
        operationsResponse.json(),
        documentsResponse.json()
      ]);

      // Find the specific operation
      const operation = [
        ...(operationsData.operations.completed || []),
        ...(operationsData.operations.inprogress || []),
        ...(operationsData.operations.scheduled || [])
      ].find(op => op.operation_number === operationNumber);

      if (!operation) {
        throw new Error('Operation not found');
      }

      // Combine operation and document data
      const combinedData = {
        operation: {
          ...operation,
          documents: {
            mpp: documentsData.mpp_document,
            ipid: documentsData.ipid_document,
            engineering: documentsData.engineering_drawing_document,
            oarc: documentsData.oarc_document,
            fixture: documentsData.fixture_document
          }
        }
      };

      set({
        operationDocuments: combinedData.operation.documents,
        loading: false
      });

      return {
        success: true,
        data: combinedData
      };

    } catch (error) {
      console.error('Error fetching operation details:', error);
      set({ 
        documentError: error.message,
        loading: false 
      });
      return {
        success: false,
        error: error.message
      };
    }
  },

  downloadDocumentById: async (documentId) => {
    try {
      set({ documentLoading: true });
      
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log(`Downloading document with ID: ${documentId}`);
      
      // Make sure we're using the correct endpoint URL
      const endpoint = `http://172.18.7.88:4422/api/v1/document-management/documents/${documentId}/download-latest`;
      console.log(`Making request to: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set content-type for file downloads
          'Accept': '*/*'
        }
      });

      if (!response.ok) {
        console.error(`Download failed with status: ${response.status}`);
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to download document: ${response.statusText}`);
      }

      console.log('Download response received, creating blob...');
      // Create a blob from the response and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document_${documentId}.pdf`;  // Default name
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('Document download completed successfully');
      set({ documentLoading: false });
      
      return {
        success: true,
        message: 'Document downloaded successfully'
      };
    } catch (error) {
      console.error('Error downloading document:', error);
      set({ 
        documentError: error.message,
        documentLoading: false 
      });
      return {
        success: false,
        error: error.message
      };
    }
  },

  openDocumentInNewTab: async (documentId) => {
    try {
      set({ documentLoading: true });
      
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log(`Opening document with ID: ${documentId} in new tab`);
      
      // Create the endpoint URL - same as in downloadDocumentById
      const endpoint = `http://172.18.7.88:4422/api/v1/document-management/documents/${documentId}/download-latest`;
      
      // Open in new tab and handle the request there
      const newWindow = window.open('', '_blank');
      
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Loading Document...</title>
              <style>
                body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; }
                .loader { border: 5px solid #f3f3f3; border-radius: 50%; border-top: 5px solid #3498db; width: 50px; height: 50px; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              </style>
            </head>
            <body>
              <div class="loader"></div>
              <script>
                fetch('${endpoint}', {
                  headers: {
                    'Authorization': 'Bearer ${token}'
                  }
                })
                .then(response => {
                  if (!response.ok) throw new Error('Failed to load document');
                  return response.blob();
                })
                .then(blob => {
                  const objectUrl = URL.createObjectURL(blob);
                  window.location.href = objectUrl;
                })
                .catch(error => {
                  document.body.innerHTML = '<div style="color:red">Error loading document: ' + error.message + '</div>';
                });
              </script>
            </body>
          </html>
        `);
        
        set({ documentLoading: false });
        return { success: true };
      } else {
        throw new Error('Could not open new tab. Please check browser settings.');
      }
    } catch (error) {
      console.error('Error opening document in new tab:', error);
      set({ 
        documentError: error.message,
        documentLoading: false 
      });
      return {
        success: false,
        error: error.message
      };
    }
  },
}));

export default useWebSocketStore; 