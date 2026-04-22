import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  signupUser: (data) => api.post("/auth/user/signup", data),
  loginUser: (data) => api.post("/auth/user/login", data),
  signupOwner: (data) => api.post("/auth/owner/signup", data),
  loginOwner: (data) => api.post("/auth/owner/login", data),
};

export const restaurantAPI = {
  getAll: (params) => api.get("/restaurants", { params }),
  getById: (id) => api.get(`/restaurants/${id}`),
  create: (data) => api.post("/restaurants", data),
  update: (id, data) => api.put(`/restaurants/${id}`, data),
  delete: (id) => api.delete(`/restaurants/${id}`),
  search: (params) => api.get("/restaurants/search", { params }),
  uploadPhotos: (id, formData) =>
    api.post(`/restaurants/${id}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  favorite: (id) => api.post(`/restaurants/${id}/favorite`),
  unfavorite: (id) => api.delete(`/restaurants/${id}/favorite`),
  getFavorites: () => api.get("/restaurants/favorites"),
  claim: (id) => api.post(`/owner/restaurants/${id}/claim`),
};

export const reviewAPI = {
  getByRestaurant: (restaurantId) =>
    api.get(`/restaurants/${restaurantId}/reviews`),
  create: (restaurantId, data) =>
    api.post(`/restaurants/${restaurantId}/reviews`, data),
  update: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),
  delete: (reviewId) => api.delete(`/reviews/${reviewId}`),
  uploadPhotos: (reviewId, formData) =>
    api.post(`/reviews/${reviewId}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const profileAPI = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data) => api.put("/user/profile", data),
  updatePreferences: (data) => api.put("/user/preferences", data),
  getHistory: () => api.get("/user/history"),
  uploadPhoto: (formData) =>
    api.post("/user/profile/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const ownerAPI = {
  dashboard: () => api.get("/owner/dashboard"),
  getProfile: () => api.get("/owner/profile"),
  updateProfile: (data) => api.put("/owner/profile", data),
  createRestaurant: (data) => api.post("/owner/restaurants", data),
  claimRestaurant: (id) => api.post(`/owner/restaurants/${id}/claim`),
  updateRestaurant: (id, data) => api.put(`/owner/restaurants/${id}`, data),
  uploadRestaurantPhotos: (id, formData) =>
    api.post(`/owner/restaurants/${id}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getRestaurantReviews: (id, params) =>
    api.get(`/owner/restaurants/${id}/reviews`, { params }),
};

export const aiAPI = {
  chat: (data) => api.post("/ai-assistant/chat", data),
};

// Alias used by ChatBot.jsx
export const chatAPI = {
  sendMessage: (data) => api.post("/ai-assistant/chat", data),
};

export { api };
export default api;