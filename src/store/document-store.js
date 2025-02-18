import { create } from 'zustand';
import useAuthStore from './auth-store';
import { message } from 'antd';

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

  // Fetch document types
  fetchDocTypes: async () => {
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://172.18.7.88:7780/api/v1/documents/types/?include_inactive=true', {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch document types');
      }

      const data = await response.json();
      set({ 
        documentTypes: data,  // API returns array directly
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      message.error(error.message);
    }
  },

  // Create new folder
  createFolder: async (folderData) => {
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Ensure parent_folder_id is a number or null
      const requestData = {
        folder_name: folderData.folder_name,
        parent_folder_id: folderData.parent_folder_id ? Number(folderData.parent_folder_id) : null,
        is_active: true
      };

      const response = await fetch('http://172.18.7.88:7780/api/v1/documents/folders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create folder');
      }

      const data = await response.json();
      set(state => ({
        folders: [...state.folders, data]
      }));
      return data;
    } catch (error) {
      console.error('Create folder error:', error);
      throw error;
    }
  },

  // List folders
  fetchFolders: async () => {
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://172.18.7.88:7780/api/v1/documents/folders/', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error('Failed to fetch folders');
      }

      const data = await response.json();
      set({ folders: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      message.error(error.message);
    }
  },

  // Fetch part numbers
  fetchPartNumbers: async () => {
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://172.18.7.88:7780/api/v1/planning/all_orders', {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch part numbers');
      }

      const data = await response.json();
      set({ partNumbers: data });
      return data;
    } catch (error) {
      message.error(error.message);
      throw error;
    }
  },

  // Upload document
  uploadDocument: async (formData) => {
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const uploadFormData = new FormData();
      
      // Append file with the correct field name
      uploadFormData.append('file', formData.file);
      uploadFormData.append('folder_id', formData.folder_id);
      uploadFormData.append('document_name', formData.document_name);
      uploadFormData.append('doc_type_id', formData.doc_type_id);
      uploadFormData.append('part_number_id', formData.part_number_id);
      uploadFormData.append('description', formData.description || '');
      uploadFormData.append('version_number', '1.0');
      uploadFormData.append('metadata', JSON.stringify({}));

      console.log('Sending upload data:', {
        folder_id: formData.folder_id,
        document_name: formData.document_name,
        doc_type_id: formData.doc_type_id,
        part_number_id: formData.part_number_id,
        description: formData.description
      });

      const response = await fetch('http://172.18.7.88:7780/api/v1/documents/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.log('Upload error response:', responseData);
        if (responseData.detail && Array.isArray(responseData.detail)) {
          throw new Error(responseData.detail[0]?.msg || 'Failed to upload document');
        }
        throw new Error(responseData.detail || 'Failed to upload document');
      }

      return responseData;
    } catch (error) {
      console.error('Upload error details:', error);
      throw error;
    }
  },

  // Fetch folder documents
  fetchFolderDocuments: async (folderId) => {
    try {
      const token = useAuthStore.getState().token;
      
      if (!token || !folderId) {
        throw new Error('Invalid request parameters');
      }

      const response = await fetch(`http://172.18.7.88:7780/api/v1/documents/folder/${folderId}/documents?skip=0&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      const documents = data.documents || [];

      // Fetch versions for each document
      const documentsWithVersions = await Promise.all(
        documents.map(async (doc) => {
          try {
            const versions = await get().fetchDocumentVersions(doc.id);
            return { 
              ...doc, 
              versions: versions.sort((a, b) => 
                parseInt(b.version_number) - parseInt(a.version_number)
              ) 
            };
          } catch (error) {
            console.error(`Failed to fetch versions for document ${doc.id}:`, error);
            return doc;
          }
        })
      );

      set({ documents: documentsWithVersions });
      return documentsWithVersions;
    } catch (error) {
      console.error('Fetch documents error:', error);
      throw error;
    }
  },

  // Create document version
  createVersion: async (documentId, versionData) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/v1/documents/${documentId}/versions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // List versions
  fetchVersions: async (documentId) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/v1/documents/${documentId}/versions`);
      const data = await response.json();
      set(state => ({
        versions: { ...state.versions, [documentId]: data },
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Delete document
  deleteDocument: async (documentId) => {
    set({ isLoading: true });
    try {
      await fetch(`/api/v1/documents/${documentId}`, {
        method: 'DELETE',
      });
      set(state => ({
        documents: state.documents.filter(doc => doc.id !== documentId),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Update folder
  updateFolder: async (folderId, updateData) => {
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://172.18.7.88:7780/api/v1/documents/folders/${folderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
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
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Format the request body according to API specification
      const requestBody = {
        type_name: docTypeData.type_name,
        description: docTypeData.description,
        file_extensions: docTypeData.extensions.split(',').map(ext => ext.trim()),
        is_active: docTypeData.is_active
      };

      const response = await fetch('http://172.18.7.88:7780/api/v1/documents/types/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create document type');
      }

      const data = await response.json();
      set(state => ({
        documentTypes: [...state.documentTypes, data],
        isLoading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      message.error(error.message);
      throw error;
    }
  },

  // Search documents by text and other parameters
  searchDocuments: async (searchParams) => {
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const queryParams = new URLSearchParams({
        skip: '0',
        limit: '100',
        ...(searchParams.search_text && { search_text: searchParams.search_text }),
        ...(searchParams.doc_type_id && { doc_type_id: searchParams.doc_type_id }),
        ...(searchParams.folder_id && { folder_id: searchParams.folder_id })
      });

      console.log('Search query params:', queryParams.toString()); // Debug log

      const response = await fetch(`http://172.18.7.88:7780/api/v1/documents/search/?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to search documents');
      }

      const data = await response.json();
      console.log('Search response:', data); // Debug log
      
      // Update the documents in state
      set({ documents: data.documents || [] });
      return data;
    } catch (error) {
      console.error('Search error:', error);
      message.error(error.message);
      throw error;
    }
  },

  // Search documents by part number
  searchByPartNumber: async (partNumber, docTypeId) => {
    try {
      if (partNumber.length < 3) {
        throw new Error('Please enter at least 3 characters for part number search');
      }

      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const queryParams = new URLSearchParams({
        part_number: partNumber,
        ...(docTypeId && { doc_type_id: docTypeId })
      });

      console.log('Part number search params:', queryParams.toString()); // Debug log

      const response = await fetch(`http://172.18.7.88:7780/api/v1/documents/by-part-number/?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to search documents by part number');
      }

      const data = await response.json();
      console.log('Part number search response:', data); // Debug log

      // Make sure we're setting the documents array correctly
      if (data && data.documents) {
        set({ documents: data.documents });
      } else if (Array.isArray(data)) {
        set({ documents: data });
      } else {
        set({ documents: [] });
      }
      
      return data;
    } catch (error) {
      console.error('Part number search error:', error);
      message.error(error.message);
      throw error;
    }
  },

  // Download document version
  downloadDocumentVersion: async (documentId, versionId) => {
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://172.18.7.88:7780/api/v1/documents/${documentId}/download/${versionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
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
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://172.18.7.88:7780/api/v1/documents/${documentId}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch document versions');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Fetch versions error:', error);
      throw error;
    }
  },

  // Add this new method for deleting folders
  deleteFolder: async (folderId) => {
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Making DELETE request to:', `http://172.18.7.88:7780/api/v1/documents/folders/${folderId}`);
      
      const response = await fetch(`http://172.18.7.88:7780/api/v1/documents/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      console.log('Delete response:', {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete error response:', errorData);
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
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://172.18.7.88:7780/api/v1/documents/${copyData.document_id}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
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

  // Update the uploadNewVersion method
  uploadNewVersion: async (documentId, file) => {
    try {
      const token = useAuthStore.getState().token;
      const formData = new FormData();
      
      // Add required fields to formData
      formData.append('file', file);
      
      // Get the latest version number and increment it
      const versions = await get().fetchDocumentVersions(documentId);
      const latestVersion = versions.length > 0 
        ? Math.max(...versions.map(v => parseInt(v.version_number))) 
        : 0;
      const newVersionNumber = (latestVersion + 1).toString();
      
      formData.append('version_number', newVersionNumber);
      formData.append('metadata', '{}');

      console.log('Making POST request to:', `http://172.18.7.88:7780/api/v1/documents/${documentId}/versions/`);
      
      const response = await fetch(`http://172.18.7.88:7780/api/v1/documents/${documentId}/versions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload new version');
      }

      const data = await response.json();
      console.log('Upload response:', data);
      return data;
    } catch (error) {
      console.error('Upload version error:', error);
      throw error;
    }
  },

  updateVersion: async (documentId, versionId, file, currentVersionNumber) => {
    try {
      const token = useAuthStore.getState().token;
      const formData = new FormData();
      
      formData.append('file', file);
      formData.append('version_number', currentVersionNumber);
      formData.append('metadata', '{}');

      console.log('Making PUT request to:', `http://172.18.7.88:7780/api/v1/documents/${documentId}/versions/${versionId}/file`);

      const response = await fetch(`http://172.18.7.88:7780/api/v1/documents/${documentId}/versions/${versionId}/file`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update version');
      }

      const data = await response.json();
      console.log('Update version response:', data);

      // Get the current folder ID from state
      const currentFolderId = get().selectedFolder;
      
      // Wait for both operations to complete
      if (currentFolderId && currentFolderId !== 'all') {
        // First fetch the latest document versions
        const updatedVersions = await get().fetchDocumentVersions(documentId);
        
        // Then fetch and update the folder documents
        const folderDocs = await get().fetchFolderDocuments(currentFolderId);
        
        // Update the specific document's versions in the state
        set(state => ({
          documents: state.documents.map(doc => 
            doc.id === documentId ? { ...doc, versions: updatedVersions } : doc
          )
        }));
      }

      return data;
    } catch (error) {
      console.error('Update version error:', error);
      throw error;
    }
  },

  deleteVersion: async (documentId, versionId) => {
    try {
      const token = useAuthStore.getState().token;

      const response = await fetch(`http://172.18.7.88:7780/api/v1/documents/${documentId}/versions/${versionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
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
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://172.18.7.88:7780/api/v1/documents/${documentId}/download-count`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
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
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://172.18.7.88:7780/api/v1/documents/${documentId}/view-count`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
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

  // Update handlePreview to track views
  handlePreview: async (documentId) => {
    try {
      await get().incrementViewCount(documentId);
      // Your existing preview logic...
    } catch (error) {
      throw error;
    }
  },

  // Add fetchMetrics function
  fetchMetrics: async () => {
    set({ isLoadingMetrics: true });
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://172.18.7.88:7780/api/v1/documents/analytics/metrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch metrics');
      }

      const data = await response.json();
      set({ 
        metrics: data,
        isLoadingMetrics: false,
        metricsError: null
      });
      return data;
    } catch (error) {
      console.error('Metrics fetch error:', error);
      set({ 
        metricsError: error.message,
        isLoadingMetrics: false 
      });
      throw error;
    }
  },

  // Add refresh metrics function
  refreshMetrics: async () => {
    try {
      await get().fetchMetrics();
    } catch (error) {
      message.error('Failed to refresh metrics');
    }
  },
}));

export default useDocumentStore;