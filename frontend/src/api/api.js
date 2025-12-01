import axios from "axios";

// Decide backend URL based on build mode
const isProd = import.meta.env.MODE === "production";

const API_BASE = isProd
  ? "https://campus-resource-app.onrender.com"  
  : "http://localhost:5000";                    

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
});

// Debugging
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API Error:", err.response?.data || err.message);
    throw err;
  }
);

export default api;
