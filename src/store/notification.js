import { create } from 'zustand';
import { message } from 'antd';

// Centralized API endpoints
const API_BASE_URL = 'http://172.19.224.1:8002/api/v1';
const API_ENDPOINTS = {
  simpleNotifications: `${API_BASE_URL}/simple-notifications/unread`,
  markAsRead: `${API_BASE_URL}/simple-notifications/mark-read`,
  markAllAsRead: `${API_BASE_URL}/simple-notifications/mark-all-read`,
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

// Helper function to generate a consistent unique ID for a notification
const generateNotificationId = (notification) => {
  const type = notification.table_name;
  
  if (type === 'MachineStatusLog') {
    // For machine notifications, use machine_id + timestamp
    return `machine-${notification.id || notification.machine_id}-${notification.updated_at}`;
  } else if (type === 'RawMaterialStatusLog') {
    // For material notifications, use part_number + timestamp
    return `material-${notification.id || notification.part_number}-${notification.updated_at}`;
  }
  
  // Fallback
  return `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Helper function to standardize notification object format
const standardizeNotification = (notification) => {
  const baseNotification = {
    ...notification,
    _uniqueId: notification._uniqueId || generateNotificationId(notification),
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
  userMap: new Map(),
  
  // Initialize the store
  initialize: async () => {
    if (get().isInitialized) return;
    
    console.log('Initializing notification store...');
    
    // Initial fetch
    await get().fetchUsers();
    await get().fetchNotifications();
    
    // Set up polling every 20 seconds (20000 milliseconds)
    const pollInterval = setInterval(() => {
      console.log('Polling for new notifications...');
      get().fetchNotifications().catch(error => {
        console.error('Error during notification polling:', error);
      });
    }, 20000);
    
    // Store interval ID for cleanup
    set({ 
      isInitialized: true, 
      pollInterval,
      lastUpdated: new Date().toISOString()
    });
    
    // Cleanup function
    return () => {
      console.log('Cleaning up notification polling...');
      clearInterval(pollInterval);
    };
  },
  
  // Fetch notifications from the simplified API
  fetchNotifications: async (showErrorMessages = false) => {
    set({ isLoading: true });
    
    try {
      console.log('Fetching notifications from:', API_ENDPOINTS.simpleNotifications);
      
      // Prepare headers
      const headers = new Headers();
      const token = localStorage.getItem('token');
      if (token) {
        headers.append('Authorization', `Bearer ${token}`);
      }
      headers.append('Accept', 'application/json');
      
      // Make the request with CORS mode and credentials
      const response = await fetch(API_ENDPOINTS.simpleNotifications, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'same-origin' // Changed from 'include' to 'same-origin'
      });
      
      // Handle non-2xx responses
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Couldn't parse error as JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      // Parse response
      let notifications;
      try {
        notifications = await response.json();
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Invalid JSON response from server');
      }
      
      console.log('Received notifications:', notifications);
      
      if (!Array.isArray(notifications)) {
        throw new Error('Invalid response format: expected an array of notifications');
      }

      // Process and standardize notifications
      const processedNotifications = notifications.map(notification => {
        // Extract record_data (it's already an object)
        const recordData = notification.record_data || {};
        
        // Determine notification type based on table_name
        let type = 'other';
        let title = 'Notification';
        
        if (notification.table_name === 'MachineStatusLog') {
          type = 'machine';
          title = 'Machine Status';
        } else if (notification.table_name === 'RawMaterialStatusLog') {
          type = 'material';
          title = 'Material Status';
        }
        
        // Create a standardized notification object
        return {
          // Keep the original notification data
          ...notification,
          // Flatten record_data into the main object
          ...recordData,
          // Add our custom fields
          notificationType: type,
          title: title,
          _uniqueId: `notif-${notification.id}-${Date.now()}`,
          // Use the read status from the main object or fallback to record_data
          read: notification.read !== undefined ? notification.read : (recordData.read || false),
          // Use is_acknowledged from record_data or fallback to false
          is_acknowledged: recordData.is_acknowledged || false,
          // Use the timestamp from record_data or fallback to created_at
          timestamp: recordData.updated_at || notification.created_at || new Date().toISOString(),
          // Keep the original table_name
          table_name: notification.table_name
        };
      });
      
      // Update state
      set({
        notifications: processedNotifications,
        unreadCount: processedNotifications.filter(n => !n.read).length,
        isLoading: false,
        error: null
      });
      
      return processedNotifications;
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (showErrorMessages) {
        message.error(`Failed to load notifications: ${error.message}`);
      }
      set({ error, isLoading: false });
      return [];
    }
  },
  
  // Mark a single notification as read via API
  markNotificationAsRead: async (notificationId) => {
    try {
      const { notifications } = get();
      const notification = notifications.find(n => n._uniqueId === notificationId);
      
      if (!notification) {
        console.error('Notification not found:', notificationId);
        return false;
      }

      // Call the API to mark as read
      const response = await fetch(API_ENDPOINTS.markAsRead, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          table_name: notification.table_name,
          record_id: notification.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state
      const updatedNotifications = notifications.map(n => 
        n._uniqueId === notificationId 
          ? { 
              ...n, 
              read: true, 
              is_acknowledged: true,
              acknowledged_by: 'current_user',
              acknowledged_at: new Date().toISOString() 
            } 
          : n
      );
      
      set({
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.read).length
      });
      
      return true;
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      message.error('Failed to mark notification as read');
      return false;
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const { notifications } = get();
      
      // Call the API to mark all as read
      const response = await fetch(API_ENDPOINTS.markAllAsRead, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          marked_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update all notifications to be marked as read
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true,
        is_acknowledged: true,
        acknowledged_by: 'current_user',
        acknowledged_at: new Date().toISOString()
      }));
      
      // Update the state
      set({
        notifications: updatedNotifications,
        unreadCount: 0
      });
      
      message.success('All notifications marked as read');
      return true;
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      message.error('Failed to mark all notifications as read');
      return false;
    }
  },
  
  // Fetch users for mapping user IDs to names
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

      set({ userMap });
      return userMap;
    } catch (error) {
      console.error('Error fetching users:', error);
      return new Map();
    }
  }
}));

// Simplified notification display function
const showNotification = (notification) => {
  let title = 'Notification';
  let content = notification.description || 'No description';
  let borderColor = '#1890ff';
  
  // Customize based on notification type
  if (notification.table_name === 'MachineStatusLog') {
    title = 'Machine Update';
    borderColor = '#1890ff';
  } else if (notification.table_name === 'RawMaterialStatusLog') {
    title = 'Material Update';
    borderColor = '#52c41a';
  }
  
  // Play notification sound
  playNotificationSound();
  
  // Show the notification
  message.info({
    key: `notification-${notification.id}-${Date.now()}`,
    content: `${title}: ${content}`,
    duration: 10,
    style: {
      borderLeft: `4px solid ${borderColor}`,
      padding: '12px',
      marginTop: '12px'
    }
  });
};

export default useNotificationStore; 
