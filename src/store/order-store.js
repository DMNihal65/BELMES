import { create } from 'zustand';

const useOrderStore = create((set) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.88:8010/all_orders');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      // Sort orders by priority
      const sortedOrders = data.sort((a, b) => a.project.priority - b.project.priority);
      set({ orders: sortedOrders, isLoading: false });
      return sortedOrders;
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

      const response = await fetch('http://172.18.7.88:8010/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload PDF');
      }

      // Transform the API response to match our form fields
      const transformedData = {
        orderNumber: data.order_details.production_order,
        salesOrderNumber: data.order_details.sale_order,
        wbsElement: data.order_details.wbs_element,
        partNumber: data.order_details.part_number,
        materialDescription: data.order_details.part_description,
        targetQuantity: data.order_details.required_quantity,
        launchedQuantity: data.order_details.launched_quantity,
        plant: data.order_details.plant_id.toString(),
        priority: data.order_details.project.priority.toString(),
        projectName: data.order_details.project.name,
        totalOperations: data.order_details.total_operations,
      };

      set({ orderDetails: transformedData, isLoading: false });
      return transformedData;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearOrderDetails: () => set({ orderDetails: null, error: null }),
}));

export default useOrderStore; 