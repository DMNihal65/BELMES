import { create } from 'zustand';
import dayjs from 'dayjs';

// API endpoints configuration
const API_CONFIG = {
  BASE_URL: 'http://172.18.7.85:6767',
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
    saveOarcToDb: '/api/v1/planning/save-to-db',
    createOrder: '/api/v1/planning/create_order',
    uploadDocumentByType: '/api/v1/document-management/documents/upload-by-type',
    getDocumentsByPartNumber: (partNumber) => `/api/v1/document-management/documents/by-part-number-all/${partNumber}`
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

  priorityOrders: [], // Add new state for priority orders
  isLoadingPriority: false,
  priorityError: null,

  clearOrderDetails: () => set({ 
    orderDetails: null, 
    error: null,
    isLoading: false 
  }),

  fetchAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.18.7.85:6767/api/v1/planning/all_orders');
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
  
      const response = await fetch('http://172.18.7.85:6767/api/v1/planning/upload-pdf', {
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
        `http://172.18.7.85:6767/api/v1/planning/update_order/${payload.orderNumber}`,
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

  // Update saveOarcDataToDb to use the API_CONFIG
  saveOarcDataToDb: async (storedData) => {
    set({ isLoading: true, error: null });
    try {
      const submitData = {
        data: {
          "Project Name": storedData["Project Name"],
          "Sale Order": storedData["Sale Order"],
          "Part No": storedData["Part No"],
          "Part Desc": storedData["Part Desc"],
          "Required Qty": storedData["Required Qty"],
          "Plant": storedData["Plant"],
          "WBS": storedData["WBS"],
          "Rtg Seq No": storedData["Rtg Seq No"],
          "Sequence No": storedData["Sequence No"],
          "Launched Qty": storedData["Launched Qty"],
          "Prod Order No": storedData["Prod Order No"],
          "Operations": storedData["Operations"],
          "Raw Materials": storedData["Raw Materials"],
          "Document Verification": {}
        }
      };

      const maxRetries = 3;
      let retryCount = 0;
      let response;

      while (retryCount < maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.saveOarcToDb}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(submitData),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            break;
          }

          throw new Error(`Server responded with ${response.status}`);
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
          }
          console.log(`Attempt ${retryCount} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
        }
      }

      const result = await response.json();
      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error('Save OARC data error:', error);
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
      const response = await fetch(`http://172.18.7.85:6767/api/v1/work_centers/${workcenterData.workcenter_id}`, {
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
    set({ isLoadingTimeline: true, timelineError: null });
    try {
      const response = await fetch(
        'http://172.18.7.85:6767/api/v1/scheduling/part-production-timeline/',
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch timeline data');
      }

      const data = await response.json();
      
      // Extract items array from response
      const timelineArray = data.items || [];
      
      // Transform data if needed
      const transformedData = timelineArray.map(item => ({
        ...item,
        key: item.production_order,
      }));

      set({ 
        timelineData: transformedData, 
        isLoadingTimeline: false,
        totalParts: data.total_parts
      });
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching timeline:', error);
      set({ 
        timelineError: error.message, 
        isLoadingTimeline: false,
        timelineData: [], 
        totalParts: 0
      });
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
        `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.getDocumentsByPartNumber(partNumber)}`,
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

      const allOrdersResponse = await fetch('http://172.18.7.85:6767/api/v1/planning/all_orders');
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
        `http://172.18.7.85:6767/api/v1/planning/order/${order1.id}/priority`,
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

      // Update both orders and priorityOrders in the store
      set(state => {
        // Update main orders array
        const updatedOrders = state.orders.map(order => {
          if (order.id === order1.id && order.project) {
            return { ...order, project: { ...order.project, priority: order2Priority }};
          } else if (order.id === order2.id && order.project) {
            return { ...order, project: { ...order.project, priority: order1Priority }};
          }
          return order;
        });

        // Update priority orders array
        const updatedPriorityOrders = state.priorityOrders.map(order => {
          if (order.production_order === order1ProductionOrder) {
            return { ...order, project_priority: order2Priority };
          } else if (order.production_order === order2ProductionOrder) {
            return { ...order, project_priority: order1Priority };
          }
          return order;
        });

        // Sort both arrays by priority
        const sortedOrders = [...updatedOrders].sort((a, b) => 
          (a.project?.priority ?? 999) - (b.project?.priority ?? 999)
        );

        const sortedPriorityOrders = [...updatedPriorityOrders].sort((a, b) => 
          (a.project_priority ?? 999) - (b.project_priority ?? 999)
        );

        // Save the sorted sequence to localStorage
        localStorage.setItem('orderSequence', JSON.stringify({
          orders: sortedOrders.map(order => ({
            id: order.id,
            project_id: order.project?.id,
            priority: order.project?.priority
          })),
          timestamp: Date.now()
        }));

        return {
          orders: sortedOrders,
          priorityOrders: sortedPriorityOrders,
          isLoading: false
        };
      });

      return data;
    } catch (error) {
      console.error('Swap priority error:', error);
      set({ error: error.message || 'Failed to swap priorities', isLoading: false });
      throw error;
    }
  },

  // Add new function to fetch priority orders
  fetchPriorityOrders: async () => {
    set({ isLoadingPriority: true, priorityError: null });
    try {
      const response = await fetch('http://172.18.7.85:6767/api/v1/planning/projects/priority', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch priority orders');
      }

      const data = await response.json();
      
      // Transform the nested structure into a flat array of orders with project info
      const flattenedOrders = data.projects.flatMap(project => 
        project.orders.map(order => ({
          ...order,
          project_name: project.project_name,
          project_priority: project.priority
        }))
      );
      
      set({ 
        priorityOrders: flattenedOrders,
        isLoadingPriority: false 
      });
      return flattenedOrders;
    } catch (error) {
      console.error('Fetch priority orders error:', error);
      set({ 
        priorityError: error.message, 
        isLoadingPriority: false,
        priorityOrders: [] 
      });
      throw error;
    }
  },

  // Update createManualOrder to handle the sequence correctly
  createManualOrder: async (values, mppFile, drawingFile, mppDocName, mppDescription, mppVersion, drawingDocName, drawingDescription, drawingVersion) => {
    set({ isLoading: true, error: null });
    try {
      // Step 1: Create the order
      const orderData = {
        production_order: values.production_order,
        sale_order: values.sale_order,
        wbs_element: values.wbs_element,
        part_number: values.part_number,
        part_description: values.part_description,
        total_operations: values.total_operations,
        required_quantity: values.required_quantity,
        launched_quantity: values.launched_quantity,
        plant_id: values.plant_id,
        project_name: values.project_name
      };

      console.log('Creating order with data:', orderData);

      const orderResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.createOrder}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const savedOrderData = await orderResponse.json();
      console.log('Order created successfully:', savedOrderData);

      // Step 2: Upload documents if provided
      const fileUploadErrors = [];

      // Function to upload a document with correct doc_type values
      const uploadDocument = async (file, name, docType, description, version) => {
        const formData = new FormData();
        const fileObj = file.originFileObj || file;
        
        formData.append('file', fileObj);
        formData.append('name', name);
        // Use the exact values required by the API
        formData.append('doc_type', docType.toUpperCase());
        formData.append('part_number', values.part_number);
        formData.append('description', description || '');
        formData.append('version', version || '1.0');

        console.log(`Uploading ${docType} with data:`, {
          name,
          doc_type: docType.toUpperCase(),
          part_number: values.part_number,
          description,
          version
        });

        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.uploadDocumentByType}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          }
        );

        const result = await response.json();
        
        if (!response.ok) {
          console.error(`${docType} upload error response:`, result);
          throw new Error(result.detail?.[0]?.msg || `Failed to upload ${docType}`);
        }

        return result;
      };

      // Upload MPP file if provided
      let mppResult = null;
      if (mppFile) {
        try {
          mppResult = await uploadDocument(
            mppFile,
            mppDocName,
            'MPP', // Use exact value required by API
            mppDescription,
            mppVersion
          );
          console.log('MPP file uploaded successfully:', mppResult);
        } catch (error) {
          console.error('MPP file upload error:', error);
          fileUploadErrors.push(`MPP file: ${error.message}`);
        }
      }

      // Upload Engineering Drawing if provided
      let drawingResult = null;
      if (drawingFile) {
        try {
          drawingResult = await uploadDocument(
            drawingFile,
            drawingDocName,
            'ENGINEERING_DRAWING', // Use exact value required by API
            drawingDescription,
            drawingVersion
          );
          console.log('Engineering Drawing uploaded successfully:', drawingResult);
        } catch (error) {
          console.error('Engineering Drawing upload error:', error);
          fileUploadErrors.push(`Engineering Drawing: ${error.message}`);
        }
      }

      // Return the final result
      set({ isLoading: false });
      
      if (fileUploadErrors.length > 0) {
        return {
          order: savedOrderData,
          fileUploadError: fileUploadErrors.join('; '),
          documents: {
            mpp: mppResult,
            drawing: drawingResult
          }
        };
      }

      return {
        order: savedOrderData,
        documents: {
          mpp: mppResult,
          drawing: drawingResult
        }
      };

    } catch (error) {
      console.error('Create manual order error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Update the uploadDocumentByType function to fix the 422 error
  uploadDocumentByType: async (file, partNumber, documentType, documentName, description, version) => {
    try {
      const formData = new FormData();
      
      // Make sure we're getting the actual File object
      const fileObj = file.originFileObj || file;
      formData.append('file', fileObj);
      
      // Add metadata as JSON string in a separate field
      const metadata = {
        part_number: partNumber,
        document_type: documentType,
        name: documentName,
        description: description || '',
        version: version || 'v1'
      };
      
      formData.append('metadata', JSON.stringify(metadata));
      
      // Log the request for debugging
      console.log('Uploading document with metadata:', metadata);

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.uploadDocumentByType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // Note: Don't set Content-Type header when using FormData
        },
        body: formData
      });

      // Log the response status for debugging
      console.log(`Document upload response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.detail || `Failed to upload ${documentType} document`;
        } catch (e) {
          // If not JSON, use the raw text
          errorMessage = errorText || `Failed to upload ${documentType} document (Status: ${response.status})`;
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`Upload ${documentType} document error:`, error);
      throw error;
    }
  },
}));

export default useOrderStore;