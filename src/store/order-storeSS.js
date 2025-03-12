import { create } from 'zustand';
import dayjs from 'dayjs';


const useOrderStore = create((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  timelineData: [],
  isLoadingTimeline: false,
  timelineError: null,

  // Add workcenter-related state
  workcenters: [],
  isLoadingWorkcenters: false,
  workcenterError: null,

  documents: {
    mpp_document: null,
    engineering_drawing_document: null,
    oarc_document: null,
    ipid_document: null,
    all_documents: []
  },
  isLoadingDocuments: false,
  documentError: null,

  // Add loading state specifically for document fetching
  documentLoadingStates: {
    mpp: false,
    engineering: false
  },

  clearOrderDetails: () => set({ 
    orderDetails: null, 
    error: null,
    isLoading: false 
  }),

  fetchAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://localhost:8000/api/v1/planning/all_orders');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      let transformedOrders = data.map(order => ({
        ...order,
      }));

      // Get saved sequence from localStorage
      const savedSequence = localStorage.getItem('orderSequence');
      if (savedSequence) {
        const { orders: savedOrders, timestamp } = JSON.parse(savedSequence);
        
        // Only use saved sequence if it's less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          const orderedItems = [];
          
          // Reconstruct the order based on saved sequence
          savedOrders.forEach(savedOrder => {
            const item = transformedOrders.find(
              order => order.id === savedOrder.id || 
                       order.project?.id === savedOrder.project_id
            );
            if (item) {
              if (item.project) {
                item.project.priority = savedOrder.priority;
              }
              orderedItems.push(item);
            }
          });
          
          // Add any new items at the end
          transformedOrders.forEach(order => {
            if (!orderedItems.find(item => item.id === order.id)) {
              orderedItems.push(order);
            }
          });

          transformedOrders = orderedItems;
        }
      }

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
  
      const response = await fetch('http://localhost:8000/api/v1/planning/upload-pdf', {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload PDF');
      }

      // Transform the API response to match form fields
      const transformedData = {
        orderNumber: data['Prod Order No'],
        salesOrderNumber: data['Sale Order'],
        wbsElement: data['WBS'],
        partNumber: data['Part No'],
        materialDescription: data['Part Desc'],
        totalOperations: data.Operations?.length || 0,
        targetQuantity: parseInt(data['Required Qty']),
        launchedQuantity: parseInt(data['Launched Qty']),
        plant: data['Plant'],
        projectName: data['Project Name'],
        // Additional fields
        priority: 'normal', // Default priority since it's not in the response
        rawMaterials: data['Raw Materials']?.map(material => ({
          child_part_number: material['Child Part No'],
          description: material['Description'],
          quantity: material['Qty Per Set'],
          unit: { name: material['UoM'] },
          status: { name: 'Available' } // Default status
        })) || [],
        // Add operations data
        operations: data.Operations?.map(op => ({
          operation_number: op['Oprn No'],
          workcenter: op['Wc/Plant'],
          plant_number: op['Plant Number'],
          operation_description: op['Operation'],
          setup_time: parseFloat(op['Setup Time']),
          per_piece_time: parseFloat(op['Per Pc Time']),
          jump_quantity: parseInt(op['Jmp Qty']),
          total_quantity: parseInt(op['Tot Qty']),
          allowed_time: parseFloat(op['Allowed Time']),
          confirmation_number: op['Confirm No'],
          long_text: op['Long Text']
        })) || []
      };

      // Immediately fetch documents after successful PDF upload
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const documentsResponse = await fetch(
            `http://localhost:8000/api/v1/document-management/documents/by-part-number-all/${transformedData.partNumber}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            }
          );

          if (documentsResponse.ok) {
            const documentsData = await documentsResponse.json();
            set({
              documents: {
                mpp_document: documentsData.mpp_document || null,
                engineering_drawing_document: documentsData.engineering_drawing_document || null,
                oarc_document: documentsData.oarc_document || null,
                ipid_document: documentsData.ipid_document || null,
                all_documents: documentsData.all_documents || []
              },
              documentLoadingStates: {
                mpp: false,
                engineering: false
              },
              isLoadingDocuments: false
            });
          }
        }
      } catch (docError) {
        console.error('Error fetching documents:', docError);
        // Don't throw this error as it's not critical to the PDF upload
      }

      set({ 
        orderDetails: transformedData, 
        isLoading: false 
      });
      
      return transformedData;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateOrder: async (orderId, payload, orderNumber) => {
    set({ isLoading: true, error: null });
    try {
      // Transform the payload to match API expectations
      const transformedPayload = {
        production_order: payload.orderNumber,
        sale_order: payload.salesOrderNumber,
        wbs_element: payload.wbsElement,
        part_number: payload.partNumber,
        part_description: payload.materialDescription,
        total_operations: payload.totalOperations,
        required_quantity: payload.targetQuantity,
        launched_quantity: payload.launchedQuantity,
        plant_id: payload.plant,
        project_name: payload.projectName,
        priority: payload.priority,
        delivery_date: payload.deliveryDate 
          ? Math.floor(payload.deliveryDate.valueOf() / 1000)
          : null
      };

      console.log('Transformed Payload:', transformedPayload);

      // Use the orderNumber parameter instead of hardcoded value
      const response = await fetch(
        `http://localhost:8000/api/v1/planning/update_order/${payload.orderNumber}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transformedPayload),
        }
      );
  
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Server Error Response:', data);
        const errorMessage = data.detail 
          ? Array.isArray(data.detail)
            ? data.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('; ')
            : data.detail
          : 'Failed to update order';
        throw new Error(errorMessage);
      }
      
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
  createOrder: async (orderData) => {
    try {
      set({ isLoading: true, error: null });

      console.log('Sending order data:', orderData);

      const response = await fetch('http://localhost:8000/api/v1/planning/save-to-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          data: orderData
        })
      });

      const result = await response.json();
      console.log('Server response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create order');
      }

      // Refresh orders list after successful creation
      await get().fetchAllOrders();

      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error('Create order error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearOrderDetails: () => set({ orderDetails: null, error: null }),

  // Fetch all workcenters from the correct endpoint
  fetchWorkcenters: async () => {
    set({ isLoadingWorkcenters: true, workcenterError: null });
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use mock data instead of API call
      set({ 
        workcenters: mockWorkcenters,
        isLoadingWorkcenters: false 
      });
      return mockWorkcenters;
    } catch (error) {
      console.error('Fetch workcenters error:', error);
      set({ 
        workcenterError: error.message,
        isLoadingWorkcenters: false 
      });
      throw error;
    }
  },

  // Update workcenter details
  updateWorkcenter: async (workcenterData) => {
    set({ isLoadingWorkcenters: true, workcenterError: null });
    try {
      const response = await fetch(`http://localhost:8000/api/v1/work_centers/${workcenterData.workcenter_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workcenterData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update workcenter');
      }
      
      const updatedWorkcenter = await response.json();
      
      set(state => ({
        workcenters: state.workcenters.map(w => 
          w.workcenter_id === updatedWorkcenter.workcenter_id ? updatedWorkcenter : w
        ),
        isLoadingWorkcenters: false
      }));
      
      return updatedWorkcenter;
    } catch (error) {
      console.error('Update workcenter error:', error);
      set({ 
        workcenterError: error.message,
        isLoadingWorkcenters: false 
      });
      throw error;
    }
  },

  addWorkcenter: async (newWorkcenter) => {
    set((state) => {
      const currentWorkcenters = state.workcenters;
      const newId = currentWorkcenters.length + 1;
      const workcenterWithId = { ...newWorkcenter, id: newId };
      return {
        workcenters: [...currentWorkcenters, workcenterWithId],
      };
    });
  },

  uploadMppFile: async (file, partNumber, documentName, description, version) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('part_number', partNumber);
      formData.append('name', documentName);
      formData.append('description', description || '');
      formData.append('version', version);
      formData.append('doc_type', 'MPP');
      formData.append('metadata', JSON.stringify({}));

      const response = await fetch('http://localhost:8000/api/v1/document-management/documents/upload-by-type', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload MPP document');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('MPP Upload Error:', error);
      throw error;
    }
  },

  uploadEngineeringDrawing: async (file, partNumber, documentName, description, version) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('part_number', partNumber);
      formData.append('name', documentName);
      formData.append('description', description || '');
      formData.append('version', version);
      formData.append('doc_type', 'ENGINEERING_DRAWING');
      formData.append('metadata', JSON.stringify({}));

      const response = await fetch('http://localhost:8000/api/v1/document-management/documents/upload-by-type', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload Engineering Drawing');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Engineering Drawing Upload Error:', error);
      throw error;
    }
  },

  fetchTimelineData: async () => {
    set({ isLoadingTimeline: true, timelineError: null });
    try {
      const response = await fetch('http://localhost:8000/api/v1/scheduling/part-production-timeline/');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch timeline data');
      }

      // Transform the data to include a key property for the table
      const transformedData = data.items.map((item, index) => ({
        ...item,
        key: index,
      }));

      set({ 
        timelineData: transformedData,
        isLoadingTimeline: false 
      });
      return transformedData;
    } catch (error) {
      set({ 
        timelineError: error.message, 
        isLoadingTimeline: false 
      });
      throw error;
    }
  },

  // Update fetchDocumentsByPartNumber to be more efficient
  fetchDocumentsByPartNumber: async (partNumber) => {
    // Set initial loading state
    set(state => ({ 
      documentLoadingStates: {
        mpp: true,
        engineering: true
      }
    }));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Use AbortController to handle timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `http://localhost:8000/api/v1/document-management/documents/by-part-number-all/${partNumber}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);
      
      if (response.status === 401) {
        throw new Error('Unauthorized: Please log in again');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch documents: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update state with new data and reset loading states
      set({ 
        documents: {
          mpp_document: data.mpp_document || null,
          engineering_drawing_document: data.engineering_drawing_document || null,
          oarc_document: data.oarc_document || null,
          ipid_document: data.ipid_document || null,
          all_documents: data.all_documents || []
        },
        documentLoadingStates: {
          mpp: false,
          engineering: false
        },
        isLoadingDocuments: false 
      });

      return data;
    } catch (error) {
      // Handle timeout errors specifically
      const errorMessage = error.name === 'AbortError' 
        ? 'Request timed out. Please try again.'
        : error.message;

      console.error('Fetch documents error:', error);
      set({ 
        documentError: errorMessage,
        documentLoadingStates: {
          mpp: false,
          engineering: false
        },
        isLoadingDocuments: false,
        documents: {
          mpp_document: null,
          engineering_drawing_document: null,
          oarc_document: null,
          ipid_document: null,
          all_documents: []
        }
      });
      throw error;
    }
  },

  // Update clearDocuments to match new structure
  clearDocuments: () => set({ 
    documents: {
      mpp_document: null,
      engineering_drawing_document: null,
      oarc_document: null,
      ipid_document: null,
      all_documents: []
    },
    documentError: null,
    isLoadingDocuments: false 
  }),

  swapOrderPriority: async (order1ProductionOrder, order2ProductionOrder, order1Priority, order2Priority) => {
    try {
      set({ isLoading: true, error: null });

      // First, fetch all orders to get the correct order_ids
      const allOrdersResponse = await fetch('http://localhost:8000/api/v1/planning/all_orders');
      const allOrdersData = await allOrdersResponse.json();

      if (!allOrdersResponse.ok) {
        throw new Error('Failed to fetch orders data');
      }

      // Find the orders by their production order numbers to get their order_ids
      const order1 = allOrdersData.find(order => 
        String(order.production_order) === String(order1ProductionOrder)
      );
      const order2 = allOrdersData.find(order => 
        String(order.production_order) === String(order2ProductionOrder)
      );

      if (!order1?.id || !order2?.id) {
        throw new Error('Could not find order IDs for the selected orders');
      }

      // Make the priority update request using the order IDs from all_orders
      const response = await fetch(
        `http://localhost:8000/api/v1/planning/order/${order1.id}/priority`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priority: order2Priority,
            order_id: order2.id
          })
        }
      );

      const data = await response.json();
      console.log('Priority update response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update priority');
      }

      return data;
    } catch (error) {
      console.error('Swap priority error:', error);
      set({ 
        error: error.message || 'Failed to swap priorities', 
        isLoading: false 
      });
      throw error;
    }
  },
}));

export default useOrderStore;