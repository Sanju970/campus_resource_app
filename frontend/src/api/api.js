import axios from "axios";

// Backend URL from .env
// const API_BASE = "https://campus-resource-app.onrender.com";
const API_BASE = "http://localhost:5000";
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
