import axios from 'axios';

class QualityStore {
  constructor() {
    // Create axios instance with better configuration
    this.api = axios.create({
      baseURL: 'http://172.19.224.1:8002/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getValidToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          this.handleTokenExpiration();
        }
        return Promise.reject(error);
      }
    );
  }

  // Improved token management
  getValidToken() {
    let token = localStorage.getItem('token');
    
    if (!token) {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          token = parsed?.state?.token;
        } catch (error) {
          console.error('Error parsing auth storage:', error);
        }
      }
    }

    if (!token) {
      console.warn('No valid authentication token found');
      return null;
    }

    return token;
  }

  // Handle token expiration
  handleTokenExpiration() {
    console.error('Authentication token expired or invalid');
    localStorage.removeItem('token');
    localStorage.removeItem('auth-storage');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    localStorage.removeItem('currentMachine');
    
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Retry mechanism
  async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        console.warn(`Request attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  // Enhanced error handling
  handleError(error, context = 'API request') {
    console.error(`${context} error:`, error);
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.detail || 'Server error';
      
      switch (status) {
        case 401:
          this.handleTokenExpiration();
          throw new Error('Authentication failed. Please log in again.');
        case 403:
          throw new Error('Access denied. You do not have permission to perform this action.');
        case 404:
          throw new Error('Resource not found.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(`Server error (${status}): ${message}`);
      }
    } else if (error.request) {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred.');
    }
  }

  // Legacy method for backward compatibility
  getAuthHeaders() {
    const token = this.getValidToken();
    
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
    return this.retryRequest(async () => {
      try {
        const response = await this.api.get('/planning/all_orders');
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
        this.handleError(error, 'Fetching orders');
      }
    });
  }

  async fetchInspectionByOrderId(orderId) {
    return this.retryRequest(async () => {
      try {
        console.log('Fetching inspection for order ID:', orderId);
        const response = await this.api.get(`/quality/inspection/${orderId}/detailed`);
        
        console.log('Inspection data received:', response.data);
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
        this.handleError(error, 'Fetching inspection details');
      }
    });
  }

  /**
   * Generate a consolidated report for a production order and operation
   * @param {string} productionOrder - The production order number
   * @param {string|number} operationNo - The operation number
   * @returns {Promise<Blob>} The generated report as a Blob
   */
  async generateConsolidatedReport(productionOrder, operationNo) {
    try {
      // Ensure operationNo is provided and is a valid number
      if (operationNo === undefined || operationNo === null || operationNo === '') {
        throw new Error('Operation number is required');
      }
      
      // Convert to number to ensure it's a valid operation number
      const opNo = Number(operationNo);
      if (isNaN(opNo)) {
        throw new Error('Invalid operation number');
      }
      
      // Create URL with production order and operation_no as a query parameter
      const baseUrl = 'http://172.19.224.1:8002/api/v1/document-management/report/generate-consolidated';
      const url = new URL(`${baseUrl}/${productionOrder}`);
      url.searchParams.append('operation_no', opNo);
      
      console.log('=== API Request Details ===');
      console.log('URL:', url.toString());
      console.log('Method: GET');
      console.log('Query Params:', Object.fromEntries(url.searchParams));
      console.log('Headers:', {
        'Authorization': 'Bearer [TOKEN]',
        'Accept': 'application/pdf'
      });
      
      // Make the request using the URL object
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getValidToken()}`,
          'Accept': 'application/pdf'
        },
        credentials: 'include'  // Include cookies if needed
      });
      
      console.log('=== API Response ===');
      console.log('Status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { detail: errorText };
        }
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Received blob of size:', blob.size, 'bytes');
      return blob;
      
    } catch (error) {
      console.error('Error in generateConsolidatedReport:', {
        productionOrder,
        operationNo,
        error: error.message
      });
      
      // Rethrow with a more user-friendly message
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  async fetchInspectionDetails(orderId) {
    return this.retryRequest(async () => {
      try {
        if (!orderId) {
          throw new Error('Order ID is required');
        }
        
        console.log(`Fetching inspection details for Order ID: ${orderId}`);
        
        // Fetch initial inspection details to get part_number
        const initialDetails = await this.fetchInspectionByOrderId(orderId);
        
        // If no initial details were found, return empty data structure
        if (!initialDetails || !initialDetails.part_number) {
          console.log('No inspection data or part number found for order ID:', orderId);
          return {
            order_id: orderId,
            production_order: '',
            part_number: '',
            operations: [],
            operation_groups: [],
            inspection_data: []
          };
        }
        
        const partNumber = initialDetails.part_number;
        const response = await this.api.get(`/quality/master-boc/ipids/${orderId}/${partNumber}`);
        
        console.log('API Response:', response.data);

        return {
          order_id: response.data.order_id || orderId,
          production_order: response.data.production_order || '',
          part_number: response.data.part_number || partNumber,
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
        if (error.response?.status === 404) {
          return {
            status: 'error',
            message: 'No inspection details found',
            hasData: false,
            order_id: orderId,
            operation_groups: [],
            operations: []
          };
        }
        this.handleError(error, 'Fetching inspection details');
      }
    });
  }

  async launchQMSSoftware() {
    return this.retryRequest(async () => {
      try {
        const response = await this.api.get('/quality/run');
        return response.data;
      } catch (error) {
        this.handleError(error, 'Launching QMS software');
      }
    });
  }

  async fetchBalloonedDrawing(partNumber, operationId) {
    return this.retryRequest(async () => {
      try {
        console.log(`Fetching ballooned drawing for Part: ${partNumber}, Operation: ${operationId}`);
        
        const response = await this.api.get(
          `/document-management/ballooned-drawing/download/${partNumber}/${operationId}`,
          { responseType: 'blob' }
        );
        
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        return {
          url: url,
          fileName: `drawing_${partNumber}_${operationId}.pdf`
        };
      } catch (error) {
        this.handleError(error, 'Fetching ballooned drawing');
      }
    });
  }

  async updateInspectionStatus(inspectionId, isDone) {
    return this.retryRequest(async () => {
      try {
        console.log(`Updating inspection status for ID: ${inspectionId}, isDone: ${isDone}`);
        
        const response = await this.api.put(
          `/quality/stage-inspection/${inspectionId}/status?is_done=${isDone}`
        );
        
        console.log(`Updated status for inspection #${inspectionId}`, response.data);
        return response.data;
        
      } catch (error) {
        console.error('Error in updateInspectionStatus:', error);
        
        // Return mock data as fallback for development
        if (process.env.NODE_ENV === 'development') {
          return {
            id: inspectionId,
            is_done: isDone,
            message: "Status updated (mock fallback)",
            _mock: true
          };
        }
        
        this.handleError(error, 'Updating inspection status');
      }
    });
  }

  async checkNetworkConnectivity() {
    return this.retryRequest(async () => {
      try {
        await this.api.head('/health');
        console.log('Network connectivity check passed');
        return true;
      } catch (error) {
        console.error('Network connectivity check failed:', error.message);
        throw new Error(`Network connectivity check failed: ${error.message}`);
      }
    });
  }

  async fetchReportStructure(forceRefresh = false) {
    return this.retryRequest(async () => {
      try {
        console.log('Fetching report structure data...');
        return [];
      } catch (error) {
        this.handleError(error, 'Fetching report structure');
      }
    });
  }

  async downloadReport(filePath) {
    return this.retryRequest(async () => {
      try {
        console.log(`Downloading report from path: ${filePath}`);
        
        const response = await this.api.get(
          `/document-management/download/?path=${encodeURIComponent(filePath)}`,
          {
            headers: { 'Accept': 'application/pdf' },
            responseType: 'blob'
          }
        );
        
        const contentType = 'application/pdf';
        const blob = new Blob([response.data], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        const pathParts = filePath.split('/');
        let fileName = pathParts[pathParts.length - 1] || 'download';
        
        if (!fileName.toLowerCase().endsWith('.pdf')) {
          fileName = `${fileName}.pdf`;
        }
        
        return { url, fileName, contentType };
      } catch (error) {
        this.handleError(error, 'Downloading report');
      }
    });
  }

  async downloadReportById(documentId, versionNumber, additionalInfo = {}) {
    return this.retryRequest(async () => {
      try {
        console.log(`Downloading report with document ID: ${documentId}, version: ${versionNumber}`);
        
        const response = await this.api.get(
          `/document-management/documents/${documentId}/download`,
          {
            params: { version_id: versionNumber },
            headers: { 'Accept': 'application/pdf' },
            responseType: 'blob'
          }
        );
        
        const contentType = 'application/pdf';
        const blob = new Blob([response.data], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        // Try to get filename from additionalInfo first, then from content-disposition header
        let fileName = additionalInfo.name 
          ? `${additionalInfo.name.replace(/[^a-zA-Z0-9-_ ]/g, '_')}.pdf`
          : `document_${documentId}_v${versionNumber}.pdf`;
          
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            fileName = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        return {
          url,
          fileName,
          contentType
        };
      } catch (error) {
        console.error('Error in downloadReportById:', error);
        this.handleError(error, 'Downloading report by ID');
        throw error; // Re-throw to allow handling in the component
      }
    });
  }

  async fetchDetailedInspection(inspectionId) {
    return this.retryRequest(async () => {
      try {
        console.log(`Fetching detailed inspection data for ID: ${inspectionId}`);
        
        const response = await this.api.get(`/quality/inspection/${inspectionId}/detailed`);
        
        console.log('Detailed inspection data received:', response.data);
        return response.data;
        
      } catch (error) {
        this.handleError(error, 'Fetching detailed inspection');
      }
    });
  }

  async downloadDocument(documentId, versionId = '1.0') {
    return this.retryRequest(async () => {
      try {
        console.log(`Downloading document ID: ${documentId}, version: ${versionId}`);
        
        const response = await this.api.get(
          `/document-management/documents/${documentId}/download?version_id=${versionId}`,
          {
            headers: { 'Accept': 'application/pdf' },
            responseType: 'blob'
          }
        );
        
        const contentType = 'application/pdf';
        const blob = new Blob([response.data], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        return {
          url,
          fileName: `document_${documentId}_v${versionId}.pdf`,
          contentType
        };
      } catch (error) {
        this.handleError(error, 'Downloading document');
      }
    });
  }

  async deleteDocument(documentId) {
    return this.retryRequest(async () => {
      try {
        console.log(`Deleting document with ID: ${documentId}`);
        
        const response = await this.api.delete(
          `/document-management/report/structure/document/${documentId}`,
          { timeout: 15000 }
        );
        
        console.log('Document deletion successful:', response.data);
        return {
          success: true,
          message: 'Document deleted successfully',
          data: response.data
        };
      } catch (error) {
        this.handleError(error, 'Deleting document');
      }
    });
  }

  async deleteFolder(folderId) {
    return this.retryRequest(async () => {
      try {
        console.log(`Deleting folder with ID: ${folderId}`);
        
        const response = await this.api.delete(`/document-management/report/structure/folder/${folderId}`);
        
        console.log('Folder deletion response:', response.data);
        return {
          success: true,
          message: 'Folder deleted successfully',
          data: response.data
        };
      } catch (error) {
        this.handleError(error, 'Deleting folder');
      }
    });
  }

  async generateConsolidatedReport(productionOrder, operationNo) {
    return this.retryRequest(async () => {
      try {
        // Ensure operationNo is provided and is a valid number
        if (operationNo === undefined || operationNo === null || operationNo === '') {
          throw new Error('Operation number is required');
        }

        // Convert to number to ensure it's a valid operation number
        const opNo = Number(operationNo);
        if (isNaN(opNo)) {
          throw new Error('Invalid operation number');
        }

        console.log(`Generating consolidated report for production order: ${productionOrder}, operation: ${opNo}`);
        
        const response = await this.api({
          method: 'post',
          url: `/document-management/report/generate-consolidated/${productionOrder}?operation_no=${opNo}`,
          responseType: 'arraybuffer',
          headers: {
            'Accept': 'application/pdf',
            'Content-Type': 'application/json'
          },
          responseEncoding: 'binary'
        });

        if (!response.data) {
          throw new Error('No data received from server');
        }

        // Get filename from Content-Disposition header or use default
        let fileName = `Consolidated_Report_${productionOrder}_OP${opNo}.pdf`;
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) {
            fileName = match[1].replace(/['"]/g, '');
          }
        }

        // Create a blob from the arraybuffer
        const blob = new Blob([response.data], { type: 'application/pdf' });
        
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        return {
          url,
          blob,
          fileName
        };
      } catch (error) {
        console.error('Error in generateConsolidatedReport:', error);
        this.handleError(error, 'Generating consolidated report');
        throw error;
      }
    });
  }

  async approveAllMeasurements(orderId, ipid) {
    return this.retryRequest(async () => {
      try {
        const response = await this.api.post(`/quality/ftp/${orderId}/${ipid}/update`, {
          is_completed: true,
          status: 'approved'
        });
        return response.data;
      } catch (error) {
        this.handleError(error, 'Approving all measurements');
        throw error; // Re-throw the error to be handled by the caller
      }
    });
  }

  async rejectAllMeasurements(orderId, ipid) {
    return this.retryRequest(async () => {
      try {
        const response = await this.api.post(`/quality/ftp/${orderId}/${ipid}/update`, {
          is_completed: false,
          status: 'rejected'
        });
        return response.data;
      } catch (error) {
        this.handleError(error, 'Rejecting all measurements');
        throw error; // Re-throw the error to be handled by the caller
      }
    });
  }

  async checkFTPApprovalStatus(orderId, ipid) {
    return this.retryRequest(async () => {
      try {
        console.log(`Checking FTP approval status for Order ID: ${orderId}, IPID: ${ipid}`);
        
        const response = await this.api.get(`/quality/ftp/${orderId}/${ipid}`);
        
        console.log('FTP approval status response:', response.data);
        
        if (response.data && typeof response.data.is_completed === 'boolean') {
          return {
            order_id: response.data.order_id,
            ipid: response.data.ipid,
            is_completed: response.data.is_completed,
            status: response.data.status || 'NA', // Set default status to 'NA' if undefined
            created_at: response.data.created_at,
            updated_at: response.data.updated_at
          };
        } else {
          console.warn('Unexpected FTP status response format:', response.data);
          return {
            order_id: orderId,
            ipid: ipid,
            is_completed: false,
            status: 'pending'
          };
        }
        
      } catch (error) {
        console.error('Error checking FTP approval status:', error);
        return {
          order_id: orderId,
          ipid: ipid,
          is_completed: false,
          status: 'pending'
        };
      }
    });
  }

  async fetchDocumentsByFolder(folderId, page = 1, pageSize = 10) {
    return this.retryRequest(async () => {
      try {
        console.log(`Fetching documents for folder ID: ${folderId}, page: ${page}`);
        
        const response = await this.api.get(
          `/document-management/documents/?folder_id=${folderId}&page=${page}&page_size=${pageSize}`
        );
        
        console.log('Documents data received:', response.data);
        return response.data;
        
      } catch (error) {
        this.handleError(error, 'Fetching documents by folder');
      }
    });
  }

  async fetchDocumentVersions(documentId) {
    return this.retryRequest(async () => {
      try {
        console.log(`Fetching versions for document ID: ${documentId}`);
        
        const response = await this.api.get(`/document-management/documents/${documentId}/versions`);
        
        console.log('Document versions received:', response.data);
        return response.data;
        
      } catch (error) {
        this.handleError(error, 'Fetching document versions');
      }
    });
  }

  async fetchFolders(parentId = 26) {
    return this.retryRequest(async () => {
      try {
        console.log(`Fetching folders for parent ID: ${parentId}`);
        
        const response = await this.api.get(`/document-management/folders/?parent_id=${parentId}`);
        
        console.log('Raw response data:', response.data);
        
        // Get all active folders
        const folders = response.data.filter(folder => folder.is_active);
        console.log('Active folders:', folders);
        
        return folders;
      } catch (error) {
        console.error('Error fetching folders:', error);
        this.handleError(error, 'Fetching folders');
        return []; // Return empty array on error to prevent crashes
      }
    });
  }


  async uploadNewVersion(documentId, file, versionNumber) {
    return this.retryRequest(async () => {
      try {
        console.log(`Uploading new version for document ID: ${documentId}, version: ${versionNumber}`);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('version_number', versionNumber);
        
        const response = await this.api.post(
          `/document-management/documents/${documentId}/versions`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        console.log('New version upload response:', response.data);
        return response.data;
        
      } catch (error) {
        this.handleError(error, 'Uploading new version');
      }
    });
  }

  async deleteDocumentVersion(versionId) {
    return this.retryRequest(async () => {
      try {
        console.log(`Attempting to delete document version ID: ${versionId}`);
        
        const response = await this.api.delete(`/document-management/document-versions/${versionId}`);
        
        console.log('Delete version response:', response.data);
        
        return {
          success: true,
          message: 'Version deleted successfully',
          data: response.data
        };
        
      } catch (error) {
        this.handleError(error, 'Deleting document version');
      }
    });
  }

  async fetchStageInspectionByOperation(orderId, opNo, quantityNo = 1) {
    return this.retryRequest(async () => {
      try {
        console.log(`Fetching stage inspection for Order ID: ${orderId}, Operation: ${opNo}`);
        
        const inspectionDetails = await this.fetchInspectionDetails(orderId);
        const partNumber = inspectionDetails.part_number;
        
        console.log('Part Number:', partNumber);
        
        const response = await this.api.get(
          `/quality/stage-inspection/filter?order_id=${orderId}&quantity_no=${quantityNo}&op_no=${opNo}`
        );
        
        console.log('Stage inspection data received:', response.data);

        if (response.data && response.data.length > 0) {
          const firstRecord = response.data[0];
          const ipid = firstRecord.ipid || `IPID-${partNumber}-${opNo}`;
          
          console.log('Constructed IPID:', ipid);
          
          try {
            const ftpStatus = await this.checkFTPApprovalStatus(orderId, ipid);
            console.log('Raw FTP Status Response:', ftpStatus);
            
            const isCompleted = ftpStatus.is_completed === true;
            console.log('Is Completed:', isCompleted);
            
            response.data = response.data.map(record => ({
              ...record,
              ftp_status: {
                ...ftpStatus,
                is_completed: isCompleted
              }
            }));
            
            console.log('Updated response data with FTP status:', response.data);
          } catch (ftpError) {
            console.error('Error checking FTP status:', ftpError);
          }
        }
        
        return response.data;
        
      } catch (error) {
        let errorMessage = 'An error occurred while fetching stage inspection.';
        if (error.response && error.response.data && error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }

        console.error('Backend error:', errorMessage);
        
        // Optionally throw this to be handled in the UI
        throw new Error(errorMessage);
      }
    });
  }

  // Update FTP status (approve/reject)
  async updateFTPStatus(orderId, ipid, isCompleted) {
    try {
      const response = await this.api.post(`/quality/ftp/${orderId}/${ipid}`, {
        is_completed: isCompleted
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Updating FTP status');
      throw error;
    }
  }

  // Legacy method for backward compatibility
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