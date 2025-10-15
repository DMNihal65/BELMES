// src/store/inventory-store.js
import { create } from 'zustand';
import axios from 'axios';
import { message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { read, utils } from 'xlsx';
import dayjs from 'dayjs';
import useAuthStore from './auth-store';











const BASE_URL = 'http://172.19.224.1:8002/api/v1/inventory';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Helper function to get user_id
const getUserId = () => {
  const { user_id } = useAuthStore.getState();
  return user_id;
};

// Add these functions before the create function
const addCalibration = async (calibrationData) => {
  try {
    const response = await axios.post('http://172.19.224.1:8002/api/v1/inventory/calibrations/', {
      ...calibrationData,
      created_by: getUserId()
    });
    return response.data;
  } catch (error) {
    console.error('Error adding calibration:', error);
    throw error;
  }
};

const updateCalibration = async (id, calibrationData) => {
  try {
    const response = await axios.put(`http://172.19.224.1:8002/api/v1/inventory/calibrations/${id}`, {
      ...calibrationData,
      created_by: getUserId()
    });
    return response.data;
  } catch (error) {
    console.error('Error updating calibration:', error);
    throw error;
  }
};

const getCalibrationByItemId = async (itemId) => {
  try {
    const response = await axios.get(`http://172.19.224.1:8002/api/v1/inventory/calibrations/?inventory_item_id=${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching calibration:', error);
    throw error;
  }
};

const useInventoryStore = create((set, get) => ({
  categories: [],
  subcategories: [],
  items: [],
  calibrations: [],
  calibrationHistory: [],
  upcomingCalibrations: [],
  requestsByStatus: [],
  transactionSummary: [],
  transactionMetrics: null,
  transactionHistory: { transactions: [] },
  enhancedTransactionHistory: null,
  selectedCategory: null,
  selectedSubcategory: null,
  loading: false,
  error: null,
  allOrders: [],
  operations: [],
  requests: [],
  returnRequests: [],
  machines: [],
  transactions: [],
  set: (state) => set(state),

  // Categories
  fetchCategories: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/categories/`);
      set({ categories: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch categories');
    }
  },

  fetchCategoryById: async (id) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/categories/${id}`);
      return response.data;
    } catch (error) {
      message.error('Failed to fetch category details');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addCategory: async (categoryData) => {
    set({ loading: true });
    try {
      const response = await axios.post(`${BASE_URL}/categories/`, {
        name: categoryData.name,
        description: categoryData.description,
        created_by: getUserId()
      });
      set(state => ({
        categories: [...state.categories, response.data],
      }));
      message.success('Category added successfully');
      return response.data;
    } catch (error) {
      message.error('Failed to add category');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateCategory: async (id, categoryData) => {
    set({ loading: true });
    try {
      const response = await axios.put(`${BASE_URL}/categories/${id}`, {
        name: categoryData.name,
        description: categoryData.description
      });
      set(state => ({
        categories: state.categories.map(cat => cat.id === id ? response.data : cat),
      }));
      message.success('Category updated successfully');
      return response.data;
    } catch (error) {
      message.error('Failed to update category');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteCategory: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`${BASE_URL}/categories/${id}`);
      set(state => ({
        categories: state.categories.filter(cat => cat.id !== id),
      }));
      message.success('Category deleted successfully');
    } catch (error) {
      message.error('Failed to delete category');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Subcategories
  fetchAllSubcategories: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/subcategories/`);
      // console.log('Subcategories API Response:', response.data); // Debug log
      const subcategories = Array.isArray(response.data) ? response.data : [];
      set({ subcategories, loading: false }); // Set the subcategories in state
      return subcategories;
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      message.error('Failed to fetch subcategories');
      set({ subcategories: [], loading: false }); // Set empty array on error
      return [];
    }
  },

  fetchSubcategories: async (categoryId) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/categories/${categoryId}/subcategories`);
      set({ subcategories: response.data });
      return response.data;
    } catch (error) {
      message.error('Failed to fetch subcategories');
      return [];
    } finally {
      set({ loading: false });
    }
  },

  fetchSubcategoryById: async (id) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/subcategories/${id}`);
      return response.data;
    } catch (error) {
      message.error('Failed to fetch subcategory details');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addSubcategory: async (subcategoryData) => {
    set({ loading: true });
    try {
      const response = await axios.post(`${BASE_URL}/subcategories/`, {
        name: subcategoryData.name,
        description: subcategoryData.description,
        dynamic_fields: subcategoryData.dynamic_fields,
        category_id: subcategoryData.category_id,
        created_by: getUserId()
      });
      set(state => ({
        subcategories: [...state.subcategories, response.data],
      }));
      message.success('Subcategory added successfully');
      return response.data;
    } catch (error) {
      message.error('Failed to add subcategory');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateSubcategory: async (id, subcategoryData) => {
    set({ loading: true });
    try {
      const response = await axios.put(`${BASE_URL}/subcategories/${id}`, {
        name: subcategoryData.name,
        description: subcategoryData.description,
        dynamic_fields: subcategoryData.dynamic_fields,
        category_id: subcategoryData.category_id
      });
      set(state => ({
        subcategories: state.subcategories.map(sub => 
          sub.id === id ? response.data : sub
        ),
      }));
      message.success('Subcategory updated successfully');
      return response.data;
    } catch (error) {
      message.error('Failed to update subcategory');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteSubcategory: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`${BASE_URL}/subcategories/${id}`);
      set(state => ({
        subcategories: state.subcategories.filter(sub => sub.id !== id),
      }));
      message.success('Subcategory deleted successfully');
      return true;
    } catch (error) {
      message.error('Failed to delete subcategory');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Items
  fetchItems: async (subcategoryId) => {
    set({ loading: true });
    try {
      let url = `${BASE_URL}/items/`;
      if (subcategoryId) {
        url = `${url}?subcategory_id=${subcategoryId}`;
      }
      
      const response = await axios.get(url);
      // console.log('Items response:', response.data);
      
      set({ 
        items: Array.isArray(response.data) ? response.data : [],
        loading: false 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching items:', error);
      message.error(`Failed to fetch items: ${error.response?.data?.detail || error.message}`);
      set({ 
        items: [],
        loading: false,
        error: error.message 
      });
      return [];
    }
  },

  fetchItemById: async (id) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/items/${id}`);
      return response.data;
    } catch (error) {
      message.error('Failed to fetch item details');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (itemData) => {
    set({ loading: true });
    try {
      const response = await axios.post(`${BASE_URL}/items/`, {
        item_code: itemData.item_code,
        dynamic_data: itemData.dynamic_data,
        quantity: parseInt(itemData.quantity),
        available_quantity: parseInt(itemData.available_quantity),
        status: itemData.status,
        subcategory_id: parseInt(itemData.subcategory_id),
        created_by: getUserId()
      });
      set(state => ({
        items: [...state.items, response.data],
      }));
      message.success('Item added successfully');
      return response.data;
    } catch (error) {
      console.error('Error adding item:', error);
      message.error(`Failed to add item: ${error.response?.data?.detail || error.message}`);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateItem: async (id, itemData) => {
    set({ loading: true });
    try {
      // Process dynamic data to handle image fields
      const processedDynamicData = {};
      if (itemData.dynamic_data) {
        for (const [key, value] of Object.entries(itemData.dynamic_data)) {
          // If it's a base64 image, compress it before sending
          if (value && typeof value === 'string' && value.startsWith('data:image')) {
            processedDynamicData[key] = await compressImage(value);
          } else {
            processedDynamicData[key] = value;
          }
        }
      }

      const response = await axios.put(
        `${BASE_URL}/items/${id}`,
        {
          item_code: itemData.item_code,
          dynamic_data: processedDynamicData,
          quantity: parseInt(itemData.quantity),
          available_quantity: parseInt(itemData.available_quantity),
          status: itemData.status,
          subcategory_id: parseInt(itemData.subcategory_id)
        }
      );
      set(state => ({
        items: state.items.map(item => item.id === id ? response.data : item),
      }));
      message.success('Item updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error updating item:', error);
      message.error(`Failed to update item: ${error.response?.data?.detail || error.message}`);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteItem: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`${BASE_URL}/items/${id}`);
      set(state => ({
        items: state.items.filter(item => item.id !== id),
      }));
      message.success('Item deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      message.error(`Failed to delete item: ${error.response?.data?.detail || error.message}`);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Calibration Management
  fetchCalibrations: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/calibrations/`);
      set({ calibrations: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch calibrations');
      throw error;
    }
  },

  fetchCalibrationById: async (id) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/calibrations/${id}`);
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch calibration details');
      throw error;
    }
  },

  addCalibration: addCalibration,

  updateCalibration: updateCalibration,

  deleteCalibration: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`${BASE_URL}/calibrations/${id}`);
      set((state) => ({
        calibrations: state.calibrations.filter(cal => cal.id !== id),
        loading: false
      }));
      message.success('Calibration deleted successfully');
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to delete calibration');
      throw error;
    }
  },

  // Calibration History
  fetchCalibrationHistory: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/calibration-history/`);
      set({ calibrationHistory: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch calibration history');
      throw error;
    }
  },

  fetchCalibrationHistoryById: async (id) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/calibration-history/${id}`);
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch calibration history details');
      throw error;
    }
  },

  addCalibrationHistory: async (historyData) => {
    set({ loading: true });
    try {
      const response = await axios.post(
        `${BASE_URL}/calibration-history/`,
        {
          ...historyData,
          performed_by: getUserId() // You might want to get this from user context
        }
      );
      set((state) => ({
        calibrationHistory: [...state.calibrationHistory, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to add calibration history');
      throw error;
    }
  },

  // Selection handlers
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedSubcategory: (subcategory) => set({ selectedSubcategory: subcategory }),

  // Add new functions
  fetchAllOrders: async () => {
    set({ loading: true });
    try {
      const response = await axios.get('http://172.19.224.1:8002/api/v1/planning/all_orders');
      set({ 
        allOrders: response.data || [],
        loading: false 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Failed to fetch orders');
      set({ loading: false, allOrders: [] });
      return [];
    }
  },

  submitItemRequest: async (requestData) => {
    set({ loading: true });
    try {
      const response = await axios.post(
        `${BASE_URL}/requests/`,
        {
          expected_return_date: requestData.expected_return_date?.toISOString(),
          inventory_item_id: parseInt(requestData.item_id),
          operation_id: parseInt(requestData.operation_id),
          order_id: parseInt(requestData.order_id),
          purpose: requestData.purpose,
          quantity: parseInt(requestData.quantity),
          remarks: requestData.remarks || "",
          status: "Pending"
        },
        getAuthHeaders()
      );
      
      message.success('Request submitted successfully');
      return response.data;
    } catch (error) {
      console.error('Error submitting request:', error);
      
      // Handle different types of errors
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
      } else if (error.response?.data?.detail) {
        message.error(`Failed to submit request: ${error.response.data.detail}`);
      } else {
        message.error(error.message || 'Failed to submit request');
      }
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchOperationsByPartNumber: async (partNumber) => {
    set({ loading: true });
    try {
      const response = await axios.get(`http://172.19.224.1:8002/api/v1/planning/search_order?part_number=${partNumber}`);
      const operations = response.data?.orders?.[0]?.operations || [];
      set({ 
        operations: operations,
        loading: false 
      });
      return operations;
    } catch (error) {
      console.error('Error fetching operations:', error);
      message.error('Failed to fetch operations');
      set({ loading: false, operations: [] });
      return [];
    }
  },

  // Requests Management
  fetchRequests: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/requests/`, getAuthHeaders());
      set({ requests: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch requests');
      throw error;
    }
  },

  // Fetch user's own requests for history
  fetchUserRequests: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/requests/`, getAuthHeaders());
      const userId = getUserId();
      const userRequests = response.data.filter(request => request.requested_by === userId);
      set({ requests: userRequests, loading: false });
      return userRequests;
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch your requests');
      throw error;
    }
  },

  approveRequest: async (requestId) => {
    set({ loading: true });
    try {
      const response = await axios.put(
        `${BASE_URL}/requests/${requestId}/approve`,
        {},
        getAuthHeaders()
      );

      // After approval, create transaction
      const requestData = get().requests.find(req => req.id === requestId);
      if (requestData) {
        await axios.post(
          `${BASE_URL}/transactions/`,
          {
            transaction_type: "Issue",
            quantity: requestData.quantity,
            inventory_item_id: requestData.inventory_item_id,
            performed_by: getUserId(),
            reference_request_id: requestId,
            reference_return_request_id: null,
            remarks: "Issuing tools for approved request"
          },
          getAuthHeaders()
        );
      }

      // Refresh requests list
      await get().fetchRequests();
      message.success('Request approved successfully');
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to approve request');
      throw error;
    }
  },

  rejectRequest: async (requestId) => {
    set({ loading: true });
    try {
      await axios.put(
        `${BASE_URL}/requests/${requestId}/reject`,
        {},
        getAuthHeaders()
      );

      // Refresh requests list
      await get().fetchRequests();
      message.success('Request rejected');
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to reject request');
      throw error;
    }
  },

  // Return Requests Management
  submitReturnRequest: async (returnData) => {
    set({ loading: true });
    try {
      const response = await axios.post(
        `${BASE_URL}/return-requests/`,
        returnData,
        getAuthHeaders()
      );
      
      message.success('Return request submitted successfully');
      return response.data;
    } catch (error) {
      console.error('Error submitting return request:', error);
      message.error('Failed to submit return request');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchReturnRequests: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/return-requests/`, getAuthHeaders());
      set({ returnRequests: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch return requests');
      throw error;
    }
  },

  approveReturnRequest: async (returnRequestId) => {
    set({ loading: true });
    try {
      const response = await axios.put(
        `${BASE_URL}/return-requests/${returnRequestId}/approve`,
        {},
        getAuthHeaders()
      );

      // Process the return transaction
      const returnData = get().returnRequests?.find(req => req.id === returnRequestId);
      if (returnData) {
        await axios.post(
          `${BASE_URL}/transactions/process-return/?return_request_id=${returnRequestId}&quantity=${returnData.quantity_to_return}&remarks=Return approved`,
          {},
          getAuthHeaders()
        );
      }

      // Refresh return requests list
      await get().fetchReturnRequests();
      message.success('Return request approved successfully');
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to approve return request');
      throw error;
    }
  },

  // Enhanced transaction history
  fetchTransactionHistoryEnhanced: async (startDate = null, endDate = null) => {
    set({ loading: true });
    try {
      let url = `${BASE_URL}/analytics/transaction-history-enhanced`;
      const params = new URLSearchParams();
      
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, getAuthHeaders());
      set({ 
        enhancedTransactionHistory: response.data, 
        loading: false 
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch enhanced transaction history');
      throw error;
    }
  },

  // Machines Management
  fetchMachines: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/machines/`, getAuthHeaders());
      set({ machines: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch machines');
      throw error;
    }
  },

  updateRequestMachine: async (requestId, machineId) => {
    set({ loading: true });
    try {
      const response = await axios.put(
        `${BASE_URL}/inventory/requests/${requestId}/machine`,
        { machine_id: machineId },
        getAuthHeaders()
      );
      set(state => ({
        requests: state.requests.map(req => 
          req.id === requestId ? { ...req, machine_id: machineId } : req
        ),
        loading: false
      }));
      message.success('Machine updated successfully');
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to update machine');
      throw error;
    }
  },

  // Add transaction analytics
  fetchTransactionAnalytics: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/inventory/analytics/transaction-summary`, getAuthHeaders());
      if (!response.data) {
        throw new Error('Failed to fetch transaction analytics');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction analytics:', error);
      message.error('Failed to fetch analytics data');
      return null;
    }
  },

  // Add transaction management functions
  fetchTransactions: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/inventory/transactions`, getAuthHeaders());
      const transactions = Array.isArray(response.data) ? response.data : [];
      set({ transactions, loading: false });
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      message.error('Failed to fetch transactions');
      set({ transactions: [], loading: false });
      return [];
    }
  },

  createReturnTransaction: async (returnData) => {
    set({ loading: true });
    try {
      const response = await axios.post(
        `${BASE_URL}/inventory/transactions`,
        returnData,
        getAuthHeaders()
      );

      if (response.status === 201 || response.status === 200) {
        message.success('Item returned successfully');
        // Update local transactions state
        const { fetchTransactions } = get();
        await fetchTransactions();
        return response.data;
      } else {
        throw new Error('Failed to create return transaction');
      }
    } catch (error) {
      console.error('Error returning item:', error);
      message.error('Failed to return item: ' + (error.response?.data?.detail || error.message));
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Update bulk upload function with correct endpoint
  bulkUploadItems: async (subcategoryId, items) => {
    set({ loading: true });
    try {
      const response = await axios.post(
        `${BASE_URL}/items/bulk/`,
        {
          created_by: getUserId(),
          subcategory_id: subcategoryId,
          items: items
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data) {
        message.success('Excel data imported successfully');
        await get().fetchItems();
        return response.data;
      }
    } catch (error) {
      console.error('Server Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        error: error.message
      });

      if (error.response?.status === 500) {
        throw new Error(
          'Server error (500). Possible issues:\n' +
          '1. Duplicate item codes\n' +
          '2. Invalid data format\n' +
          '3. Missing required fields\n' +
          'Please check your data and try again.'
        );
      } else if (error.response?.data?.detail) {
        throw new Error(`Upload failed: ${error.response.data.detail}`);
      } else {
        throw new Error('Failed to upload data. Please check the server logs for details.');
      }
    } finally {
      set({ loading: false });
    }
  },

  handleExcelUpload: async (file) => {
    if (!selectedCategory || selectedCategory.type !== 'subcategory') {
      message.warning('Please select a subcategory first');
      return false;
    }

    const loadingMessage = message.loading('Processing file...', 0);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = utils.sheet_to_json(worksheet, { 
            raw: false, // This will preserve string values
            defval: '', // Default value for empty cells
          });

          const subcategory = subcategories.find(sub => sub.id === selectedCategory.id);
          const category = categories.find(cat => cat.id === subcategory?.category_id);
          
          if (!subcategory || !category) {
            throw new Error('Subcategory not found');
          }

          if (jsonData.length === 0) {
            throw new Error('The Excel file is empty. Please add some data.');
          }

          // Process the items without truncating item codes
          const formattedItems = jsonData.map(row => {
            return {
              item_code: row['Item Code'] || generateItemCode(), // Use the item code from the Excel or generate a new one
              quantity: parseInt(row['Total Quantity'].toString().trim()),
              available_quantity: parseInt(row['Available Quantity'].toString().trim()),
              status: (row['Status']?.toString().trim() || 'Active'),
              dynamic_data: Object.entries(subcategory.dynamic_fields || {}).reduce((acc, [fieldName, config]) => {
                const value = row[fieldName]?.toString().trim();
                if (value) {
                  if (config.type === 'date') {
                    const dateValue = dayjs(value);
                    acc[fieldName] = dateValue.isValid() ? dateValue.format('YYYY-MM-DD') : null;
                  } else if (config.type === 'number') {
                    acc[fieldName] = parseFloat(value);
                  } else if (config.type === 'boolean') {
                    acc[fieldName] = ['yes', 'true', '1'].includes(value.toLowerCase());
                  } else {
                    acc[fieldName] = value;
                  }
                }
                return acc;
              }, {})
            };
          });

          // Proceed with bulk upload
          await bulkUploadItems(selectedCategory.id, formattedItems);
          loadingMessage();
          message.success('Excel data imported successfully');
          setRefreshTrigger(prev => prev + 1);
        } catch (error) {
          loadingMessage();
          console.error('Data Processing Error:', error);
          message.error(error.message || 'Failed to process Excel file');
        }
      };

      reader.onerror = () => {
        loadingMessage();
        message.error('Failed to read file');
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      loadingMessage();
      console.error('File Processing Error:', error);
      message.error('Failed to process file');
    }

    return false;
  },

  handleItemFormSubmit: async (values) => {
    try {
        if (!selectedCategory?.id || selectedCategory?.type !== 'subcategory') {
            message.error('Please select a subcategory first');
            return;
        }

        const selectedSubcategory = subcategories.find(s => s.id === selectedCategory.id);
        if (!selectedSubcategory) {
            message.error('Invalid subcategory');
            return;
        }

        // Generate a new item code using UUID
        const newItemCode = uuidv4().slice(0, 12); // Generate a unique ID and take the first 12 characters

        const itemData = {
            item_code: newItemCode, // Use the new unique item code
            dynamic_data: formattedDynamicData,
            quantity: Number(values.quantity) || 0,
            available_quantity: Number(values.available_quantity) || 0,
            status: values.status || 'Active',
            subcategory_id: selectedSubcategory.id,
            created_by: getUserId()
        };

        let result;
        if (values.id) {
            result = await updateItem(values.id, itemData);
        } else {
            result = await addItem(itemData);
        }

        if (result) {
            message.success(`Item ${values.id ? 'updated' : 'added'} successfully`);
            setIsModalVisible(false);
            form.resetFields();
            setRefreshTrigger(prev => prev + 1);
        }
    } catch (error) {
        console.error('Error submitting item:', error);
        message.error(`Error: ${error.response?.data?.detail || error.message}`);
    }
  },

  getCalibrationByItemId: getCalibrationByItemId,

  // Add this new function
  fetchUpcomingCalibrations: async (days = 7) => {
    set({ loading: true });
    try {
      // console.log('Fetching upcoming calibrations for days:', days); // Debug log
      const response = await axios.get(`${BASE_URL}/analytics/upcoming-calibrations?days=${days}`);
      // console.log('Upcoming calibrations response:', response.data); // Debug log
      
      // Remove duplicates based on item_id and next_calibration
      const uniqueCalibrations = response.data.filter((cal, index, self) =>
        index === self.findIndex((c) => (
          c.item_id === cal.item_id && c.next_calibration === cal.next_calibration
        ))
      );
      
      set({ upcomingCalibrations: uniqueCalibrations, loading: false });
      return uniqueCalibrations;
    } catch (error) {
      console.error('Error fetching upcoming calibrations:', error);
      message.error(`Failed to fetch upcoming calibrations: ${error.message}`);
      set({ upcomingCalibrations: [], loading: false });
      return [];
    }
  },

  // Add analytics functions
  fetchAnalytics: async () => {
    set({ loading: true });
    try {
      const [requestsRes, summaryRes, metricsRes, historyRes] = await Promise.all([
        axios.get(`${BASE_URL}/analytics/requests-by-status`),
        axios.get(`${BASE_URL}/analytics/transaction-summary`),
        axios.get(`${BASE_URL}/analytics/transaction-metrics`),
        axios.get(`${BASE_URL}/analytics/transaction-history2?limit=10&offset=0`)
      ]);

      set({
        requestsByStatus: requestsRes.data,
        transactionSummary: summaryRes.data,
        transactionMetrics: metricsRes.data,
        transactionHistory: historyRes.data,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Add transaction history search function
  searchTransactionHistory: async (searchText, dateRange) => {
    try {
      let url = `${BASE_URL}/analytics/transaction-history2?limit=10&offset=0`;
      
      if (searchText) {
        url += `&search=${encodeURIComponent(searchText)}`;
      }
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        url += `&start_date=${dateRange[0].toISOString()}&end_date=${dateRange[1].toISOString()}`;
      }

      const response = await axios.get(url);
      set({ transactionHistory: response.data });
    } catch (error) {
      console.error('Error searching transaction history:', error);
      set({ error: error.message });
    }
  },
}));

// Add helper function for image compression
const compressImage = async (base64String) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 with reduced quality
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressedBase64);
    };
    img.onerror = reject;
    img.src = base64String;
  });
};

const generateItemCode = (existingCodes, categoryName, subcategoryName) => {
  let nextNumber = 1;
  let newCode;

  do {
    newCode = `${categoryName}_${subcategoryName}_${String(nextNumber).padStart(3, '0')}`;
    nextNumber++;
  } while (existingCodes.has(newCode));

  return newCode;
};

export default useInventoryStore;

