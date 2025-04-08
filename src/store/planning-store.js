import { create } from 'zustand';

const usePlanningStore = create((set) => ({
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
      const response = await fetch('http://172.18.7.85:6298/api/v1/planning/all_orders');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch all orders');
      }

      // Extract production orders from orders
      const productionOrders = Array.isArray(data) ? data.map(item => ({
        id: item.id || String(Math.random()),
        productionOrder: item.production_order
      })) : [];

      set({ 
        allOrders: data,
        partNumbers: productionOrders, // We'll keep the same state variable but store production orders
        isLoading: false,
        error: null
      });
      
      return data;
    } catch (error) {
      console.error('Fetch all orders error:', error);
      set({ 
        allOrders: [],
        partNumbers: [], // This will now store production orders
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
      const response = await fetch(`http://172.18.7.85:6298/api/v1/planning/search_order2?production_order=${productionOrder}`);
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

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('Fetching MPP for production order:', productionOrder); // Debug log

      const response = await fetch(`http://172.18.7.85:6298/api/v1/documents/mpp/${productionOrder}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
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

      const response = await fetch('http://172.18.7.85:6298/api/v1/mpp', {
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
      const response = await fetch('http://172.18.7.85:6298/api/v1/scheduling/active-parts');
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
      const response = await fetch(`http://172.18.7.85:6298/api/v1/scheduling/set-part-status/${partNumber}?status=${newStatus}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          part_number: partNumber,
          status: newStatus
        })
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
      const response = await fetch(`http://172.18.7.85:6298/api/v1/master-order/machines/${machineId}`);
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
      const response = await fetch(`http://172.18.7.85:6298/api/v1/master-order/machines/${machineId}`, {
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
      const response = await fetch(`http://172.18.7.85:6298/api/v1/planning/operations/${partNumber}/${operationNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation_description: updateData.operation_description,
          setup_time: updateData.setup_time,
          ideal_cycle_time: updateData.ideal_cycle_time,
          work_center_code: updateData.work_center_code,
          machine_id: updateData.machine_id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update operation details');
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
        machine_id: updateData.machine_id
      };

      console.log('Sending machine update data:', formattedData);

      const response = await fetch(`http://172.18.7.85:6298/api/v1/planning/operations/${partNumber}/${operationNumber}`, {
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
      const response = await fetch(`http://172.18.7.85:6298/api/v1/documents/mpp/${productionOrder}`, {
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
      const response = await fetch(`http://172.18.7.85:6298/api/v1/mpp/by-identifier?operation_number=${operationNumber}&production_order=${productionOrder}`, {
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

      const response = await fetch('http://172.18.7.85:6298/api/v1/mpp', {
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

      const response = await fetch(`http://172.18.7.85:6298/api/v1/documents/${versionId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      setTimeout(() => {
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

      const response = await fetch(`http://172.18.7.85:6298/api/v1/document-management/documents/by-part-number-all/${partNumber}`, {
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

      const response = await fetch(`http://172.18.7.85:6298/api/v1/document-management/documents/${documentId}/download-latest`, {
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
        // It's a file - open in new tab
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Cleanup
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
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
      const response = await fetch(`http://172.18.7.85:6298/api/v1/document-management/documents/by-part-number-all/${partNumber}`, {
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
      if (documentsData.mpp_document?.latest_version?.id) {
        console.log('Found MPP document, attempting download');
        
        // Download the document
        const downloadResponse = await fetch(
          `http://172.18.7.85:6298/api/v1/document-management/documents/${documentsData.mpp_document.latest_version.id}/download-latest`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'accept': '*/*'
          }
        });

        if (downloadResponse.ok) {
          const contentType = downloadResponse.headers.get('content-type');
          if (contentType && !contentType.includes('application/json')) {
            const blob = await downloadResponse.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
            return { hasFile: true };
          }
        }
      }

      // 2. If no document exists, check for MPP data using the correct endpoint
      console.log('Checking MPP data for part:', partNumber, 'operation:', operation.operation_number);
      const mppResponse = await fetch(
        `http://172.18.7.85:6298/api/v1/mpp/by-part/${partNumber}/${operation.operation_number}`, {
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
      const response = await fetch(`http://172.18.7.85:6298/api/v1/mpp/by-part/${partNumber}/${operationNumber}`, {
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

      const response = await fetch(`http://172.18.7.85:6298/api/v1/mpp/by-part/${partNumber}/${operationNumber}`, {
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
      
      const response = await fetch('http://172.18.7.85:6298/api/v1/planning/operations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.detail || 'Failed to create operation');
      }

      const data = await response.json();

      // Fetch machines for the work center
      const workCenterMachines = await fetch(`http://172.18.7.85:6298/api/v1/planning/work-center-machines/${operationData.work_center_code}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      }).then(res => res.json());

      // If we have machines, assign the first one as default
      if (workCenterMachines && workCenterMachines.length > 0) {
        const defaultMachine = workCenterMachines[0];
        
        // Update the operation with the default machine
        await fetch(`http://172.18.7.85:6298/api/v1/planning/operations/${partNumber}/${operationData.operation_number}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...operationData,
            machine_id: defaultMachine.id
          })
        });

        // Return the operation with the machine information
        return {
          ...data,
          primary_machine: {
            id: defaultMachine.id,
            name: defaultMachine.make
          },
          work_center_machines: workCenterMachines
        };
      }

      return data;
    } catch (error) {
      console.error('Error creating operation:', error);
      throw error;
    }
  },

  // Add this to your store
  fetchWorkCenters: async () => {
    try {
      const response = await fetch('http://172.18.7.85:6298/api/v1/planning/work_centers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch work centers');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching work centers:', error);
      throw error;
    }
  },

  // Add this function to check IPID status
  checkIpidStatus: async (productionOrder, operationNumber) => {
    try {
      const response = await fetch(`http://172.18.7.85:6298/api/v1/document-management/ipid/status?production_order=${productionOrder}&operation_number=${operationNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check IPID status');
      }

      const data = await response.json();
      return data.hasIpid || false;
    } catch (error) {
      console.error('Error checking IPID status:', error);
      return false;
    }
  },

  // Update the uploadIpidDocument function to return more details
  uploadIpidDocument: async (file, productionOrder, operationNumber, documentName, description = '', versionNumber = '1', metadata = '{}') => {
    try {
      if (!productionOrder) {
        throw new Error('Production order number is required');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('production_order', productionOrder);
      formData.append('operation_number', operationNumber);
      formData.append('document_name', documentName);
      formData.append('description', description || '');
      formData.append('version_number', versionNumber);
      formData.append('metadata', metadata);

      console.log('Uploading IPID with data:', {
        productionOrder,
        operationNumber,
        documentName,
        description,
        versionNumber,
        metadata
      });

      const response = await fetch('http://172.18.7.85:6298/api/v1/document-management/ipid/upload/', {
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
      return {
        success: true,
        data,
        operationNumber
      };
    } catch (error) {
      console.error('Error uploading IPID document:', error);
      throw error;
    }
  },
}));

export default usePlanningStore;