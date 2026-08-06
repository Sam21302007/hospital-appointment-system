import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, checkBackendStatus } from '../api/apiClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const isOnline = await checkBackendStatus();
      setDbConnected(isOnline);

      const currentUser = await apiClient.getProfile();
      if (currentUser) {
        setUser(currentUser);
        setProfile(currentUser);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const signUp = async (email, password, profileData) => {
    try {
      const data = await apiClient.register(email, password, profileData);
      setUser(data.user);
      setProfile(data.user);
      // Re-verify connection to update banner
      const isOnline = await checkBackendStatus();
      setDbConnected(isOnline);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const signIn = async (email, password) => {
    try {
      const data = await apiClient.login(email, password);
      setUser(data.user);
      setProfile(data.user);
      // Re-verify connection to update banner
      const isOnline = await checkBackendStatus();
      setDbConnected(isOnline);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const signOut = async () => {
    apiClient.logout();
    setUser(null);
    setProfile(null);
  };

  // Keep compatibility with old code that expects isConfigured
  const isConfigured = dbConnected;

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, isConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
