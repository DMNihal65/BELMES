import { create } from 'zustand';

const useOperatorMppStore = create((set) => ({
  allOrders: [],
  isLoading: false,
  error: null,

  // Fetch all orders
  fetchAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.88:3252/api/v1/planning/all_orders');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch orders');
      }

      // Transform the data to include operations
      const transformedOrders = Array.isArray(data) ? await Promise.all(data.map(async (order) => {
        // Fetch operations using the new endpoint
        const operationsResponse = await fetch(`http://172.18.7.88:3252/api/v1/planning/search_order2?production_order=${order.production_order}`);
        const operationsData = await operationsResponse.json();
        
        return {
          id: order.id,
          production_order: order.production_order,
          part_number: order.part_number,
          part_description: order.part_description,
          required_quantity: order.required_quantity,
          launched_quantity: order.launched_quantity,
          project: order.project,
          total_operations: order.total_operations,
          sales_order: order.sales_order,
          wbs_element: order.wbs_element,
          // Add operations from the new API response
          operations: operationsData?.operations || []
        };
      })) : [];

      set({ 
        allOrders: transformedOrders,
        isLoading: false 
      });
      
      return transformedOrders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return [];
    }
  },

  clearOrders: () => set({ allOrders: [], error: null }),
}));

export default useOperatorMppStore; 