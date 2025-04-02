import { create } from 'zustand';
import useAuthStore from './auth-store';
import { message } from 'antd';
import axios from 'axios';

const useDynamicStore = create((set) => ({
  scheduleData: null,
  loading: false,
  error: null,

  clearScheduleData: () => {
    set({ scheduleData: null, loading: false, error: null });
  },

  fetchDynamicScheduleData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get('http://172.18.7.85:9938/api/v1/rescheduling/reschedule-actual-planned-combined');
      set({ 
        scheduleData: response.data,
        loading: false,
        error: null
      });
      return response.data;
    } catch (error) {
      set({ 
        error: 'Failed to fetch schedule data', 
        loading: false,
        scheduleData: null
      });
      throw error;
    }
  },

  
  // Add this function to fetch orders
  // fetchAllOrders: async () => {
  //   try {
  //     const token = useAuthStore.getState().token;
  //     set({ isLoadingOrders: true });

  //     const response = await fetch('http://172.18.7.85:9938/planning/all_orders', {
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Accept': 'application/json'
  //       }
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       set({ allOrders: data, isLoadingOrders: false });
  //     }
  //   } catch (error) {
  //     console.error('Error fetching orders:', error);
  //     set({ isLoadingOrders: false });
  //   }
  // }
}));

export default useDynamicStore;