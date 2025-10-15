import { create } from 'zustand';
import dayjs from 'dayjs';
import { message } from 'antd';
import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';

// API endpoints configuration
const API_CONFIG = {
  BASE_URL: 'http://172.19.224.1:8002',
  QUALITY_URL: 'http://172.19.224.1:8002',
  PLANNING_URL: 'http://172.19.224.1:8002',
  SCHEDULING_URL: 'http://172.19.224.1:8002',
  endpoints: {
    allOrders: '/api/v1/planning/all_orders',
    saveOrder: '/api/v1/planning/save-to-db',
    uploadPdf: '/api/v1/planning/upload-pdf',
    updatePriority: (orderId) => `/api/v1/planning/order/${orderId}/priority`,
    deleteOrder: (orderId) => `/api/v1/planning/orders/${orderId}`,
    uploadMpp: '/api/v1/documents/mpp',
    uploadDrawing: '/api/v1/documents/drawing',
    documents: (productionOrder) => `/api/v1/documents/${productionOrder}`,
    saveOarcToDb: '/api/v1/planning/save-to-db',
    createOrder: '/api/v1/planning/create_order',
    uploadDocumentByType: '/api/v1/document-management/documents/upload-by-type',
    getDocumentsByPartNumber: (partNumber) => `/api/v1/document-management/documents/by-part-number-all/${partNumber}`,
    updateProjectPriorities: '/api/v1/planning/projects/priority',
    checkOrderCompletion: (partNumber, productionOrder) => `/api/v1/scheduling/check-order-completion-simple/${partNumber}/${productionOrder}`
  }
};

// Update the polling interval constant to 1 hour (in milliseconds)
const POLLING_INTERVAL = 60 * 60 * 1000; // 1 hour

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
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.allOrders}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      // Ensure we're working with an array
      const ordersArray = Array.isArray(data) ? data : [];

      let transformedOrders = ordersArray.map(order => ({
        ...order,
        key: order.id || order.production_order || Math.random().toString(),
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

      set({ 
        orders: transformedOrders, 
        isLoading: false 
      });
      
      return transformedOrders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      set({ 
        error: error.message, 
        isLoading: false,
        orders: []
      });
      throw error;
    }
  },
  
  uploadPDF: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await fetch('http://172.19.224.1:8002/api/v1/planning/upload-pdf', {
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

  updateOrder: async (updatedOrder) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/v1/planning/orders/${updatedOrder.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            part_description: updatedOrder.part_description,
            required_quantity: updatedOrder.required_quantity,
            wbs_element: updatedOrder.wbs_element,
            sale_order: updatedOrder.sale_order,
            project: {
              name: updatedOrder.project.name
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order');
      }

      // Update the order in the local state
      set(state => ({
        orders: state.orders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        ),
        isLoading: false
      }));

      // Fetch fresh data to ensure consistency
      await get().fetchAllOrders();

      return { success: true, message: 'Order updated successfully' };
    } catch (error) {
      console.error('Error updating order:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Add createOrder function to the store
  createOrder: async (orderData) => {
    set({ isLoading: true, error: null });
    try {
      // First create the order
      const submitData = {
        data: {
          "Project Name": orderData.project_name,
          "Sale Order": orderData.sale_order,
          "Part No": orderData.part_number,
          "Part Desc": orderData.part_description,
          "Required Qty": orderData.required_quantity.toString(),
          "Plant": orderData.plant_id.toString(),
          "WBS": orderData.wbs_element,
          "Rtg Seq No": "0",
          "Sequence No": "0",
          "Launched Qty": orderData.launched_quantity.toString(),
          "Prod Order No": orderData.production_order,
          "Operations": [],
          "Document Verification": {},
          "Raw Materials": []
        }
      };

      const orderResponse = await fetch(
        `${API_CONFIG.PLANNING_URL}${API_CONFIG.endpoints.saveOrder}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(submitData)
        }
      );

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderResult = await orderResponse.json();

      // Upload MPP document if provided
      if (orderData.mppFile) {
        await get().uploadDocumentByType(
          orderData.mppFile,
          orderData.mppDocName,
          'MPP',
          orderData.part_number,
          orderData.mppDescription,
          orderData.mppVersion
        );
      }

      // Upload Engineering Drawing if provided
      if (orderData.drawingFile) {
        await get().uploadDocumentByType(
          orderData.drawingFile,
          orderData.drawingDocName,
          'ENGINEERING_DRAWING',
          orderData.part_number,
          orderData.drawingDescription,
          orderData.drawingVersion
        );
      }

      set({ isLoading: false });
      return orderResult;

    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Update saveOarcDataToDb to use the API_CONFIG
  saveOarcDataToDb: async (storedData, mppFile, drawingFile, mppDocName, mppDescription, mppVersion, drawingDocName, drawingDescription, drawingVersion) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Saving OARC data with documents:', {
        hasMppFile: !!mppFile,
        hasDrawingFile: !!drawingFile,
        partNumber: storedData["Part No"]
      });

      // First save the OARC data
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.saveOarcToDb}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ data: storedData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save OARC data');
      }

      const savedData = await response.json();
      console.log('OARC data saved successfully:', savedData);

      // Step 2: Upload documents if provided
      const fileUploadErrors = [];

      // Function to handle document upload
      const uploadDocument = async (file, docName, docType, description, version) => {
        if (!file) {
          console.log(`No ${docType} file provided, skipping upload`);
          return;
        }

        console.log(`Preparing to upload ${docType} document:`, {
          docName,
          docType,
          description,
          version,
          fileName: file.name
        });

        const formData = new FormData();
        const fileObj = file.originFileObj || file;
        
        formData.append('file', fileObj);
        formData.append('name', docName);
        formData.append('doc_type', docType);
        formData.append('part_number', storedData["Part No"]);
        formData.append('description', description || '');
        formData.append('version', version || '1.0');

        // Log FormData contents (for debugging)
        for (let pair of formData.entries()) {
          console.log('FormData entry:', pair[0], pair[1]);
        }

        const uploadUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.uploadDocumentByType}`;
        console.log('Uploading to URL:', uploadUrl);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        console.log('Upload response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload error response:', errorText);
          throw new Error(errorText || `Failed to upload ${docType}`);
        }

        const responseData = await response.json();
        console.log(`${docType} upload successful:`, responseData);
        return responseData;
      };

      // Upload MPP file if provided
      if (mppFile) {
        try {
          console.log('Starting MPP file upload...');
          await uploadDocument(mppFile, mppDocName, 'MPP', mppDescription, mppVersion);
          console.log('MPP file uploaded successfully');
        } catch (error) {
          console.error('MPP upload error:', error);
          fileUploadErrors.push(`MPP file: ${error.message}`);
        }
      }

      // Upload Engineering Drawing if provided
      if (drawingFile) {
        try {
          console.log('Starting Engineering Drawing upload...');
          await uploadDocument(drawingFile, drawingDocName, 'ENGINEERING_DRAWING', drawingDescription, drawingVersion);
          console.log('Engineering Drawing uploaded successfully');
        } catch (error) {
          console.error('Engineering Drawing upload error:', error);
          fileUploadErrors.push(`Engineering Drawing: ${error.message}`);
        }
      }

      set({ isLoading: false });
      return {
        message: "Data saved successfully",
        fileUploadError: fileUploadErrors.length > 0 ? fileUploadErrors.join('; ') : null
      };

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
      const response = await fetch(`http://172.19.224.1:8002/api/v1/work_centers/${workcenterData.workcenter_id}`, {
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
      // Add authorization token to the request
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/scheduling/part-production-timeline/`, {
        headers,
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        const errorMessage = response.status === 500 
          ? 'Server error: The timeline service is currently unavailable'
          : 'Failed to fetch timeline data';
        
        console.warn(`Timeline API returned status ${response.status}`);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Extract items array from the response
      const timelineItems = data.items?.map(item => ({
        ...item,
        key: item.production_order // Use production_order as key
      })) || [];

      set({ 
        timelineData: timelineItems,
        isLoadingTimeline: false 
      });
      
      return timelineItems;
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      
      // Silently handle the error without showing a message to the user
      // message.error({
      //   content: 'Could not load timeline data. Some features may be limited.',
      //   duration: 5
      // });
      
      set({ 
        timelineError: error.message, 
        isLoadingTimeline: false,
        timelineData: [] // Set empty array instead of null to prevent rendering errors
      });
      
      // Return empty array to prevent downstream errors
      return [];
    }
  },

  // Start polling when component mounts
  startPolling: () => {
    const { fetchAllOrders, fetchTimelineData } = get();
    
    // Initial fetch
    fetchAllOrders().catch(error => console.error('Initial orders fetch failed:', error));
    fetchTimelineData().catch(error => console.error('Initial timeline fetch failed:', error));
    
    // Set up polling interval (1 hour)
    const intervalId = setInterval(() => {
      fetchAllOrders().catch(error => console.error('Polling orders fetch failed:', error));
      fetchTimelineData().catch(error => console.error('Polling timeline fetch failed:', error));
    }, POLLING_INTERVAL);
    
    // Store the interval ID
    set({ pollingInterval: intervalId });
    
    console.log('Orders polling started with 1-hour interval');
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
      console.log('Orders polling stopped');
    }
  },

  // Update fetchDocumentsByPartNumber to handle document caching
  fetchDocumentsByPartNumber: async (partNumber) => {
    // Configure message to appear in the middle of the screen
    message.config({
      top: '50vh',
      maxCount: 1
    });

    set({ 
      documentLoadingStates: {
        mpp: true,
        engineering: true
      }
    });

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/v1/document-management/documents/by-part-number-all/${partNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      console.log('Checked documents for part number:', partNumber, data);
      
      // Create detailed message about document existence
      const hasMpp = !!data.mpp_document;
      const hasDrawing = !!data.engineering_drawing_document;
      
      if (hasMpp || hasDrawing) {
        const details = [];
        if (hasMpp) {
          details.push(`MPP Document (Version: ${data.mpp_document.latest_version?.version_number || 'N/A'})`);
        }
        if (hasDrawing) {
          details.push(`Engineering Drawing (Version: ${data.engineering_drawing_document.latest_version?.version_number || 'N/A'})`);
        }
  
        message.info({
          content: `Found existing documents for Part Number: ${partNumber}\n\n${details.join('\n')}`,
          duration: 5,
          style: { 
            whiteSpace: 'pre-line',
            position: 'absolute',
            left: '60%',
            width: '400px',
          // / marginTop:-6-60vh', // Adjust message position to be more centered
            textAlign: 'left',
            padding: '16px',
            boxShadow: '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08)',
            background: '#ffffff',
            borderRadius: '4px'
          }
        });
      } else {
        message.warning({
          content: `No documents found for Part Number: ${partNumber}\n\nMPP Document: Not found\nEngineering Drawing: Not found`,
          duration: 5,
          style: { 
            whiteSpace: 'pre-line',
            position: 'absolute',
            left: '60%',
            width: '400px',
            // marginTop: '-20vh', // Adjust message position to be more centered
            textAlign: 'left',
            padding: '16px',
            boxShadow: '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08)',
            background: '#ffffff',
            borderRadius: '4px'
          }
        });
      }
      
      // Store the documents in state
      set({ 
        documents: {
          mpp_document: data.mpp_document ? {
            ...data.mpp_document,
            existingFile: data.mpp_document.latest_version?.file_url || null,
            existingName: data.mpp_document.name || '',
            existingDescription: data.mpp_document.description || '',
            existingVersion: data.mpp_document.latest_version?.version_number || 'v1',
            uploadedFiles: data.mpp_document.versions || []
          } : null,
          engineering_drawing_document: data.engineering_drawing_document ? {
            ...data.engineering_drawing_document,
            existingFile: data.engineering_drawing_document.latest_version?.file_url || null,
            existingName: data.engineering_drawing_document.name || '',
            existingDescription: data.engineering_drawing_document.description || '',
            existingVersion: data.engineering_drawing_document.latest_version?.version_number || 'v1',
            uploadedFiles: data.engineering_drawing_document.versions || []
          } : null,
          oarc_document: data.oarc_document,
          ipid_document: data.ipid_document,
          all_documents: data.all_documents || []
        },
        documentLoadingStates: {
          mpp: false,
          engineering: false
        }
      });

      return data;
    } catch (error) {
      console.error('Error checking documents:', error);
      message.error({
        content: `Failed to check documents for Part Number: ${partNumber}\nError: ${error.message}`,
        duration: 5,
        style: { 
          whiteSpace: 'pre-line',
          width: '400px',
          marginTop: '-20vh', // Adjust message position to be more centered
          textAlign: 'left',
          padding: '16px',
          boxShadow: '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08)',
          background: '#ffffff',
          borderRadius: '4px'
        }
      });
      
      set({ 
        documents: {
          mpp_document: null,
          engineering_drawing_document: null,
          oarc_document: null,
          ipid_document: null,
          all_documents: []
        },
        documentError: error.message,
        documentLoadingStates: {
          mpp: false,
          engineering: false
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
    documentLoadingStates: {
      mpp: false,
      engineering: false
    }
  }),

  swapOrderPriority: async (order1ProductionOrder, order2ProductionOrder, order1Priority, order2Priority) => {
    try {
      set({ isLoading: true, error: null });
      const { orders } = get();

      // Find orders in current state
      const order1 = orders.find(order => String(order.production_order) === String(order1ProductionOrder));
      const order2 = orders.find(order => String(order.production_order) === String(order2ProductionOrder));

      if (!order1?.id || !order2?.id) {
        throw new Error('Could not find order IDs for the selected orders');
      }

      // Make the priority update request
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/v1/planning/order/${order1.id}/priority`,
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update priority');
      }

      // Fetch latest priorities after successful swap
      const priorityResponse = await fetch('http://172.19.224.1:8002/api/v1/planning/projects/priority', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!priorityResponse.ok) {
        throw new Error('Failed to fetch updated priorities');
      }

      const priorityData = await priorityResponse.json();

      // Transform and update the orders with latest priorities
      const updatedOrders = orders.map(order => {
        const projectWithOrder = priorityData.projects.find(project => 
          project.orders.some(o => String(o.production_order) === String(order.production_order))
        );

        if (projectWithOrder) {
          return {
            ...order,
            project: {
              ...order.project,
              priority: projectWithOrder.priority,
              name: projectWithOrder.project_name
            }
          };
        }
        return order;
      });

      // Sort orders by priority
      const sortedOrders = [...updatedOrders].sort((a, b) => {
        const priorityA = a.project?.priority || 999;
        const priorityB = b.project?.priority || 999;
        return priorityA - priorityB;
      });

      set({ orders: sortedOrders, isLoading: false });

      return {
        updated_priorities: [
          { production_order: order1ProductionOrder, priority: order2Priority },
          { production_order: order2ProductionOrder, priority: order1Priority }
        ]
      };
    } catch (error) {
      console.error('Error updating order priorities:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Add new function to fetch priority orders
  fetchPriorityOrders: async () => {
    set({ isLoadingPriority: true, priorityError: null });
    try {
      const response = await fetch('http://172.19.224.1:8002/api/v1/planning/projects/priority', {
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
  createManualOrder: async (data) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Creating order with data:', {
        production_order: data.production_order,
        sale_order: data.sale_order,
        wbs_element: data.wbs_element,
        part_number: data.part_number,
        part_description: data.part_description,
        total_operations: data.total_operations,
        required_quantity: data.required_quantity,
        launched_quantity: data.launched_quantity,
        plant_id: data.plant_id,
        project_name: data.project_name
      });
      
      // First create the order
      const orderResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.createOrder}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          production_order: data.production_order,
          sale_order: data.sale_order,
          wbs_element: data.wbs_element,
          part_number: data.part_number,
          part_description: data.part_description,
          total_operations: data.total_operations,
          required_quantity: data.required_quantity,
          launched_quantity: data.launched_quantity,
          plant_id: data.plant_id,
          project_name: data.project_name
        })
      });

      // First check if the response is ok
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        console.error('Order creation failed:', {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
          error: errorData
        });
        throw new Error(errorData.message || 'Failed to create order');
      }

      // If response is ok, parse the response once
      const orderResult = await orderResponse.json();
      console.log('Order creation successful:', orderResult);
      const fileUploadErrors = [];

      // Upload MPP document if provided
      if (data.mppFile) {
        try {
          const mppFormData = new FormData();
          mppFormData.append('file', data.mppFile);
          mppFormData.append('name', data.mppDocName || 'MPP Document');
          mppFormData.append('doc_type', 'MPP');
          mppFormData.append('part_number', data.part_number);
          mppFormData.append('description', data.mppDescription || '');
          mppFormData.append('version', data.mppVersion || 'v1');

          const mppResponse = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.uploadDocumentByType}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: mppFormData
            }
          );

          if (!mppResponse.ok) {
            throw new Error('Failed to upload MPP document');
          }
        } catch (error) {
          fileUploadErrors.push(`MPP: ${error.message}`);
        }
      }

      // Upload Engineering Drawing if provided
      if (data.drawingFile) {
        try {
          const drawingFormData = new FormData();
          drawingFormData.append('file', data.drawingFile);
          drawingFormData.append('name', data.drawingDocName || 'Engineering Drawing');
          drawingFormData.append('doc_type', 'ENGINEERING_DRAWING');
          drawingFormData.append('part_number', data.part_number);
          drawingFormData.append('description', data.drawingDescription || '');
          drawingFormData.append('version', data.drawingVersion || 'v1');

          const drawingResponse = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.uploadDocumentByType}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: drawingFormData
            }
          );

          if (!drawingResponse.ok) {
            throw new Error('Failed to upload Engineering Drawing');
          }
        } catch (error) {
          fileUploadErrors.push(`Engineering Drawing: ${error.message}`);
        }
      }

      set({ isLoading: false });
      return {
        order: orderResult,
        fileUploadErrors: fileUploadErrors.length > 0 ? fileUploadErrors : null
      };

    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Update the uploadDocumentByType function to fix the 422 error
  uploadDocumentByType: async (file, docName, docType, partNumber, description = '', version = 'v1') => {
    try {
      console.log('Uploading document with details:', {
        fileName: file.name,
        fileSize: file.size,
        docName,
        docType,
        partNumber,
        description,
        version
      });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const formData = new FormData();
      formData.append('file', file.originFileObj || file);
      formData.append('name', docName);
      formData.append('doc_type', docType);
      formData.append('part_number', partNumber);
      formData.append('description', description);
      formData.append('version', version);

      // Log FormData entries for verification
      for (let pair of formData.entries()) {
        console.log('FormData entry:', pair[0], 
          typeof pair[1] === 'object' ? `File: ${pair[1].name}, type: ${pair[1].type}, size: ${pair[1].size}` : pair[1]);
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.uploadDocumentByType}`;
      console.log('Uploading to URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to upload document';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || `Error ${response.status}: ${errorMessage}`;
          console.error('Error response data:', errorData);
        } catch (e) {
          errorMessage = `Server error (${response.status}): ${errorMessage}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Upload successful, response:', data);
      return data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // Add polling functions
  startTimelinePolling: () => {
    const interval = setInterval(async () => {
      try {
        await get().fetchAllOrders();
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000); // Poll every 30 seconds

    set({ timelinePollingInterval: interval });
  },

  stopTimelinePolling: () => {
    const interval = get().timelinePollingInterval;
    if (interval) {
      clearInterval(interval);
      set({ timelinePollingInterval: null });
    }
  },

  // Update this function to use the uploadDocumentByType endpoint for new versions
  uploadNewVersion: async (documentId, file, version) => {
    try {
      console.log('Uploading new version for document ID:', documentId);
      console.log('Version number:', version);
      
      // Get document details from state to fetch required information
      const state = get();
      const { documents } = state;
      
      // Find the document in either MPP or Engineering Drawing
      let documentInfo = null;
      let docType = '';
      
      if (documents.mpp_document && documents.mpp_document.id === documentId) {
        documentInfo = documents.mpp_document;
        docType = 'MPP';
      } else if (documents.engineering_drawing_document && documents.engineering_drawing_document.id === documentId) {
        documentInfo = documents.engineering_drawing_document;
        docType = 'ENGINEERING_DRAWING';
      }
      
      if (!documentInfo) {
        throw new Error('Document not found in state');
      }
      
      const formData = new FormData();
      
      // Handle file from antd Upload component if needed
      const fileObj = file.originFileObj || file;
      console.log('File to upload:', fileObj.name, fileObj.type, fileObj.size);
      
      formData.append('file', fileObj);
      formData.append('name', documentInfo.name);
      formData.append('doc_type', docType);
      formData.append('part_number', documentInfo.part_number);
      formData.append('description', documentInfo.description || '');
      formData.append('version', version);

      // Log FormData for debugging
      for (let pair of formData.entries()) {
        console.log('FormData entry:', pair[0], typeof pair[1] === 'object' ? 'File: ' + pair[1].name : pair[1]);
      }

      // Use the uploadDocumentByType endpoint
      const endpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.uploadDocumentByType}`;
      console.log('Sending request to endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || 'Failed to upload new version');
        } catch (parseError) {
          throw new Error(`Failed to upload new version (${response.status}): ${errorText.substring(0, 100)}`);
        }
      }

      const data = await response.json();
      console.log('Upload successful, response data:', data);
      return data;
    } catch (error) {
      console.error('Error uploading new version:', error);
      throw error;
    }
  },

  // Update the checkDocumentsByPartNumber function
  checkDocumentsByPartNumber: async (partNumber) => {
    // Show loading message first
    const loadingKey = 'documentCheck';
    message.loading({
      content: '⌛ Checking documents...',
      key: loadingKey,
      duration: 0,
      style: {
        padding: '12px 20px',
        borderRadius: '8px',
        background: 'white',
        boxShadow: '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08)',
        marginTop: '0',
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'auto',
        textAlign: 'center'
      }
    });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Log the API call for debugging
      console.log(`Checking documents for part number: ${partNumber}`);

      // Call the documents endpoint
      const response = await fetch(
        `http://172.19.224.1:8002/api/v1/document-management/documents/by-part-number-all/${partNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (!response.ok) {
        const statusText = response.statusText || `Error ${response.status}`;
        console.error(`Document check failed: ${statusText}`);
        throw new Error(`Failed to fetch documents (${statusText})`);
      }

      const data = await response.json();
      console.log('Document check response:', data);
      
      // Check if any documents exist
      const hasMpp = !!data.mpp_document;
      const hasDrawing = !!data.engineering_drawing_document;

      // Show result after loading
      if (hasMpp || hasDrawing) {
        console.log('Documents found:', {
          hasMppDoc: hasMpp,
          hasDrawingDoc: hasDrawing
        });
        
        message.success({
          content: '✅ Documents exist for this part number',
          key: loadingKey,
          className: 'custom-message-notification',
          style: {
            marginTop: '0',
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'auto',
            textAlign: 'center'
          }
        });
      } else {
        console.log('No documents found for part number:', partNumber);
        
        message.warning({
          content: `⚠️ No documents found for part number: ${partNumber}`,
          key: loadingKey,
          className: 'custom-message-notification',
          style: {
            marginTop: '0',
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'auto',
            textAlign: 'center'
          }
        });
      }
      
      // Update the documents state
      set({ 
        documents: {
          mpp_document: data.mpp_document,
          engineering_drawing_document: data.engineering_drawing_document,
          oarc_document: data.oarc_document,
          ipid_document: data.ipid_document,
          all_documents: data.all_documents || []
        },
        documentLoadingStates: {
          mpp: false,
          engineering: false
        },
        documentError: null // Clear any previous errors
      });

      return data;
    } catch (error) {
      console.error('Error checking documents:', error);
      message.error({
        content: `❌ ${error.message || 'Failed to check documents'}`,
        key: loadingKey,
        className: 'custom-message-notification',
        style: {
          marginTop: '0',
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'auto',
          textAlign: 'center'
        }
      });
      
      set({ 
        documents: {
          mpp_document: null,
          engineering_drawing_document: null,
          oarc_document: null,
          ipid_document: null,
          all_documents: []
        },
        documentError: error.message,
        documentLoadingStates: {
          mpp: false,
          engineering: false
        }
      });
      throw error;
    }
  },

  // Add this function to your store
  uploadDocumentVersion: async (documentId, formData) => {
    try {
      console.log(`Uploading document version for document ID: ${documentId}`);
      
      // Check if we have a token
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        throw new Error('Authentication token is missing');
      }
      
      // Check formData content before sending
      console.log('FormData contents being sent:');
      for (let pair of formData.entries()) {
        if (pair[0] === 'file') {
          console.log('FormData file:', {
            name: pair[1].name,
            type: pair[1].type,
            size: pair[1].size
          });
        } else {
          console.log(`FormData ${pair[0]}:`, pair[1]);
        }
      }
      
      // Make sure we're using the correct URL
      const endpoint = `${API_CONFIG.BASE_URL}/api/v1/document-management/documents/${documentId}/versions`;
      console.log(`Sending request to: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      // Log response status for debugging
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        // Try to get detailed error information
        let errorText;
        try {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
          errorText = JSON.stringify(errorData);
          throw new Error(errorData.detail || errorData.message || `Server returned ${response.status}`);
        } catch (jsonError) {
          // If we can't parse JSON, try to get text
          try {
            errorText = await response.text();
            console.error('Error response text:', errorText);
          } catch (textError) {
            errorText = 'Could not extract error details';
          }
          throw new Error(`Failed to upload document version (${response.status}): ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('Document version upload successful, response:', data);
      return data;
    } catch (error) {
      console.error('Error uploading document version:', error);
      throw error;
    }
  },

  // Remove the duplicate function and replace with a function to clear document versions
  clearDocumentVersions: () => {
    set({
      documents: {
        ...get().documents,
        mpp_document: get().documents.mpp_document ? {
          ...get().documents.mpp_document,
          versions: []
        } : null,
        engineering_drawing_document: get().documents.engineering_drawing_document ? {
          ...get().documents.engineering_drawing_document,
          versions: []
        } : null
      }
    });
  },

  // Add deleteOrder function
  deleteOrder: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.deleteOrder(orderId)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete order');
      }

      // Update the orders list by removing the deleted order
      set(state => ({
        orders: state.orders.filter(order => order.id !== orderId),
        isLoading: false
      }));

      return { success: true, message: 'Order deleted successfully' };
    } catch (error) {
      console.error('Delete order error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Add deleteMachine function
  deleteMachine: async (machineId) => {
    set({ isLoading: true, error: null });
    try {
      // Show loading message
      message.loading({ 
        content: 'Deleting machine...', 
        key: 'deleteMachine',
        duration: 0 
      });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetch(
        `http://172.19.224.1:8002/api/v1/master-order/machines/${machineId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      // Get the response data
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }

      if (!response.ok) {
        // Clear loading message
        message.destroy('deleteMachine');
        
        if (response.status === 500) {
          throw new Error('Server error: The machine may be linked to a workcenter. Please unlink it first.');
        } else if (response.status === 404) {
          throw new Error('Machine not found. It may have been already deleted.');
        } else {
          throw new Error(errorData.message || errorData.detail || 'Failed to delete machine');
        }
      }

      // Clear loading and show success
      message.success({ 
        content: 'Machine deleted successfully', 
        key: 'deleteMachine' 
      });

      // Update the machines list by removing the deleted machine
      set(state => ({
        machines: state.machines.filter(machine => machine.id !== machineId),
        isLoading: false
      }));

      return { success: true, message: 'Machine deleted successfully' };
    } catch (error) {
      console.error('Delete machine error:', error);
      
      // Show error message
      message.error({ 
        content: error.message || 'Failed to delete machine', 
        key: 'deleteMachine' 
      });
      
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  checkOrderCompletion: async (partNumber, productionOrder) => {
    try {
      // Input validation
      if (!partNumber || !productionOrder) {
        console.error('Missing required parameters:', { partNumber, productionOrder });
        throw new Error('Part number and production order are required');
      }

      console.log('Starting order completion check with parameters:', {
        partNumber,
        productionOrder,
        timestamp: new Date().toISOString()
      });

      const url = `http://172.19.224.1:8002/api/v1/scheduling/check-order-completion-simple?part_number=${partNumber}&production_order=${productionOrder}`;
      console.log('API Endpoint URL:', url);

      const token = localStorage.getItem('token');
      console.log('Auth token present:', !!token);

      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('Making API request...');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || 'Unknown error';
          console.error('API Error Response:', errorData);
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || `HTTP error ${response.status}`;
          console.error('API Error Text:', errorText);
        }
        throw new Error(`API request failed: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('API Success Response:', data);

      // Validate response data
      if (!data || !data.completed_orders) {
        throw new Error('Invalid response format: missing completed_orders array');
      }

      // Return the entire response object which includes completed_orders and summary
      return {
        message: data.message || 'No status message available',
        summary: data.summary || { total_completed_orders: 0 },
        completed_orders: data.completed_orders.map(order => ({
          is_order_completed: order.is_order_completed || false,
          message: order.message || 'No status message available',
          part_number: order.part_number || '',
          production_order: order.production_order || '',
          project_name: order.project_name || 'Unknown Project',
          completed_operations: order.completed_operations || 0,
          total_eligible_operations: order.total_eligible_operations || 0,
          total_all_operations: order.total_all_operations || 0,
          completion_percentage: order.completion_percentage || 0,
          overall_completion_date: order.overall_completion_date || null,
          completion_date_status: order.completion_date_status || 'Unknown'
        }))
      };

    } catch (error) {
      console.error('Error in checkOrderCompletion:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },
}));

export default useOrderStore;