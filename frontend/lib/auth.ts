import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authAPI } from './api';

export const useAuth = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const validateSession = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        await authAPI.me();
        if (mounted) {
          setIsAuthenticated(true);
        }
      } catch {
        localStorage.removeItem('authToken');
        if (mounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    validateSession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({
        email: String(email || '').trim().toLowerCase(),
        password,
      });
      const token = response?.data?.access_token || response?.data?.token;
      if (!token) {
        throw new Error('Authentication token missing in login response');
      }
      localStorage.setItem('authToken', token);
      setIsAuthenticated(true);
      router.push('/admin/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};
