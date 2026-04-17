import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intentar recuperar el usuario del localStorage al cargar an app
    const storedUser = localStorage.getItem('polines_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user', e);
        localStorage.removeItem('polines_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    // userData format: { role: 'ADMIN' | 'CLIENTE_DIRECTO' | 'CLIENTE_FINAL', entityId: 'uuid' | null, entityName: 'string' }
    setUser(userData);
    if (token) localStorage.setItem('polines_token', token);
    localStorage.setItem('polines_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('polines_user');
    localStorage.removeItem('polines_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
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
