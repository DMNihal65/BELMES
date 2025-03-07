import { create } from 'zustand';

const useWebSocketStore = create((set, get) => ({
  machineStatus: null,
  isConnected: false,
  error: null,
  socket: null,
  lastUpdate: null,
  idleStartTime: null,

  initializeWebSocket: (machineId) => {
    const currentSocket = get().socket;
    if (currentSocket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      console.log(`Connecting WebSocket for machine: ${machineId}`);
      const ws = new WebSocket('ws://172.18.7.89:4470/production_monitoring/ws/live-status/');
      
      ws.onopen = () => {
        console.log('WebSocket Connected');
        set({ 
          isConnected: true, 
          socket: ws, 
          error: null 
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const machineData = data.find(machine => machine.machine_id === parseInt(machineId));
          
          if (machineData) {
            const prevStatus = get().machineStatus?.status;
            const newStatus = machineData.status;

            // Handle idle timer
            if ((newStatus === 'IDLE' || newStatus === 'ON') && !get().idleStartTime) {
              set({ idleStartTime: Date.now() });
            } else if (newStatus === 'PRODUCTION') {
              set({ idleStartTime: null });
            }

            set({ 
              machineStatus: machineData,
              lastUpdate: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        set({ error: 'Connection error', isConnected: false });
      };

      ws.onclose = () => {
        console.log('WebSocket Disconnected');
        set({ 
          isConnected: false, 
          socket: null,
          error: 'Connection closed'
        });
        
        // Only attempt to reconnect if it wasn't intentionally closed
        if (get().socket) {
          setTimeout(() => {
            get().initializeWebSocket(machineId);
          }, 3000);
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
      socket.close();
      set({ 
        socket: null, 
        isConnected: false,
        machineStatus: null,
        error: null,
        idleStartTime: null
      });
    }
  },

  getIdleTime: () => {
    const { idleStartTime } = get();
    if (!idleStartTime) return 0;
    return Math.floor((Date.now() - idleStartTime) / 1000);
  }
}));

export default useWebSocketStore; 