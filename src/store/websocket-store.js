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

  initializeWebSocket: (machineId) => {
    if (!machineId) {
      // Try to get machine ID from localStorage
      const storedMachine = localStorage.getItem('currentMachine');
      if (storedMachine) {
        try {
          const machineData = JSON.parse(storedMachine);
          machineId = machineData.id;
        } catch (error) {
          console.error('Error parsing stored machine data:', error);
          return;
        }
      } else {
        console.error('No machine ID provided for WebSocket connection');
        return;
      }
    }

    const currentSocket = get().socket;
    if (currentSocket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      console.log(`Connecting WebSocket for machine: ${machineId}`);
      const ws = new WebSocket('ws://172.18.7.155:8002/production_monitoring/ws/live-status/');
      
      ws.onopen = () => {
        console.log('WebSocket Connected Successfully');
        set({ 
          isConnected: true, 
          socket: ws, 
          error: null,
          reconnectAttempts: 0
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Find the machine data that matches the logged-in machine ID
          const machineData = data.find(machine => machine.machine_id === parseInt(machineId));
          
          if (machineData) {
            const prevStatus = get().machineStatus?.status;
            const newStatus = machineData.status;

            // Improved idle timer logic
            if ((newStatus === 'IDLE' || newStatus === 'ON')) {
              // If status is IDLE/ON and we don't have a start time, set one
              if (!get().idleStartTime) {
                console.log('Starting idle timer');
                set({ idleStartTime: Date.now() });
              }
              // Otherwise keep the existing timer running
            } else {
              // For any other status (like PRODUCTION), reset the timer
              if (get().idleStartTime) {
                console.log('Resetting idle timer');
                set({ idleStartTime: null });
              }
            }

            set({ 
              machineStatus: machineData,
              lastUpdate: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
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
    } catch (error) {
      console.error('WebSocket initialization error:', error);
      set({ error: error.message, isConnected: false });
    }
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
        `http://172.18.7.155:8002/api/v1/operator/machines/${machineId}/operations`
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
      
      // Get machine ID from localStorage if not provided
      if (!machineId) {
        const storedMachine = localStorage.getItem('currentMachine');
        if (storedMachine) {
          try {
            const machineData = JSON.parse(storedMachine);
            machineId = machineData.id;
          } catch (error) {
            console.error('Error parsing stored machine data:', error);
            throw new Error('No valid machine ID available');
          }
        }
      }

      if (!machineId) {
        throw new Error('No machine ID available');
      }

      console.log(`Submitting machine issue for machine ID: ${machineId}`, payload);
      
      const response = await fetch(
        `http://172.18.7.155:8002/api/v1/maintainance/operator/machine-update/${machineId}`,
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
        `http://172.18.7.155:8002/api/v1/maintainance/operator/raw-material-update/${partNumber}`,
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
        `http://172.18.7.155:8002/api/v1/document-management/documents/by-part-number-all/${partNumber}`,
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
        `http://172.18.7.155:8002/api/v1/document-management/documents/download-latest/${partNumber}/${docType}`,
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
  }
}));

export default useWebSocketStore; 