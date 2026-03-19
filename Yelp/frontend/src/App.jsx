import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import AddRestaurant from "./pages/AddRestaurant";
import RestaurantDetails from "./pages/RestaurantDetails";
import WriteReview from "./pages/WriteReview";
import WriteReviewSearch from "./pages/WriteReviewSearch";
import Favorites from "./pages/Favorites";
import History from "./pages/History";
import OwnerLogin from "./pages/OwnerLogin";
import OwnerSignup from "./pages/OwnerSignup";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerProfile from "./pages/OwnerProfile";
import OwnerEditRestaurant from "./pages/OwnerEditRestaurant";

// This protects routes for logged-in users or logged-in owners.
function PrivateRoute({ children, ownerOnly = false }) {
  const { user, owner, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "#999",
          fontFamily: "sans-serif",
        }}
      >
        Loading…
      </div>
    );
  }

  if (ownerOnly) {
    return owner ? children : <Navigate to="/owner/login" replace />;
  }

  return user ? children : <Navigate to="/login" replace />;
}

// This defines all app routes for user and owner pages.
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/owner/login" element={<OwnerLogin />} />
      <Route path="/owner/signup" element={<OwnerSignup />} />
      <Route path="/search" element={<Search />} />
      <Route path="/restaurant/:id" element={<RestaurantDetails />} />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/add-restaurant"
        element={
          <PrivateRoute>
            <AddRestaurant />
          </PrivateRoute>
        }
      />
      <Route
        path="/review/:restaurantId"
        element={
          <PrivateRoute>
            <WriteReview />
          </PrivateRoute>
        }
      />
      <Route
        path="/write-review"
        element={
          <PrivateRoute>
            <WriteReviewSearch />
          </PrivateRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <PrivateRoute>
            <Favorites />
          </PrivateRoute>
        }
      />
      <Route
        path="/history"
        element={
          <PrivateRoute>
            <History />
          </PrivateRoute>
        }
      />

      <Route
        path="/owner/dashboard"
        element={
          <PrivateRoute ownerOnly>
            <OwnerDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/owner/profile"
        element={
          <PrivateRoute ownerOnly>
            <OwnerProfile />
          </PrivateRoute>
        }
      />
      <Route
        path="/owner/restaurants/:id/edit"
        element={
          <PrivateRoute ownerOnly>
            <OwnerEditRestaurant />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// This wraps the app with router and auth context.
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
