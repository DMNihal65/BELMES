import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null, // 'SUPERVISOR' | 'OPERATOR' | null
      isAuthenticated: false,

      login: (userData) => set({
        user: userData.user,
        token: userData.token,
        role: userData.role,
        isAuthenticated: true,
      }),

      logout: () => set({
        user: null,
        token: null,
        role: null,
        isAuthenticated: false,
      }), 
    }),
    {
      name: 'auth-storage',
    }
  )
)

export default useAuthStore 