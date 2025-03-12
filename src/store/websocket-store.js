import { create } from 'zustand';

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

  initializeWebSocket: (machineId) => {
    if (!machineId) {
      console.error('No machine ID provided for WebSocket connection');
      return;
    }

    const currentSocket = get().socket;
    if (currentSocket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      console.log(`Connecting WebSocket for machine: ${machineId}`);
      const ws = new WebSocket('ws://172.18.7.89:4470/production_monitoring/ws/live-status/');
      
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
      set({ maintenanceLoading: true });
      console.log(`Fetching operations for machine ID: ${machineId}`);
      
      const response = await fetch(
        `http://172.18.7.85:6768/api/v1/operator/machines/${machineId}/operations`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch machine operations: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Machine operations data:', data);
      
      set({ 
        machineOperations: data,
        maintenanceLoading: false
      });

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error fetching machine operations:', error);
      set({ maintenanceLoading: false });
      return {
        success: false,
        error: error.message
      };
    }
  },

  submitMachineIssue: async (machineId, payload) => {
    try {
      set({ maintenanceLoading: true });
      console.log(`Submitting machine issue for machine ID: ${machineId}`, payload);
      
      const response = await fetch(
        `http://172.18.7.85:6768/api/v1/maintainance/operator/machine-update/${machineId}`,
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
        `http://172.18.7.85:6768/api/v1/maintainance/operator/raw-material-update/${partNumber}`,
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
  }
}));

export default useWebSocketStore; 