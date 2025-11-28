import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";
import { toast } from "sonner";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const API_URL = "/auth";

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedToken) setToken(storedToken);
  }, []);

  /* LOGIN */
  const login = async (identifier, password) => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      const res = await api.post(`${API_URL}/login`, { identifier, password });
      const { token, user } = res.data;

      const fresh = await api.get(`/user/${user.user_id}`);

      const fullUser = {
        ...fresh.data, 
        name: `${fresh.data.first_name} ${fresh.data.last_name}`,
      };

      setUser(fullUser);
      setToken(token);

      localStorage.setItem("user", JSON.stringify(fullUser));
      localStorage.setItem("token", token);

      return fullUser;
    } catch (err) {
      throw {
        response: {
          data: {
            message: err.response?.data?.message || "Login failed",
          },
        },
      };
    }
  };

  /* SIGNUP */
  const signup = async (first_name, last_name, user_uid, password) => {
    const res = await api.post(`${API_URL}/register`, {
      first_name,
      last_name,
      user_uid,
      password,
    });

    toast.success(res.data?.message || "Account created successfully!");
    return res.data.user;
  };

  /* LOGOUT */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toast.success("Logged out successfully.");
  };

  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
