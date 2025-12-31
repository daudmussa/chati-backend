import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  businessName: string;
  role: 'admin' | 'user';
  enabledFeatures: string[];
  limits: {
    maxConversations: number;
    maxProducts: number;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, businessName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Load user from localStorage on init
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const signup = async (email: string, password: string, businessName: string) => {
    // Mock signup - in production this would call your backend
    // First user is admin, rest are regular users
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      businessName,
      role: users.length === 0 ? 'admin' as const : 'user' as const,
      enabledFeatures: ['conversations', 'store', 'bookings', 'settings', 'billing'],
      limits: {
        maxConversations: 100,
        maxProducts: 50,
      },
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const login = async (email: string, password: string) => {
    // Mock login - in production this would call your backend
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find((u: User) => u.email === email);
    
    if (foundUser) {
      // Ensure enabledFeatures exists for backward compatibility
      if (!foundUser.enabledFeatures) {
        foundUser.enabledFeatures = ['conversations', 'store', 'bookings', 'settings', 'billing'];
      }
      // Ensure limits exist for backward compatibility
      if (!foundUser.limits) {
        foundUser.limits = { maxConversations: 100, maxProducts: 50 };
      }
      localStorage.setItem('user', JSON.stringify(foundUser));
      setUser(foundUser);
    } else {
      // Fallback for existing sessions - create admin user
      const mockUser = {
        id: 'admin-123',
        email,
        businessName: 'Demo Business',
        role: 'admin' as const,
        enabledFeatures: ['conversations', 'store', 'bookings', 'settings', 'billing'],
        limits: {
          maxConversations: 999999,
          maxProducts: 999999,
        },
      };
      const updatedUsers = [mockUser, ...users];
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
