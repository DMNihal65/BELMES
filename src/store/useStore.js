import { create } from 'zustand'

const useStore = create((set) => ({
  // User state
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  },
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
  
  // Theme state
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  // Sidebar state
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}))

export default useStore 