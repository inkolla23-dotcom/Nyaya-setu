import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'client' | 'advocate' | 'verification_officer' | 'super_admin';
  phone?: string;
  languagePreference?: string;
  state?: string;
  district?: string;
  city?: string;
  advocateDetails?: {
    id: number;
    bar_registration: string;
    specialization_id: number | null;
    experience_years: number;
    languages: string;
    biography: string;
    consultation_fee: number;
    location: string;
    rating: number;
    profile_photo: string;
    availability: string;
    is_verified?: number;
    verification_status?: string;
    state?: string;
    district?: string;
    city?: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  demoMode: boolean;
  isLoaded: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (formData: any) => Promise<any>;
  enterDemoMode: (role: 'client' | 'advocate' | 'verification_officer' | 'super_admin') => void;
  logout: () => void;
  switchDemoRole: () => void;
  updateAdvocateDetails: (details: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Users for Demo Mode
const mockClientUser: User = {
  id: 1, // Ramesh Kumar's ID in seeded db
  name: "Ramesh Kumar",
  email: "ramesh@example.com",
  role: "client",
  phone: "9876543210",
  languagePreference: "hi"
};

const mockAdvocateUser: User = {
  id: 6, // Adv. Aditi Sharma's user_id in seeded db
  name: "Adv. Aditi Sharma",
  email: "aditi@example.com",
  role: "advocate",
  phone: "9999888877",
  languagePreference: "hi",
  advocateDetails: {
    id: 1, // advocate table ID in seeded db
    bar_registration: "BAR/DEL/2012/987",
    specialization_id: 1, // Family Law
    experience_years: 12,
    languages: "English, Hindi",
    biography: "Experienced Family Advocate dedicated to handling divorce, child custody, and legal inheritance disputes with compassion and rigor.",
    consultation_fee: 1500,
    location: "New Delhi",
    rating: 4.8,
    profile_photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    availability: "Available Tomorrow"
  }
};

const mockVerificationOfficerUser: User = {
  id: 99,
  name: "Officer Dhivija (Demo)",
  email: "ndhivija3@gmail.com",
  role: "verification_officer",
  phone: "9876543211",
  languagePreference: "en"
};

const mockSuperAdminUser: User = {
  id: 100,
  name: "System Super Admin (Demo)",
  email: "admin@nyayasetu.in",
  role: "super_admin",
  phone: "9999922222",
  languagePreference: "en"
};

const API_URL = '/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const demoMode = false;
  const setDemoMode = (val: boolean) => {};
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    async function initAuth() {
      const savedToken = localStorage.getItem('nyaya_setu_token');
      const savedDemo = localStorage.getItem('nyaya_setu_demo');
      const savedDemoRole = localStorage.getItem('nyaya_setu_demo_role');

      if (savedDemo === 'true') {
        setDemoMode(true);
        let demoUser = mockClientUser;
        if (savedDemoRole === 'advocate') demoUser = mockAdvocateUser;
        else if (savedDemoRole === 'verification_officer') demoUser = mockVerificationOfficerUser;
        else if (savedDemoRole === 'super_admin') demoUser = mockSuperAdminUser;
        
        setUser(demoUser);
        setToken('demo_token_' + (savedDemoRole || 'client'));
        setIsLoaded(true);
      } else if (savedToken) {
        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setToken(savedToken);
            setUser(data.user);
          } else {
            // clear invalid token
            localStorage.removeItem('nyaya_setu_token');
          }
        } catch (error) {
          console.warn('Backend server offline, switching to demo mode fallback implicitly.');
          // Auto fall back to demo mode if backend is offline to keep UI alive
          setDemoMode(true);
          setUser(mockClientUser);
          setToken('demo_token_client');
          localStorage.setItem('nyaya_setu_demo', 'true');
          localStorage.setItem('nyaya_setu_demo_role', 'client');
          localStorage.setItem('nyaya_setu_token', 'demo_token_client');
        } finally {
          setIsLoaded(true);
        }
      } else {
        setIsLoaded(true);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const isOfficer = email === 'ndhivija3@gmail.com' || email === 'verification@nyayasetu.in';
      const endpoint = isOfficer ? `${API_URL}/verification/login` : `${API_URL}/auth/login`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const contentType = response.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Invalid server response (non-JSON): ${text.substring(0, 80)}...`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setToken(data.token);
      setUser(data.user);
      setDemoMode(false);
      localStorage.setItem('nyaya_setu_token', data.token);
      localStorage.removeItem('nyaya_setu_demo');
      localStorage.removeItem('nyaya_setu_demo_role');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const register = async (formData: any) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const contentType = response.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Invalid server response (non-JSON): ${text.substring(0, 80)}...`);
      }

      if (!response.ok) {
        const errMessage = data.sqlMessage || data.details || data.error || 'Registration failed';
        throw new Error(errMessage);
      }
      if (formData.role === 'advocate') {
        return data; // Return data for success screen redirect, bypass auto log in
      }

      setToken(data.token);
      setUser(data.user);
      setDemoMode(false);
      localStorage.setItem('nyaya_setu_token', data.token);
      localStorage.removeItem('nyaya_setu_demo');
      localStorage.removeItem('nyaya_setu_demo_role');
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const enterDemoMode = (role: 'client' | 'advocate' | 'verification_officer' | 'super_admin') => {
    setDemoMode(true);
    let mockUser = mockClientUser;
    if (role === 'advocate') mockUser = mockAdvocateUser;
    else if (role === 'verification_officer') mockUser = mockVerificationOfficerUser;
    else if (role === 'super_admin') mockUser = mockSuperAdminUser;
    
    setUser(mockUser);
    const mockToken = 'demo_token_' + role;
    setToken(mockToken);
    localStorage.setItem('nyaya_setu_demo', 'true');
    localStorage.setItem('nyaya_setu_demo_role', role);
    localStorage.setItem('nyaya_setu_token', mockToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setDemoMode(false);
    localStorage.removeItem('nyaya_setu_token');
    localStorage.removeItem('nyaya_setu_demo');
    localStorage.removeItem('nyaya_setu_demo_role');
    window.history.pushState({}, '', '/');
  };

  const switchDemoRole = () => {
    if (!demoMode) return;
    let nextRole: 'client' | 'advocate' | 'verification_officer' | 'super_admin' = 'client';
    if (user?.role === 'client') nextRole = 'advocate';
    else if (user?.role === 'advocate') nextRole = 'verification_officer';
    else if (user?.role === 'verification_officer') nextRole = 'super_admin';
    else nextRole = 'client';

    let mockUser = mockClientUser;
    if (nextRole === 'advocate') mockUser = mockAdvocateUser;
    else if (nextRole === 'verification_officer') mockUser = mockVerificationOfficerUser;
    else if (nextRole === 'super_admin') mockUser = mockSuperAdminUser;

    setUser(mockUser);
    const mockToken = 'demo_token_' + nextRole;
    setToken(mockToken);
    localStorage.setItem('nyaya_setu_demo_role', nextRole);
    localStorage.setItem('nyaya_setu_token', mockToken);
  };

  const updateAdvocateDetails = (details: any) => {
    setUser(prev => prev ? { ...prev, advocateDetails: details } : null);
  };

  return (
    <AuthContext.Provider value={{ user, token, demoMode, isLoaded, login, register, enterDemoMode, logout, switchDemoRole, updateAdvocateDetails }}>
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
