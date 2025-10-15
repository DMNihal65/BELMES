import { create } from 'zustand';
import useAuthStore from './auth-store';
import { message } from 'antd';

// Utility function to get token from multiple sources with fallback
const getAuthToken = () => {
  // Try Zustand store first
  const authStore = useAuthStore.getState();
  if (authStore.token) {
    return authStore.token;
  }
  
  // Fallback to localStorage
  const localToken = localStorage.getItem('token');
  if (localToken) {
    return localToken;
  }
  
  // Try parsing auth-storage
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      if (parsed.state?.token) {
        return parsed.state.token;
      }
    }
  } catch (error) {
    console.error('Error parsing auth storage:', error);
  }
  
  return null;
};

// Utility function to handle API requests with retry logic
const makeApiRequest = async (url, options = {}, retries = 3) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers
    },
    timeout: 30000, // 30 second timeout
    ...options
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);
      
      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // Clear invalid token
        useAuthStore.getState().logout();
        throw new Error('Session expired. Please log in again.');
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // Retry on 5xx errors or network issues
        if (response.status >= 500 || response.status === 0) {
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        throw new Error(errorMessage);
      }

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      
      if (attempt === retries) {
        throw error;
      }
      
      // Retry on network errors
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`Network error, retrying in ${delay}ms (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
};

const useDocumentStore = create((set, get) => ({
  folders: [],
  documents: [],
  documentTypes: [],
  currentFolder: null,
  versions: {},
  isLoading: false,
  error: null, 
  partNumbers: [],
  metrics: null,
  isLoadingMetrics: false,
  metricsError: null,
  totalDocuments: 0,
  selectedFolder: null,
  allOrders: [],
  isLoadingOrders: false,
  machines: [],
  isLoadingMachines: false,
  analytics: null,
  isLoadingAnalytics: false,
  analyticsError: null,

  // Fetch document types
  fetchDocTypes: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await makeApiRequest('http://172.19.224.1:8002/api/v1/document-management/document-types/');
      const data = await response.json();
      
      set({ 
        documentTypes: data,
        isLoading: false,
        error: null
      });
      
      return data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch document types';
      set({ error: errorMessage, isLoading: false });
      message.error(errorMessage);
      throw error;
    }
  },

  // List folders with proper tree structure
  fetchFolders: async (parentId = null) => {
    set({ isLoading: true, error: null });
    try {
      const url = parentId 
        ? `http://172.19.224.1:8002/api/v1/document-management/folders/?parent_id=${parentId}`
        : 'http://172.19.224.1:8002/api/v1/document-management/folders/';

      const response = await makeApiRequest(url);
      const data = await response.json();
      
      // Transform the response to match the expected format and filter active folders
      const transformedFolders = data
        .filter(folder => folder.is_active) // Only include active folders
        .map(folder => ({
          id: folder.id,
          folder_name: folder.name,
          parent_folder_id: folder.parent_folder_id,
          is_active: folder.is_active,
          created_at: folder.created_at,
          created_by_id: folder.created_by_id,
          path: folder.path,
          children: []
        }));

      set(state => {
        if (!parentId) {
          return { folders: transformedFolders, isLoading: false, error: null };
        } else {
          const updateFolderChildren = (folders) => {
            return folders.map(folder => {
              if (folder.id === Number(parentId)) {
                return { ...folder, children: transformedFolders };
              }
              if (folder.children?.length > 0) {
                return { ...folder, children: updateFolderChildren(folder.children) };
              }
              return folder;
            });
          };
          
          return { 
            folders: updateFolderChildren(state.folders),
            isLoading: false,
            error: null
          };
        }
      });

      return transformedFolders;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch folders';
      set({ error: errorMessage, isLoading: false });
      message.error(errorMessage);
      return [];
    }
  },

  // Fetch part numbers
  fetchPartNumbers: async () => {
    try {
      const response = await makeApiRequest('http://172.19.224.1:8002/api/v1/planning/all_orders');
      const data = await response.json();
      set({ partNumbers: data, error: null });
      return data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch part numbers';
      set({ error: errorMessage });
      message.error(errorMessage);
      throw error;
    }
  },

  // Upload document
  uploadDocument: async (formData) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Log the FormData contents for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await fetch('http://172.19.224.1:8002/api/v1/document-management/documents/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error response:', errorData);
        throw new Error(errorData.detail || 'Failed to upload document');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Fetch folder documents
  fetchFolderDocuments: async (folderId) => {
    set({ isLoading: true, error: null });
    try {
      if (!folderId) {
        set({ documents: [], totalDocuments: 0, isLoading: false, error: null });
        return { items: [], total: 0 };
      }

      // Fetch all documents for the folder (no pagination)
      const response = await makeApiRequest(
        `http://172.19.224.1:8002/api/v1/document-management/documents/?folder_id=${folderId}`
      );

      const data = await response.json();
      // If the API returns an array, use it directly; if it returns {items: []}, use items
      const items = Array.isArray(data) ? data : (data.items || []);
      // Filter active documents and format them
      const activeDocuments = items.filter(doc => doc.is_active);
      // Format the documents data with error handling for version fetching
      const formattedDocuments = await Promise.all(activeDocuments.map(async doc => {
        try {
          // Fetch versions for each document with retry logic
          const versions = await get().fetchDocumentVersions(doc.id);
          return {
            ...doc,
            key: doc.id,
            versions,
            file_size: doc.latest_version?.file_size 
              ? (doc.latest_version.file_size / (1024 * 1024)).toFixed(2) 
              : null,
            created_at: new Date(doc.created_at).toISOString(),
            version_number: doc.latest_version?.version_number || '1.0'
          };
        } catch (versionError) {
          console.warn(`Failed to fetch versions for document ${doc.id}:`, versionError);
          // Return document without versions if version fetch fails
          return {
            ...doc,
            key: doc.id,
            versions: [],
            file_size: doc.latest_version?.file_size 
              ? (doc.latest_version.file_size / (1024 * 1024)).toFixed(2) 
              : null,
            created_at: new Date(doc.created_at).toISOString(),
            version_number: doc.latest_version?.version_number || '1.0'
          };
        }
      }));

      set({ 
        documents: formattedDocuments,
        totalDocuments: activeDocuments.length,
        isLoading: false,
        error: null
      });

      return { items: formattedDocuments, total: activeDocuments.length };
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch folder documents';
      set({ error: errorMessage, isLoading: false });
      // message.error(errorMessage);
      return { items: [], total: 0 };
    }
  },

  // Create document version
  createVersion: async (documentId, versionData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await makeApiRequest(`/api/v1/documents/${documentId}/versions/`, {
        method: 'POST',
        body: JSON.stringify(versionData),
      });
      const data = await response.json();
      set({ isLoading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to create version';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // List versions
  fetchVersions: async (documentId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await makeApiRequest(`/api/v1/documents/${documentId}/versions`);
      const data = await response.json();
      set(state => ({
        versions: { ...state.versions, [documentId]: data },
        isLoading: false,
        error: null
      }));
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch versions';
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Delete document
  deleteDocument: async (documentId) => {
    set({ isLoading: true, error: null });
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete document');
      }

      set(state => ({
        documents: state.documents.filter(doc => doc.id !== documentId),
        isLoading: false,
        error: null
      }));
      return true;
    } catch (error) {
      console.error('Delete document error:', error);
      const errorMessage = error.message || 'Failed to delete document';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Update folder
  updateFolder: async (folderId, updateData) => {
    try {
      const response = await makeApiRequest(`http://172.19.224.1:8002/api/v1/documents/folders/${folderId}`, {
        method: 'PUT',
        body: JSON.stringify({
          folder_name: updateData.folder_name,
          parent_folder_id: updateData.parent_folder_id,
          is_active: true,
          move_documents: updateData.move_documents
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update folder');
      }

      await get().fetchFolders();
      return true;
    } catch (error) {
      console.error('Update folder error:', error);
      throw error;
    }
  },

  // Create document type
  createDocType: async (docTypeData) => {
    try {
      const response = await makeApiRequest('http://172.19.224.1:8002/api/v1/document-management/document-types/', {
        method: 'POST',
        body: JSON.stringify({
          name: docTypeData.name,
          description: docTypeData.description,
          allowed_extensions: docTypeData.allowed_extensions,
          is_active: docTypeData.is_active
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create document type');
      }

      // Return the created document type
      return data;
    } catch (error) {
      console.error('Create document type error:', error);
      throw error;
    }
  },

  // Search documents by text and other parameters
  searchDocuments: async (query, docTypeId = null, folderId = null) => {
    set({ isLoading: true, error: null });
    try {
      if (!query || query.length < 3) {
        set({ isLoading: false, error: null });
        return { items: [], total: 0 };
      }

      let url = `http://172.19.224.1:8002/api/v1/document-management/documents/search/?query=${encodeURIComponent(query)}`;
      if (docTypeId) url += `&doc_type_id=${docTypeId}`;
      if (folderId) url += `&folder_id=${folderId}`;

      const response = await makeApiRequest(url);
      const data = await response.json();
      
      // Format the documents data similar to fetchFolderDocuments
      const formattedDocuments = await Promise.all(data.map(async doc => {
        try {
          return {
            ...doc,
            key: doc.id,
            file_size: doc.latest_version?.file_size 
              ? (doc.latest_version.file_size / (1024 * 1024)).toFixed(2) 
              : null,
            created_at: new Date(doc.created_at).toISOString(),
            version_number: doc.latest_version?.version_number || '1.0'
          };
        } catch (error) {
          console.warn(`Error formatting document ${doc.id}:`, error);
          return {
            ...doc,
            key: doc.id,
            file_size: null,
            created_at: new Date().toISOString(),
            version_number: '1.0'
          };
        }
      }));

      set({ 
        documents: formattedDocuments,
        totalDocuments: formattedDocuments.length,
        isLoading: false,
        error: null
      });

      return { items: formattedDocuments, total: formattedDocuments.length };
    } catch (error) {
      const errorMessage = error.message || 'Failed to search documents';
      set({ error: errorMessage, isLoading: false });
      return { items: [], total: 0 };
    }
  },

  // Search documents by part number
  searchByPartNumber: async (partNumber, docTypeId = null) => {
    set({ isLoading: true, error: null });
    try {
      if (!partNumber) {
        set({ isLoading: false, error: null });
        return { items: [], total: 0 };
      }

      let url = `http://172.19.224.1:8002/api/v1/document-management/documents/by-part-number/${encodeURIComponent(partNumber)}`;
      if (docTypeId) {
        url += `?doc_type_id=${docTypeId}`;
      }

      const response = await makeApiRequest(url);
      const data = await response.json();
      
      // Format the documents data similar to other document responses
      const formattedDocuments = data.map(doc => ({
        ...doc,
        key: doc.id,
        file_size: doc.latest_version?.file_size 
          ? (doc.latest_version.file_size / (1024 * 1024)).toFixed(2) 
          : null,
        created_at: new Date(doc.created_at).toISOString(),
        version_number: doc.latest_version?.version_number || '1.0'
      }));

      set({ 
        documents: formattedDocuments,
        totalDocuments: formattedDocuments.length,
        isLoading: false,
        error: null
      });

      return { items: formattedDocuments, total: formattedDocuments.length };
    } catch (error) {
      const errorMessage = error.message || 'Failed to search by part number';
      set({ error: errorMessage, isLoading: false });
      return { items: [], total: 0 };
    }
  },

  // Download document version
  downloadDocumentVersion: async (documentId, versionId = null) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Construct URL based on whether versionId is provided
      const url = versionId 
        ? `http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/download?version_id=${versionId}`
        : `http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/download-latest`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to download document version');
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  // Fetch document versions
  fetchDocumentVersions: async (documentId) => {
    try {
      const response = await makeApiRequest(
        `http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/versions`
      );

      const data = await response.json();
      // Filter active versions
      const activeVersions = data.filter(version => version.is_active);
      return activeVersions;
    } catch (error) {
      console.error('Fetch versions error:', error);
      throw error;
    }
  },

  // Add this new method for deleting folders
  deleteFolder: async (folderId) => {
    try {
      const response = await makeApiRequest(`http://172.19.224.1:8002/api/v1/document-management/folders/${folderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete folder');
      }

      // Update the folders list in state
      set(state => ({
        folders: state.folders.filter(folder => folder.id !== folderId)
      }));

      return true;
    } catch (error) {
      console.error('Delete folder error:', error);
      throw error;
    }
  },

  // Add copyDocument method
  copyDocument: async (copyData) => {
    try {
      const response = await makeApiRequest(`http://172.19.224.1:8002/api/v1/documents/${copyData.document_id}/copy`, {
        method: 'POST',
        body: JSON.stringify({
          new_folder_id: copyData.new_folder_id,
          new_document_name: copyData.new_document_name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to copy document');
      }

      return await response.json();
    } catch (error) {
      console.error('Copy document error:', error);
      throw error;
    }
  },

  // Update the uploadNewVersion method to allow custom version numbers
  uploadNewVersion: async (documentId, file, customVersionNumber = null) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // First get existing versions to determine next version number if not provided
      const existingVersions = await get().fetchDocumentVersions(documentId);
      
      // Use custom version number if provided, otherwise calculate next version
      const nextVersionNumber = customVersionNumber || 
        `${Math.max(...existingVersions.map(v => 
          parseFloat(v.version_number.replace('v', ''))
        ), 0) + 1}`;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('version_number', nextVersionNumber);
      
      // Add metadata as JSON string - for CNC programs, include part_number, program_path, and operation_number
      formData.append('metadata', JSON.stringify({
        program_path: file.name
      }));

      const response = await fetch(
        `http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/versions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
          },
          body: formData
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload new version');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload version error:', error);
      throw error;
    }
  },

  updateVersion: async (documentId, versionId, file, metadata = {}) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch(
        `http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/version/${versionId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
          },
          body: formData
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update version');
      }

      const data = await response.json();
      
      // Refresh document versions after successful update
      await get().fetchDocumentVersions(documentId);
      
      // If we're in a folder, refresh the folder documents
      const currentFolderId = get().selectedFolder;
      if (currentFolderId && currentFolderId !== 'all') {
        await get().fetchFolderDocuments(currentFolderId);
      }

      return data;
    } catch (error) {
      console.error('Update version error:', error);
      throw error;
    }
  },

  deleteVersion: async (documentId, versionId) => {
    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/versions/${versionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to delete version');
      }

      return true;
    } catch (error) {
      console.error('Delete version error:', error);
      throw error;
    }
  },

  // Add download tracking
  incrementDownloadCount: async (documentId) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`http://172.19.224.1:8002/api/v1/documents/${documentId}/download-count`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to update download count');
      }

      // Update local state
      set(state => ({
        documents: state.documents.map(doc =>
          doc.id === documentId
            ? { ...doc, download_count: (doc.download_count || 0) + 1 }
            : doc
        )
      }));

    } catch (error) {
      console.error('Failed to increment download count:', error);
    }
  },

  // Update handleDownload to track downloads
  handleDownload: async (documentId, versionId) => {
    try {
      const blob = await get().downloadDocumentVersion(documentId, versionId);
      await get().incrementDownloadCount(documentId);
      return blob;
    } catch (error) {
      throw error;
    }
  },

  // Add view tracking
  incrementViewCount: async (documentId) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`http://172.19.224.1:8002/api/v1/documents/${documentId}/view-count`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to update view count');
      }

      // Update local state
      set(state => ({
        documents: state.documents.map(doc =>
          doc.id === documentId
            ? { ...doc, view_count: (doc.view_count || 0) + 1 }
            : doc
        )
      }));

    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  },

  // Create new folder
  createFolder: async (folderData) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Format the request body according to API requirements
      const requestData = {
        name: folderData.name,  // Make sure this is included
        parent_folder_id: folderData.parent_folder_id || null
      };

      console.log('Creating folder with data:', requestData); // Debug log

      const response = await fetch('http://172.19.224.1:8002/api/v1/document-management/folders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail?.[0]?.msg || 'Failed to create folder');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Create folder error:', error);
      throw error;
    }
  },

  // Add a new function to get preview URL
  getPreviewUrl: async (documentId, versionId = null) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const url = versionId 
        ? `http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/download?version_id=${versionId}`
        : `http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/download-latest`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to get preview URL');
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Preview error:', error);
      throw error;
    }
  },

  // Add this new function for production order search
  searchByProductionOrder: async (productionOrderId, docTypeId = null) => {
    set({ isLoading: true, error: null });
    try {
      if (!productionOrderId) {
        set({ isLoading: false, error: null });
        return { items: [], total: 0 };
      }

      let url = `http://172.19.224.1:8002/api/v1/document-management/documents/by-production-order/${productionOrderId}`;
      if (docTypeId) {
        url += `?doc_type_id=${docTypeId}`;
      }

      const response = await makeApiRequest(url);
      const data = await response.json();
      
      const formattedDocuments = data.map(doc => ({
        ...doc,
        key: doc.id,
        file_size: doc.latest_version?.file_size 
          ? (doc.latest_version.file_size / (1024 * 1024)).toFixed(2) 
          : null,
        created_at: new Date(doc.created_at).toISOString(),
        version_number: doc.latest_version?.version_number || '1.0'
      }));

      set({ 
        documents: formattedDocuments,
        totalDocuments: formattedDocuments.length,
        isLoading: false,
        error: null
      });

      return { items: formattedDocuments, total: formattedDocuments.length };
    } catch (error) {
      const errorMessage = error.message || 'Failed to search by production order';
      set({ error: errorMessage, isLoading: false });
      return { items: [], total: 0 };
    }
  },

  // Add this function to fetch orders
  fetchAllOrders: async () => {
    try {
      const token = getAuthToken();
      set({ isLoadingOrders: true, error: null });

      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch('http://172.19.224.1:8002/api/v1/planning/all_orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      set({ allOrders: data, isLoadingOrders: false, error: null });
      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      set({ isLoadingOrders: false, error: error.message });
      throw error;
    }
  },

  // Add this function to handle version selection for downloads
  handleVersionDownload: async (documentId, versionId) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const url = versionId 
        ? `http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/download?version_id=${versionId}`
        : `http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/download-latest`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${documentId}_${versionId || 'latest'}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      // Track download
      await get().incrementDownloadCount(documentId);

    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  // Update the downloadDocument function to handle batch downloads
  downloadDocument: async (documentId, versionId = null) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // If no versionId is provided, return all versions for selection
      if (!versionId) {
        const versions = await get().fetchDocumentVersions(documentId);
        return {
          success: true,
          versions: versions.map(version => ({
            ...version,
            key: version.id,
            created_at: new Date(version.created_at).toLocaleString(),
            file_size: (version.file_size / (1024 * 1024)).toFixed(2) + ' MB'
          }))
        };
      }

      // Download specific version
      const url = `http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/download?version_id=${versionId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to download document');
      }

      // Get the content-disposition header to extract the filename
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `document_${documentId}_v${versionId}`;
      
      // Extract filename from content-disposition if available
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          // Remove any surrounding quotes
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      // Track download
      await get().incrementDownloadCount(documentId);
      return { success: true, filename };

    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  // Add this new function for uploading machine documents
  uploadMachineDocument: async (formData) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch('http://172.19.224.1:8002/api/v1/document-management/machine-documents/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload machine document');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload machine document error:', error);
      throw error;
    }
  },

  // Add fetchMachines function
  fetchMachines: async () => {
    try {
      const token = getAuthToken();
      set({ isLoadingMachines: true, error: null });
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch('http://172.19.224.1:8002/api/v1/master-order/machines/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to fetch machines');
      }

      const data = await response.json();
      set({ machines: data, isLoadingMachines: false, error: null });
      return data;
    } catch (error) {
      console.error('Error fetching machines:', error);
      set({ isLoadingMachines: false, error: error.message });
      throw error;
    }
  },

  // Add deleteVersion method with the correct endpoint
  deleteDocumentVersion: async (versionId) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/document-versions/${versionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete version');
      }

      return true;
    } catch (error) {
      console.error('Delete version error:', error);
      throw error;
    }
  },

  // Add deleteDocumentType method
  deleteDocumentType: async (docTypeId, force = false) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`http://172.19.224.1:8002/api/v1/document-management/document-types/${docTypeId}?force=${force}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
          throw new Error('Session expired. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete document type');
      }

      // Update document types in state
      set(state => ({
        documentTypes: state.documentTypes.filter(type => type.id !== docTypeId)
      }));

      return true;
    } catch (error) {
      console.error('Delete document type error:', error);
      throw error;
    }
  },

  // Add metrics functions
  fetchMetrics: async () => {
    set({ isLoadingMetrics: true, metricsError: null });
    try {
      const response = await makeApiRequest('http://172.19.224.1:8002/api/v1/document-management/metrics/');
      const data = await response.json();
      set({ metrics: data, isLoadingMetrics: false, metricsError: null });
      return data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch metrics';
      set({ metricsError: errorMessage, isLoadingMetrics: false });
      throw error;
    }
  },

  refreshMetrics: async () => {
    return await get().fetchMetrics();
  },

  // Clear error state
  clearError: () => set({ error: null, metricsError: null }),

  // Set selected folder
  setSelectedFolder: (folderId) => set({ selectedFolder: folderId }),

  // Clear documents
  clearDocuments: () => set({ documents: [], totalDocuments: 0 }),

  fetchAnalytics: async () => {
    set({ isLoadingAnalytics: true, analyticsError: null });
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token found. Please log in again.');
      const response = await fetch('http://172.19.224.1:8002/api/v1/document-management/documents/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      set({ analytics: data, isLoadingAnalytics: false, analyticsError: null });
      return data;
    } catch (error) {
      set({ analyticsError: error.message, isLoadingAnalytics: false });
      throw error;
    }
  },
}));

export default useDocumentStore;


