import axios from 'axios';
import { create } from 'zustand';
import { message } from 'antd';

// const API_URL = 'http://172.19.224.1:8002/api/v1/auth';

const useAccessControlStore = create((set) => ({
  users: [],
  loading: false,
  totalUsers: 0,
  
  fetchUsers: async (skip, limit) => {
    set({ loading: true });
    try {
      const response = await axios.get(
         `http://172.19.224.1:8002/api/v1/auth/api/v1/auth/users-get?skip=${skip}&limit=${limit}&active_only=true`,
        { timeout: 5000 } // Add timeout
      );
      
      if (response.data) {
        set({
          users: response.data,
          totalUsers: response.data.length,
          loading: false,
        });
      } else {
        throw new Error('No data received');
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      message.error(
        error.response?.data?.message || 
        error.message || 
        'Error connecting to server'
      );
      set({ 
        loading: false,
        users: [],
        totalUsers: 0
      });
    }
  },


  registerUser: async (userData) => {
    try {
      const response = await axios.post(`http://172.19.224.1:8002/api/v1/auth/register`, userData);
      message.success(response.data.message || 'User registered successfully');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      message.error(errorMsg);
    }
  },
}));

export { useAccessControlStore };