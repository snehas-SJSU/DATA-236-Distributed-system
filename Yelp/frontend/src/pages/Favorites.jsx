import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import RestaurantCard from "../components/RestaurantCard";
import { restaurantAPI } from "../services/api";

export default function Favorites() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restaurantAPI
      .getFavorites()
      .then((res) => setItems(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
      }}
    >
      <Navbar
        onSearch={({ find, near }) =>
          navigate(`/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`)
        }
      />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px 60px" }}>
        <h1 style={{ marginTop: 0, fontSize: 28, fontWeight: 800, color: "#2d2d2d" }}>
          Your Favorites
        </h1>

        {loading ? (
          <div style={{ color: "#999", padding: "40px 0" }}>Loading…</div>
        ) : items.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e8e8e8",
              borderRadius: 12,
              padding: "48px 32px",
              textAlign: "center",
              color: "#777",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>♡</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#555", margin: "0 0 8px" }}>
              No favorites yet
            </p>
            <p style={{ fontSize: 14, color: "#999", margin: "0 0 20px" }}>
              Save restaurants you love so you can find them easily later.
            </p>
            <button
              onClick={() => navigate("/search?q=Restaurants&loc=")}
              style={{
                background: "#d32323",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "11px 20px",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "inherit",
              }}
            >
              Discover restaurants
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
              {items.length} saved restaurant{items.length !== 1 ? "s" : ""}
            </p>
            {items.map((item, idx) => (
              <RestaurantCard key={item.id} restaurant={item} index={idx} showNumber={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
