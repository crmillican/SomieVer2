import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Define user type
export interface User {
  id: number;
  username: string;
  email?: string;
  userType: string;
  [key: string]: any; // For any other properties
}

// Context type
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  register: (username: string, password: string, email: string, userType: string) => Promise<User>;
  isAuthenticated: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  login: async () => { throw new Error('AuthContext not initialized'); },
  logout: () => {},
  register: async () => { throw new Error('AuthContext not initialized'); },
  isAuthenticated: false,
});

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check local storage for existing auth data on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUserId = localStorage.getItem('userId');
    const storedUserType = localStorage.getItem('userType');
    
    if (storedToken && storedUserId) {
      console.log('Found stored auth token and userId');
      setToken(storedToken);
      
      // Create a minimal user object from stored data
      // We'll fetch full user data in the effect below
      setUser({
        id: parseInt(storedUserId, 10),
        username: 'loading...',
        userType: storedUserType || 'user',
      });
    }
    
    setIsLoading(false);
  }, []);

  // Fetch user data when token changes
  useEffect(() => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    
    axios.get('/api/user', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => {
      setUser(response.data);
      // Update token if a new one was returned
      if (response.data.authToken) {
        setToken(response.data.authToken);
        localStorage.setItem('authToken', response.data.authToken);
      }
      setError(null);
    })
    .catch(err => {
      console.error('Failed to fetch user data:', err);
      // If we get a 401, clear auth data
      if (err.response?.status === 401) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userType');
      }
      setError(err);
    })
    .finally(() => {
      setIsLoading(false);
    });
  }, [token]);

  // Login function
  const login = useCallback(async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      const userData = response.data;
      
      setUser(userData);
      setToken(userData.authToken);
      
      // Store auth data in localStorage
      localStorage.setItem('authToken', userData.authToken);
      localStorage.setItem('userId', userData.id.toString());
      localStorage.setItem('userType', userData.userType);
      
      return userData;
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err : new Error('Login failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    axios.post('/api/auth/logout')
      .catch(err => console.error('Logout API call failed:', err))
      .finally(() => {
        // Always clear local state even if API call fails
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userType');
      });
  }, []);

  // Register function
  const register = useCallback(async (username: string, password: string, email: string, userType: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/register', { username, password, email, userType });
      const userData = response.data;
      
      setUser(userData);
      setToken(userData.authToken);
      
      // Store auth data in localStorage
      localStorage.setItem('authToken', userData.authToken);
      localStorage.setItem('userId', userData.id.toString());
      localStorage.setItem('userType', userData.userType);
      
      return userData;
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err instanceof Error ? err : new Error('Registration failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    error,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);