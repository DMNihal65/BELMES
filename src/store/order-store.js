import { create } from 'zustand';
import dayjs from 'dayjs';

// API endpoints configuration
const API_CONFIG = {
  BASE_URL: 'http://172.18.7.85:6768',
  QUALITY_URL: 'http://172.18.7.93:9999',
  PLANNING_URL: 'http://172.18.7.85:9671',
  endpoints: {
    allOrders: '/api/v1/planning/all_orders',
    saveOrder: '/api/v1/planning/save-to-db',
    uploadPdf: '/api/v1/planning/upload-pdf',
    updatePriority: (orderId) => `/api/v1/planning/order/${orderId}/priority`,
    uploadMpp: '/api/v1/documents/mpp',
    uploadDrawing: '/api/v1/documents/drawing',
    documents: (productionOrder) => `/api/v1/documents/${productionOrder}`,
  }
};

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

  timelinePollingInterval: null,  // Add this to track the interval

  clearOrderDetails: () => set({ 
    orderDetails: null, 
    error: null,
    isLoading: false 
  }),

  fetchAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.85:6768/api/v1/planning/all_orders');
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
        const { orders: savedOrders } = JSON.parse(savedSequence);
        
        // Sort orders based on priority
        transformedOrders.sort((a, b) => {
          const savedOrderA = savedOrders.find(
            so => so.id === a.id || so.project_id === a.project?.id
          );
          const savedOrderB = savedOrders.find(
            so => so.id === b.id || so.project_id === b.project?.id
          );

          // Get priorities (default to highest number if not found)
          const priorityA = savedOrderA?.priority ?? 999;
          const priorityB = savedOrderB?.priority ?? 999;

          // Sort by priority (lower number comes first)
          return priorityA - priorityB;
        });

        // Update priorities in the transformed orders
        transformedOrders = transformedOrders.map(order => {
          const savedOrder = savedOrders.find(
            so => so.id === order.id || so.project_id === order.project?.id
          );
          if (savedOrder && order.project) {
            order.project.priority = savedOrder.priority;
          }
          return order;
        });
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
  
      const response = await fetch('http://172.18.7.85:6768/api/v1/planning/upload-pdf', {
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

      set({ 
        orderDetails: transformedData, 
        isLoading: false 
      });
      
      return data;
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
        `http://172.18.7.85:6768/api/v1/planning/update_order/${payload.orderNumber}`,
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
  createOrder: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const submitData = {
        data: {
          "Project Name": payload.project_name,
          "Sale Order": payload.sale_order,
          "Part No": payload.part_number,
          "Part Desc": payload.part_description,
          "Required Qty": payload.required_quantity.toString(),
          "Plant": payload.plant_id.toString(),
          "WBS": payload.wbs_element,
          "Rtg Seq No": "0",
          "Sequence No": "0",
          "Launched Qty": payload.launched_quantity.toString(),
          "Prod Order No": payload.production_order,
          "Operations": [],
          "Document Verification": {},
          "Raw Materials": []
        }
      };

      const response = await fetch(`${API_CONFIG.PLANNING_URL}${API_CONFIG.endpoints.saveOrder}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const data = await response.json();
      set({ isLoading: false });
      return data;
    } catch (error) {
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
      const response = await fetch(`http://172.18.7.85:6768/api/v1/work_centers/${workcenterData.workcenter_id}`, {
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

  uploadMppFile: async (file, productionOrder, documentName, description, version) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('production_order', productionOrder);
      formData.append('document_name', documentName);
      formData.append('description', description || '');
      formData.append('version', version);

      const response = await fetch(`${API_CONFIG.PLANNING_URL}${API_CONFIG.endpoints.uploadMpp}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload MPP file');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload MPP file error:', error);
      throw error;
    }
  },

  uploadEngineeringDrawing: async (file, productionOrder, documentName, description, version) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('production_order', productionOrder);
      formData.append('document_name', documentName);
      formData.append('description', description || '');
      formData.append('version', version);

      const response = await fetch(`${API_CONFIG.PLANNING_URL}${API_CONFIG.endpoints.uploadDrawing}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload Engineering Drawing');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload Engineering Drawing error:', error);
      throw error;
    }
  },

  fetchTimelineData: async () => {
    try {
      set({ isLoadingTimeline: true, timelineError: null });
      
      const response = await fetch('http://172.18.7.85:6768/api/v1/scheduling/part-production-timeline/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch timeline data');
      }

      const data = await response.json();
      
      // Ensure we're working with an array
      const items = data?.items || [];
      
      // Transform the data and ensure it's an array
      const transformedData = items.map(item => ({
        key: item.production_order,
        part_number: item.part_number || '',
        production_order: item.production_order || '',
        completed_total_quantity: item.completed_total_quantity || 0,
        operations_count: item.operations_count || 0,
        status: item.status || 'scheduled',
        part_description: item.part_description || ''
      }));

      set({ 
        timelineData: transformedData,
        isLoadingTimeline: false 
      });

      return transformedData;

    } catch (error) {
      console.error('Timeline fetch error:', error);
      set({ 
        timelineError: error.message,
        timelineData: [], // Always set an empty array if there's an error
        isLoadingTimeline: false 
      });
      throw error;
    }
  },

  // Start polling when component mounts
  startTimelinePolling: () => {
    // Clear any existing interval first
    const { timelinePollingInterval } = get();
    if (timelinePollingInterval) {
      console.log('Clearing existing polling interval');
      clearInterval(timelinePollingInterval);
      set({ timelinePollingInterval: null });
    }

    // Set new interval for 1 hour
    const ONE_HOUR = 3600000; // 1 hour in milliseconds
    console.log('Starting new polling interval with delay:', ONE_HOUR, 'ms');
    
    const intervalId = setInterval(() => {
      console.log('Polling timeline data at:', new Date().toLocaleTimeString());
      get().fetchTimelineData();
    }, ONE_HOUR);

    // Store the interval ID
    set({ timelinePollingInterval: intervalId });
    console.log('Timeline polling started - updating every hour');
    console.log('Next update at:', new Date(Date.now() + ONE_HOUR).toLocaleTimeString());
  },

  // Stop polling when component unmounts
  stopTimelinePolling: () => {
    const { timelinePollingInterval } = get();
    if (timelinePollingInterval) {
      console.log('Stopping timeline polling');
      clearInterval(timelinePollingInterval);
      set({ timelinePollingInterval: null });
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
        `http://172.18.7.85:6768/api/v1/document-management/documents/by-part-number-all/${partNumber}`,
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

      const allOrdersResponse = await fetch('http://172.18.7.85:6768/api/v1/planning/all_orders');
      const allOrdersData = await allOrdersResponse.json();

      if (!allOrdersResponse.ok) {
        throw new Error('Failed to fetch orders data');
      }

      const order1 = allOrdersData.find(order => 
        String(order.production_order) === String(order1ProductionOrder)
      );
      const order2 = allOrdersData.find(order => 
        String(order.production_order) === String(order2ProductionOrder)
      );

      if (!order1?.id || !order2?.id) {
        throw new Error('Could not find order IDs for the selected orders');
      }

      // Make the priority update request
      const response = await fetch(
        `http://172.18.7.85:6768/api/v1/planning/order/${order1.id}/priority`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            priority: order2Priority,
            order_id: order2.id
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update priority');
      }

      // Update the orders in memory and localStorage
      const currentOrders = get().orders;
      const updatedOrders = currentOrders.map(order => {
        if (order.id === order1.id && order.project) {
          order.project.priority = order2Priority;
        } else if (order.id === order2.id && order.project) {
          order.project.priority = order1Priority;
        }
        return order;
      });

      // Sort orders by priority
      updatedOrders.sort((a, b) => 
        (a.project?.priority ?? 999) - (b.project?.priority ?? 999)
      );

      // Save the sorted sequence to localStorage
      localStorage.setItem('orderSequence', JSON.stringify({
        orders: updatedOrders.map(order => ({
          id: order.id,
          project_id: order.project?.id,
          priority: order.project?.priority
        })),
        timestamp: Date.now()
      }));

      // Update state with sorted orders
      set({ orders: updatedOrders, isLoading: false });

      return data;
    } catch (error) {
      console.error('Swap priority error:', error);
      set({ error: error.message || 'Failed to swap priorities', isLoading: false });
      throw error;
    }
  },
}));

export default useOrderStore;