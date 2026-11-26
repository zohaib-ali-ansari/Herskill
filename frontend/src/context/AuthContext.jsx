import { useCallback, useEffect, useState } from 'react';
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '../services/api';
import {
  changeAccountPassword,
  fetchCurrentUser,
  loginAdmin,
  loginUser,
  logoutUser,
  registerUser,
  switchAccountMode,
  updateAccountProfile,
} from '../services/authService';
import {
  activateSellerAccount,
  updateSellerProfile,
} from '../services/sellerService';
import { AuthContext } from './authContextValue';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setSeller(null);
      setLoading(false);
      return null;
    }

    try {
      const data = await fetchCurrentUser();
      setUser(data.user);
      setSeller(data.seller || null);
      return data;
    } catch {
      clearStoredToken();
      setUser(null);
      setSeller(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const token = getStoredToken();
    if (!token) {
      Promise.resolve().then(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    fetchCurrentUser()
      .then((data) => {
        if (!active) return;
        setUser(data.user);
        setSeller(data.seller || null);
      })
      .catch(() => {
        if (!active) return;
        clearStoredToken();
        setUser(null);
        setSeller(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const register = async (payload) => {
    const data = await registerUser(payload);
    setStoredToken(data.token, true);
    setUser(data.user);
    setSeller(data.seller || null);
    return data;
  };

  const login = async (payload) => {
    const data = await loginUser(payload);
    setStoredToken(data.token, Boolean(payload.rememberMe));
    setUser(data.user);
    setSeller(data.seller || null);
    return data;
  };

  const adminLogin = async (payload) => {
    const data = await loginAdmin(payload);
    setStoredToken(data.token, Boolean(payload.rememberMe));
    setUser(data.user);
    setSeller(null);
    return data;
  };

  const logout = async () => {
    try {
      if (getStoredToken()) {
        await logoutUser();
      }
    } catch {
      // Clear local session regardless of server response
    } finally {
      clearStoredToken();
      setUser(null);
      setSeller(null);
    }
  };

  const switchMode = async (mode) => {
    const data = await switchAccountMode(mode);
    setUser(data.user);
    setSeller(data.seller || null);
    return data;
  };

  const activateSeller = async () => {
    const data = await activateSellerAccount();
    setUser(data.user);
    setSeller(data.seller || null);
    return data;
  };

  const updateProfile = async (payload) => {
    const data = await updateAccountProfile(payload);
    setUser(data.user);
    if (data.seller !== undefined) {
      setSeller(data.seller);
    }
    return data;
  };

  const changePassword = async (payload) => {
    return changeAccountPassword(payload);
  };

  const saveSellerProfile = async (payload) => {
    const data = await updateSellerProfile(payload);
    setUser(data.user);
    setSeller(data.seller || null);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        seller,
        loading,
        isAuthenticated: Boolean(user),
        refreshUser,
        register,
        login,
        adminLogin,
        logout,
        switchMode,
        activateSeller,
        updateProfile,
        changePassword,
        saveSellerProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
