import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      roles: [],
      machines: [],
      isLoading: false,
      error: null,

      fetchRoles: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('http://172.18.7.85:4411/api/v1/auth/roles');
          const data = await response.json();
          set({ roles: data, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      fetchMachines: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('http://172.18.7.85:4411/master-order/all-machines/');
          const data = await response.json();
          // Extracting the "code" from each machine's work_center
          const machinesWithCode = data.map(machine => ({
            ...machine,
            code: machine.work_center.code // Adding the "code" to the machine object
          }));
          set({ machines: machinesWithCode, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const formData = new URLSearchParams({
            grant_type: 'password',
            username: credentials.username,
            password: credentials.password,
            scope: '',
            client_id: 'string',
            client_secret: 'string'
          });

          const response = await fetch('http://172.18.7.85:4411/api/v1/auth/login', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });
          
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.detail?.[0]?.msg || 'Authentication failed');
          }
          
          const userData = {
            username: credentials.username,
            role: credentials.role || data.role,
            access: data.access,
          };

          set({ 
            token: data.access_token,
            user: userData,
            isLoading: false,
            error: null
          });

          localStorage.setItem('token', data.access_token);
          localStorage.setItem('user', JSON.stringify(userData));

          return { ...data, user: userData };
        } catch (error) {
          set({ error: error.message, isLoading: false, token: null, user: null });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('http://172.18.7.85:4411/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userData.email,
              password: userData.password,
              role_id: userData.role_id,
              username: userData.username
            }),
          });
          
          const data = await response.json();
          if (!response.ok) {
            console.error('Registration error:', data); // Log the error response
            throw new Error(data.detail ? data.detail.join(', ') : 'Registration failed');
          }
          
          set({ isLoading: false, error: null });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ token: null, user: null });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

export default useAuthStore; 