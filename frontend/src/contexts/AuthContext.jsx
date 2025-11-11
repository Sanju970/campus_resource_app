import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const API_URL = 'http://localhost:5000/api';

  // -------------------- LOAD USER FROM LOCALSTORAGE --------------------
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedToken) setToken(storedToken);
  }, []);

  // -------------------- LOGIN --------------------
const login = async (email, password, role) => {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password, role });
    const { token, user } = res.data;

    const fullUser = {
      ...user,
      name: user.name || `${user.first_name} ${user.last_name}`,
    };

    setUser(fullUser);
    setToken(token);
    localStorage.setItem('user', JSON.stringify(fullUser));
    localStorage.setItem('token', token);

    toast.success(`Welcome back, ${fullUser.first_name}!`);
    return fullUser;
  } catch (err) {
    console.error('Login failed:', err);
    toast.error(err.response?.data?.message || 'Login failed');
    throw err;
  }
};


  // -------------------- SIGNUP --------------------
  const signup = async (first_name, last_name, user_uid, email, password, role_id) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        first_name,
        last_name,
        user_uid,
        email,
        password,
        role_id,
      });
      toast.success('Account created successfully!');
      return res.data.user;
    } catch (err) {
      console.error('Signup failed:', err);
      toast.error(err.response?.data?.message || 'Signup failed');
      throw err;
    }
  };

  // -------------------- LOGOUT --------------------
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
  };

  // -------------------- AXIOS AUTH HEADER --------------------
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
