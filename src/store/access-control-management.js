import axios from 'axios';
import { create } from 'zustand';
import { message } from 'antd';

// const API_URL = 'http://172.18.7.85:8078/api/v1/auth';

const useAccessControlStore = create((set) => ({
  users: [],
  loading: false,
  totalUsers: 0,
  fetchUsers: async (skip, limit) => {
    set({ loading: true });
    try {
      const response = await axios.get(
        `http://172.18.7.85:8078/api/v1/auth/api/v1/auth/users-get?skip=${skip}&limit=${limit}&active_only=true`
      );
      set({
        users: response.data,
        totalUsers: response.data.length,
        loading: false,
      });
    } catch (error) {
      message.error('Error fetching users');
      set({ loading: false });
    }
  },
  deleteUser: async (userId) => {
    try {
      await axios.delete(`http://172.18.7.85:8078/api/v1/auth/api/v1/auth/users-delete/${userId}`);
      message.success('User deleted successfully');
      set((state) => ({
        users: state.users.filter(user => user.id !== userId),
      }));
    } catch (error) {
      message.error('Error deleting user');
    }
  },
  updateUser: async (userId, data) => {
    try {
      await axios.put(`http://172.18.7.85:8078/api/v1/auth/api/v1/auth/users-update/${userId}`, data);
      message.success('User updated successfully');
      set((state) => ({
        users: state.users.map(user =>
          user.id === userId ? { ...user, ...data } : user
        ),
      }));
    } catch (error) {
      message.error('Error updating user');
    }
  },
  registerUser: async (userData) => {
    try {
      const response = await axios.post(`http://172.18.7.85:8078/api/v1/auth/register`, userData);
      message.success(response.data.message || 'User registered successfully');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      message.error(errorMsg);
    }
  },
}));

export { useAccessControlStore };
