import { createSlice } from "@reduxjs/toolkit";

const storedToken = localStorage.getItem("token");
const storedRole = localStorage.getItem("role");
const storedUser = localStorage.getItem("user");
const storedOwner = localStorage.getItem("owner");

const initialState = {
  token: storedToken || null,
  role: storedRole || null,
  user: storedUser ? JSON.parse(storedUser) : null,
  owner: storedOwner ? JSON.parse(storedOwner) : null,
  isAuthenticated: !!storedToken,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { principal, token, role } = action.payload;
      state.token = token;
      state.role = role;
      state.isAuthenticated = true;
      if (role === "owner") {
        state.owner = principal;
        state.user = null;
      } else {
        state.user = principal;
        state.owner = null;
      }
    },
    clearCredentials: (state) => {
      state.token = null;
      state.role = null;
      state.user = null;
      state.owner = null;
      state.isAuthenticated = false;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
});

export const { setCredentials, clearCredentials, updateUser } = authSlice.actions;

// Selectors
export const selectToken = (state) => state.auth.token;
export const selectRole = (state) => state.auth.role;
export const selectUser = (state) => state.auth.user;
export const selectOwner = (state) => state.auth.owner;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;
