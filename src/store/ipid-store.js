import { create } from 'zustand';
import useAuthStore from './auth-store';

const useIpidStore = create((set, get) => ({
  isLoading: false,
  error: null,
  uploadedIpids: [],

  uploadIpidDocument: async (file, documentName, description, orderNumber, operationNumber) => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_name', documentName);
      formData.append('description', description);
      formData.append('production_order', orderNumber);
      formData.append('operation_number', operationNumber);
      formData.append('version_number', 'v1');
      formData.append('metadata', JSON.stringify({}));

      const response = await fetch('http://172.19.224.1:8002/api/v1/documents/ipid/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload IPID document');
      }

      const data = await response.json();
      set(state => ({
        uploadedIpids: [...state.uploadedIpids, data],
        isLoading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  }
}));

export default useIpidStore;