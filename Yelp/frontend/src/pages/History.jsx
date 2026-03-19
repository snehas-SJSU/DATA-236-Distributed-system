import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import RestaurantCard from "../components/RestaurantCard";
import { profileAPI } from "../services/api";

const STARS = (n) => "★".repeat(Math.max(0, Math.min(5, n)));

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState({ reviews: [], restaurants_added: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileAPI
      .getHistory()
      .then((res) => setHistory(res.data))
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
        <h1 style={{ marginTop: 0, fontSize: 28, fontWeight: 800, color: "#2d2d2d" }}>Your History</h1>

        {loading ? (
          <div style={{ color: "#999", padding: "40px 0" }}>Loading…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            {/* ── Reviews ── */}
            <section>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 0, marginBottom: 16, color: "#2d2d2d" }}>
                Your Reviews ({history.reviews.length})
              </h2>
              {history.reviews.length === 0 ? (
                <EmptyState
                  emoji="✏️"
                  title="No reviews yet"
                  sub="Share your dining experiences with the community."
                  btnLabel="Find restaurants to review"
                  onClick={() => navigate("/search?q=Restaurants&loc=")}
                />
              ) : (
                history.reviews.map((review) => (
                  <div
                    key={review.id}
                    onClick={() => navigate(`/restaurant/${review.restaurant_id}`)}
                    style={{
                      background: "#fff",
                      border: "1px solid #e8e8e8",
                      borderRadius: 10,
                      padding: "16px 18px",
                      marginBottom: 12,
                      cursor: "pointer",
                      transition: "box-shadow 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                  >
                    {/* Restaurant name as heading */}
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#0073bb", marginBottom: 4 }}>
                      {review.restaurant_name || "View Restaurant"}
                    </div>

                    {/* Stars + date row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div>
                        <span style={{ color: "#d32323", fontSize: 16, letterSpacing: 1 }}>
                          {STARS(review.rating)}
                        </span>
                        <span style={{ color: "#888", fontSize: 12, marginLeft: 6 }}>
                          {review.rating}/5
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#aaa" }}>
                        {review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}
                      </div>
                    </div>

                    {/* Comment */}
                    <p
                      style={{
                        margin: 0,
                        color: "#555",
                        fontSize: 13,
                        lineHeight: 1.6,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {review.comment || <em style={{ color: "#aaa" }}>No comment written</em>}
                    </p>
                  </div>
                ))
              )}
            </section>

            {/* ── Restaurants Added ── */}
            <section>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 0, marginBottom: 16, color: "#2d2d2d" }}>
                Restaurants You Added ({history.restaurants_added.length})
              </h2>
              {history.restaurants_added.length === 0 ? (
                <EmptyState
                  emoji="🏪"
                  title="No restaurants added yet"
                  sub="Add a restaurant to help others discover great places."
                  btnLabel="Add a restaurant"
                  onClick={() => navigate("/add-restaurant")}
                />
              ) : (
                history.restaurants_added.map((item, idx) => (
                  <RestaurantCard key={item.id} restaurant={item} index={idx} showNumber={false} />
                ))
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ emoji, title, sub, btnLabel, onClick }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: 10,
        padding: "28px 20px",
        textAlign: "center",
        color: "#999",
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 10 }}>{emoji}</div>
      <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#555", fontSize: 15 }}>{title}</p>
      <p style={{ margin: "0 0 16px", fontSize: 13 }}>{sub}</p>
      <button
        onClick={onClick}
        style={{
          background: "#d32323",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "9px 16px",
          cursor: "pointer",
          fontWeight: 700,
          fontFamily: "inherit",
          fontSize: 13,
        }}
      >
        {btnLabel}
      </button>
    </div>
  );
}
