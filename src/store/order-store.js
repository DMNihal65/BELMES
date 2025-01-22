import { create } from 'zustand';
import dayjs from 'dayjs';

const useOrderStore = create((set) => ({
  orders: [],
  isLoading: false,
  error: null,

  clearOrderDetails: () => set({ 
    orderDetails: null, 
    error: null,
    isLoading: false 
  }),

  fetchAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.88:8012/all_orders');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      // Sort orders by priority
      const sortedOrders = data.sort((a, b) => a.project.priority - b.project.priority);

      // Transform each order to include deliveryDate
      const transformedOrders = sortedOrders.map(order => ({
        ...order,
        deliveryDate: order.project?.delivery_date 
          ? dayjs(order.project.delivery_date).toISOString() 
          : null,
      }));

      set({ orders: transformedOrders, isLoading: false });
      return transformedOrders;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  uploadPDF: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await fetch('http://172.18.7.88:8012/upload-pdf', {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload PDF');
      }

      // Transform the API response to match form fields
      const transformedData = {
        id: data.order_details.id,
        orderNumber: data.order_details.production_order,
        salesOrderNumber: data.order_details.sale_order,
        wbsElement: data.order_details.wbs_element,
        partNumber: data.order_details.part_number,
        materialDescription: data.order_details.part_description,
        totalOperations: data.order_details.total_operations,
        targetQuantity: data.order_details.required_quantity,
        launchedQuantity: data.order_details.launched_quantity,
        plant: data.order_details.plant_id.toString(),
        // Convert delivery_date to ISO string
        deliveryDate: data.order_details.project?.delivery_date 
      ? dayjs(data.order_details.project.delivery_date) // Ensure it's a dayjs object
      : null,
        // Additional fields
        projectName: data.order_details.project?.name,
        priority: data.order_details.project?.priority,
        rawMaterials: data.order_details.raw_materials || [],
      };

      set({ orderDetails: transformedData, isLoading: false });
      return transformedData;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateOrder: async (orderId, payload, orderNumber) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(
        `http://172.18.7.88:8012/update_order/${orderId}?order_number=${orderNumber}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order');
      }
  
      const data = await response.json();
      
      // Update the orders list with the new data
      set(state => ({
        orders: state.orders.map(order => 
          order.id === orderId ? data : order
        ),
        isLoading: false
      }));
  
      return data;
    } catch (error) {
      console.error('Update Error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Add createOrder function to the store
  createOrder: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.88:8012/create_order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        
        throw new Error(data.message || data.detail || 'Failed to create order');
      }
  
      // Transform the response data to match your application's format
      const transformedData = {
        ...data,
        deliveryDate: data.project?.delivery_date 
          ? dayjs(data.project.delivery_date).toISOString() 
          : null,
      };
  
      // Update the orders list with the new order
      set((state) => ({ 
        orders: [...state.orders, transformedData], 
        isLoading: false 
      }));
  
      return transformedData;
    } catch (error) {
      console.error('Create Order Error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearOrderDetails: () => set({ orderDetails: null, error: null }),
}));

export default useOrderStore;