import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext(null);

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token  = localStorage.getItem('ko_token');
      const stored = localStorage.getItem('ko_user');
      if (!token || !stored || isTokenExpired(token)) {
        localStorage.removeItem('ko_token');
        localStorage.removeItem('ko_user');
        return null;
      }
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });

  const inactivityTimer = useRef(null);

  const logout = useCallback(() => {
    localStorage.removeItem('ko_token');
    localStorage.removeItem('ko_user');
    setUser(null);
    clearTimeout(inactivityTimer.current);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(logout, INACTIVITY_LIMIT);
  }, [logout]);

  // Start/stop inactivity timer based on login state
  useEffect(() => {
    if (!user) return;

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      clearTimeout(inactivityTimer.current);
    };
  }, [user, resetInactivityTimer]);

  // Periodically check if the token has expired (e.g. tab left open overnight)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const token = localStorage.getItem('ko_token');
      if (!token || isTokenExpired(token)) logout();
    }, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, [user, logout]);

  const login = (userData, token) => {
    localStorage.setItem('ko_token', token);
    localStorage.setItem('ko_user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (userData) => {
    localStorage.setItem('ko_user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function getToken() {
  return localStorage.getItem('ko_token');
}
