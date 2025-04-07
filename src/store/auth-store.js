import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      roles: [],
      machines: [],
      currentMachine: null,
      isLoading: false,
      error: null,

      fetchRoles: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('http://172.18.7.85:6998/api/v1/auth/roles');
          const data = await response.json();
          set({ roles: data, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      fetchMachines: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('http://172.18.7.85:6998/api/v1/master-order/all-machines/');
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
          let response;
          let data;

          if (credentials.role === 'operator') {
            // Use machine login endpoint for operators
            response = await fetch('http://172.18.7.85:6998/api/v1/auth/machine-login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                machine_id: credentials.machineId,
                machine_password: credentials.machinePassword,
                username: credentials.username,
                password: credentials.password
              }),
            });

            data = await response.json();
            if (!response.ok) {
              throw new Error(data.detail?.[0]?.msg || 'Authentication failed');
            }

            // Store machine details from the response
            const userData = {
              username: credentials.username,
              role: data.role,
              access: data.access_list,
            };

            set({ 
              token: data.access_token,
              user: userData,
              currentMachine: data.machine, // Store the machine details
              isLoading: false,
              error: null
            });

            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('currentMachine', JSON.stringify(data.machine));

            return { ...data, user: userData };
          } else {
            // Existing supervisor login logic
            const formData = new URLSearchParams({
              grant_type: 'password',
              username: credentials.username,
              password: credentials.password,
              scope: '',
              client_id: 'string',
              client_secret: 'string'
            });

            response = await fetch('http://172.18.7.85:6998/api/v1/auth/login', {
              method: 'POST',
              headers: {
                'accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData.toString(),
            });
            
            data = await response.json();
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
          }
        } catch (error) {
          set({ error: error.message, isLoading: false, token: null, user: null, currentMachine: null });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('currentMachine');
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('http://172.18.7.85:6998/api/v1/auth/register', {
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
        set({ token: null, user: null, currentMachine: null });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('currentMachine');
      },

      clearError: () => set({ error: null }),

      setCurrentMachine: (machine) => set({ currentMachine: machine }),
      clearCurrentMachine: () => set({ currentMachine: null }),
    }),
    
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

export default useAuthStore; 