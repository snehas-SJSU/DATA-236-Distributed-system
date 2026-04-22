import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { restaurantAPI } from "../../services/api";

// Async thunks
export const fetchRestaurants = createAsyncThunk(
  "restaurants/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await restaurantAPI.getAll();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch restaurants");
    }
  }
);

export const fetchRestaurantById = createAsyncThunk(
  "restaurants/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await restaurantAPI.getById(id);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Restaurant not found");
    }
  }
);

export const searchRestaurants = createAsyncThunk(
  "restaurants/search",
  async (params, { rejectWithValue }) => {
    try {
      const res = await restaurantAPI.search(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Search failed");
    }
  }
);

const restaurantSlice = createSlice({
  name: "restaurants",
  initialState: {
    list: [],
    currentRestaurant: null,
    searchResults: [],
    searchTotal: 0,
    searchPage: 1,
    searchTotalPages: 1,
    status: "idle",       // idle | loading | succeeded | failed
    searchStatus: "idle",
    error: null,
  },
  reducers: {
    setCurrentRestaurant: (state, action) => {
      state.currentRestaurant = action.payload;
    },
    updateRestaurantInList: (state, action) => {
      const idx = state.list.findIndex((r) => r.id === action.payload.id);
      if (idx !== -1) state.list[idx] = action.payload;
      if (state.currentRestaurant?.id === action.payload.id) {
        state.currentRestaurant = action.payload;
      }
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    // fetchAll
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });

    // fetchById
    builder
      .addCase(fetchRestaurantById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRestaurantById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentRestaurant = action.payload;
      })
      .addCase(fetchRestaurantById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });

    // search
    builder
      .addCase(searchRestaurants.pending, (state) => {
        state.searchStatus = "loading";
      })
      .addCase(searchRestaurants.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
        state.searchResults = action.payload.restaurants || [];
        state.searchTotal = action.payload.total || 0;
        state.searchPage = action.payload.page || 1;
        state.searchTotalPages = action.payload.total_pages || 1;
      })
      .addCase(searchRestaurants.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { setCurrentRestaurant, updateRestaurantInList, clearSearchResults } =
  restaurantSlice.actions;

// Selectors
export const selectRestaurants = (state) => state.restaurants.list;
export const selectCurrentRestaurant = (state) => state.restaurants.currentRestaurant;
export const selectSearchResults = (state) => state.restaurants.searchResults;
export const selectSearchTotal = (state) => state.restaurants.searchTotal;
export const selectRestaurantStatus = (state) => state.restaurants.status;
export const selectSearchStatus = (state) => state.restaurants.searchStatus;

export default restaurantSlice.reducer;
