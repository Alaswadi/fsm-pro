import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User, LoginCredentials } from '../types';
import apiService from '../services/api';
import toast from 'react-hot-toast';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        try {
          // Clear any existing auth state first
          localStorage.removeItem('fsm_token');
          set({
            isLoading: true,
            isAuthenticated: false,
            user: null,
            token: null
          });

          const response = await apiService.login(credentials);
          
          if (response.success && response.data) {
            const { user, token } = response.data;
            
            // Store token in localStorage
            localStorage.setItem('fsm_token', token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            
            toast.success('Login successful!');
            return true;
          } else {
            set({ isLoading: false });
            return false;
          }
        } catch (error: any) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('fsm_token');
        localStorage.removeItem('fsm_user');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        
        toast.success('Logged out successfully');
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('fsm_token');
          
          if (!token) {
            set({ isAuthenticated: false, isLoading: false });
            return;
          }

          set({ isLoading: true });
          
          const response = await apiService.getProfile();
          
          if (response.success && response.data) {
            set({
              user: response.data,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Invalid token
            localStorage.removeItem('fsm_token');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Auth check error:', error);
          localStorage.removeItem('fsm_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'fsm-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
