import { create } from 'zustand';
import useAuthStore from './auth-store';

// If the above path doesn't work, you can alternatively import from the auth store:
// import useAuthStore from './auth-store';

const useHelpSupportStore = create((set) => ({
  // Document states
  machineDocuments: [],
  loading: false,
  error: null,

  // Machine states
  machines: [],
  machinesLoading: false,
  machinesError: null,

  // Fetch machines function
  fetchMachines: async () => {
    set({ machinesLoading: true, machinesError: null });
    try {
      const token = useAuthStore.getState().token;
      
      const response = await fetch(
        'http://172.19.224.1:8002/api/v1/master-order/machines/',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch machines');
      }

      const data = await response.json();
      set({ machines: data, machinesLoading: false });
    } catch (error) {
      set({ machinesError: error.message, machinesLoading: false, machines: [] });
    }
  },

  // Fetch machine documents function
  fetchMachineDocuments: async (machineId) => {
    if (!machineId) return;
    
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      
      const response = await fetch(
        `http://172.19.224.1:8002/api/v1/document-management/machine-documents/${machineId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch machine documents');
      }

      const data = await response.json();
      set({ machineDocuments: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false, machineDocuments: [] });
    }
  },

  // Download document function
  downloadDocument: async (minioPath, token) => {
    try {
      const response = await fetch(
        `http://172.19.224.1:8002/api/v1/document-management/documents/download/?path=${encodeURIComponent(minioPath)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  },

  // Download latest document version by document ID
  downloadLatestDocument: async (documentId, token) => {
    try {
      console.log(`Downloading latest version of document ID: ${documentId}`);
      const response = await fetch(
        `http://172.19.224.1:8002/api/v1/document-management/documents/${documentId}/download-latest`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to download document ID: ${documentId}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      return true;
    } catch (error) {
      console.error('Error downloading latest document:', error);
      return false;
    }
  },

  // Clear functions
  clearMachines: () => {
    set({ machines: [], machinesLoading: false, machinesError: null });
  },

  clearDocuments: () => {
    set({ machineDocuments: [], loading: false, error: null });
  }
}));

export default useHelpSupportStore; 