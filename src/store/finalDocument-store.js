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
  totalDocuments: 0,
  selectedFolder: null,

  // Fetch document types
  fetchDocTypes: async () => {
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://172.18.7.89:4470/api/v1/document-management/document-types/', {
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
        documentTypes: data,
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      message.error(error.message);
    }
  },

  // List folders with proper tree structure
  fetchFolders: async (parentId = null) => {
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = parentId 
        ? `http://172.18.7.89:4470/api/v1/document-management/folders/?parent_id=${parentId}`
        : 'http://172.18.7.89:4470/api/v1/document-management/folders/';

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }

      const data = await response.json();
      
      // Transform the response to match the expected format
      const transformedFolders = data.map(folder => ({
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
          return { folders: transformedFolders, isLoading: false };
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
            isLoading: false 
          };
        }
      });

      return transformedFolders;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      message.error(error.message);
      return [];
    }
  },

  // Fetch part numbers
  fetchPartNumbers: async () => {
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://172.18.7.89:4470/planning/all_orders', {
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

      // Log the FormData contents for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await fetch('http://172.18.7.89:4470/api/v1/document-management/documents/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error response:', errorData); // Debug log
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
  fetchFolderDocuments: async (folderId, page = 1, pageSize = 10) => {
    try {
      const token = useAuthStore.getState().token;
      
      if (!token || !folderId) {
        throw new Error('Invalid request parameters');
      }

      const response = await fetch(
        `http://172.18.7.89:4470/api/v1/document-management/documents/?folder_id=${folderId}&page=${page}&page_size=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      
      // Format the documents data
      const formattedDocuments = await Promise.all(data.items.map(async doc => {
        // Fetch versions for each document
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
      }));

      set({ 
        documents: formattedDocuments,
        totalDocuments: data.total,
        isLoading: false
      });

      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      message.error(error.message);
      return { items: [], total: 0 };
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

      const response = await fetch(`http://172.18.7.85:6639/api/v1/documents/folders/${folderId}`, {
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

      // Format the request body according to new API specification
      const requestBody = {
        name: docTypeData.type_name,
        description: docTypeData.description,
        allowed_extensions: docTypeData.extensions.split(',').map(ext => ext.trim())
      };

      const response = await fetch('http://172.18.7.89:4470/api/v1/document-management/document-types/', {
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

      const response = await fetch(`http://172.18.7.85:6639/api/v1/documents/search/?${queryParams}`, {
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

      const response = await fetch(`http://172.18.7.85:6639/api/v1/documents/by-part-number/?${queryParams}`, {
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
  downloadDocumentVersion: async (documentId, versionId = null) => {
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Construct URL based on whether versionId is provided
      const url = versionId 
        ? `http://172.18.7.89:4470/api/v1/document-management/documents/${documentId}/download?version_id=${versionId}`
        : `http://172.18.7.89:4470/api/v1/document-management/documents/${documentId}/download-latest`;

      const response = await fetch(url, {
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

      const response = await fetch(
        `http://172.18.7.89:4470/api/v1/document-management/documents/${documentId}/versions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
          }
        }
      );

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

      console.log('Making DELETE request to:', `http://172.18.7.85:6639/api/v1/documents/folders/${folderId}`);
      
      const response = await fetch(`http://172.18.7.85:6639/api/v1/documents/folders/${folderId}`, {
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

      const response = await fetch(`http://172.18.7.85:6639/api/v1/documents/${copyData.document_id}/copy`, {
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
  uploadNewVersion: async (documentId, file, versionNumber) => {
    try {
      const token = useAuthStore.getState().token;
      const formData = new FormData();
      
      formData.append('file', file);
      formData.append('version_number', versionNumber || 'v2');
      formData.append('metadata', '{}');

      const response = await fetch(
        `http://172.18.7.89:4470/api/v1/document-management/documents/${documentId}/versions`,
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
      const token = useAuthStore.getState().token;
      const formData = new FormData();
      
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch(
        `http://172.18.7.89:4470/api/v1/document-management/documents/${documentId}/version/${versionId}`,
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
      const token = useAuthStore.getState().token;

      const response = await fetch(`http://172.18.7.85:6639/api/v1/documents/${documentId}/versions/${versionId}`, {
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

      const response = await fetch(`http://172.18.7.85:6639/api/v1/documents/${documentId}/download-count`, {
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

      const response = await fetch(`http://172.18.7.85:6639/api/v1/documents/${documentId}/view-count`, {
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

  // Create new folder
  createFolder: async (folderData) => {
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Format the request body according to API requirements
      const requestData = {
        name: folderData.name,  // Make sure this is included
        parent_folder_id: folderData.parent_folder_id || null
      };

      console.log('Creating folder with data:', requestData); // Debug log

      const response = await fetch('http://172.18.7.89:4470/api/v1/document-management/folders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
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
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = versionId 
        ? `http://172.18.7.89:4470/api/v1/document-management/documents/${documentId}/download?version_id=${versionId}`
        : `http://172.18.7.89:4470/api/v1/document-management/documents/${documentId}/download-latest`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get preview URL');
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Preview error:', error);
      throw error;
    }
  }
}));

export default useDocumentStore;