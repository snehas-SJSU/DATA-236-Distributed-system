import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { restaurantAPI } from "../services/api";

const STARS = (n) => "★".repeat(Math.max(0, Math.min(5, n)));

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
        background: "#f7f7f7",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
      }}
    >
      <Navbar
        onSearch={({ find, near }) =>
          navigate(
            `/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(
              near || ""
            )}`
          )
        }
      />

      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 20px 50px" }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          style={{
            border: "none",
            background: "transparent",
            marginBottom: 12,
            padding: 0,
            cursor: "pointer",
            color: "#777",
            fontSize: 16,
            lineHeight: 1,
            fontWeight: 600,
          }}
        >
          ← back
        </button>

        <div style={{ marginBottom: 18 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: "#2d2d2d",
            }}
          >
            Your Favorites
          </h1>
          <p style={{ margin: "6px 0 0", color: "#777", fontSize: 14 }}>
            Restaurants you saved for later.
          </p>
        </div>

        {loading ? (
          <div
            style={{ color: "#999", padding: "30px 0", fontSize: 14 }}
            role="status"
            aria-live="polite"
          >
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e8e8e8",
              borderRadius: 12,
              padding: "36px 24px",
              textAlign: "center",
              color: "#777",
              width: 560,
              maxWidth: "100%",
              boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: 42, marginBottom: 10 }}>♡</div>
            <p
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#555",
                margin: "0 0 8px",
              }}
            >
              No favorites yet
            </p>
            <p
              style={{
                fontSize: 14,
                color: "#999",
                margin: "0 0 18px",
                lineHeight: 1.5,
              }}
            >
              Save restaurants you love so you can find them easily later.
            </p>
            <button
              onClick={() => navigate("/search?q=Restaurants&loc=")}
              style={{
                background: "#d32323",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "inherit",
              }}
            >
              Discover restaurants
            </button>
          </div>
        ) : (
          <section aria-label="Your favourite restaurants">
            <p style={{ color: "#666", fontSize: 14, margin: "0 0 12px" }}>
              {items.length} saved restaurant{items.length !== 1 ? "s" : ""}
            </p>

            <div
              style={{
                display: "grid",
                gap: 14,
                width: 560,
                maxWidth: "100%",
              }}
            >
              {items.map((item) => (
                <article
                  key={item.id}
                  style={cardBase}
                  aria-label={item.name}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/restaurant/${item.id}`)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && navigate(`/restaurant/${item.id}`)
                      }
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div style={imgBox}>
                        {item.photos?.[0] || item.image ? (
                          <img
                            src={item.photos?.[0] || item.image}
                            alt={item.name}
                            style={imgStyle}
                          />
                        ) : (
                          "🍽️"
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 16,
                            color: "#2d2d2d",
                            lineHeight: 1.2,
                            marginBottom: 6,
                          }}
                        >
                          {item.name}
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            color: "#666",
                            lineHeight: 1.5,
                            marginBottom: 8,
                          }}
                        >
                          {item.cuisine_type || "Restaurant"} · {item.city}
                          {item.state ? `, ${item.state}` : ""}
                          {item.price_range ? ` · ${item.price_range}` : ""}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            flexWrap: "wrap",
                            fontSize: 13,
                          }}
                        >
                          <span style={{ color: "#d32323", fontSize: 14, letterSpacing: 0.5 }}>
                            {STARS(Math.round(item.average_rating || 0))}
                          </span>

                          <span style={{ fontWeight: 700, color: "#444" }}>
                            {(item.average_rating || 0).toFixed(1)}
                          </span>

                          <span style={{ color: "#999" }}>
                            ({item.review_count || 0}{" "}
                            {(item.review_count || 0) === 1 ? "review" : "reviews"})
                          </span>

                          {typeof item.is_open === "boolean" && (
                            <span
                              style={{
                                color: item.is_open ? "#166534" : "#d32323",
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                            >
                              ● {item.is_open ? "Open" : "Closed"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      aria-label="Favorite"
                      title="Favorite"
                      style={favBtn}
                    >
                      ★
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const cardBase = {
  background: "#fff",
  border: "1px solid #e8e8e8",
  borderRadius: 14,
  padding: 14,
  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
};

const imgBox = {
  width: 74,
  height: 74,
  borderRadius: 10,
  overflow: "hidden",
  background: "#eee",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  fontSize: 28,
};

const imgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const favBtn = {
  border: "none",
  background: "transparent",
  color: "#d32323",
  fontSize: 18,
  lineHeight: 1,
  cursor: "pointer",
  padding: 2,
  flexShrink: 0,
};