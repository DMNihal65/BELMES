import { create } from 'zustand';
import { message } from 'antd';
import { Wrench, Package } from 'lucide-react';



// Centralized API endpoints
const API_BASE_URL = 'http://172.19.224.1:8002/api/v1';
const API_ENDPOINTS = {
  // GET endpoints for notifications
  machineNotifications: `${API_BASE_URL}/newlogsmachine-status-logs`,
  materialNotifications: `${API_BASE_URL}/newlogsraw_material_status_logs`,
  instrumentCalibrationHttp: `${API_BASE_URL}/newlogs/instrument-calibration-logs`,
  machineCalibrationHttp: `${API_BASE_URL}/newlogs/machine-calibration-logs`,
  
  // POST endpoints for acknowledgments
  machineAcknowledge: `${API_BASE_URL}/newlogs/machine-status-logs/acknowledge`,
  materialAcknowledge: `${API_BASE_URL}/notification/material-notification/acknowledge`,
  
  // WebSocket endpoints
  machineWs: `ws://${API_BASE_URL.replace('http://', '')}/notification/ws/machine-notifications`,
  materialWs: `ws://${API_BASE_URL.replace('http://', '')}/notification/ws/material-notifications`,

  // User endpoint
  users: `${API_BASE_URL}/auth/api/v1/auth/users-get?active_only=true`
};

// Utility function to play notification sound
const playNotificationSound = (() => {
  // Access the global flag from the Header component if possible
  // If window exists, add a flag to track whether notification has played
  if (typeof window !== 'undefined' && !window.hasPlayedNotificationSound) {
    window.hasPlayedNotificationSound = false;
  }





  
  
  return () => {
    try {
      // Check if notification has already been played in this session
      if (typeof window !== 'undefined' && window.hasPlayedNotificationSound) {
        console.log('Notification sound already played');
        return;
      }
      
      // Check if already speaking
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        console.log('Speech synthesis already speaking, skipping');
        return;
      }
      
      // Play voice notification
      const utterance = new SpeechSynthesisUtterance("You have a new notification");
      utterance.volume = 1;
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      
      // Mark as played for this session
      if (typeof window !== 'undefined') {
        window.hasPlayedNotificationSound = true;
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };
})();

/**
 * Helper function to generate a consistent unique ID for a notification
 * @param {Object} notification - The notification object
 * @returns {string} A unique ID for the notification
 */
const generateNotificationId = (notification) => {
  const type = notification.notificationType;
  
  if (type === 'machine') {
    // For machine notifications, use machine_id + timestamp
    return `machine-${notification.id || notification.machine_id}-${notification.updated_at}`;
  } else if (type === 'material') {
    // For material notifications, use part_number + timestamp
    return `material-${notification.id || notification.part_number}-${notification.updated_at}`;
  } else if (type === 'instrumentCalibration') {
    // For instrument calibration notifications, use instrument_id + timestamp
    return `instrumentCalibration-${notification.id || notification.instrument_id}-${notification.timestamp}`;
  } else if (type === 'machineCalibration') {
    // For machine calibration notifications, use machine_id + timestamp
    return `machineCalibration-${notification.id || notification.machine_id}-${notification.timestamp}`;
  }
  
  // Fallback
  return `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Helper function to standardize notification object format
 * @param {Object} notification - Raw notification data from API
 * @param {string} type - Either 'machine', 'material', 'instrumentCalibration', or 'machineCalibration'
 * @returns {Object} Standardized notification object
 */
const standardizeNotification = (notification, type) => {
  const baseNotification = {
    ...notification,
    notificationType: type,
    // For calibration notifications, we'll manually set is_acknowledged since backend doesn't have this
    is_acknowledged: type === 'instrumentCalibration' || type === 'machineCalibration' 
      ? notification.is_acknowledged_frontend || false 
      : notification.is_acknowledged || false,
    // Using a consistent approach to handle IDs
    _uniqueId: notification._uniqueId || generateNotificationId({ ...notification, notificationType: type }),
  };
  
  return baseNotification;
};

const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isInitialized: false,
  isLoading: false,
  error: null,
  machineSocket: null,
  materialSocket: null,
  isMachineSocketConnected: false,
  isMaterialSocketConnected: false,
  userMap: new Map(),
  
  // Initialize the store and connect to WebSockets
  initialize: async () => {
    if (get().isInitialized) return;
    
    console.log('Initializing notification store...');
    get().connectWebSockets();
    await get().fetchUsers();
    get().fetchNotifications(false);
    
    set({ isInitialized: true });
  },
  
  // Connect to WebSockets
  connectWebSockets: () => {
    get().connectMachineWebSocket();
    get().connectMaterialWebSocket();
  },
  
  // Connect to Machine WebSocket
  connectMachineWebSocket: () => {
    try {
      // Close existing connection if any
      const existingSocket = get().machineSocket;
      if (existingSocket && existingSocket.readyState !== WebSocket.CLOSED) {
        existingSocket.close();
      }
      
      const socket = new WebSocket(API_ENDPOINTS.machineWs);
      
      socket.onopen = () => {
        console.log('Machine WebSocket connected');
        set({ machineSocket: socket, isMachineSocketConnected: true });
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Machine WebSocket message:', data);
          
          switch (data.type) {
            case 'initial_notifications':
              if (data.notifications && Array.isArray(data.notifications)) {
                // Process initial notifications from WebSocket
                const machineNotifications = data.notifications.map(n => 
                  standardizeNotification(n, 'machine')
                );
                
                // Update the store
                get().updateNotifications(machineNotifications, 'machine');
              }
              break;
              
            case 'new_notification':
              if (data.notification) {
                // Process new notification
                const newNotification = standardizeNotification(data.notification, 'machine');
                
                // Add to store
                get().addNotification(newNotification);
                
                // Show toast
                showMachineNotification(newNotification);
              }
              break;
              
            case 'notification_acknowledged':
              if (data.notification_id) {
                // Process acknowledgment
                get().updateNotificationAcknowledgment(
                  data.notification_id, 
                  'machine',
                  data.acknowledged_by,
                  data.acknowledged_at
                );
              }
              break;
              
            default:
              console.log('Unknown machine notification type:', data.type);
          }
        } catch (error) {
          console.error('Error processing machine WebSocket message:', error);
        }
      };
      
      socket.onclose = () => {
        console.log('Machine WebSocket disconnected');
        set({ isMachineSocketConnected: false });
        
        // Auto-reconnect after delay
        setTimeout(() => {
          if (!get().machineSocket || get().machineSocket.readyState === WebSocket.CLOSED) {
            console.log('Attempting to reconnect machine WebSocket...');
            get().connectMachineWebSocket();
          }
        }, 5000);
      };
      
      socket.onerror = (error) => {
        console.error('Machine WebSocket error:', error);
      };
      
      set({ machineSocket: socket });
    } catch (error) {
      console.error('Error setting up machine WebSocket:', error);
    }
  },






  
  // Connect to Material WebSocket
  connectMaterialWebSocket: () => {
    try {
      // Close existing connection if any
      const existingSocket = get().materialSocket;
      if (existingSocket && existingSocket.readyState !== WebSocket.CLOSED) {
        existingSocket.close();
      }
      
      const socket = new WebSocket(API_ENDPOINTS.materialWs);
      
      socket.onopen = () => {
        console.log('Material WebSocket connected');
        set({ materialSocket: socket, isMaterialSocketConnected: true });
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Material WebSocket message:', data);
          
          switch (data.type) {
            case 'initial_notifications':
              if (data.notifications && Array.isArray(data.notifications)) {
                // Process initial notifications
                const materialNotifications = data.notifications.map(n => 
                  standardizeNotification(n, 'material')
                );
                
                // Update the store
                get().updateNotifications(materialNotifications, 'material');
              }
              break;
              
            case 'new_notification':
              if (data.notification) {
                // Process new notification
                const newNotification = standardizeNotification(data.notification, 'material');
                
                // Add to store
                get().addNotification(newNotification);
                
                // Show toast
                showMaterialNotification(newNotification);
              }
              break;
              
            case 'notification_acknowledged':
              if (data.notification_id) {
                // Process acknowledgment
                get().updateNotificationAcknowledgment(
                  data.notification_id, 
                  'material',
                  data.acknowledged_by,
                  data.acknowledged_at
                );
              }
              break;
              
            default:
              console.log('Unknown material notification type:', data.type);
          }
        } catch (error) {
          console.error('Error processing material WebSocket message:', error);
        }
      };
      
      socket.onclose = () => {
        console.log('Material WebSocket disconnected');
        set({ isMaterialSocketConnected: false });
        
        // Auto-reconnect after delay
        setTimeout(() => {
          if (!get().materialSocket || get().materialSocket.readyState === WebSocket.CLOSED) {
            console.log('Attempting to reconnect material WebSocket...');
            get().connectMaterialWebSocket();
          }
        }, 5000);
      };
      
      socket.onerror = (error) => {
        console.error('Material WebSocket error:', error);
      };
      
      set({ materialSocket: socket });
    } catch (error) {
      console.error('Error setting up material WebSocket:', error);
    }
  },
  
  // Disconnect WebSockets
  disconnectWebSockets: () => {
    try {
      const machineSocket = get().machineSocket;
      if (machineSocket) {
        machineSocket.close();
      }
      
      const materialSocket = get().materialSocket;
      if (materialSocket) {
        materialSocket.close();
      }
      
      set({ 
        machineSocket: null, 
        materialSocket: null,
        isMachineSocketConnected: false,
        isMaterialSocketConnected: false
      });
      
      console.log('WebSockets disconnected');
    } catch (error) {
      console.error('Error disconnecting WebSockets:', error);
    }
  },


  
  // Fetch notifications from the API
  fetchNotifications: async (showErrorMessages = false) => {
    try {
      set({ isLoading: true, error: null });
      console.log('🔄 Fetching notifications...');
      
      // Fetch from all endpoints in parallel
      const [
        machineResponse, 
        materialResponse, 
        instrumentCalibrationResponse,
        machineCalibrationResponse
      ] = await Promise.all([
        fetch(API_ENDPOINTS.machineNotifications, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(API_ENDPOINTS.materialNotifications, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(API_ENDPOINTS.instrumentCalibrationHttp, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(API_ENDPOINTS.machineCalibrationHttp, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      // Process machine notifications
      let allNotifications = [];
      
      if (machineResponse.ok) {
        const machineData = await machineResponse.json();
        console.log('Machine notifications response:', machineData); // Debug log
        const machineNotifications = (machineData.notifications || []).map(n => 
          standardizeNotification({
            ...n,
            is_acknowledged: n.is_acknowledged || false, // Ensure is_acknowledged is properly set
            notificationType: 'machine'
          }, 'machine')
        );
        allNotifications = [...allNotifications, ...machineNotifications];
      } else if (showErrorMessages) {
        console.error('Failed to fetch machine notifications:', machineResponse.statusText);
      }
      
      // Process material notifications
      if (materialResponse.ok) {
        const materialData = await materialResponse.json();
        console.log('Material notifications response:', materialData); // Debug log
        const materialNotifications = (materialData.notifications || []).map(n => 
          standardizeNotification({
            ...n,
            is_acknowledged: n.is_acknowledged || false, // Ensure is_acknowledged is properly set
            notificationType: 'material'
          }, 'material')
        );
        allNotifications = [...allNotifications, ...materialNotifications];
      } else if (showErrorMessages) {
        console.error('Failed to fetch material notifications:', materialResponse.statusText);
      }
      
      // Process instrument calibration notifications
      if (instrumentCalibrationResponse.ok) {
        const instrumentCalibrationData = await instrumentCalibrationResponse.json();
        const instrumentCalibrationNotifications = (instrumentCalibrationData || []).map(n => 
          standardizeNotification({
            ...n,
            is_acknowledged: false,
            notificationType: 'instrumentCalibration',
            instrument_details: n.instrument_details || {}
          }, 'instrumentCalibration')
        );
        allNotifications = [...allNotifications, ...instrumentCalibrationNotifications];
      } else if (showErrorMessages) {
        console.error('Failed to fetch instrument calibration notifications:', instrumentCalibrationResponse.statusText);
      }
      
      // Process machine calibration notifications
      if (machineCalibrationResponse.ok) {
        const machineCalibrationData = await machineCalibrationResponse.json();
        const machineCalibrationNotifications = (machineCalibrationData || []).map(n => 
          standardizeNotification({
            ...n,
            is_acknowledged: false,
            notificationType: 'machineCalibration',
            machine_name: n.machine_details?.make || 'Unknown',
            machine_type: n.machine_details?.type || 'Unknown'
          }, 'machineCalibration')
        );
        allNotifications = [...allNotifications, ...machineCalibrationNotifications];
      } else if (showErrorMessages) {
        console.error('Failed to fetch machine calibration notifications:', machineCalibrationResponse.statusText);
      }
      
      // Replace the entire notifications collection
      get().setNotifications(allNotifications);
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      
      set({ 
        isLoading: false, 
        error: 'Failed to fetch notifications'
      });
      
      if (showErrorMessages) {
        message.error('Failed to fetch notifications. Please try again.');
      }
      
      return false;
    }
  },
  
  // Set the entire notifications collection
  setNotifications: (notifications) => {
    // Create a Map to efficiently merge and deduplicate notifications
    const notificationMap = new Map();
    
    // First, add existing notifications to the map
    get().notifications.forEach(notification => {
      notificationMap.set(notification._uniqueId, notification);
    });
    
    // Then, merge in the new notifications, overwriting duplicates
    notifications.forEach(notification => {
      notificationMap.set(notification._uniqueId, notification);
    });
    
    // Convert back to array and sort by date
    const mergedNotifications = Array.from(notificationMap.values()).sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );
    
    // Update the store
    const unreadCount = mergedNotifications.filter(n => !n.is_acknowledged).length;
    
    set({ 
      notifications: mergedNotifications,
      unreadCount
    });
    
    console.log(`📊 Notifications updated: ${mergedNotifications.length} total, ${unreadCount} unread`);
  },
  
  // Add a new notification
  addNotification: (notification) => {
    set(state => {
      // Standardize the notification
      const standardizedNotification = standardizeNotification(
        notification, 
        notification.notificationType
      );
      
      // Check if this notification already exists
      const existingIndex = state.notifications.findIndex(
        n => n._uniqueId === standardizedNotification._uniqueId
      );
      
      let updatedNotifications;
      
      if (existingIndex >= 0) {
        // Update existing notification
        updatedNotifications = [...state.notifications];
        updatedNotifications[existingIndex] = standardizedNotification;
      } else {
        // Add new notification
        updatedNotifications = [standardizedNotification, ...state.notifications];
      }
      
      // Sort by date
      updatedNotifications.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      
      // Calculate unread count
      const unreadCount = updatedNotifications.filter(n => !n.is_acknowledged).length;
      
      return { 
        notifications: updatedNotifications,
        unreadCount
      };
    });
  },
  
  // Update notifications of a specific type
  updateNotifications: (notifications, type) => {
    if (!Array.isArray(notifications) || notifications.length === 0) return;
    
    set(state => {
      // Remove existing notifications of this type
      const otherTypeNotifications = state.notifications.filter(
        n => n.notificationType !== type
      );
      
      // Standardize all new notifications
      const standardizedNotifications = notifications.map(n => 
        standardizeNotification(n, type)
      );
      
      // Combine and sort
      const updatedNotifications = [...otherTypeNotifications, ...standardizedNotifications]
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      
      // Calculate unread count
      const unreadCount = updatedNotifications.filter(n => !n.is_acknowledged).length;
      
      return { 
        notifications: updatedNotifications,
        unreadCount
      };
    });
  },
  
  // Update a notification's acknowledgment status
  updateNotificationAcknowledgment: (notificationId, type, acknowledgedBy, acknowledgedAt, message) => {
    set(state => {
      const updatedNotifications = state.notifications.map(notification => {
        // Match by ID and type
        const matchesId = () => {
          if (type === 'machine' && notification.notificationType === 'machine') {
            return notification.id === notificationId || notification.machine_id === notificationId;
          } else if (type === 'material' && notification.notificationType === 'material') {
            return notification.id === notificationId;
          }
          return false;
        };
        
        if (matchesId()) {
          return {
            ...notification,
            is_acknowledged: true,
            acknowledged_by: acknowledgedBy || notification.acknowledged_by || '',
            acknowledged_at: acknowledgedAt || new Date().toISOString(),
            acknowledgment_message: message || 'Notification acknowledged'
          };
        }
        
        return notification;
      });
      
      // Calculate unread count
      const unreadCount = updatedNotifications.filter(n => !n.is_acknowledged).length;
      
      return { 
        notifications: updatedNotifications,
        unreadCount
      };
    });
  },
  
  // Mark a notification as read/acknowledged
  markAsRead: async (notification) => {
    if (!notification) return false;
    
    try {
      // Skip acknowledgment for instrument and machine calibration notifications
      if (notification.notificationType === 'instrumentCalibration' || 
          notification.notificationType === 'machineCalibration') {
        console.log('Acknowledgment not required for this notification type:', notification.notificationType);
        return true;
      }
      
      // Get username for acknowledgment - get the actual logged in user's name
      const username = localStorage.getItem('name') || localStorage.getItem('username') || '';
      
      // Update UI state for both machine and material notifications
      get().updateNotificationAcknowledgment(
        notification.id,
        notification.notificationType,
        username,
        new Date().toISOString(),
        'Notification acknowledged'
      );
      
      return true;
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      message.error('Failed to acknowledge notification');
      return false;
    }
  },
  
  // Mark all unacknowledged notifications as read
  markAllAsRead: async () => {
    // Filter out calibration notifications since they don't need acknowledgment
    const unacknowledgedNotifications = get().notifications.filter(n => 
      !n.is_acknowledged && 
      n.notificationType !== 'instrumentCalibration' && 
      n.notificationType !== 'machineCalibration'
    );
    
    if (unacknowledgedNotifications.length === 0) return true;
    
    try {
      let success = true;
      
      // Process in batches to avoid overwhelming the server
      for (const notification of unacknowledgedNotifications) {
        try {
          await get().markAsRead(notification);
        } catch (error) {
          console.error('Error in markAllAsRead for notification:', notification, error);
          success = false;
          // Continue with other notifications even if one fails
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      message.error('Some notifications could not be acknowledged');
      return false;
    }
  },
  
  // Clear all notifications (for testing/debugging)
  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  // Add new function to fetch users
  fetchUsers: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.users, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      const userMap = new Map();
      
      // Create a map of user IDs to user names
      if (Array.isArray(data)) {
        data.forEach(user => {
          // Map both id and _id to handle different response formats
          if (user.id) {
            userMap.set(user.id.toString(), user.name || user.username || user.email);
          }
          if (user._id) {
            userMap.set(user._id.toString(), user.name || user.username || user.email);
          }
        });
      } else if (data.users && Array.isArray(data.users)) {
        // Handle case where users are nested in a users property
        data.users.forEach(user => {
          if (user.id) {
            userMap.set(user.id.toString(), user.name || user.username || user.email);
          }
          if (user._id) {
            userMap.set(user._id.toString(), user.name || user.username || user.email);
          }
        });
      }

      // console.log('User map created:', Object.fromEntries(userMap));
      set({ userMap });
      return userMap;
    } catch (error) {
      console.error('Error fetching users:', error);
      return new Map();
    }
  }
}));

// Helper function to show machine notification toast
const showMachineNotification = (() => {
  // Set to track which notifications we've already shown
  const shownNotifications = new Set();
  
  return (notification) => {
    // Generate a unique identifier for this notification
    const notificationId = `machine-${notification.id || notification.machine_id}-${notification.updated_at}`;
    
    // Check if we've already shown this notification
    if (shownNotifications.has(notificationId)) {
      console.log('This notification has already been shown:', notificationId);
      return;
    }
    
    // Add to shown set
    shownNotifications.add(notificationId);
    
    // Generate toast key
    const key = `machine-${notification.id || notification.machine_id}-${Date.now()}`;
    
    // Play notification sound only on first notification
    if (shownNotifications.size === 1) {
      playNotificationSound();
    }
    
    message.info({
      key,
      content: `Machine Update: ${notification.status_name} - ${notification.description || 'No description'} (${notification.machine_make} #${notification.machine_id})`,
      duration: 10,
      style: {
        borderLeft: '4px solid #1890ff',
        padding: '12px',
        marginTop: '12px'
      }
    });
  };
})();

// Helper function to show material notification toast
const showMaterialNotification = (() => {
  // Set to track which notifications we've already shown
  const shownNotifications = new Set();
  
  return (notification) => {
    // Generate a unique identifier for this notification
    const notificationId = `material-${notification.id || notification.part_number}-${notification.updated_at}`;
    
    // Check if we've already shown this notification
    if (shownNotifications.has(notificationId)) {
      console.log('This notification has already been shown:', notificationId);
      return;
    }
    
    // Add to shown set
    shownNotifications.add(notificationId);
    
    // Generate toast key
    const key = `material-${notification.id || notification.part_number}-${Date.now()}`;
    
    // Play notification sound only on first notification
    if (shownNotifications.size === 1) {
      playNotificationSound();
    }
    
    message.info({
      key,
      content: `Material Update: ${notification.status_name} - ${notification.description || 'No description'} (Part #${notification.part_number})`,
      duration: 10,
      style: {
        borderLeft: '4px solid #52c41a',
        padding: '12px',
        marginTop: '12px'
      }
    });
  };
})();

export default useNotificationStore; 












//testing///////////////





















