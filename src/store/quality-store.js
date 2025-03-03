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
        'http://172.18.7.88:7599/api/v1/planning/all_orders',
        this.getAuthHeaders()
      );
      return response.data.map(order => ({
        value: order.id,
        label: `${order.production_order} - ${order.part_number}`,
        partDetails: order
      }));
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('Authentication failed. Please log in again.');
        // Optionally redirect to login page or show login modal
        localStorage.removeItem('token'); // Clear invalid token
      }
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async fetchInspectionDetails(orderId) {
    try {
      const response = await axios.get(
        `http://172.18.7.88:7599/api/v1/quality/inspection/${orderId}/detailed`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('Authentication failed. Please log in again.');
        // Optionally redirect to login page or show login modal
        localStorage.removeItem('token'); // Clear invalid token
      }
      console.error('Error fetching inspection details:', error);
      throw error;
    }
  }
}

export const qualityStore = new QualityStore();
