
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
} from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the logged-in user when the app starts.
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('campusbite_token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        logoutUser();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Login and retrieve the user's profile.
  const login = async (credentials) => {
    await loginUser(credentials);

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      logoutUser();
      throw error;
    }
  };

  // Register a new user.
  const register = async (userData) => {
    return await registerUser(userData);
  };

  // Logout.
  const logout = () => {
    logoutUser();
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Access authentication state from any component.
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
