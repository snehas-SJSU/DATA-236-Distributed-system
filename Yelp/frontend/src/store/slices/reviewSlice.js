import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { reviewAPI } from "../../services/api";

// Async thunks
export const fetchReviews = createAsyncThunk(
  "reviews/fetchByRestaurant",
  async (restaurantId, { rejectWithValue }) => {
    try {
      const res = await reviewAPI.getByRestaurant(restaurantId);
      return { restaurantId, reviews: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch reviews");
    }
  }
);

export const submitReview = createAsyncThunk(
  "reviews/submit",
  async ({ restaurantId, data }, { rejectWithValue }) => {
    try {
      const res = await reviewAPI.create(restaurantId, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to submit review");
    }
  }
);

export const editReview = createAsyncThunk(
  "reviews/edit",
  async ({ reviewId, data }, { rejectWithValue }) => {
    try {
      const res = await reviewAPI.update(reviewId, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to update review");
    }
  }
);

export const deleteReview = createAsyncThunk(
  "reviews/delete",
  async (reviewId, { rejectWithValue }) => {
    try {
      await reviewAPI.delete(reviewId);
      return reviewId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to delete review");
    }
  }
);

const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    // reviews stored by restaurantId: { [restaurantId]: [...reviews] }
    byRestaurant: {},
    status: "idle",       // idle | loading | succeeded | failed
    submitStatus: "idle", // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    clearReviewStatus: (state) => {
      state.submitStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchReviews
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.byRestaurant[action.payload.restaurantId] = action.payload.reviews;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });

    // submitReview
    builder
      .addCase(submitReview.pending, (state) => {
        state.submitStatus = "loading";
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.submitStatus = "succeeded";
        const { restaurant_id } = action.payload;
        if (state.byRestaurant[restaurant_id]) {
          state.byRestaurant[restaurant_id].unshift(action.payload);
        } else {
          state.byRestaurant[restaurant_id] = [action.payload];
        }
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.submitStatus = "failed";
        state.error = action.payload;
      });

    // editReview
    builder.addCase(editReview.fulfilled, (state, action) => {
      const updated = action.payload;
      const list = state.byRestaurant[updated.restaurant_id];
      if (list) {
        const idx = list.findIndex((r) => r.id === updated.id);
        if (idx !== -1) list[idx] = updated;
      }
    });

    // deleteReview
    builder.addCase(deleteReview.fulfilled, (state, action) => {
      const reviewId = action.payload;
      for (const restaurantId in state.byRestaurant) {
        state.byRestaurant[restaurantId] = state.byRestaurant[restaurantId].filter(
          (r) => r.id !== reviewId
        );
      }
    });
  },
});

export const { clearReviewStatus } = reviewSlice.actions;

// Selectors
export const selectReviewsByRestaurant = (restaurantId) => (state) =>
  state.reviews.byRestaurant[restaurantId] || [];
export const selectReviewStatus = (state) => state.reviews.status;
export const selectSubmitStatus = (state) => state.reviews.submitStatus;
export const selectReviewError = (state) => state.reviews.error;

export default reviewSlice.reducer;
