import { create } from 'zustand';

const usePlanningStore = create((set) => ({
  searchResults: [],
  allOrders: [],
  partNumbers: [],
  isLoading: false,
  error: null,
  mppDetails: null,
  activeParts: [],
  machines: [
    { id: 1, name: 'Machine A', status: 'Available' },
    { id: 2, name: 'Machine B', status: 'In Use' },
    { id: 3, name: 'Machine C', status: 'Under Maintenance' },
  ],

  // Fetch all orders to get part numbers for dropdown
  fetchAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.85:4723/planning/all_orders');
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
      const response = await fetch(`http://172.18.7.85:4723/planning/search_order2?part_number=${partNumber}`);
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
    // Clear existing MPP details before fetching new ones
    set({ 
      mppDetails: null,
      isLoading: true, 
      error: null 
    });

    try {
      const response = await fetch(`http://172.18.7.85:4723/mpp/by-part/${partNumber}/${operationNumber}`);
      
      // Handle 404 case explicitly
      if (response.status === 404) {
        set({ 
          mppDetails: null,
          isLoading: false,
          error: null
        });
        return null;
      }

      const data = await response.json();
      
      // Enhanced error checking
      if (!response.ok) {
        throw new Error(data.detail || `Error ${response.status}: Failed to fetch MPP details`);
      }

      // Validate data structure before setting state
      if (data && (Array.isArray(data) ? data.length > 0 : true)) {
        const mppDetail = Array.isArray(data) ? data[0] : data;
        set({ 
          mppDetails: mppDetail,
          isLoading: false,
          error: null
        });
        return mppDetail;
      } else {
        set({ 
          mppDetails: null,
          isLoading: false,
          error: null
        });
        return null;
      }
    } catch (error) {
      console.error('MPP details fetch error:', error);
      set({ 
        mppDetails: null,
        isLoading: false,
        error: error.message
      });
      return null;
    }
  },

  // Save MPP details
  saveMPPDetails: async (mppData) => {
    set({ isLoading: true, error: null });
    try {
      // Format the data according to the API requirements
      const formattedData = {
        order_id: mppData.order_id,
        operation_id: mppData.operation_id,
        document_id: mppData.document_id,
        fixture_number: String(mppData.fixture_number).trim(),
        ipid_number: String(mppData.ipid_number).trim(),
        datum_x: String(mppData.datum_x).trim(),
        datum_y: String(mppData.datum_y).trim(),
        datum_z: String(mppData.datum_z).trim(),
        work_instructions: mppData.work_instructions.sections
          .filter(section => section.title || section.instructions)
          .map((section, index) => ({
            title: String(section.title || '').trim(),
            instructions: String(section.instructions || '').trim(),
            sequence: index + 1
          })),
        part_number: String(mppData.part_number).trim(),
        operation_number: Number(mppData.operation_number)
      };

      console.log('Sending MPP data:', formattedData);

      const response = await fetch('http://172.18.7.85:4723/mpp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData)
      });

      // First try to get the error response as JSON
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }

      if (!response.ok) {
        // Log the complete error response for debugging
        console.error('Server Error Response:', errorData);
        
        throw new Error(
          typeof errorData === 'object' 
            ? JSON.stringify(errorData) 
            : errorData || `Failed to save MPP details (${response.status})`
        );
      }



      set({ 
        mppDetails: errorData,
        isLoading: false,
        error: null
      });
      
      return errorData;
    } catch (error) {
      console.error('Save MPP details error:', error);
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
      error: null,
      isLoading: false,
      searchResults: [], // Clear search results as well
    });
  },

  // Add new function to fetch active parts
  fetchActiveParts: async () => {
    try {
      const response = await fetch('http://172.18.7.85:4723/scheduling/active-parts');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch active parts');
      }

      set({ activeParts: data.active_parts });
      return data.active_parts;
    } catch (error) {
      console.error('Fetch active parts error:', error);
      set({ activeParts: [] });
      return [];
    }
  },

  // Add function to change part status
  changePartStatus: async (partNumber, newStatus) => {
    try {
      // Ensure we're using the exact same URL format as the working endpoint
      const response = await fetch(`http://172.18.7.85:4723/scheduling/set-part-status/${partNumber}?status=${newStatus}`, {
        method: 'POST',  // Changed to POST since GET is not allowed
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to change part status');
      }

      // Refresh active parts list after status change
      const fetchActiveParts = usePlanningStore.getState().fetchActiveParts;
      await fetchActiveParts();

      return data;
    } catch (error) {
      console.error('Change part status error:', error);
      throw error;
    }
  },

  // Add this new function to fetch machine details
  fetchMachineDetails: async (machineId) => {
    try {
      const response = await fetch(`http://172.18.7.85:4723/master-order/machines/${machineId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch machine details');
      }

      return data;
    } catch (error) {
      console.error('Error fetching machine details:', error);
      throw error;
    }
  },

  // Add the updateMachine function to the store
  updateMachine: async (machineId, updatedData) => {
    try {
      const response = await fetch(`http://172.18.7.85:4723/master-order/machines/${machineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update machine');
      }

      return data;
    } catch (error) {
      console.error('Error updating machine:', error);
      throw error;
    }
  },

  // Add this new function to update operation details
  updateOperationDetails: async (partNumber, operationNumber, updatedData) => {
    try {
      // Format the data according to the API requirements
      const payload = {
        work_center_code: updatedData.work_center,
        machine_id: parseInt(updatedData.primary_machine?.id),
        part_number: partNumber,
        operation_number: parseInt(operationNumber),
        operation_description: updatedData.operation_description || "",
        setup_time: parseFloat(updatedData.setup_time) || 0,
        ideal_cycle_time: parseFloat(updatedData.ideal_cycle_time) || 0
      };

      console.log('Sending payload:', payload); // Debug log

      const response = await fetch(
        `http://172.18.7.85:4723/planning/operations/${partNumber}/${operationNumber}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Server error response:', responseData); // Debug log
        
        // Handle array of error details
        if (responseData.detail && Array.isArray(responseData.detail)) {
          const errorMessages = responseData.detail.map(error => {
            if (typeof error === 'object' && error.msg) {
              return error.msg;
            }
            return error;
          });
          throw new Error(errorMessages.join('; '));
        }
        
        throw new Error(
          typeof responseData.detail === 'string' 
            ? responseData.detail 
            : 'Failed to update operation details'
        );
      }

      return responseData;
    } catch (error) {
      console.error('Update operation details error:', error);
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to the server');
      }
      throw error;
    }
  }
}));

export default usePlanningStore;

