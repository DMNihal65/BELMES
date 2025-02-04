// src/store/inventory-store.js
import { create } from 'zustand';
import axios from 'axios';
import { message } from 'antd';

const BASE_URL = 'http://172.18.7.85:4411/api/v1/api/inventory';

const useInventoryStore = create((set, get) => ({
  categories: [],
  subcategories: [],
  items: [],
  calibrations: [],
  calibrationHistory: [],
  selectedCategory: null,
  selectedSubcategory: null,
  loading: false,
  error: null,
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
      console.log('Subcategories API Response:', response.data); // Debug log
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
  fetchItems: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/items/`);
      console.log('Items API Response:', response.data); // Debug log
      const items = Array.isArray(response.data) ? response.data : [];
      return items;
    } catch (error) {
      console.error('Error fetching items:', error);
      message.error(`Failed to fetch items: ${error.response?.data?.detail || error.message}`);
      return [];
    } finally {
      set({ loading: false });
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

  addCalibration: async (calibrationData) => {
    set({ loading: true });
    try {
      const response = await axios.post(
        `${BASE_URL}/calibrations/`,
        {
          ...calibrationData,
          created_by: 1 // You might want to get this from user context
        }
      );
      set((state) => ({
        calibrations: [...state.calibrations, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to add calibration');
      throw error;
    }
  },

  updateCalibration: async (id, calibrationData) => {
    set({ loading: true });
    try {
      const response = await axios.put(
        `${BASE_URL}/calibrations/${id}`,
        calibrationData
      );
      set((state) => ({
        calibrations: state.calibrations.map(cal => 
          cal.id === id ? response.data : cal
        ),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      message.error('Failed to update calibration');
      throw error;
    }
  },

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
          performed_by: 1 // You might want to get this from user context
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
}));

export default useInventoryStore;

