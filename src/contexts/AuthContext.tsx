import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/services/api';
import api from '@/services/api';
import { toast } from 'sonner';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'player' | 'organizer' | 'admin';
  skillLevel?: number;
  phone?: string;
  avatar?: string;
  bio?: string;
  location?: {
    city?: string;
    state?: string;
  };
  preferences?: {
    playingDays?: string[];
    partnerPreference?: 'looking' | 'have-partner' | 'either';
    preferredSide?: string;
    primaryPaddle?: string;
    availability?: string[];
  };
  statistics?: {
    matchesPlayed: number;
    matchesWon: number;
    tournamentsPlayed: number;
    goldMedals: number;
    silverMedals: number;
    bronzeMedals: number;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    skillLevel?: number;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  setAuthData: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Verify token is still valid
        try {
          const response = await authAPI.getMe();
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { user: userData, token: userToken } = response.data;

      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      toast.success('Login successful!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      throw error;
    }
  };

  const loginWithGoogle = async (access_token: string) => {
    try {
      const response = await api.post('/auth/google', { access_token });
      const { user: userData, token: userToken } = response.data.data;

      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      toast.success('Signed in with Google!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Google sign-in failed. Please try again.';
      toast.error(message);
      throw error;
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    skillLevel?: number;
    phone?: string;
  }) => {
    try {
      const response = await authAPI.register(data);
      const { user: userData, token: userToken } = response.data;

      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      toast.success('Registration successful!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const setAuthData = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser,
    setAuthData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
