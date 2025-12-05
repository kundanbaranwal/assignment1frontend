import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add JWT token to all requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  register: (username, email, password) =>
    instance.post("/auth/register", { username, email, password }),
  login: (email, password) => instance.post("/auth/login", { email, password }),
  getProfile: () => instance.get("/auth/profile"),
  getAllUsers: () => instance.get("/auth/users"),
};

// Channel API
export const channelAPI = {
  createChannel: (name, description, isPrivate, members) =>
    instance.post("/channels", { name, description, isPrivate, members }),
  getChannels: () => instance.get("/channels"),
  getChannelById: (id) => instance.get(`/channels/${id}`),
  inviteUser: (channelId, userId) =>
    instance.post("/channels/invite", { channelId, userId }),
  removeUser: (channelId, userId) =>
    instance.post("/channels/remove", { channelId, userId }),
  deleteChannel: (id) => instance.delete(`/channels/${id}`),
};

// Message API
export const messageAPI = {
  getMessages: (channelId) => instance.get(`/messages/${channelId}`),
  sendMessage: (content, channelId) =>
    instance.post("/messages", { content, channelId }),
  markAsRead: (messageId) => instance.post(`/messages/${messageId}/read`),
  getMessageHistory: (channelId, skip) =>
    instance.get(`/messages/${channelId}/history/${skip}`),
};

export default instance;
