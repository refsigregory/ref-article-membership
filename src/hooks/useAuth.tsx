import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  subscription?: {
    id: number;
    plan: {
      id: number;
      name: string;
      type: string;
      daily_article_limit: number;
      daily_video_limit: number;
    };
    status: 'active' | 'expired' | 'cancelled';
    start_date: string;
    end_date: string | null;
    articles_read_today: number;
    videos_watched_today: number;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Simple user query - only runs if we have a token
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) return null;

      try {
        const response = await window.api.get('/api/user');
        return response.data;
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
        }
        return null;
      }
    },
    // Only run if we have a token
    enabled: !!localStorage.getItem('token'),
    // Don't retry or refetch automatically
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await window.api.post('/api/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      return user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user);
      toast.success('Successfully logged in!');
    },
    onError: (err: any) => {
      localStorage.removeItem('token');
      queryClient.setQueryData(['user'], null);
      toast.error(err.response?.data?.message || 'Failed to login');
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      const response = await window.api.post('/api/register', { 
        name, 
        email, 
        password, 
        password_confirmation: password 
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      return user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user);
      toast.success('Successfully registered!');
    },
    onError: (err: any) => {
      localStorage.removeItem('token');
      queryClient.setQueryData(['user'], null);
      toast.error(err.response?.data?.message || 'Failed to register');
    }
  });

  // Logout function
  const logout = async () => {
    try {
      if (localStorage.getItem('token')) {
        await window.api.post('/api/logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      queryClient.setQueryData(['user'], null);
      toast.success('Successfully logged out!');
    }
  };

  const value = {
    user: user || null,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login: (email: string, password: string) => loginMutation.mutateAsync({ email, password }),
    register: (name: string, email: string, password: string) => 
      registerMutation.mutateAsync({ name, email, password }),
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 