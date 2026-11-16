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

export default api;
