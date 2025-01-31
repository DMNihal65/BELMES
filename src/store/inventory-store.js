import { create } from 'zustand';
import axios from 'axios';

const BASE_URL = 'http://172.18.7.89:2222/api/v1/api/inventory';

const useInventoryStore = create((set, get) => ({
  categories: [],
  subcategories: {},
  selectedCategory: null,
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${BASE_URL}/categories/`);
      console.log('Fetched categories:', response.data);
      set({ categories: response.data, isLoading: false });
      
      // Fetch subcategories for each category
      response.data.forEach(async (category) => {
        try {
          await get().fetchSubcategories(category.id);
        } catch (error) {
          console.error(`Error fetching subcategories for category ${category.id}:`, error);
        }
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  fetchSubcategories: async (categoryId) => {
    try {
      const response = await axios.get(`${BASE_URL}/subcategories/`, {
        params: { category_id: categoryId }
      });
      console.log(`Fetched subcategories for category ${categoryId}:`, response.data);
      set(state => ({
        subcategories: {
          ...state.subcategories,
          [categoryId]: response.data
        }
      }));
      return response.data;
    } catch (error) {
      console.error(`Error fetching subcategories for category ${categoryId}:`, error);
      return [];
    }
  },

  addCategory: async (categoryData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${BASE_URL}/categories/`, categoryData);
      console.log('Added category:', response.data);
      
      // Fetch categories again to ensure we have the latest data
      await get().fetchCategories();
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding category:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
  },
}));

export default useInventoryStore; 