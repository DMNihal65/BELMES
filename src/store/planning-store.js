import { create } from 'zustand';

const usePlanningStore = create((set) => ({
  searchResults: [],
  allOrders: [],
  partNumbers: [],
  isLoading: false,
  error: null,
  mppDetails: null,
  mppLoading: false,
  mppError: null,
  ordernumber:null,

  // Fetch all orders to get part numbers for dropdown
  fetchAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.89:7010/all_orders');
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
      const response = await fetch(`http://172.18.7.89:7010/search_order?part_number=${partNumber}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch order details');
      }

      set({ 
        searchResults: data,
        isLoading: false,
        error: null,
        ordernumber:data.order_number
      });
      
      return data;
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

  // Fetch MPP details for a specific part and operation
  fetchMPPDetails: async (partNumber, operationNumber) => {
    set({ mppLoading: true, mppError: null });
    try {
      // Clean up the part number and operation number
      const cleanPartNumber = partNumber?.trim();
      const cleanOpNumber = operationNumber?.toString().trim();
      
      console.log('Fetching MPP details for:', {
        partNumber: cleanPartNumber,
        operationNumber: cleanOpNumber
      });

      if (!cleanPartNumber || !cleanOpNumber) {
        throw new Error('Part number and operation number are required');
      }

      const response = await fetch(
        `http://172.18.7.89:7010/mpp/by-part/${cleanPartNumber}/${cleanOpNumber}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch MPP details');
      }

      const data = await response.json();
      console.log('MPP details received:', data);

      set({ 
        mppDetails: data,
        mppLoading: false,
        mppError: null
      });
      
      return data;
    } catch (error) {
      console.error('Fetch MPP details error:', error);
      set({ 
        mppDetails: null,
        mppError: error.message, 
        mppLoading: false 
      });
      return null;
    }
  },

  // Save MPP details
  saveMPPDetails: async (mppData) => {
    set({ mppLoading: true, mppError: null });
    try {
      const response = await fetch('http://172.18.7.89:7010/mpp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mppData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to save MPP details');
      }

      set({ 
        mppDetails: data,
        mppLoading: false,
        mppError: null
      });
      
      return data;
    } catch (error) {
      console.error('Save MPP details error:', error);
      set({ 
        mppError: error.message, 
        mppLoading: false 
      });
      throw error;
    }
  }
}));

export default usePlanningStore;
