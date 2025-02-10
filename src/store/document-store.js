
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

  // Fetch document types
  fetchDocTypes: async () => {
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://172.18.7.85:4723/api/v1/documents/types/?include_inactive=true', {
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
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://172.18.7.85:4723/api/v1/documents/folders/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`  // Make sure token format matches backend expectation
        },
        body: JSON.stringify({
          folder_name: folderData.name,
          parent_folder_id: folderData.parent_id || 0,
          is_active: true
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error('Failed to create folder');
      }

      const data = await response.json();
      set(state => ({
        folders: [...state.folders, {
          id: data.id,
          name: data.folder_name,
          parent_id: data.parent_folder_id,
          path: data.folder_path,
          created_at: data.created_at,
          is_active: data.is_active
        }],
        isLoading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      message.error(error.message); // Show error to user
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

      const response = await fetch('http://172.18.7.85:4723/api/v1/documents/folders/', {
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

  // Upload document
  uploadDocument: async (formData) => {
    set({ isLoading: true });
    try {
      const response = await fetch('http://172.18.7.85:4723/api/v1/documents/upload/', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      set(state => ({
        documents: [...state.documents, data],
        isLoading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Fetch folder documents
  fetchFolderDocuments: async (folderId) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/v1/documents/folder/${folderId}/documents`);
      const data = await response.json();
      set({ documents: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
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
  updateFolder: async (folderId, folderData) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/v1/documents/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData),
      });
      const data = await response.json();
      set(state => ({
        folders: state.folders.map(folder => 
          folder.id === folderId ? data : folder
        ),
        isLoading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
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

      const response = await fetch('http://172.18.7.85:4723/api/v1/documents/types/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
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
      throw error;
    }
  },
}));

export default useDocumentStore; 