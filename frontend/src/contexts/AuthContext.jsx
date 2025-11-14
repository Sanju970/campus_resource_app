import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const API_URL = "http://localhost:5000/api/auth";

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  /* --------------------------------------------------
     LOAD USER FROM LOCAL STORAGE (ONLY ONCE)
  -------------------------------------------------- */
  useEffect(() => {
    // Prevent double-run in React Strict Mode
    let ignore = false;

    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (!ignore) {
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedToken) setToken(storedToken);
    }

    return () => {
      ignore = true;
    };
  }, []);

  /* --------------------------------------------------
     LOGIN
  -------------------------------------------------- */
  const login = async (identifier, password) => {
    try {
      const res = await axios.post(`${API_URL}/login`, {
        identifier,
        password,
      });

      const { token, user } = res.data;

      const fullUser = {
        ...user,
        user_id: user.user_id,
        created_at: user.created_at,
        name: `${user.first_name} ${user.last_name}`,
      };

      setUser(fullUser);
      setToken(token);

      localStorage.setItem("user", JSON.stringify(fullUser));
      localStorage.setItem("token", token);

      return fullUser;

    } catch (err) {
      // 🔥 Return the backend message properly so the UI sees it
      throw {
        response: {
          data: {
            message: err.response?.data?.message || "Login failed",
          },
        },
      };
    }
  };


  /* --------------------------------------------------
     SIGNUP (CLEAN VERSION)
  -------------------------------------------------- */
  const signup = async (first_name, last_name, user_uid, password) => {
    try {
      const res = await axios.post(`${API_URL}/register`, {
        first_name,
        last_name,
        user_uid,
        password,
      });

      toast.success(res.data?.message || "Account created successfully!");
      return res.data.user;
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Signup failed, please try again."
      );
    }
  };

  /* --------------------------------------------------
     LOGOUT
  -------------------------------------------------- */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toast.success("Logged out successfully.");
  };

  /* --------------------------------------------------
     ATTACH TOKEN TO AXIOS HEADERS
  -------------------------------------------------- */
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
