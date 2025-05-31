import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState } from '../types';
import { login, logout, checkAuth } from '../services/authService';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session) {
            setAuthState({
              isAuthenticated: true,
              user: session.user,
              token: session.access_token,
            });
          } else {
            setAuthState({
              isAuthenticated: false,
              user: null,
              token: null,
            });
          }
          setIsLoading(false);
        }
      );

      // Initial session check
      const authData = await checkAuth();
      if (authData.token) {
        setAuthState({
          isAuthenticated: true,
          user: authData.user,
          token: authData.token,
        });
      }
      setIsLoading(false);

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    };

    initAuth();
  }, []);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        setAuthState({
          isAuthenticated: true,
          user: result.user,
          token: result.token,
        });
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };

  const handleLogout = async () => {
    await logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login: handleLogin,
        logout: handleLogout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};