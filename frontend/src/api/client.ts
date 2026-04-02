import axios, { AxiosHeaders } from "axios";

// Centralized Axios instance for all API modules.
const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  // Attach auth token on every request (except when absent)
  const token = localStorage.getItem("token");
  if (token) {
    // Normalize headers to AxiosHeaders to keep typings happy across Axios v1+.
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the token is invalid/expired, clear it and route user to login
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
