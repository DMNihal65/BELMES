import { create } from 'zustand';
import { message } from 'antd';
import { LogOut, Menu as MenuIcon, Search, User, Bell, Wrench, Package } from 'lucide-react';

// Centralized API endpoints
const API_BASE_URL = 'http://172.18.7.89:7000/api/v1';
const API_ENDPOINTS = {
  // GET endpoints for supervisor
  machineNotifications: 'http://172.18.7.89:7000/api/v1/maintainance/supervisor/machine-notifications/',
  materialNotifications: `${API_BASE_URL}/maintainance/supervisor/raw-material-notifications`,
  // POST endpoints for operator updates
  machineUpdate: `${API_BASE_URL}/maintainance/operator/machine-update`,
  materialUpdate: `${API_BASE_URL}/maintainance/operator/raw-material-update`,
  // WebSocket endpoints remain the same
  machineWs: `ws://172.18.7.89:7000/api/v1/notification/ws/machine-notifications`,
  materialWs: `ws://172.18.7.89:7000/api/v1/notification/ws/material-notifications`,
  // Add these new endpoints
  machineUnacknowledged: 'http://172.18.7.89:7000/api/v1/notification/machine-notifications/unacknowledged',
  materialUnacknowledged: 'http://172.18.7.89:7000/api/v1/notification/material-notifications/unacknowledged'
};

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  machineSocket: null,
  materialSocket: null,
  isMachineSocketConnected: false,
  isMaterialSocketConnected: false,
  machineRetryCount: 0,
  materialRetryCount: 0,
  
  // Connect to WebSockets
  connectWebSockets: () => {
    // Connect to both WebSocket endpoints
    get().connectMachineWebSocket();
    get().connectMaterialWebSocket();
    
    // Fetch initial notifications from both endpoints
    // Pass false to prevent showing error messages on initial load
    get().fetchNotifications(false);
  },
  
  // Connect to Machine WebSocket
  connectMachineWebSocket: () => {
    const token = localStorage.getItem('token');
    
    // Close existing connection if any
    if (get().machineSocket) {
      get().machineSocket.close();
    }
    
    try {
      const socket = new WebSocket(API_ENDPOINTS.machineWs);
      
      socket.onopen = () => {
        // console.log('Machine WebSocket connected');
        set({ 
          machineSocket: socket, 
          isMachineSocketConnected: true,
          machineRetryCount: 0
        });
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // console.log('Machine notification received:', data);
          
          // Handle different message types
          switch (data.type) {
            case 'initial_notifications':
              if (data.notifications && Array.isArray(data.notifications)) {
                // Handle initial notifications list - add source type to each notification
                const machineNotifications = data.notifications.map(notification => ({
                  ...notification,
                  notificationType: 'machine'
                }));
                
                // Merge with existing notifications
                set((state) => {
                  // Filter out machine notifications from current list
                  const currentMaterialNotifications = state.notifications.filter(
                    n => n.notificationType === 'material'
                  );
                  
                  // Combine and sort by updated_at descending
                  const allNotifications = [...machineNotifications, ...currentMaterialNotifications]
                    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
                  
                  // Count unread
                  const unreadCount = allNotifications.filter(n => !n.is_acknowledged).length;
                  
                  return { 
                    notifications: allNotifications,
                    unreadCount
                  };
                });
              }
              break;
              
            case 'new_notification':
              if (data.notification) {
                // Add type to the notification
                const machineNotification = {
                  ...data.notification,
                  notificationType: 'machine'
                };
                
                // Add new notification to the list
                set((state) => ({
                  notifications: [machineNotification, ...state.notifications]
                    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
                  unreadCount: state.unreadCount + 1
                }));
                
                // Show toast notification
                showMachineNotification(machineNotification);
              }
              break;
              
            case 'notification_acknowledged':
              if (data.notification_id) {
                // Update acknowledged notification
                set((state) => {
                  const updatedNotifications = state.notifications.map(notification => {
                    // Find the notification by machine_id and updated_at (since there's no explicit id in the sample)
                    if (notification.notificationType === 'machine' && 
                        notification.machine_id === data.notification.machine_id && 
                        notification.updated_at === data.notification.updated_at) {
                      return { 
                        ...notification, 
                        is_acknowledged: true,
                        acknowledged_by: data.acknowledged_by,
                        acknowledged_at: data.acknowledged_at
                      };
                    }
                    return notification;
                  });
                  
                  // Recalculate unread count
                  const unreadCount = updatedNotifications.filter(n => !n.is_acknowledged).length;
                  
                  return { notifications: updatedNotifications, unreadCount };
                });
              }
              break;
              
            default:
              // console.log('Unknown machine notification type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing machine notification:', error);
        }
      };
      
      socket.onclose = (event) => {
        // console.log('Machine WebSocket disconnected');
        set({ isMachineSocketConnected: false });
      };
      
      socket.onerror = (error) => {
        // Just log the error, don't take any action here
        // The onclose handler will handle reconnection
        console.error('Machine WebSocket error:', error);
      };
      
      set({ machineSocket: socket });
    } catch (error) {
      console.error('Error creating machine WebSocket:', error);
    }
  },
  
  // Connect to Material WebSocket
  connectMaterialWebSocket: () => {
    const token = localStorage.getItem('token');
    
    // Close existing connection if any
    if (get().materialSocket) {
      get().materialSocket.close();
    }
    
    try {
      const socket = new WebSocket(API_ENDPOINTS.materialWs);
      
      socket.onopen = () => {
        // console.log('Material WebSocket connected');
        set({ 
          materialSocket: socket, 
          isMaterialSocketConnected: true,
          materialRetryCount: 0
        });
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // console.log('Material notification received:', data);
          
          // Handle different message types
          switch (data.type) {
            case 'initial_notifications':
              if (data.notifications && Array.isArray(data.notifications)) {
                // Handle initial notifications list - add source type to each notification
                const materialNotifications = data.notifications.map(notification => ({
                  ...notification,
                  notificationType: 'material'
                }));
                
                // Merge with existing notifications
                set((state) => {
                  // Filter out material notifications from current list
                  const currentMachineNotifications = state.notifications.filter(
                    n => n.notificationType === 'machine'
                  );
                  
                  // Combine and sort by updated_at descending
                  const allNotifications = [...materialNotifications, ...currentMachineNotifications]
                    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
                  
                  // Count unread
                  const unreadCount = allNotifications.filter(n => !n.is_acknowledged).length;
                  
                  return { 
                    notifications: allNotifications,
                    unreadCount
                  };
                });
              }
              break;
              
            case 'new_notification':
              if (data.notification) {
                // Add type to the notification
                const materialNotification = {
                  ...data.notification,
                  notificationType: 'material'
                };
                
                // Add new notification to the list
                set((state) => ({
                  notifications: [materialNotification, ...state.notifications]
                    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
                  unreadCount: state.unreadCount + 1
                }));
                
                // Show toast notification
                showMaterialNotification(materialNotification);
              }
              break;
              
            case 'notification_acknowledged':
              if (data.notification_id) {
                // Update acknowledged notification
                set((state) => {
                  const updatedNotifications = state.notifications.map(notification => {
                    // Find the notification by id for material notifications
                    if (notification.notificationType === 'material' && 
                        notification.id === data.notification_id) {
                      return { 
                        ...notification, 
                        is_acknowledged: true,
                        acknowledged_by: data.acknowledged_by,
                        acknowledged_at: data.acknowledged_at
                      };
                    }
                    return notification;
                  });
                  
                  // Recalculate unread count
                  const unreadCount = updatedNotifications.filter(n => !n.is_acknowledged).length;
                  
                  return { notifications: updatedNotifications, unreadCount };
                });
              }
              break;
              
            default:
              // console.log('Unknown material notification type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing material notification:', error);
        }
      };
      
      socket.onclose = (event) => {
        // console.log('Material WebSocket disconnected');
        set({ isMaterialSocketConnected: false });
      };
      
      socket.onerror = (error) => {
        // Just log the error, don't take any action here
        // The onclose handler will handle reconnection
        console.error('Material WebSocket error:', error);
      };
      
      set({ materialSocket: socket });
    } catch (error) {
      console.error('Error creating material WebSocket:', error);
    }
  },
  
  // Disconnect WebSockets
  disconnectWebSockets: () => {
    // Disconnect machine socket
    const { machineSocket } = get();
    if (machineSocket) {
      machineSocket.close();
    }
    
    // Disconnect material socket
    const { materialSocket } = get();
    if (materialSocket) {
      materialSocket.close();
    }
    
    set({ 
      machineSocket: null, 
      materialSocket: null,
      isMachineSocketConnected: false,
      isMaterialSocketConnected: false
    });
  },
  
  // Fetch notifications from both APIs
  fetchNotifications: async (showErrorMessage = false) => {
    try {
      // console.log('🔄 Starting to fetch notifications...');
      
      const [
        machineResponse, 
        materialResponse,
        machineUnackResponse, 
        materialUnackResponse
      ] = await Promise.all([
        fetch(API_ENDPOINTS.machineNotifications, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch(API_ENDPOINTS.materialNotifications, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch(API_ENDPOINTS.machineUnacknowledged, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch(API_ENDPOINTS.materialUnacknowledged, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      let allNotifications = [];

      // Process regular machine notifications
      if (machineResponse.ok) {
        const machineData = await machineResponse.json();
        // console.log('🔧 Machine Response:', machineData);
        
        const machineNotifications = (machineData.notifications || [])
          .map(notification => ({
            ...notification,
            notificationType: 'machine',
            is_acknowledged: notification.is_acknowledged || true
          }));
        // console.log('🔧 Processed Machine Notifications:', {
        //   total: machineData.total_notifications,
        //   processed: machineNotifications.length
        // });
        allNotifications = [...allNotifications, ...machineNotifications];
      }

      // Process regular material notifications
      if (materialResponse.ok) {
        const materialData = await materialResponse.json();
        // console.log('📦 Material Response:', materialData);
        
        const materialNotifications = (materialData.notifications || [])
          .map(notification => ({
            ...notification,
            notificationType: 'material',
            is_acknowledged: notification.is_acknowledged || true
          }));
        // console.log('📦 Processed Material Notifications:', {
        //   total: materialData.total_notifications,
        //   processed: materialNotifications.length
        // });
        allNotifications = [...allNotifications, ...materialNotifications];
      }

      // Process unacknowledged machine notifications
      if (machineUnackResponse.ok) {
        const unackMachineData = await machineUnackResponse.json();
        // console.log('🚨 Unacknowledged Machine Response:', unackMachineData);
        
        const unackMachineNotifications = (unackMachineData.notifications || [])
          .map(notification => ({
            ...notification,
            notificationType: 'machine',
            is_acknowledged: false
          }));
        // console.log('🚨 Processed Unack Machine:', {
        //   total: unackMachineData.total_notifications,
        //   processed: unackMachineNotifications.length
        // });
        allNotifications = [...allNotifications, ...unackMachineNotifications];
      }

      // Process unacknowledged material notifications
      if (materialUnackResponse.ok) {
        const unackMaterialData = await materialUnackResponse.json();
        // console.log('🚨 Unacknowledged Material Response:', unackMaterialData);
        
        const unackMaterialNotifications = (unackMaterialData.notifications || [])
          .map(notification => ({
            ...notification,
            notificationType: 'material',
            is_acknowledged: false
          }));
        // console.log('🚨 Processed Unack Material:', {
        //   total: unackMaterialData.total_notifications,
        //   processed: unackMaterialNotifications.length
        // });
        allNotifications = [...allNotifications, ...unackMaterialNotifications];
      }

      // Remove duplicates
      const uniqueNotifications = [...new Map(
        allNotifications.map(item => [
          `${item.notificationType}-${item.id || item.machine_id || item.part_number}-${item.updated_at}`,
          item
        ])
      ).values()];

      // Sort by date
      const sortedNotifications = uniqueNotifications.sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );

      // console.log('📊 Final Notifications:', {
      //   total: sortedNotifications.length,
      //   machine: sortedNotifications.filter(n => n.notificationType === 'machine').length,
      //   material: sortedNotifications.filter(n => n.notificationType === 'material').length,
      //   unacknowledged: sortedNotifications.filter(n => !n.is_acknowledged).length
      // });

      // Update store
      set({ 
        notifications: sortedNotifications,
        unreadCount: sortedNotifications.filter(n => !n.is_acknowledged).length,
        machineCount: sortedNotifications.filter(n => n.notificationType === 'machine').length,
        materialCount: sortedNotifications.filter(n => n.notificationType === 'material').length
      });

    } catch (error) {
      console.error('❌ Error in fetchNotifications:', error);
      if (showErrorMessage) {
        message.error('Failed to fetch notifications. Please try again.');
      }
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: () => {
    set((state) => {
      const updatedNotifications = state.notifications.map(notification => ({
        ...notification,
        is_acknowledged: true,
        acknowledged_by: "current_user", // Replace with actual user name
        acknowledged_at: new Date().toISOString()
      }));
      
      return { notifications: updatedNotifications, unreadCount: 0 };
    });
    
    // Here you could also send a request to the backend to mark all as read
  },
  
  // Mark a specific notification as read
  markAsRead: (notification) => {
    set((state) => {
      const updatedNotifications = state.notifications.map(item => {
        if (notification.notificationType === 'machine' && item.notificationType === 'machine') {
          if (item.machine_id === notification.machine_id && item.updated_at === notification.updated_at) {
            return { 
              ...item, 
              is_acknowledged: true,
              acknowledged_by: "current_user",
              acknowledged_at: new Date().toISOString()
            };
          }
        } else if (notification.notificationType === 'material' && item.notificationType === 'material') {
          if (item.id === notification.id) {
            return { 
              ...item, 
              is_acknowledged: true,
              acknowledged_by: "current_user",
              acknowledged_at: new Date().toISOString()
            };
          }
        }
        return item;
      });
      
      return { 
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.is_acknowledged).length
      };
    });
    
    // Here you could also send a request to the backend to mark this notification as read
  },
  
  // Clear all notifications
  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },
  
  // Test machine endpoint - for diagnostic purposes
  testMachineEndpoint: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.machineNotifications, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // console.log('Machine API Status:', response.status);
      const data = await response.text();
      
      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }
    } catch (error) {
      console.error('Error testing machine endpoint:', error);
      throw error;
    }
  },
  
  // Test material endpoint - for diagnostic purposes
  testMaterialEndpoint: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.materialNotifications, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // console.log('Material API Status:', response.status);
      const data = await response.text();
      
      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }
    } catch (error) {
      console.error('Error testing material endpoint:', error);
      throw error;
    }
  }
}));

// Helper function to show machine notification
const showMachineNotification = (notification) => {
  const key = `notification-machine-${Date.now()}`;
  
  message.info({
    key,
    content: `Machine Update: ${notification.status_name} - ${notification.description || 'No description'} (${notification.machine_make} #${notification.machine_id})`,
    duration: 10, // 10 seconds
    style: {
      borderLeft: '4px solid #1890ff',
      padding: '12px',
      marginTop: '12px'
    }
  });
};

// Helper function to show material notification
const showMaterialNotification = (notification) => {
  const key = `notification-material-${Date.now()}`;
  
  message.info({
    key,
    content: `Material Update: ${notification.status_name} - ${notification.description || 'No description'} (Part #${notification.part_number})`,
    duration: 10, // 10 seconds
    style: {
      borderLeft: '4px solid #52c41a',
      padding: '12px',
      marginTop: '12px'
    }
  });
};

export default useNotificationStore; 