import { create } from 'zustand';

const usePlanningStore = create((set) => ({
  searchResults: [],
  allOrders: [],
  partNumbers: [],
  isLoading: false,
  error: null,
  mppDetails: null,

  // Fetch all orders to get part numbers for dropdown
  fetchAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.88:2223/planning/all_orders');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch all orders');
      }

      // Extract part numbers from orders
      const partNumbers = Array.isArray(data) ? data.map(item => ({
        id: item.id || String(Math.random()),
        partNumber: item.part_number
      })) : [];

      set({ 
        allOrders: data,
        partNumbers,
        isLoading: false,
        error: null
      });
      
      return data;
    } catch (error) {
      console.error('Fetch all orders error:', error);
      set({ 
        allOrders: [],
        partNumbers: [],
        error: error.message, 
        isLoading: false 
      });
      return [];
    }
  },

  // Search for specific order details
  searchOrders: async (partNumber) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`http://172.18.7.88:2223/search_order?part_number=${partNumber}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch order details');
      }

      // Transform the operations data if needed
      const transformedData = {
        ...data,
        orders: data.orders.map(order => ({
          ...order,
          operations: order.operations?.map(op => ({
            ...op,
            key: op.id.toString() // Ensure each operation has a key
          })) || []
        }))
      };

      set({ 
        searchResults: transformedData,
        isLoading: false,
        error: null
      });
      
      return transformedData;
    } catch (error) {
      console.error('Search error:', error);
      set({ 
        searchResults: [],
        error: error.message, 
        isLoading: false 
      });
      return [];
    }
  },

  clearSearch: () => {
    set({ 
      searchResults: [],
      error: null 
    });
  },

  // Fetch MPP details
  fetchMPPDetails: async (partNumber, operationNumber) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`http://172.18.7.88:2223/mpp/by-part/${partNumber}/${operationNumber}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch MPP details');
      }

      const mppDetail = Array.isArray(data) ? data[0] : data;
      set({ 
        mppDetails: mppDetail,
        isLoading: false,
        error: null
      });
      
      return mppDetail;
    } catch (error) {
      console.error('MPP details fetch error:', error);
      set({ 
        mppDetails: null,
        error: error.message, 
        isLoading: false 
      });
      return null;
    }
  },

  // Save MPP details
  saveMPPDetails: async (mppData) => {
    set({ isLoading: true, error: null });
    try {
      // Format the data according to API requirements
      const formattedData = {
        order_id: mppData.order_id || null,
        operation_id: mppData.operation_id || null,
        document_id: mppData.document_id || null,
        fixture_number: mppData.fixture_number,
        ipid_number: mppData.ipid_number,
        datum_x: mppData.datum_x,
        datum_y: mppData.datum_y,
        datum_z: mppData.datum_z,
        // Change work_instructions to be an array instead of an object
        work_instructions: mppData.work_instructions.sections,
        part_number: mppData.part_number,
        operation_number: Number(mppData.operation_number)
      };

      console.log('Sending formatted data:', formattedData);

      const response = await fetch('http://172.18.7.88:2223/mpp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formattedData)
      });
      
      const responseData = await response.json();

      if (!response.ok) {
        console.error('API Error:', responseData);
        throw new Error(
          typeof responseData.detail === 'string' 
            ? responseData.detail 
            : JSON.stringify(responseData)
        );
      }

      set({ 
        mppDetails: responseData,
        isLoading: false,
        error: null
      });
      
      return responseData;
    } catch (error) {
      console.error('Save MPP details error:', error.message);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      throw error;
    }
  },

  // Clear MPP details
  clearMPPDetails: () => {
    set({ 
      mppDetails: null,
      error: null 
    });
  }
}));

export default usePlanningStore;

