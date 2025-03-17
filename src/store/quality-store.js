import axios from 'axios';

class QualityStore {
  getAuthHeaders() {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Log token for debugging (remove in production)
    console.log('Current token:', token);

    if (!token) {
      throw new Error('No authentication token found');
    }

    // Remove 'Bearer ' if it's already included in the stored token
    const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    return {
      headers: {
        'Authorization': cleanToken,
        'Content-Type': 'application/json'
      }
    };
  }

  async fetchAllOrders() {
    try {
      const response = await axios.get(
        'http://172.18.7.155:8002/api/v1/planning/all_orders',
        this.getAuthHeaders()
      );
      return response.data.map(order => ({
        value: order.id,
        label: `${order.production_order} - ${order.part_number}`,
        partDetails: order,
        operations: order.operations || [],
        production_order: order.production_order,
        part_number: order.part_number,
        order_id: order.id
      }));
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
      }
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async fetchInspectionByOrderId(orderId) {
    try {
      console.log('Fetching inspection for order ID:', orderId);
      const response = await axios.get(
        `http://172.18.7.155:8002/api/v1/quality/inspection/${orderId}/detailed`,
        this.getAuthHeaders()
      );
      
      console.log('Inspection data received:', response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('No inspection data found for order ID:', orderId);
        return {
          order_id: orderId,
          inspection_data: []
        };
      }
      if (error.response?.status === 401) {
        console.error('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
      }
      console.error('Error fetching inspection details:', error);
      throw error;
    }
  }

  async fetchInspectionDetails(ipId) {
    try {
      const response = await axios.get(
        `http://172.18.7.155:8002/api/v1/quality/master-boc/ipids/${ipId}`,
        this.getAuthHeaders()
      );
      return {
        ...response.data,
        operation_groups: response.data.operation_groups || []
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          order_id: ipId,
          operation_groups: [],
          operations: []
        };
      }
      if (error.response?.status === 401) {
        console.error('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
      }
      console.error('Error fetching inspection details:', error);
      throw error;
    }
  }
}

export const qualityStore = new QualityStore();
