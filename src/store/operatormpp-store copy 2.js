import { create } from 'zustand';

const API_BASE_URL = 'http://172.19.224.1:8002/api/v1/planning';
const API_PLANNING_BASE_URL = 'http://172.19.224.1:8002/api/v1/planning';

// Helper function to get stored order from localStorage
const getStoredOrder = () => {
  const storedOrder = localStorage.getItem('selectedOrder');
  return storedOrder ? JSON.parse(storedOrder) : null;
};

const DEFAULT_PART_NUMBER = '213511100114';

const useOperatorMppStore = create((set, get) => ({
  allOrders: [],
  selectedOrder: getStoredOrder(),
  orderDetails: getStoredOrder(),
  isLoading: false,
  error: null,
  isOrderChangeAllowed: true,

  // Update the init function
  init: async () => {
    const storedOrder = getStoredOrder();
    if (storedOrder) {
      try {
        const response = await fetch(`${API_PLANNING_BASE_URL}/search_order?part_number=${storedOrder.part_number}`);
        const data = await response.json();
        
        if (data.orders && data.orders.length > 0) {
          const freshOrderData = data.orders[0];
          localStorage.setItem('selectedOrder', JSON.stringify(freshOrderData));
          set({ 
            orderDetails: freshOrderData,
            currentActiveOrder: freshOrderData
          });
          return;
        }
      } catch (error) {
        console.error('Error loading stored order:', error);
      }
    }
    
    // Only load default if no stored order exists or there was an error
    try {
      const response = await fetch(`${API_PLANNING_BASE_URL}/search_order?part_number=${DEFAULT_PART_NUMBER}`);
      const data = await response.json();
      
      if (data.orders && data.orders.length > 0) {
        const defaultOrder = data.orders[0];
        localStorage.setItem('selectedOrder', JSON.stringify(defaultOrder));
        set({ 
          orderDetails: defaultOrder,
          currentActiveOrder: defaultOrder
        });
      }
    } catch (error) {
      console.error('Error loading default order:', error);
    }
  },

  // Fetch all orders
  fetchAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_PLANNING_BASE_URL}/all_orders`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch orders');
      }

      set({ 
        allOrders: data,
        isLoading: false 
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return [];
    }
  },

  // Fetch detailed order information
  fetchOrderDetails: async (productionOrder) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_PLANNING_BASE_URL}/search_order2?production_order=${productionOrder}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch order details');
      }

      const orderData = data.orders[0];
      set({ 
        selectedOrder: orderData,
        isLoading: false 
      });
      
      return orderData;
    } catch (error) {
      console.error('Error fetching order details:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return null;
    }
  },

  // Add new function to check if order change is allowed
  canChangeOrder: () => {
    return get().isOrderChangeAllowed;
  },

  // Add new function to set order change permission
  setOrderChangePermission: (allowed) => {
    set({ isOrderChangeAllowed: allowed });
  },

  // Update fetchOrderByPartNumber to check permissions
  fetchOrderByPartNumber: async (partNumber) => {
    if (!get().isOrderChangeAllowed) {
      return {
        success: false,
        error: 'Cannot change order while operation is active'
      };
    }

    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_PLANNING_BASE_URL}/search_order?part_number=${partNumber}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      
      if (!data.orders || !data.orders.length) {
        throw new Error('No order data found');
      }

      const orderData = data.orders[0];
      
      const processedOrderData = {
        ...orderData,
        project: {
          id: orderData.project?.id,
          name: orderData.project?.name,
          priority: orderData.project?.priority,
          start_date: orderData.project?.start_date,
          end_date: orderData.project?.end_date
        }
      };

      localStorage.setItem('selectedOrder', JSON.stringify(processedOrderData));

      set({ 
        orderDetails: processedOrderData,
        currentActiveOrder: processedOrderData,
        isLoading: false 
      });
      
      return { success: true, data: processedOrderData };
    } catch (error) {
      console.error('Error fetching order details:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  clearOrders: () => set({ 
    allOrders: [], 
    selectedOrder: null, 
    error: null 
  }),

  clearOrderDetails: () => {
    localStorage.removeItem('selectedOrder');
    set({ 
      orderDetails: null,
      error: null 
    });
  },

  // Add new function to fetch machine operations
  fetchMachineOperations: async (machineId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`http://172.19.224.1:8002/api/v1/operator/machines/${machineId}/operations`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch machine operations');
      }

      set({ 
        orderDetails: { ...get().orderDetails, operations: data },
        isLoading: false 
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching machine operations:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return null;
    }
  },

  // Function to activate a job on a machine
  activateJob: async (machineId, operationId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.19.224.1:8002/api/v1/logs/machine-raw-live/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          machine_id: machineId,
          operation_id: operationId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to activate job');
      }
      
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('Error activating job:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Update activateOrder to handle operation activation
  activateOrder: async (machineId, orderData) => {
    if (!get().isOrderChangeAllowed) {
      return {
        success: false,
        error: 'Cannot activate order while another operation is active'
      };
    }

    set({ isLoading: true, error: null });
    try {
      console.log('Activating order:', orderData);
      
      const activateResponse = await fetch(`http://172.19.224.1:8002/api/v1/operator/machines/${machineId}/operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          production_order: orderData.production_order,
          part_number: orderData.part_number,
          operation_number: orderData.operation_number || '10'
        })
      });

      if (!activateResponse.ok) {
        throw new Error('Failed to activate order');
      }

      // Prevent order changes while operation is active
      set({ isOrderChangeAllowed: false });

      const getResponse = await fetch(`http://172.19.224.1:8002/api/v1/operator/machines/${machineId}/operations`);
      const updatedData = await getResponse.json();

      if (!getResponse.ok) {
        throw new Error('Failed to fetch updated operations');
      }

      set({ 
        currentActiveOrder: {
          ...orderData,
          operations: updatedData
        },
        machineOperations: updatedData,
        isLoading: false 
      });
      
      return { 
        success: true, 
        data: updatedData,
        orderDetails: orderData 
      };
    } catch (error) {
      console.error('Error in activateOrder:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Add new function to deactivate order
  deactivateOrder: async (machineId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`http://172.19.224.1:8002/api/v1/operator/machines/${machineId}/operations/deactivate`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate order');
      }

      // Allow order changes again
      set({ isOrderChangeAllowed: true });
      set({ isLoading: false });

      return { success: true };
    } catch (error) {
      console.error('Error deactivating order:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Add new function to fetch default order
  fetchDefaultOrder: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Fetching default order...');
      const response = await fetch(`${API_PLANNING_BASE_URL}/search_order?part_number=${DEFAULT_PART_NUMBER}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch default order details');
      }

      const data = await response.json();
      console.log('Default Order API Response:', data);

      if (!data.orders || !data.orders.length) {
        throw new Error('No default order data found');
      }

      const orderData = data.orders[0];
      
      // Sort operations by operation number
      if (orderData.operations) {
        orderData.operations.sort((a, b) => a.operation_number - b.operation_number);
      }

      // Store in localStorage
      localStorage.setItem('selectedOrder', JSON.stringify(orderData));

      // Update store state
      set({ 
        orderDetails: orderData,
        currentActiveOrder: orderData,
        isLoading: false 
      });
      
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching default order:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return { success: false, error: error.message };
    }
  },

  // Add a simple function to load stored order
  loadStoredOrder: () => {
    const storedOrder = localStorage.getItem('selectedOrder');
    if (storedOrder) {
      try {
        const orderData = JSON.parse(storedOrder);
        set({ 
          orderDetails: orderData,
          currentActiveOrder: orderData 
        });
        return true;
      } catch (error) {
        console.error('Error loading stored order:', error);
        return false;
      }
    }
    return false;
  },

  // Update this function in the operatormpp-store.js store
  submitOperatorLog: async (logData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Operator store: Preparing to send data to API:', logData);
      
      // Use the exact URL provided
      const apiUrl = 'http://172.19.224.1:8002/api/v1/logs/operator-log';
      console.log('Using API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add these headers to help with CORS issues
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(logData)
      });
      
      console.log('API raw response status:', response.status);
      console.log('API raw response ok:', response.ok);
      
      if (!response.ok) {
        // Try to get error details if available
        let errorMessage = `Server returned ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('API error details:', errorData);
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Parse the successful response
      const data = await response.json();
      console.log('API success response:', data);
      set({ isLoading: false });
      
      return { success: true, data };
    } catch (error) {
      console.error('Error in submitOperatorLog:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  }
}));

// Initialize the store when it's created
useOperatorMppStore.getState().init();

export default useOperatorMppStore; 