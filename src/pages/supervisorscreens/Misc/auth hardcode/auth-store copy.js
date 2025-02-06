import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      roles: [
        { id: 1, name: 'operator' },
        { id: 2, name: 'supervisor' }
      ],
      machines: [
        { 
          id: 1, 
          model: "machine name new 1",
          work_center: { code: "WC1" }
        }
      ],
      isLoading: false,
      error: null,

      fetchRoles: async () => {
        // Hardcoded roles, no need to fetch
        return;
      },

      fetchMachines: async () => {
        // Hardcoded machines, no need to fetch
        return;
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          // Hardcoded validation
          if (credentials.role === 'operator') {
            if (credentials.username === 'string' && credentials.password === 'string') {
              const userData = {
                username: credentials.username,
                role: 'operator',
                access: 'granted'
              };

              localStorage.setItem('isAuthenticated', 'true');
              localStorage.setItem('userRole', 'operator');

              set({ 
                token: 'fake-token',
                user: userData,
                isLoading: false,
                error: null
              });

              return { user: userData };
            }
          } else if (credentials.role === 'supervisor') {
            if (credentials.username === 'string' && credentials.password === 'string') {
              const userData = {
                username: credentials.username,
                role: 'supervisor',
                access: 'granted'
              };

              localStorage.setItem('isAuthenticated', 'true');
              localStorage.setItem('userRole', 'supervisor');

              set({ 
                token: 'fake-token',
                user: userData,
                isLoading: false,
                error: null
              });

              return { user: userData };
            }
          }
          throw new Error('Invalid credentials');
        } catch (error) {
          set({ error: error.message, isLoading: false, token: null, user: null });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate successful registration
          set({ isLoading: false, error: null });
          return { message: 'Registration successful' };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ token: null, user: null });
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
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