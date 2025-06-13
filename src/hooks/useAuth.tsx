import React, { createContext, useContext, useState, useEffect } from 'react';
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
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const response = await window.api.get('/api/user');
        return response.data;
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          return null;
        }
        throw err;
      }
    },
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await window.api.post('/api/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Successfully logged in!');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to login';
      setError(message);
      toast.error(message);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      const response = await window.api.post('/api/register', { name, email, password, password_confirmation: password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Successfully registered!');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to register';
      setError(message);
      toast.error(message);
    },
  });

  const login = async (email: string, password: string) => {
    setError(null);
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (name: string, email: string, password: string) => {
    setError(null);
    await registerMutation.mutateAsync({ name, email, password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    queryClient.setQueryData(['user'], null);
    toast.success('Successfully logged out!');
  };

  const clearError = () => setError(null);

  const value = {
    user: user || null,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
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

export function useInitializeAuth() {
  const { user, isLoading } = useAuth();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token && !user && !isLoading) {
      // If we have a token but no user data, try to fetch user data
      window.api.get('/api/user').catch(() => {
        // If the token is invalid, clear it
        localStorage.removeItem('token');
      });
    }
  }, [token, user, isLoading]);
} 