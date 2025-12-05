import React, { useState, useCallback } from "react";
import { authAPI } from "../utils/api";

export const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("authToken"));

  const register = useCallback(async (username, email, password) => {
    const response = await authAPI.register(username, email, password);
    localStorage.setItem("authToken", response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authAPI.login(email, password);
    localStorage.setItem("authToken", response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  }, []);

  const getProfile = useCallback(async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      logout();
      setLoading(false);
    }
  }, [logout]);

  React.useEffect(() => {
    if (token) {
      getProfile();
    } else {
      setLoading(false);
    }
  }, [token, getProfile]);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
