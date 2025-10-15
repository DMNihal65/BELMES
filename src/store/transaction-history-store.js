import { create } from 'zustand';
import axios from 'axios';
import { message } from 'antd';

const BASE_URL = 'http://172.19.224.1:8002/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    message.error('Authentication token not found');
    throw new Error('Authentication token not found');
  }
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

const useTransactionHistoryStore = create((set, get) => ({
  transactions: [],
  metadata: {
    total_count: 0,
    limit: 100,
    offset: 0
  },
  loading: false,
  error: null,

  fetchTransactionHistory: async () => {
    set({ loading: true });
    try {
      const config = getAuthHeaders();
      const response = await axios.get(
        `${BASE_URL}/inventory/analytics/transaction-history2?limit=100&offset=0`,
        config
      );
      
      set({
        transactions: response.data.transactions || [],
        metadata: response.data.metadata || {
          total_count: 0,
          limit: 100,
          offset: 0
        },
        loading: false
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      if (error.response?.status === 401) {
        message.error('Authentication failed. Please log in again.');
      } else {
        message.error('Failed to fetch transaction history');
      }
      set({ error: error.message, loading: false });
      return null;
    }
  },

  createReturnTransaction: async (transactionData) => {
    set({ loading: true });
    try {
      const config = getAuthHeaders();
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const returnData = {
        transaction_type: "Return",
        quantity: transactionData.quantity,
        remarks: transactionData.remarks,
        inventory_item_id: transactionData.inventory_item_id,
        performed_by: transactionData.performed_by,
        reference_request_id: transactionData.reference_request_id || null
      };

      console.log('Return Data:', returnData);
      console.log('Auth Headers:', config.headers);

      const response = await axios.post(
        `${BASE_URL}/inventory/transactions/`,
        returnData,
        config
      );

      if (response.status === 201 || response.status === 200) {
        message.success('Return transaction created successfully');
        await get().fetchTransactionHistory();
        return response.data;
      }
    } catch (error) {
      console.error('Error creating return transaction:', error);
      if (error.response?.status === 401) {
        message.error('Authentication failed. Please log in again.');
      } else {
        message.error(error.response?.data?.detail || 'Failed to create return transaction');
      }
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));

export default useTransactionHistoryStore; 