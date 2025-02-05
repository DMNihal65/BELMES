import { create } from 'zustand';
import axios from 'axios';
import { message } from 'antd';

const BASE_URL = 'http://172.18.7.89:2222/api/v1/api/inventory';

const useInventoryStore = create((set, get) => ({
  categories: [],
  subcategories: [],
  items: [],
  selectedCategory: null,
  selectedSubcategory: null,
  loading: false,
  error: null,
  allOrders: [],
  operations: [],

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
        created_by: categoryData.created_by
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
      set({ subcategories: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to fetch subcategories');
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
        created_by: subcategoryData.created_by
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
      // Always use the /items endpoint with query parameter for subcategory_id
      let url = `${BASE_URL}/items`;
      if (subcategoryId) {
        url = `${url}?subcategory_id=${subcategoryId}`;
      }
      
      const response = await axios.get(url);
      console.log('Items response:', response.data);
      
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
      // Use the /items endpoint with the correct data structure
      const response = await axios.post(
        `${BASE_URL}/items`, 
        {
          item_code: itemData.item_code,
          dynamic_data: itemData.dynamic_data,
          quantity: parseInt(itemData.quantity),
          available_quantity: parseInt(itemData.available_quantity),
          status: itemData.status,
          subcategory_id: parseInt(itemData.subcategory_id),
          created_by: 1
        }
      );
      
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
      const response = await axios.put(
        `${BASE_URL}/items/${id}`,
        {
          item_code: itemData.item_code,
          dynamic_data: itemData.dynamic_data,
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

  // Selection handlers
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedSubcategory: (subcategory) => set({ selectedSubcategory: subcategory }),

  // Add this function to fetch all orders
  fetchAllOrders: async () => {
    set({ loading: true });
    try {
      const response = await axios.get('http://172.18.7.89:2222/api/v1/planning/all_orders');
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

  // Update the submit request function
  submitItemRequest: async (requestData) => {
    set({ loading: true });
    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      
      // Log the request for debugging
      console.log('Request Payload:', {
        expected_return_date: requestData.expected_return_date?.toISOString(),
        inventory_item_id: parseInt(requestData.item_id),
        operation_id: parseInt(requestData.operation_id),
        order_id: parseInt(requestData.order_id),
        purpose: requestData.purpose,
        quantity: parseInt(requestData.quantity),
        remarks: requestData.remarks || "",
        status: "Pending"
      });

      const response = await axios.post(
        // Updated URL to match your API endpoint structure
        'http://172.18.7.89:2222/api/v1/api/inventory/requests',  // Added 'api' in the path
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
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      message.success('Request submitted successfully');
      return response.data;
    } catch (error) {
      console.error('Error submitting request:', error);
      // More detailed error message
      message.error(`Failed to submit request: ${error.response?.data?.detail || error.message}`);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchOperationsByPartNumber: async (partNumber) => {
    set({ loading: true });
    try {
      const response = await axios.get(`http://172.18.7.89:2222/api/v1/planning/search_order?part_number=${partNumber}`);
      // Extract operations from the orders array
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
}));

export default useInventoryStore;