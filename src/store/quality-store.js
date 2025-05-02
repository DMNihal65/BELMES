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
        'http://172.18.7.89:7000/api/v1/planning/all_orders',
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
        `http://172.18.7.89:7000/api/v1/quality/inspection/${orderId}/detailed`,
        this.getAuthHeaders()
      );
      
      console.log('Inspection data received:', response.data);
      
      // Return the data as-is without transformation
      return response.data;
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('No inspection data found for order ID:', orderId);
        return {
          order_id: orderId,
          production_order: '',
          part_number: '',
          operations: [],
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

  async fetchInspectionDetails(orderId) {
    try {
      console.log(`Fetching inspection details for Order ID: ${orderId}`);
      
      const config = {
        method: 'get',
        url: `http://172.18.7.89:7000/api/v1/quality/master-boc/ipids/${orderId}`,
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
        'http://172.18.7.89:7000/api/v1/quality/run',
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
        `http://172.18.7.89:7000/api/v1/document-management/ballooned-drawing/download/${drawingId}/${operationId}`,
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

  async updateInspectionStatus(inspectionId, isDone) {
    try {
      console.log(`Attempting to update inspection status for ID: ${inspectionId}, isDone: ${isDone}`);
      
      // First check network connectivity
      try {
        await this.checkNetworkConnectivity();
      } catch (networkError) {
        console.error('Network connectivity issue detected:', networkError);
        throw new Error('Network connectivity issue: Cannot connect to the server. Please check your network connection.');
      }
      
      // Define all possible API endpoint patterns we might need to try
      const endpointPatterns = [
        // Current endpoint (PUT)
        {
          method: 'put',
          url: `http://172.18.7.89:7000/api/v1/quality/stage-inspection/${inspectionId}/status?is_done=${isDone}`,
          data: {}
        },
        // Alternative with ID in path parameter (PATCH)
        {
          method: 'patch',
          url: `http://172.18.7.89:7000/api/v1/quality/stage-inspection/${inspectionId}/status`,
          data: { is_done: isDone }
        },
        // Alternative with ID in path and status in path (PUT)
        {
          method: 'put',
          url: `http://172.18.7.89:7000/api/v1/quality/stage-inspection/${inspectionId}/${isDone ? 'complete' : 'incomplete'}`,
          data: {}
        },
        // Alternative with different base path (PUT)
        {
          method: 'put',
          url: `http://172.18.7.89:7000/api/v1/quality/inspection/${inspectionId}/status?is_done=${isDone}`,
          data: {}
        },
        // Alternative with different base path (POST)
        {
          method: 'post',
          url: `http://172.18.7.89:7000/api/v1/quality/inspection/${inspectionId}/status`,
          data: { is_done: isDone }
        },
        // Additional alternative with direct update to inspection record
        {
          method: 'put',
          url: `http://172.18.7.89:7000/api/v1/quality/inspections/${inspectionId}`,
          data: { is_done: isDone }
        },
        // Alternative with different parameter naming
        {
          method: 'put',
          url: `http://172.18.7.89:7000/api/v1/quality/inspection/${inspectionId}/status`,
          data: { isDone: isDone }
        }
      ];
      
      // Create an array to store error information
      const errors = [];
      
      // Maximum number of retries per endpoint pattern
      const MAX_RETRIES = 2;
      
      // Try each endpoint pattern in sequence until one works
      for (let i = 0; i < endpointPatterns.length; i++) {
        const pattern = endpointPatterns[i];
        
        // Try each pattern with retries and exponential backoff
        for (let retry = 0; retry <= MAX_RETRIES; retry++) {
          const attemptNumber = retry > 0 ? `${i+1}.${retry}` : `${i+1}`;
          console.log(`[ATTEMPT ${attemptNumber}/${endpointPatterns.length}${retry > 0 ? ` (retry ${retry}/${MAX_RETRIES})` : ''}] Trying ${pattern.method.toUpperCase()} ${pattern.url}`);
          console.log('Request data:', pattern.data);
          
          try {
            // If this is a retry, add a delay with exponential backoff
            if (retry > 0) {
              const delayMs = 1000 * Math.pow(2, retry - 1); // 1s, 2s, 4s, ...
              console.log(`Waiting ${delayMs}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
            
            // Make the API call with the current endpoint pattern
            const response = await axios({
              method: pattern.method,
              url: pattern.url,
              data: pattern.data,
              ...this.getAuthHeaders(),
              timeout: 10000 // 10 second timeout
            });
            
            // If we get here, the request was successful
            console.log(`[SUCCESS] Endpoint pattern ${i+1} worked!`, response.data);
            
            // Store the successful pattern for future reference
            this.lastSuccessfulEndpointPattern = pattern;
            console.log('Saved successful endpoint pattern for future use:', this.lastSuccessfulEndpointPattern);
            
            return response.data;
            
          } catch (error) {
            // Log detailed error information for debugging
            const errorDetails = {
              pattern: `${pattern.method.toUpperCase()} ${pattern.url}`,
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data || 'No response data',
              message: error.message,
              retry: retry
            };
            
            console.error(`[FAILED ATTEMPT ${attemptNumber}] Error details:`, errorDetails);
            
            // Only add to errors array on the last retry attempt
            if (retry === MAX_RETRIES) {
              errors.push(errorDetails);
            }
            
            // Check for network errors that indicate we should stop trying
            if (!error.response && (error.code === 'ECONNABORTED' || error.message.includes('Network Error'))) {
              console.error('Critical network error detected. Stopping retry attempts.');
              throw new Error(`Network error: ${error.message}. Please check your connection and try again.`);
            }
            
            // Continue to next retry or pattern
          }
        }
      }
      
      // If we get here, all endpoint patterns failed
      console.error('All endpoint patterns failed for updating inspection status:', {
        inspectionId,
        isDone,
        errors
      });
      
      // Try using the last successful pattern if available
      if (this.lastSuccessfulEndpointPattern) {
        console.log('Attempting to use previously successful endpoint pattern:', this.lastSuccessfulEndpointPattern);
        
        try {
          const pattern = {...this.lastSuccessfulEndpointPattern};
          
          // Update the URL and data for the current inspection ID
          if (pattern.url.includes('inspection')) {
            pattern.url = pattern.url.replace(/\/\d+\//, `/${inspectionId}/`);
          }
          
          if (pattern.data && 'is_done' in pattern.data) {
            pattern.data.is_done = isDone;
          } else if (pattern.data && 'isDone' in pattern.data) {
            pattern.data.isDone = isDone;
          }
          
          if (pattern.url.includes('?is_done=')) {
            pattern.url = pattern.url.replace(/\?is_done=(true|false)/, `?is_done=${isDone}`);
          }
          
          console.log('Using modified pattern:', {
            method: pattern.method,
            url: pattern.url,
            data: pattern.data
          });
          
          const response = await axios({
            method: pattern.method,
            url: pattern.url,
            data: pattern.data,
            ...this.getAuthHeaders(),
            timeout: 10000
          });
          
          console.log('[SUCCESS with saved pattern] Request succeeded!', response.data);
          return response.data;
          
        } catch (error) {
          console.error('Even the previously successful pattern failed:', error);
        }
      }
      
      // Throw an error with detailed information
      const errorMsg = `Failed to update inspection status after trying ${endpointPatterns.length} different endpoint patterns with retries. Check browser console for details.`;
      throw new Error(errorMsg);
      
    } catch (error) {
      console.error('Error updating inspection status:', error);
      this.handleAuthError(error);
      throw error;
    }
  }
  
  // Add a network connectivity check function
  async checkNetworkConnectivity() {
    try {
      // Try to ping the server with a HEAD request
      await axios({
        method: 'head',
        url: 'http://172.18.7.89:7000/api/v1/health', // Use a health endpoint if available
        timeout: 5000 // 5 second timeout
      });
      
      console.log('Network connectivity check passed');
      return true;
    } catch (error) {
      // If the health endpoint doesn't exist, try the base URL
      try {
        await axios({
          method: 'head',
          url: 'http://172.18.7.89:7000/',
          timeout: 5000
        });
        
        console.log('Network connectivity check passed (base URL)');
        return true;
      } catch (secondError) {
        console.error('Network connectivity check failed:', secondError.message);
        throw new Error(`Network connectivity check failed: ${secondError.message}`);
      }
    }
  }

  async fetchReportStructure(forceRefresh = false) {
    try {
      console.log('Fetching report structure data...');
      
      const response = await axios.get(
        `http://172.18.7.89:7000/api/v1/document-management/report/structure/?force_refresh=${forceRefresh}`,
        this.getAuthHeaders()
      );
      
      console.log('Report structure data received:', response.data);
      
      // Return the data as-is
      return response.data;
      
    } catch (error) {
      console.error('Error fetching report structure:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  async downloadReport(filePath) {
    try {
      console.log(`Downloading report from path: ${filePath}`);
      
      const response = await axios.get(
        `http://172.18.7.89:7000/api/v1/document-management/download/?path=${encodeURIComponent(filePath)}`,
        {
          ...this.getAuthHeaders(),
          responseType: 'blob' // Important: set responseType to blob for file data
        }
      );
      
      // Create a blob URL from the response data
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      
      // Get the filename from the path
      const pathParts = filePath.split('/');
      const fileName = pathParts[pathParts.length - 1] || 'download';
      
      return {
        url,
        fileName,
        contentType
      };
    } catch (error) {
      console.error('Error downloading report:', error);
      this.handleAuthError(error);
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













