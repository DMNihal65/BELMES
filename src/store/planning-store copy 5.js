import { create } from 'zustand';
import { useState, useEffect } from 'react';
import { Spin, Tooltip } from 'antd';
import moment from 'moment';

const usePlanningStore = create((set) => ({
  // Function to fetch operations for tool management
  fetchOperationsForTool: async (productionOrder) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`http://172.19.224.1:8002/api/v1/planning/search_order2?production_order=${productionOrder}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch operations');
      }

      // Extract operations from the response
      const operations = data.orders?.[0]?.operations || [];
      console.log('Fetched operations:', operations); // Debug log
      
      // Transform operations for dropdown
      const formattedOperations = operations.map(op => ({
        ...op,
        value: op.id, // Use operation id as the value
        label: `${op.operation_number} - ${op.operation_description || 'No Description'}`,
      }));

      console.log('Formatted operations:', formattedOperations); // Debug log
      set({ isLoading: false, error: null });
      return formattedOperations;
    } catch (error) {
      console.error('Error fetching operations for tool:', error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },
  searchResults: [],
  allOrders: [],
  partNumbers: [],
  isLoading: false,
  error: null,
  mppDetails: null,
  activeParts: [],
  selectedOrder: null,
  machines: [
    { id: 1, name: 'Machine A', status: 'Available' },
    { id: 2, name: 'Machine B', status: 'In Use' },
    { id: 3, name: 'Machine C', status: 'Under Maintenance' },
  ],
  mppDocuments: [],
  selectedMppDocument: null,
  mppData: null,
  setMppData: (data) => set({ mppData: data }),

  // Fetch all orders to get part numbers for dropdown
  fetchAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://172.19.224.1:8002/api/v1/planning/all_orders');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch all orders');
      }

      // Extract production orders and part descriptions for dropdown
      const productionOrders = Array.isArray(data) ? data.map(item => ({
        id: item.id || String(Math.random()),
        value: item.production_order,  // Value for the Select component
        label: `${item.production_order} | ${item.part_description || 'No Description'}`,  // Display text in dropdown
        productionOrder: item.production_order,
        partDescription: item.part_description || '',
        partNumber: item.part_number || ''
      })) : [];

      set({ 
        allOrders: data,
        partNumbers: productionOrders,
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
  searchOrders: async (productionOrder) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`http://172.19.224.1:8002/api/v1/planning/search_order2?production_order=${productionOrder}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch order details');
      }

      // Transform the operations data if needed
      const transformedData = {
        ...data,
        orders: data.orders.map(order => ({
          ...order,
          operations: order.operations?.filter(op => op.boolean === true).map(op => ({
            ...op,
            key: op.id.toString(),
            production_order: order.production_order // Map the production_order from the order level
          })) || []
        }))
      };

      console.log('Search Response:', transformedData); // Debug log
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
  fetchMPPDetails: async (productionOrder) => {
    try {
      if (!productionOrder) {
        console.error('No production order provided to fetchMPPDetails');
        return null;
      }

      console.log('Fetching MPP for production order:', productionOrder); // Debug log

      const response = await fetch(`http://172.19.224.1:8002/api/v1/documents/mpp/${productionOrder}`, {
        headers: {
          'accept': 'application/json'
        },
        credentials: 'include' // This will include cookies with the request
      });
      
      console.log('Response status:', response.status); // Debug log

      if (response.status === 404) {
        console.log('No MPP document found for production order:', productionOrder);
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch MPP documents');
      }
      
      const data = await response.json();
      console.log('MPP data:', data); // Debug log

      // Check if we have documents and get the latest version
      if (data && Array.isArray(data) && data.length > 0) {
        const latestDoc = data[0]; // Get the first document
        const latestVersion = latestDoc.latest_version;
        
        if (latestVersion) {
          // If we have a latest version, download it
          await usePlanningStore.getState().downloadMppDocument(latestVersion.id);
        }

        return latestDoc;
      }
      
      return null;
    } catch (error) {
      console.error('MPP details fetch error:', error);
      throw error;
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

      const response = await fetch('http://172.19.224.1:8002/api/v1/mpp', {
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
    });
  },

  // Check order completion status
  checkOrderCompletion: async (partNumber, productionOrder) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Checking completion status for:', { partNumber, productionOrder });
      const response = await fetch(`http://172.19.224.1:8002/api/v1/scheduling/check-order-completion-simple/${partNumber}/${productionOrder}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      // First check if the response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Completion status response:', data);
      
      set({ isLoading: false, error: null });
      return data;
    } catch (error) {
      console.error('Completion status check error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Add new function to fetch active parts
  fetchActiveParts: async () => {
    try {
      set({ isLoading: true });
      const response = await fetch('http://172.19.224.1:8002/api/v1/scheduling/active-parts');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch active parts');
      }

      console.log('Fetched active parts:', data);
      
      // Make sure each part has a production_order and status field
      const normalizedActiveParts = data.active_parts?.map(part => ({
        ...part,
        production_order: part.production_order || part.production_order_number,
        status: part.status || 'active' // Default to active if status is missing
      })) || [];
      
      set({ activeParts: normalizedActiveParts, isLoading: false });
      return normalizedActiveParts;
    } catch (error) {
      console.error('Error fetching active parts:', error);
      set({ activeParts: [], isLoading: false });
      return [];
    }
  },

  // Update the changePartStatus function
  changePartStatus: async (productionOrder, newStatus) => {
    try {
      // Using production order in the endpoint
      const response = await fetch(`http://172.19.224.1:8002/api/v1/scheduling/set-part-status/${productionOrder}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: newStatus
        })
      });
      
      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { detail: text };
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Production order not found`);
        } else if (response.status === 500) {
          throw new Error('Server error occurred while updating status');
        } else {
          throw new Error(data.detail || `Failed to change part status (${response.status})`);
        }
      }

      // Refresh active parts list after status change
      const fetchActiveParts = usePlanningStore.getState().fetchActiveParts;
      await fetchActiveParts();

      // Update the local state to immediately reflect the status change
      // This ensures PDC info will update immediately after status change
      set(state => ({
        activeParts: state.activeParts.map(part => 
          part.production_order === productionOrder 
            ? { ...part, status: newStatus } 
            : part
        )
      }));

      return data;
    } catch (error) {
      console.error('Change part status error:', error);
      throw error;
    }
  },

  // Add this new function to fetch machine details
  fetchMachineDetails: async (machineId) => {
    try {
      const response = await fetch(`http://172.19.224.1:8002/api/v1/master-order/machines/${machineId}`);
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
      const response = await fetch(`http://172.19.224.1:8002/api/v1/master-order/machines/${machineId}`, {
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

  // Function to update operation details
  updateOperationDetails: async (partNumber, operationNumber, updateData) => {
    try {
      console.log('Sending operation update data:', {
        partNumber,
        operationNumber,
        updateData
      });
      
      const response = await fetch(`http://172.19.224.1:8002/api/v1/planning/operations/${updateData.production_order}/${operationNumber}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation_description: updateData.operation_description,
          setup_time: updateData.setup_time,
          ideal_cycle_time: updateData.ideal_cycle_time,
          work_center_code: updateData.work_center_code,
          machine_id: updateData.machine_id,
          production_order: updateData.production_order
        })
      });

      // Try to get detailed error information if the request fails
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('API error response:', errorData);
        } catch (parseError) {
          errorData = await response.text();
          console.error('API error text:', errorData);
        }
        
        throw new Error(
          errorData && typeof errorData === 'object' && errorData.detail 
            ? errorData.detail 
            : 'Failed to update operation details'
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating operation:', error);
      throw error;
    }
  },

  // Function to update machine for operation
  updateOperationMachine: async (partNumber, operationNumber, updateData) => {
    try {
      // Format the data according to the API requirements
      const formattedData = {
        operation_description: updateData.operation_description,
        setup_time: parseFloat(updateData.setup_time),
        ideal_cycle_time: parseFloat(updateData.ideal_cycle_time),
        work_center_code: updateData.work_center_code,
        machine_id: updateData.machine_id,
        production_order: updateData.production_order
      };

      console.log('Sending machine update data:', formattedData);

      const response = await fetch(`http://172.19.224.1:8002/api/v1/planning/operations/${updateData.production_order}/${operationNumber}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.detail || 'Failed to update machine');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating machine:', error);
      throw error;
    }
  },

  // Function to fetch MPP documents using production order
  fetchMppDocuments: async (productionOrder) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // First try to get MPP documents using production order
      const response = await fetch(`http://172.19.224.1:8002/api/v1/documents/mpp/${productionOrder}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch MPP documents');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching MPP documents:', error);
      throw error;
    }
  },





  // Function to fetch MPP by identifier (production order and operation)
  fetchMppByIdentifier: async (productionOrder, operationNumber) => {
    try {
      const response = await fetch(`http://172.19.224.1:8002/api/v1/mpp/by-identifier?operation_number=${operationNumber}&production_order=${productionOrder}`, {
        headers: {
          'accept': 'application/json'
        }
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch MPP details');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching MPP by identifier:', error);
      return null;
    }
  },

  // Function to create new MPP
  createNewMpp: async (mppData) => {
    try {
      // Format the data according to the API requirements
      const formattedData = {
        part_number: mppData.part_number,
        operation_number: Number(mppData.operation_number),
        fixture_number: String(mppData.fixture_number || ''),
        ipid_number: String(mppData.ipid_number || ''),
        datum_x: String(mppData.datum_x || ''),
        datum_y: String(mppData.datum_y || ''),
        datum_z: String(mppData.datum_z || ''),
        work_instructions: (mppData.work_instructions?.sections || []).map((section, index) => ({
          title: String(section.title || ''),
          instructions: String(section.instructions || ''),
          sequence: index
        }))
      };

      console.log('Sending formatted MPP data:', formattedData);

      const response = await fetch('http://172.19.224.1:8002/api/v1/mpp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.detail || 'Failed to create MPP');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating MPP:', error);
      if (error.response) {
        const errorData = await error.response.json();
        throw new Error(errorData.detail || 'Failed to create MPP');
      }
      throw error;
    }
  },

  // Update downloadMppDocument to use the correct endpoint
  downloadMppDocument: async (versionId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`http://172.19.224.1:8002/api/v1/documents/${versionId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      // Get filename from Content-Disposition header if available
      let filename = 'document';
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Default to .txt for CNC program files
      const isCncProgram = filename.match(/\.(nc|cnc|prt|mpf)$/i) || 
                          versionId.toString().includes('cnc-program');
      
      if (isCncProgram && filename.includes('.')) {
        // Replace existing extension with .txt
        filename = filename.replace(/\.[^.]+$/, '.txt');
      } else if (isCncProgram) {
        filename += '.txt';
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Use a download link instead of window.open
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  },

  // Function to fetch documents by part number
  fetchDocumentsByPartNumber: async (partNumber) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/documents/by-part-number-all/${partNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      console.log('Documents by part number:', data);
      
      // Find MPP document if it exists
      const mppDocument = data.mpp_document;
      if (mppDocument?.latest_version?.id) {
        return mppDocument;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching documents by part number:', error);
      throw error;
    }
  },

  // Function to download latest document version
  downloadLatestDocument: async (documentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/download-latest`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      // Check if there's a file to download
      const contentType = response.headers.get('content-type');
      if (contentType && contentType !== 'application/json') {
        // Get filename from Content-Disposition header if available
        let filename = 'document';
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }

        // Default to .txt for CNC program files
        const isCncProgram = filename.match(/\.(nc|cnc|prt|mpf)$/i) || 
                            documentId.toString().includes('cnc-program');
        
        if (isCncProgram && filename.includes('.')) {
          // Replace existing extension with .txt
          filename = filename.replace(/\.[^.]+$/, '.txt');
        } else if (isCncProgram) {
          filename += '.txt';
        }
        
        // It's a file - download it
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Use a download link instead of window.open
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
        
        return true;
      }

      return false; // No file to download
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  },

  // Update the handleMppView function
  handleMppView: async (partNumber, operation) => {
    try {
      if (!partNumber) {
        console.error('No part number provided to handleMppView');
        return { hasFile: false };
      }

      console.log('Checking MPP document for part number:', partNumber);
      
      // 1. First check if MPP document exists
      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/documents/by-part-number-all/${partNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const documentsData = await response.json();
      console.log('Documents response:', documentsData);

      // Check if MPP document exists and has latest version
      if (documentsData.mpp_document?.id) {
        console.log('Found MPP document, attempting download');
        
        // Download the document
        const downloadResponse = await fetch(
          `http://172.19.224.1:8002/api/v1/document-management/documents/${documentsData.mpp_document.id}/download-latest`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'accept': '*/*'
          }
        });

        if (downloadResponse.ok) {
          const contentType = downloadResponse.headers.get('content-type');
          if (contentType && !contentType.includes('application/json')) {
            // Get filename from Content-Disposition header
            const contentDisposition = downloadResponse.headers.get('content-disposition');
            // const contentDisposition = downloadResponse.headers.get('content-disposition');
console.log('Content-Disposition Header:', contentDisposition);
            const filename = contentDisposition 
            
      ? contentDisposition.match(/filename="?([^"]+)"?/)[1] 
      : 'document';

            // Use the original filename as is

            const blob = await downloadResponse.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Use a download link instead of window.open
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }, 100);
            
            return { hasFile: true };
          }
        }
      }

      // 2. If no document exists, check for MPP data using the correct endpoint
      console.log('Checking MPP data for part:', partNumber, 'operation:', operation.operation_number);
      const mppResponse = await fetch(
        `http://172.19.224.1:8002/api/v1/mpp/by-part/${partNumber}/${operation.operation_number}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      });

      if (mppResponse.ok) {
        const mppData = await mppResponse.json();
        return { hasFile: false, mppData: Array.isArray(mppData) ? mppData[0] : mppData };
      } 
      
      // If 404 or any other error, return null mppData to show empty drawer
      console.log('No MPP data found or error, will show empty drawer');
      return { hasFile: false, mppData: null };
    } catch (error) {
      console.error('Error handling MPP view:', error);
      return { hasFile: false, mppData: null };
    }
  },

  // Update the createOrFetchMPP function
  createOrFetchMPP: async (partNumber, operationNumber) => {
    try {
      const response = await fetch(`http://172.19.224.1:8002/api/v1/mpp/by-part/${partNumber}/${operationNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        const mppData = await response.json();
        // Since the response is an array, get the first item
        return mppData[0];
      }

      return null;
    } catch (error) {
      console.error('Error in createOrFetchMPP:', error);
      throw error;
    }
  },

  // Update the updateMpp function
  updateMpp: async (partNumber, operationNumber, mppData) => {
    try {
      // Format the data according to the API requirements
      const formattedData = {
        part_number: mppData.part_number,
        operation_number: Number(mppData.operation_number),
        fixture_number: String(mppData.fixture_number || ''),
        ipid_number: String(mppData.ipid_number || ''),
        datum_x: String(mppData.datum_x || ''),
        datum_y: String(mppData.datum_y || ''),
        datum_z: String(mppData.datum_z || ''),
        work_instructions: (mppData.work_instructions?.sections || []).map((section, index) => ({
          title: String(section.title || ''),
          instructions: String(section.instructions || ''),
          sequence: index
        }))
      };

      console.log('Sending update MPP data:', formattedData);

      const response = await fetch(`http://172.19.224.1:8002/api/v1/mpp/by-part/${partNumber}/${operationNumber}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.detail || 'Failed to update MPP');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating MPP:', error);
      if (error.response) {
        const errorData = await error.response.json();
        throw new Error(errorData.detail || 'Failed to update MPP');
      }
      throw error;
    }
  },

  // Update the createOperation function
  createOperation: async (partNumber, operationData) => {
    try {
      console.log('Creating operation with data:', operationData);
      
      const response = await fetch('http://172.19.224.1:8002/api/v1/planning/operations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operationData)
      });

      // Parse error response even before checking if request was successful
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        data = {};
      }

      if (!response.ok) {
        const errorDetail = data?.detail || 'Failed to create operation';
        console.error('API Error Response:', data);
        // Throw error with the specific error message from the API
        throw new Error(errorDetail);
      }

      // Fetch machines for the work centre
      let workCenterMachines = [];
      try {
        const machinesResponse = await fetch(`http://172.19.224.1:8002/api/v1/planning/work-center-machines/${operationData.work_center_code}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'accept': 'application/json'
          }
        });
        
        if (machinesResponse.ok) {
          workCenterMachines = await machinesResponse.json();
        } else {
          console.warn('Could not fetch work centre machines');
        }
      } catch (machineError) {
        console.error('Error fetching work centre machines:', machineError);
        // Continue with the process even if machines can't be fetched
      }

      // If we have machines, try to assign the first one as default
      let defaultMachine = null;
      if (workCenterMachines && workCenterMachines.length > 0) {
        defaultMachine = workCenterMachines[0];
        
        try {
          // Update the operation with the default machine
          await updateOperationMachine(
            partNumber,
            operationData.operation_number,
            {
              ...operationData,
              machine_id: defaultMachine.id
            }
          );
        } catch (updateError) {
          console.error('Error assigning default machine:', updateError);
          // Continue even if machine assignment fails
        }
      }

      // Return the operation with the machine information
      return {
        ...data,
        primary_machine: defaultMachine ? {
          id: defaultMachine.id,
          name: defaultMachine.make
        } : null,
        work_center_machines: workCenterMachines
      };
    } catch (error) {
      console.error('Error creating operation:', error);
      throw error;
    }
  },

  // Add this to your store
  fetchWorkCenters: async () => {
    try {
      const response = await fetch('http://172.19.224.1:8002/api/v1/planning/work_centers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch work centres');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching work centres:', error);
      throw error;
    }
  },

  // Update the checkIpidStatus function to use the correct endpoint
  checkIpidStatus: async (productionOrder, operationNumber) => {
    // Return false directly since we're removing the endpoint
    return false;
  },

  // Updated uploadIpidDocument function to use FormData directly
  uploadIpidDocument: async (formData) => {
    try {
      set({ isLoading: true, error: null });
      
      // Log what we're sending
      console.log('Uploading IPID document');
      
      const response = await fetch('http://172.19.224.1:8002/api/v1/document-management/ipid/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload IPID document');
      }

      const data = await response.json();
      console.log('IPID Upload Response:', data);
      set({ isLoading: false });
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error uploading IPID document:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Add function to fetch document versions
  fetchDocumentVersions: async (documentId) => {
    try {
      set({ isLoading: true, error: null });
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('No versions found for document:', documentId);
          set({ isLoading: false });
          return [];
        }
        
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch document versions');
      }

      const data = await response.json();
      console.log('Document versions:', data);
      set({ isLoading: false });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching document versions:', error);
      set({ isLoading: false, error: error.message });
      return [];
    }
  },

  // Update the uploadDocumentVersion function to use the correct endpoint
  uploadDocumentVersion: async (documentId, formData) => {
    try {
      set({ isLoading: true, error: null });
      
      // Use the correct API base URL (172.19.224.1:8002)
      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/versions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload document version');
      }

      const data = await response.json();
      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error uploading document version:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Download document with original file extension
  downloadDocument: async (documentId, versionId = null, originalFileName = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Construct the download URL
      let downloadUrl = `http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/download`;
      
      // Add version ID if provided
      if (versionId) {
        downloadUrl += `?version_id=${versionId}`;
      }

      console.log(`Downloading document from: ${downloadUrl}`);
      
      // Fetch the document
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.status} ${response.statusText}`);
      }
      
      // Get the blob data
      const blob = await response.blob();
      
      // Get the filename from the content-disposition header or use the original filename
      let filename = 'document';
      const contentDisposition = response.headers.get('content-disposition') || '';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      } else if (originalFileName) {
        filename = originalFileName;
      }
      
      console.log(`Downloading file as: ${filename}`);
      
      // Create a blob URL for the file
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename; // This will force download with the specified filename
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Error downloading document:', error);
      return { success: false, error: error.message };
    }
  },

  // Add function to fetch IPID documents by production order
  fetchIpidDocumentsByPo: async (productionOrder) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/ipid/by-po/${productionOrder}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          set({ isLoading: false });
          return [];
        }
        
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch IPID documents');
      }

      const data = await response.json();
      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error fetching IPID documents by PO:', error);
      set({ isLoading: false, error: error.message });
      return [];
    }
  },

  // Add function to fetch part production PDC data
  fetchPartProductionPDC: async (partNumber, productionOrder) => {
    try {
      set({ isLoading: true, error: null });
      
      const url = new URL('http://172.19.224.1:8002/api/v1/scheduling/part-production-pdc12');
      if (partNumber) url.searchParams.append('part_number', partNumber);
      if (productionOrder) url.searchParams.append('production_order', productionOrder);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      });

      if (response.status === 404) {
        set({ isLoading: false });
        return [];
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to fetch PDC data`);
      }

      const data = await response.json();
      
      const enhancedData = Array.isArray(data) ? data.map(item => ({
        part_number: item.part_number || partNumber,
        production_order: item.production_order || productionOrder,
        pdc: item.pdc,
        status: item.status,
        data_source: item.data_source
      })) : [];
      
      set({ isLoading: false });
      return enhancedData;
    } catch (error) {
      console.error('Error fetching PDC data:', error);
      set({ isLoading: false, error: error.message });
      return [];
    }
  },

  // Add this new function to get the latest operation number
  getLatestOperationNumber: async (partNumber) => {
    try {
      console.log(`Fetching latest operation number for part: ${partNumber}`);
      
      // First attempt to get the latest operation number from the API
      const response = await fetch(`http://172.19.224.1:8002/api/v1/planning/operations/latest/${partNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      });

      // Parse the response data
      let data;
      try {
        data = await response.json();
        console.log('Latest operation number response:', data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        data = {};
      }

      if (!response.ok) {
        // If the error is "Part number not found", just start from 0
        if (data.detail && data.detail.includes("not found")) {
          console.log('Part number not found in operations, starting at 0');
          return 0;
        }
        throw new Error(data.detail || 'Failed to fetch latest operation number');
      }

      return data.latest_operation_number || 0;
    } catch (error) {
      console.error('Error fetching latest operation number:', error);
      
      // If the API call fails, try to get the latest operation number from searchOrders
      try {
        console.log('Trying to get operations from searchOrders as fallback');
        const { searchOrders } = usePlanningStore.getState();
        const searchResults = await searchOrders(partNumber);
        
        if (searchResults?.orders && searchResults.orders.length > 0) {
          const operations = searchResults.orders[0].operations || [];
          
          // Find the highest operation number
          if (operations.length > 0) {
            const operationNumbers = operations.map(op => 
              parseInt(op.operation_number, 10)
            ).filter(num => !isNaN(num));
            
            if (operationNumbers.length > 0) {
              const maxOperationNumber = Math.max(...operationNumbers);
              console.log(`Found max operation number from searchOrders: ${maxOperationNumber}`);
              return maxOperationNumber;
            }
          }
        }
      } catch (fallbackError) {
        console.error('Error in fallback operation number lookup:', fallbackError);
      }
      
      // If all else fails, start from a conservative default (e.g., 0)
      console.warn('Could not determine latest operation number. Starting from 0');
      return 0;
    }
  },

  // Update the fetchEngineeringDrawings function
  fetchEngineeringDrawings: async (partNumber) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      const response = await fetch(
        `http://172.19.224.1:8002/api/v1/document-management/documents/?page=1&page_size=100&part_number=${partNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
          }
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch engineering drawings');
      }
      const data = await response.json();
      // Filter only engineering drawing documents (doc_type_id: 2)
      const drawings = data.items.filter(item => item.doc_type_id === 2);
      console.log('Engineering drawings:', drawings);
      return { items: drawings };
    } catch (error) {
      console.error('Error fetching engineering drawings:', error);
      return { items: [] };
    }
  },

  // Add function to fetch IPID structure by production order
  fetchIpidStructure: async (productionOrder) => {
    try {
      set({ isLoading: true, error: null });
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/ipid/structure/${productionOrder}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (response.status === 404) {
        set({ isLoading: false });
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch IPID structure');
      }

      const data = await response.json();
      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error fetching IPID structure:', error);
      set({ isLoading: false, error: error.message });
      return null;
    }
  },

  // Add this function to fetch machine utilization by date range
  fetchMachinePlanningByDateRange: async (startDate, endDate) => {
    try {
      set({ isLoading: true, error: null });
      // Format dates for API call
      const formattedStartDate = startDate.format('YYYY-MM-DD');
      const formattedEndDate = endDate.format('YYYY-MM-DD');
      
      // Make API call to correct endpoint
      const response = await fetch(
        `http://172.19.224.1:8002/api/v1/scheduling/machine-utilization/range?start_date=${formattedStartDate}&end_date=${formattedEndDate}`, 
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch machine utilization data');
      }

      const data = await response.json();
      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error fetching machine utilization by date range:', error);
      set({ isLoading: false, error: error.message });
      return [];
    }
  },

  // Add this function to fetch PDC for the current job
  fetchPdcForCurrentJob: async (productionOrder) => {
    try {
      if (!productionOrder) {
        console.error('No production order provided to fetchPdcForCurrentJob');
        return { pdc: null, status: 'error', data_source: null };
      }

      // First check if this production order is in the active parts
      const { activeParts } = usePlanningStore.getState();
      const activePart = activeParts.find(part => 
        part.production_order === productionOrder || 
        part.production_order_number === productionOrder
      );
      
      // If part is not active, return appropriate status
      if (!activePart || activePart.status !== 'active') {
        console.log(`Production order ${productionOrder} is not active`);
        return { pdc: null, status: 'inactive', data_source: null };
      }
      
      // If part is active, fetch the PDC data using both part_number and production_order
      const partNumber = activePart.part_number;
      
      // Use the new endpoint with both part_number and production_order
      const response = await fetch(
        `http://172.19.224.1:8002/api/v1/scheduling/part-production-pdc12?part_number=${partNumber}&production_order=${productionOrder}`, 
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'accept': 'application/json'
          }
        }
      );

      if (response.status === 404) {
        // Part is active but no PDC data yet
        console.log(`No PDC data found for part number: ${partNumber}, production order: ${productionOrder}`);
        return { pdc: null, status: 'active', data_source: null };
      }

      if (!response.ok) {
        throw new Error('Failed to fetch PDC data');
      }

      const data = await response.json();
      console.log('PDC data:', data);
      
      // If we have PDC data, return it with active status
      if (data && Array.isArray(data) && data.length > 0) {
        // Find the matching record with both part_number and production_order
        const pdcData = data.find(item => 
          item.part_number === partNumber && 
          item.production_order === productionOrder
        ) || data[0];
        
        return { 
          pdc: pdcData.pdc, 
          status: 'active', 
          data_source: pdcData.data_source 
        };
      }
      
      // If no data returned but request was successful
      return { pdc: null, status: 'active', data_source: null };
    } catch (error) {
      console.error('Error fetching PDC data:', error);
      return { pdc: null, status: 'error', data_source: null };
    }
  },

  // Function to fetch tools by order ID
  fetchToolsByOrderId: async (orderId) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`http://172.19.224.1:8002/api/v1/toolsprograms/ordertools/?order_id=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch tools');
      }

      const data = await response.json();
      set({ isLoading: false });
      
      // Format the tools data for the UI
      return Array.isArray(data) ? data.map(tool => ({
        id: tool.id,
        tool_name: tool.tool_name,
        tool_number: tool.tool_number,
        bel_partnumber: tool.bel_partnumber,
        description: tool.description,
        quantity: tool.quantity,
        order_id: tool.order_id,
        operation_id: tool.operation_id,
        created_at: tool.created_at,
        updated_at: tool.updated_at,
        // Additional fields for table display that might be needed
        productionOrder: '', // This will be added by the component
        operationNumber: '', // This will be added by the component
        operationDescription: '' // This will be added by the component
      })) : [];
    } catch (error) {
      console.error('Error fetching tools by order ID:', error);
      set({ isLoading: false, error: error.message });
      return [];
    }
  },

  // Function to add a tool to an order
  addOrderTool: async (toolData) => {
    try {
      set({ isLoading: true, error: null });
      
      // Format the data for the API - order_id should be a number, not a string
      const formattedToolData = {
        ...toolData,
        // The API expects these as numbers, not strings
        order_id: Number(toolData.order_id),
        operation_id: Number(toolData.operation_id),
        quantity: Number(toolData.quantity)
      };
      
      // Log the data we're sending to help with debugging
      console.log('Sending formatted tool data to API:', formattedToolData);
      
      const response = await fetch('http://172.19.224.1:8002/api/v1/toolsprograms/ordertools/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedToolData)
      });

      // Get response data
      let data;
      
      try {
        data = await response.json();
        console.log('API Response Data:', data);
      } catch (error) {
        console.error('Error parsing response:', error);
        data = {};
      }

      if (!response.ok) {
        const errorMessage = data.detail || `Failed to add tool: ${response.status} ${response.statusText}`;
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error adding tool:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Function to update a tool
  updateOrderTool: async (toolId, toolData) => {
    try {
      set({ isLoading: true, error: null });
      
      // Format the data for the API
      const formattedToolData = {
        ...toolData,
        order_id: Number(toolData.order_id),
        operation_id: Number(toolData.operation_id),
        quantity: Number(toolData.quantity)
      };
      
      console.log('Updating tool with data:', formattedToolData);
      
      const response = await fetch(`http://172.19.224.1:8002/api/v1/toolsprograms/ordertools/${toolId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedToolData)
      });

      // Try to parse response as JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        data = {};
      }

      if (!response.ok) {
        const errorMessage = data.detail || `Failed to update tool: ${response.status} ${response.statusText}`;
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error updating tool:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Function to delete a tool
  deleteOrderTool: async (toolId) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`http://172.19.224.1:8002/api/v1/toolsprograms/ordertools/${toolId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      // Try to parse response as JSON if available
      let data = {};
      try {
        if (response.headers.get('content-type')?.includes('application/json')) {
          data = await response.json();
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
      }

      if (!response.ok) {
        const errorMessage = data.detail || `Failed to delete tool: ${response.status} ${response.statusText}`;
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      set({ isLoading: false });
      return true; // Return success
    } catch (error) {
      console.error('Error deleting tool:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Function to fetch programs by order ID
  fetchProgramsByOrderId: async (orderId) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`http://172.19.224.1:8002/api/v1/toolsprograms/orderprograms/by-order/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch programs');
      }

      const data = await response.json();
      set({ isLoading: false });
      
      // Format the programs data for the UI
      return Array.isArray(data) ? data.map(program => ({
        id: program.id,
        program_name: program.program_name,
        program_number: program.program_number,
        description: program.program_name, // Use program_name as description if not available
        version: program.version || 'v1',
        order_id: program.order_id,
        operation_id: program.operation_id,
        created_at: program.created_at,
        updated_at: program.updated_at
      })) : [];
    } catch (error) {
      console.error('Error fetching programs by order ID:', error);
      set({ isLoading: false, error: error.message });
      return [];
    }
  },

  // Function to add a program to an order
  addOrderProgram: async (programData) => {
    try {
      set({ isLoading: true, error: null });
      
      // Format the data for the API
      const formattedProgramData = {
        ...programData,
        order_id: Number(programData.order_id),
        operation_id: Number(programData.operation_id)
      };
      
      console.log('Sending program data to API:', formattedProgramData);
      
      const response = await fetch('http://172.19.224.1:8002/api/v1/toolsprograms/orderprograms/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedProgramData)
      });

      // Get response data
      let data;
      try {
        data = await response.json();
        console.log('API Response Data:', data);
      } catch (error) {
        console.error('Error parsing response:', error);
        data = {};
      }

      if (!response.ok) {
        const errorMessage = data.detail || `Failed to add program: ${response.status} ${response.statusText}`;
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error adding program:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Function to update a program
  updateOrderProgram: async (programId, programData) => {
    try {
      set({ isLoading: true, error: null });
      
      // Format the data for the API
      const formattedProgramData = {
        ...programData,
        order_id: Number(programData.order_id),
        operation_id: Number(programData.operation_id)
      };
      
      console.log('Updating program with data:', formattedProgramData);
      
      const response = await fetch(`http://172.19.224.1:8002/api/v1/toolsprograms/orderprograms/${programId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedProgramData)
      });

      // Try to parse response as JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        data = {};
      }

      if (!response.ok) {
        const errorMessage = data.detail || `Failed to update program: ${response.status} ${response.statusText}`;
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error updating program:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Function to delete a program
  deleteOrderProgram: async (programId) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`http://172.19.224.1:8002/api/v1/toolsprograms/orderprograms/${programId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      // Try to parse response as JSON if available
      let data = {};
      try {
        if (response.headers.get('content-type')?.includes('application/json')) {
          data = await response.json();
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
      }

      if (!response.ok) {
        const errorMessage = data.detail || `Failed to delete program: ${response.status} ${response.statusText}`;
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      set({ isLoading: false });
      return true; // Return success
    } catch (error) {
      console.error('Error deleting program:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Function to upload CNC program
  uploadCncProgram: async (formData) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch('http://172.19.224.1:8002/api/v1/document-management/cnc-program/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload CNC program');
      }

      const data = await response.json();
      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error uploading CNC program:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Function to fetch CNC program details by part number
  fetchCncProgramDetails: async (partNumber) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/cnc-program/by-part/${partNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No programs found for this part
          set({ isLoading: false });
          return [];
        }
        
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch CNC program details');
      }

      const data = await response.json();
      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error fetching CNC program details:', error);
      set({ isLoading: false, error: error.message });
      return [];
    }
  },

  // Function to update program version
  updateProgramVersion: async (documentId, file, versionNumber) => {
    try {
      set({ isLoading: true, error: null });
      
      // Create FormData object for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('version_number', versionNumber);
      
      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/versions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update program version');
      }

      const data = await response.json();
      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error updating program version:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Function to fetch program versions
  fetchProgramVersions: async (documentId) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/versions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch program versions');
      }

      const data = await response.json();
      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error fetching program versions:', error);
      set({ isLoading: false, error: error.message });
      return [];
    }
  },

  // Function to upload CNC program
  uploadCncProgram: async (formData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('http://172.19.224.1:8002/api/v1/document-management/cnc-program/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload CNC program');
      }

      const data = await response.json();
      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error uploading CNC program:', error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },


  // Function to fetch CNC program details by part number
  fetchCncProgramDetails: async (partNumber) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/cnc-program/by-part/${partNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No programs found for this part
          set({ isLoading: false });
          return [];
        }
        
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch CNC program details');
      }

      const data = await response.json();
      set({ isLoading: false });
      return data;
    } catch (error) {
      console.error('Error fetching CNC program details:', error);
      set({ isLoading: false, error: error.message });
      return [];
    }
  }
}));

export default usePlanningStore;