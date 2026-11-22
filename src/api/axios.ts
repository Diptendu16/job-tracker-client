import axios from "axios";
import { getSocket } from "../socket/socket";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Lets the server skip this tab when broadcasting the change it just made.
  const socketId = getSocket()?.id;
  if (socketId) {
    config.headers["X-Socket-Id"] = socketId;
  }

  return config;
});

// These endpoints return 401 for ordinary reasons (wrong password, nobody logged in yet),
// which must not be mistaken for "your session expired".
const AUTH_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/me"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? "";
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.includes(path));

    if (error.response?.status === 401 && !isAuthEndpoint) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  },
);

export default api;
