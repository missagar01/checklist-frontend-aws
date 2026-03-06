import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Request interceptor to add the JWT token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add legacy headers for backward compatibility (used by some backend routes)
    const userAccess1 = localStorage.getItem("user_access1") || localStorage.getItem("userAccess1") || "";
    const userAccess = localStorage.getItem("user_access") || localStorage.getItem("userAccess") || "";
    const role = localStorage.getItem("role") || "";

    if (userAccess1) {
      config.headers["x-user-access1"] = encodeURIComponent(userAccess1);
    }
    if (userAccess) {
      config.headers["x-user-access"] = encodeURIComponent(userAccess);
    }
    if (role) {
      config.headers["x-user-role"] = role;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or unauthorized
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
