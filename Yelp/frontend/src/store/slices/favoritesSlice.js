import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { restaurantAPI } from "../../services/api";

// Async thunks
export const fetchFavorites = createAsyncThunk(
  "favorites/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await restaurantAPI.getFavorites();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch favorites");
    }
  }
);

export const addFavorite = createAsyncThunk(
  "favorites/add",
  async (restaurant, { rejectWithValue }) => {
    try {
      await restaurantAPI.favorite(restaurant.id);
      return restaurant;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to add favorite");
    }
  }
);

export const removeFavorite = createAsyncThunk(
  "favorites/remove",
  async (restaurantId, { rejectWithValue }) => {
    try {
      await restaurantAPI.unfavorite(restaurantId);
      return restaurantId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to remove favorite");
    }
  }
);

const favoritesSlice = createSlice({
  name: "favorites",
  initialState: {
    items: [],
    status: "idle",   // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    clearFavorites: (state) => {
      state.items = [];
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    // fetchFavorites
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });

    // addFavorite
    builder.addCase(addFavorite.fulfilled, (state, action) => {
      const exists = state.items.find((i) => i.id === action.payload.id);
      if (!exists) state.items.push(action.payload);
    });

    // removeFavorite
    builder.addCase(removeFavorite.fulfilled, (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
    });
  },
});

export const { clearFavorites } = favoritesSlice.actions;

// Selectors
export const selectFavorites = (state) => state.favorites.items;
export const selectFavoritesStatus = (state) => state.favorites.status;
export const selectIsFavorite = (restaurantId) => (state) =>
  state.favorites.items.some((i) => i.id === restaurantId);

export default favoritesSlice.reducer;
