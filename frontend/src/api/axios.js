import axios from "axios";

// Create a shared Axios instance with a base URL
// The Vite proxy forwards /api/* to http://localhost:5000/api/* during dev
// In production, set VITE_API_URL to your deployed backend URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
