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
        'http://172.18.7.85:7068/api/v1/planning/all_orders',
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
        `http://172.18.7.85:7068/quality/inspection/${orderId}/detailed`,
        this.getAuthHeaders()
      );
      
      console.log('Inspection data received:', response.data);
      
      // Transform the data to match the expected structure
      const transformedData = [{
        key: response.data.order_id,
        order_id: response.data.order_id,
        production_order: response.data.production_order,
        part_number: response.data.part_number,
        operations: response.data.operations || [],
        inspection_data: response.data.inspection_data || []
      }];
      
      return transformedData;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('No inspection data found for order ID:', orderId);
        return [{
          key: orderId,
          order_id: orderId,
          production_order: '',
          part_number: '',
          operations: [],
          inspection_data: []
        }];
      }
      if (error.response?.status === 401) {
        console.error('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
      }
      console.error('Error fetching inspection details:', error);
      throw error;
    }
  }

  async fetchInspectionDetails(orderId) {
    try {
      console.log(`Attempting to fetch inspection details for Order ID: ${orderId}`);
      
      const response = await axios.get(
        `http://172.18.7.85:7068/quality/master-boc/ipids/${orderId}`,
        this.getAuthHeaders()
      );
      
      console.log('Successfully fetched inspection details:', response.data);
      
      return {
        ...response.data,
        order_id: orderId,
        operation_groups: response.data.operation_groups || [],
        operations: response.data.operations || [],
        production_order: response.data.production_order || '',
        part_number: response.data.part_number || ''
      };
      
    } catch (error) {
      console.log('Error details:', error.response || error);
      
      return {
        order_id: orderId,
        operation_groups: [],
        operations: [],
        production_order: '',
        part_number: '',
        details: [],
        status: 'not_found',
        error: error.response?.status === 404 ? 'NOT_FOUND' : 'ERROR',
        message: error.response?.status === 404 
          ? 'No inspection details found for this Order ID'
          : 'Error fetching inspection details'
      };
    }
  }

  async launchQMSSoftware() {
    try {
      const response = await axios.get(
        'http://172.18.7.85:7068/api/v1/quality/run',
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
      }
      console.error('Error launching QMS software:', error);
      throw error;
    }
  }
}

export const qualityStore = new QualityStore();
