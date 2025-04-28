import { create } from 'zustand';
import useAuthStore from './auth-store';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

    const ws = new WebSocket('ws://172.18.7.88:3502/production_monitoring/ws/live-status/');
    
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
            // console.log('Starting idle timer - Machine ON but not in production');
            if (!get().idleStartTime) {
              set({ idleStartTime: Date.now() });
            }
          } else if (newStatus === 'OFF') {
            // Stop timer when machine is OFF
            // console.log('Stopping idle timer - Machine OFF');
            set({ idleStartTime: null });
          } else if (isInProduction || newStatus === 'PRODUCTION') {
            // Reset timer when in production
            // console.log('Resetting idle timer - Machine in production');
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
      // console.log('WebSocket Connected Successfully');
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
      // console.log(`WebSocket Disconnected: ${event.code} ${event.reason}`);
      set({ isConnected: false, socket: null });
      
      // Only attempt to reconnect if it wasn't intentionally closed
      const { reconnectAttempts, maxReconnectAttempts, reconnectDelay } = get();
      
      if (reconnectAttempts < maxReconnectAttempts) {
        // console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttempts})...`);
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
      // console.log('Closing WebSocket connection');
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

  getMachineId: () => {
    try {
      const storedMachine = localStorage.getItem('currentMachine');
      if (storedMachine) {
        const machineData = JSON.parse(storedMachine);
        return machineData.id;
      }
    } catch (error) {
      console.error('Error getting machine ID:', error);
    }
    return null;
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
        `http://172.18.7.88:3502/api/v1/operator/machines/${machineId}/operations`
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

      // Validate required fields
      if (!payload.created_by) {
        throw new Error('User ID is required');
      }

      if (!machineId) {
        throw new Error('Machine ID is required');
      }

      const response = await fetch(
        `http://172.18.7.88:3502/api/v1/maintainance/operator/machine-update/${machineId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: payload.description || '',
            is_on: Boolean(payload.is_on),
            created_by: payload.created_by
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit machine issue');
      }

      const data = await response.json();
      return {
        success: true,
        data,
        message: 'Machine status updated successfully'
      };
    } catch (error) {
      console.error('Error submitting machine issue:', error);
      return {
        success: false,
        error: error.message || 'Failed to update machine status',
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

    // Validate user ID
    if (!payload.created_by) {
      return {
        success: false,
        error: 'User ID is required',
        message: 'Please log in to submit component issues'
      };
    }
    
    try {
      set({ maintenanceLoading: true });
      
      const response = await fetch(
        `http://172.18.7.88:3502/api/v1/maintainance/operator/raw-material-update/${partNumber}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: payload.description,
            is_available: payload.componentStatus === 'available',
            created_by: payload.created_by
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit component issue: ${errorText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          id: data.id,
          childPartNumber: data.child_part_number,
          description: data.description,
          quantity: data.quantity,
          unitName: data.unit_name,
          statusName: data.status_name,
          availableFrom: data.available_from,
          orders: data.orders
        },
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

  submitBreakdownIssue: async (values) => {
    const machineId = get().getMachineId();
    if (!machineId) {
      toast.error('No machine ID available');
      return;
    }

    const payload = {
      machine_id: machineId,
      category: values.breakdownCategory.charAt(0).toUpperCase() + values.breakdownCategory.slice(1), // Capitalize category
      description: values.breakdownReason.join(', '), // Join selected reasons
      priority: 0, // Set priority as needed
      reported_by: useAuthStore.getState().user_id 
    };

    try {
      const response = await fetch('http://172.18.7.88:3502/api/v1/maintainance/downtimes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(errorText.detail || 'Failed to submit breakdown issue');
      }

      const data = await response.json();
      // console.log('Breakdown issue submission response:', data);
      // toast.success('Breakdown issue submitted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error submitting breakdown issue:', error);
      toast.error(error.message || 'Failed to submit breakdown issue');
      return { success: false };
    }
  },

  fetchDocuments: async (partNumber) => {
    try {
      set({ loading: true });
      const token = useAuthStore.getState().token;

      const response = await fetch(
        `http://172.18.7.88:3502/api/v1/document-management/documents/by-part-number-all/${partNumber}`,
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
        `http://172.18.7.88:3502/api/v1/document-management/documents/download-latest/${partNumber}/${docType}`,
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
        `http://172.18.7.88:3502/api/v1/mpp/by-part/${partNumber}/${operationNumber}`
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
  }
}));

export default useWebSocketStore; 
























