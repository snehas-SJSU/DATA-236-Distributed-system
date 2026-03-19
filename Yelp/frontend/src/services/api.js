import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// This adds the saved token to every request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// This section handles signup and login API calls.
export const authAPI = {
  signupUser: (data) => api.post("/auth/user/signup", data),
  loginUser: (data) => api.post("/auth/user/login", data),
  signupOwner: (data) => api.post("/auth/owner/signup", data),
  loginOwner: (data) => api.post("/auth/owner/login", data),
};

// This section handles restaurant-related API calls.
export const restaurantAPI = {
  getAll: (params) => api.get("/restaurants", { params }),
  getById: (id) => api.get(`/restaurants/${id}`),
  create: (data) => api.post("/restaurants", data),
  update: (id, data) => api.put(`/restaurants/${id}`, data),
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

// This section handles review-related API calls.
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

// This section handles normal user profile API calls.
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

// This section handles owner-only API calls.
export const ownerAPI = {
  dashboard: () => api.get("/owner/dashboard"),
  getProfile: () => api.get("/owner/profile"),
  updateProfile: (data) => api.put("/owner/profile", data),
  createRestaurant: (data) => api.post("/owner/restaurants", data),
  claimRestaurant: (id) => api.post(`/owner/restaurants/${id}/claim`),
  updateRestaurant: (id, data) => api.put(`/owner/restaurants/${id}`, data),
};

// This section handles AI assistant chat calls.
export const aiAPI = {
  chat: (data) => api.post("/ai-assistant/chat", data),
};

export default api;
