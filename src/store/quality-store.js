import axios from 'axios';

class QualityStore {
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new Error('Authentication token is missing');
    }

    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    };
  }

  async fetchAllOrders() {
    try {
      const response = await axios.get(
        'http://172.18.7.93:9999/api/v1/planning/all_orders',
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
      this.handleAuthError(error);
      throw error;
    }
  }

  async fetchInspectionByOrderId(orderId) {
    try {
      console.log('Fetching inspection for order ID:', orderId);
      const response = await axios.get(
        `http://172.18.7.93:9999/api/v1/quality/inspection/${orderId}/detailed`,
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
      console.log(`Fetching inspection details for Order ID: ${orderId}`);
      
      const config = {
        method: 'get',
        url: `http://172.18.7.93:9999/api/v1/quality/master-boc/ipids/${orderId}`,
        ...this.getAuthHeaders()
      };

      console.log('Request config:', config);
      const response = await axios(config);
      
      console.log('API Response:', response.data);

      return {
        order_id: response.data.order_id,
        production_order: response.data.production_order,
        part_number: response.data.part_number,
        operations: response.data.operations || [],
        operation_groups: response.data.operation_groups?.map(group => ({
          key: `${group.op_no}-${group.details?.zone}`,
          op_no: group.op_no,
          ipid: group.ipid,
          details: group.details,
          zone: group.details?.zone,
          dimension_type: group.details?.dimension_type,
          nominal: group.details?.nominal,
          uppertol: group.details?.uppertol,
          lowertol: group.details?.lowertol,
          measured_instrument: group.details?.measured_instrument
        })) || [],
        hasData: true,
        status: 'success'
      };
      
    } catch (error) {
      this.handleAuthError(error);
      
      return {
        status: 'error',
        message: error.response?.status === 404 
          ? 'No inspection details found' 
          : 'Error fetching inspection details',
        hasData: false,
        order_id: orderId,
        operation_groups: [],
        operations: []
      };
    }
  }

  async launchQMSSoftware() {
    try {
      const response = await axios.get(
        'http://172.18.7.93:9999/api/v1/quality/run',
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

  async fetchBalloonedDrawing(drawingId, operationId) {
    try {
      const response = await axios.get(
        `http://172.18.7.93:9999/api/v1/document-management/ballooned-drawing/download/${drawingId}/${operationId}`,
        {
          ...this.getAuthHeaders(),
          responseType: 'blob' // Important: set responseType to blob for PDF data
        }
      );
      
      // Create a blob URL from the response data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      return {
        url: url,
        fileName: `drawing_${drawingId}_${operationId}.pdf`
      };
    } catch (error) {
      console.error('Error fetching ballooned drawing:', error);
      throw error;
    }
  }

  handleAuthError(error) {
    if (error.response?.status === 401) {
      console.error('Authentication failed. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Authentication failed. Please log in again.');
    }
    console.error('API Error:', error);
  }
}

export const qualityStore = new QualityStore();













