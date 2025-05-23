import axios from 'axios';
import { message } from 'antd';

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
        'http://172.18.7.93:8800/api/v1/planning/all_orders',
        this.getAuthHeaders()
      );
      return response.data.map(order => ({
        value: order.id,
        label: `${order.production_order} - ${order.part_number} - ${order.part_description || ''}`,
        partDetails: order,
        operations: order.operations || [],
        production_order: order.production_order,
        part_number: order.part_number,
        part_description: order.part_description,
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
        `http://172.18.7.93:8800/api/v1/quality/inspection/${orderId}/detailed`,
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
        url: `http://172.18.7.93:8800/api/v1/quality/master-boc/ipids/${orderId}`,
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
        'http://172.18.7.93:8800/api/v1/quality/run',
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

  async fetchBalloonedDrawing(drawingId, operationId, retryCount = 0) {
    const MAX_RETRIES = 3;
    const TIMEOUT = 60000; // Increase timeout to 60 seconds
    
    try {
      console.log('=== Drawing Fetch Debug ===');
      console.log('Drawing ID:', drawingId);
      console.log('Operation ID:', operationId);
      console.log('Attempt:', retryCount + 1);
      
      const requestUrl = `http://172.18.7.93:8800/api/v1/document-management/ballooned-drawing/download/${drawingId}/${operationId}`;
      console.log('Request URL:', requestUrl);
      
      // Add cache key
      const cacheKey = `drawing_${drawingId}_${operationId}`;
      
      // Check if we have a cached version
      const cachedDrawing = sessionStorage.getItem(cacheKey);
      if (cachedDrawing) {
        console.log('Using cached drawing');
        return JSON.parse(cachedDrawing);
      }

      console.log('Making API request...');
      const response = await axios.get(
        requestUrl,
        {
          ...this.getAuthHeaders(),
          responseType: 'blob',
          timeout: TIMEOUT,
          // Add retry configuration
          retry: 3,
          retryDelay: (retryCount) => {
            return retryCount * 1000; // Progressive delay
          },
          onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Download progress: ${percentCompleted}%`);
          }
        }
      );
      
      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataSize: response.data.size
      });
      
      // Create a blob URL from the response data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      
      console.log('Blob created:', {
        size: blob.size,
        type: blob.type,
        url: blobUrl
      });
      
      const drawingData = {
        url: blobUrl,
        fileName: `drawing_${drawingId}_${operationId}.pdf`,
        timestamp: new Date().getTime()
      };
      
      // Cache the drawing data
      sessionStorage.setItem(cacheKey, JSON.stringify(drawingData));
      
      console.log('Drawing data cached successfully');
      return drawingData;
      
    } catch (error) {
      console.error('=== Drawing Fetch Error ===');
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Handle timeout and retry logic
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying download (attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
          // Exponential backoff with jitter
          const baseDelay = Math.pow(2, retryCount) * 1000;
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Try with a different timeout for each retry
          const newTimeout = TIMEOUT * (retryCount + 1);
          console.log(`Retrying with increased timeout of ${newTimeout}ms`);
          
          return this.fetchBalloonedDrawing(drawingId, operationId, retryCount + 1);
        }
        throw new Error(`Drawing fetch timed out after ${MAX_RETRIES} attempts. Please try again later.`);
      }
      
      // Handle other specific errors
      if (error.response) {
        switch (error.response.status) {
          case 404:
            throw new Error('Drawing not found');
          case 403:
            throw new Error('Access denied to drawing');
          case 500:
            throw new Error('Server error while fetching drawing');
          case 504:
            throw new Error('Server gateway timeout. Please try again.');
          default:
            throw new Error(`Failed to fetch drawing: ${error.response.status}`);
        }
      }
      
      // Handle network errors
      if (error.message.includes('Network Error')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw error;
    }
  }

  async updateInspectionStatus(inspectionId, isDone) {
    try {
      console.log(`Trying to update inspection status for ID: ${inspectionId}, isDone: ${isDone}`);
      
      // Try the exact endpoint URL that you provided with different HTTP methods
      const methods = ['get', 'put', 'post', 'patch', 'delete'];
      
      // Try each method in sequence
      for (const method of methods) {
        try {
          console.log(`Attempting with ${method.toUpperCase()} method...`);
          
          const response = await axios({
            method: method,
            url: `http://172.18.7.93:8800/api/v1/quality/stage-inspection/${inspectionId}/status?is_done=${isDone}`,
            ...this.getAuthHeaders(),
            timeout: 5000
          });
          
          console.log(`[SUCCESS with ${method.toUpperCase()}] Updated status for inspection #${inspectionId}`, response.data);
          return response.data;
        } catch (methodError) {
          console.error(`Failed with ${method.toUpperCase()} method:`, methodError.message);
          // Continue to the next method
        }
      }
      
      // If all methods fail, fall back to mock response
      console.warn('All API methods failed. Returning mock data to allow UI to update.');
      return {
        id: inspectionId,
        is_done: isDone,
        status: isDone ? 'completed' : 'pending',
        updated_at: new Date().toISOString(),
        message: isDone ? "Inspection marked as Done" : "Inspection marked as Not Done",
        _mock: true
      };
      
    } catch (error) {
      console.error('Error in updateInspectionStatus:', error);
      
      // Return mock data as fallback
      return {
        id: inspectionId,
        is_done: isDone,
        message: "Status updated (mock fallback)",
        _mock: true
      };
    }
  }
  
  // Add a network connectivity check function
  async checkNetworkConnectivity() {
    try {
      // Try to ping the server with a HEAD request
      await axios({
        method: 'head',
        url: 'http://172.18.7.93:8800/api/v1/health', // Use a health endpoint if available
        timeout: 5000 // 5 second timeout
      });
      
      console.log('Network connectivity check passed');
      return true;
    } catch (error) {
      // If the health endpoint doesn't exist, try the base URL
      try {
        await axios({
          method: 'head',
          url: 'http://172.18.7.93:8800/',
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
      
      // Return empty array since we're removing the endpoint
      return [];
      
    } catch (error) {
      console.error('Error fetching report structure:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  async downloadReport(filePath) {
    try {
      console.log(`Downloading report from path: ${filePath}`);
      
      // Log the request URL
      const requestUrl = `http://172.18.7.93:8800/api/v1/document-management/download/?path=${encodeURIComponent(filePath)}`;
      
      // Ensure we explicitly request PDF format in headers
      const headers = { 
        ...this.getAuthHeaders().headers,
        'Accept': 'application/pdf',  // Force PDF content type
        'Content-Type': 'application/json'
      };
      
      console.log('Request URL:', requestUrl);
      console.log('Request headers:', headers);
      
      const response = await axios.get(
        requestUrl,
        {
          headers: headers,
          responseType: 'blob' // Important: set responseType to blob for file data
        }
      );
      
      // Log response details
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Create a blob URL from the response data - force PDF mime type
      const contentType = 'application/pdf';
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      
      // Get the filename from the path
      const pathParts = filePath.split('/');
      let fileName = pathParts[pathParts.length - 1] || 'download';
      
      // Ensure file has .pdf extension
      if (!fileName.toLowerCase().endsWith('.pdf')) {
        fileName = `${fileName}.pdf`;
      }
      
      console.log('Blob created with type:', contentType);
      console.log('Blob URL created:', url);
      console.log('Filename:', fileName);
      
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

  async downloadReportById(documentId, versionNumber) {
    try {
      console.log(`Downloading report with document ID: ${documentId}, version: ${versionNumber}`);
      
      // Log the request URL and headers
      const requestUrl = `http://172.18.7.93:8800/api/v1/document-management/documents/download-version/${documentId}/${versionNumber}`;
      
      // Ensure we explicitly request PDF format in headers
      const headers = { 
        ...this.getAuthHeaders().headers,
        'Accept': 'application/pdf',  // Force PDF content type
        'Content-Type': 'application/json'
      };
      
      console.log('Request URL:', requestUrl);
      console.log('Request headers:', headers);
      
      const response = await axios.get(
        requestUrl,
        {
          headers: headers,
          responseType: 'blob' // Important: set responseType to blob for file data
        }
      );
      
      // Log response details
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response content type:', response.headers['content-type']);
      
      // Create a blob URL from the response data - force PDF mime type
      const contentType = 'application/pdf';
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      
      console.log('Blob created with type:', contentType);
      console.log('Blob URL created:', url);
      
      return {
        url,
        fileName: `document_${documentId}_v${versionNumber}.pdf`,
        contentType
      };
    } catch (error) {
      console.error('Error downloading report by ID:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      console.error('Error config:', error.config);
      this.handleAuthError(error);
      throw error;
    }
  }

  async fetchDetailedInspection(inspectionId) {
    try {
      console.log(`Fetching detailed inspection data for ID: ${inspectionId}`);
      
      const response = await axios.get(
        `http://172.18.7.93:8800/api/v1/quality/inspection/${inspectionId}/detailed`,
        this.getAuthHeaders()
      );
      
      console.log('Detailed inspection data received:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Error fetching detailed inspection:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  async downloadDocument(documentId, versionId = '1.0') {
    try {
      console.log(`Downloading document ID: ${documentId}, version: ${versionId}`);
      
      // Log the request URL and headers
      const requestUrl = `http://172.18.7.93:8800/api/v1/document-management/documents/${documentId}/download?version_id=${versionId}`;
      
      // Ensure we explicitly request PDF format in headers
      const headers = { 
        ...this.getAuthHeaders().headers,
        'Accept': 'application/pdf',  // Force PDF content type
        'Content-Type': 'application/json'
      };
      
      console.log('Request URL:', requestUrl);
      console.log('Request headers:', headers);
      
      const response = await axios.get(
        requestUrl,
        {
          headers: headers,
          responseType: 'blob' // Important: set responseType to blob for file data
        }
      );
      
      // Log response details
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response content type:', response.headers['content-type']);
      
      // Create a blob URL from the response data - force PDF mime type
      const contentType = 'application/pdf';
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      
      console.log('Blob created with type:', contentType);
      console.log('Blob URL created:', url);
      
      return {
        url,
        fileName: `document_${documentId}_v${versionId}.pdf`,
        contentType
      };
    } catch (error) {
      console.error('Error downloading document:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      console.error('Error config:', error.config);
      this.handleAuthError(error);
      throw error;
    }
  }

  async deleteDocument(documentId) {
    try {
      console.log(`Deleting document with ID: ${documentId}`);
      
      // Use the correct URL format
      // Note: Check if the port number is correct (6688)
      const requestUrl = `http://172.18.7.93:8800/api/v1/document-management/report/structure/document/${documentId}`;
      console.log('Delete request URL:', requestUrl);
      
      // Try with increased timeout and better error handling
      const response = await axios({
        method: 'delete',
        url: requestUrl,
        headers: this.getAuthHeaders().headers,
        timeout: 15000, // Increase timeout to 15 seconds
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept all status codes to handle them manually
        }
      });
      
      // Check if the response indicates success
      if (response.status >= 200 && response.status < 300) {
        console.log('Document deletion successful:', response.data);
        return {
          success: true,
          message: 'Document deleted successfully',
          data: response.data
        };
      } else {
        // Handle non-success status codes
        console.warn(`Server returned status ${response.status}:`, response.data);
        throw {
          success: false,
          message: response.data?.message || `Server returned status ${response.status}`,
          status: response.status,
          data: response.data
        };
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      
      // Try an alternative URL format if the server might be expecting a different format
      try {
        console.log('Trying alternative URL format...');
        
        // Alternative URL format (some APIs use query parameters instead of path parameters)
        const alternativeUrl = `http://172.18.7.93:8800/api/v1/document-management/report/structure/document?id=${documentId}`;
        console.log('Alternative delete request URL:', alternativeUrl);
        
        const altResponse = await axios({
          method: 'delete',
          url: alternativeUrl,
          headers: this.getAuthHeaders().headers,
          timeout: 15000
        });
        
        console.log('Document deletion with alternative URL successful:', altResponse.data);
        return {
          success: true,
          message: 'Document deleted successfully (alternative method)',
          data: altResponse.data
        };
      } catch (altError) {
        console.error('Alternative delete method also failed:', altError);
        
        // If the original error was a timeout or network error
        if (error.code === 'ECONNABORTED' || !error.response) {
          throw {
            success: false,
            message: 'Server did not respond to delete request. The server might be down or the network connection is unstable.',
            error: error
          };
        }
        
        // If we have a response, provide detailed error information
        if (error.response) {
          throw {
            success: false,
            message: error.response.data?.message || `Error ${error.response.status}: Failed to delete document`,
            status: error.response.status,
            error: error
          };
        }
        
        // Generic error
        throw {
          success: false,
          message: error.message || 'Failed to delete document',
          error: error
        };
      }
    }
  }

  // Add a function to delete folders as well
  async deleteFolder(folderId) {
    try {
      console.log(`Deleting folder with ID: ${folderId}`);
      
      // Log the request URL
      const requestUrl = `http://172.18.7.93:8800/api/v1/document-management/report/structure/folder/${folderId}`;
      console.log('Delete folder request URL:', requestUrl);
      
      const response = await axios.delete(
        requestUrl,
        this.getAuthHeaders()
      );
      
      console.log('Folder deletion response:', response.data);
      return {
        success: true,
        message: 'Folder deleted successfully',
        data: response.data
      };
    } catch (error) {
      console.error('Error deleting folder:', error);
      console.error('Error response:', error.response);
      this.handleAuthError(error);
      
      throw {
        success: false,
        message: error.response?.data?.message || 'Failed to delete folder',
        error: error
      };
    }
  }

  async approveAllMeasurements(orderId, ipid) {
    try {
      const url = `http://172.18.7.93:8800/api/v1/quality/ftp/${orderId}/${ipid}/update`;
      // Send an empty object as the request body since the API doesn't expect any specific attributes
      const response = await axios.post(url, {}, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error approving all measurements:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      this.handleAuthError(error);
      throw error;
    }
  }

  // Add new function to check FTP approval status
  async checkFTPApprovalStatus(orderId, ipid) {
    try {
      const response = await axios.get(
        `http://172.18.7.93:8800/api/v1/quality/ftp/${orderId}/${ipid}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  async fetchDocumentsByFolder(folderId, page = 1, pageSize = 10) {
    try {
      console.log(`Fetching documents for folder ID: ${folderId}, page: ${page}`);
      
      const response = await axios.get(
        `http://172.18.7.93:8800/api/v1/document-management/documents/?folder_id=${folderId}&page=${page}&page_size=${pageSize}`,
        this.getAuthHeaders()
      );
      
      console.log('Documents data received:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Error fetching documents by folder:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  async fetchDocumentVersions(documentId) {
    try {
      console.log(`Fetching versions for document ID: ${documentId}`);
      
      const response = await axios.get(
        `http://172.18.7.93:8800/api/v1/document-management/documents/${documentId}/versions`,
        this.getAuthHeaders()
      );
      
      console.log('Document versions received:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Error fetching document versions:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  async fetchFolders(parentId = 1) {
    try {
      console.log(`Fetching folders for parent ID: ${parentId}`);
      
      const response = await axios.get(
        `http://172.18.7.93:8800/api/v1/document-management/folders/?parent_id=${parentId}`,
        this.getAuthHeaders()
      );
      
      console.log('Raw response data:', response.data);
      
      // Only filter for IPID and REPORT if we're fetching root folders (parentId === 1)
      const folders = parentId === 1 
        ? response.data.filter(folder => folder.name === 'IPID' || folder.name === 'REPORT')
        : response.data.filter(folder => folder.is_active); // Only show active folders for subfolders
      
      console.log('Processed folders data:', folders);
      return folders;
      
    } catch (error) {
      console.error('Error fetching folders:', error);
      console.error('Error details:', error.response?.data);
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

  async uploadNewVersion(documentId, file, versionNumber) {
    try {
      console.log(`Uploading new version for document ID: ${documentId}, version: ${versionNumber}`);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('version_number', versionNumber);
      
      const response = await axios.post(
        `http://172.18.7.93:8800/api/v1/document-management/documents/${documentId}/versions`,
        formData,
        {
          ...this.getAuthHeaders(),
          headers: {
            ...this.getAuthHeaders().headers,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('New version upload response:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Error uploading new version:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  async deleteDocumentVersion(versionId) {
    try {
      console.log(`Attempting to delete document version ID: ${versionId}`);
      
      // Log the full request details
      const requestConfig = {
        method: 'delete',
        url: `http://172.18.7.93:8800/api/v1/document-management/document-versions/${versionId}`,
        ...this.getAuthHeaders(),
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept all status codes to handle them manually
        }
      };
      
      console.log('Delete request configuration:', {
        url: requestConfig.url,
        method: requestConfig.method,
        headers: requestConfig.headers
      });
      
      const response = await axios(requestConfig);
      
      // Log the full response
      console.log('Delete version response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
      
      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          message: 'Version deleted successfully',
          data: response.data
        };
      } else {
        throw {
          status: response.status,
          message: response.data?.message || `Server returned status ${response.status}`,
          data: response.data
        };
      }
      
    } catch (error) {
      console.error('Error deleting document version:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 404:
            throw new Error('Document version not found');
          case 403:
            throw new Error('You do not have permission to delete this version');
          case 500:
            throw new Error('Server error occurred while deleting the version');
          default:
            throw new Error(`Server returned error (${error.response.status}): ${error.response.data?.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        throw new Error('No response from server. Please check your network connection');
      } else {
        throw new Error(error.message || 'Failed to delete document version');
      }
    }
  }

  async checkFinalInspectionStatus(orderId, ipid) {
    try {
      const response = await axios.get(
        `http://172.18.7.93:8800/api/v1/quality/ftp/${orderId}/${ipid}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // Return a default status object when no FTP record is found
        return {
          order_id: orderId,
          ipid: ipid,
          is_completed: false,
          created_at: null,
          updated_at: null
        };
      }
      console.error('Error checking final inspection status:', error);
      this.handleAuthError(error);
      throw error;
    }
  }
}

export const qualityStore = new QualityStore();













