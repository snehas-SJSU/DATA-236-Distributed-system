import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ownerAPI } from "../services/api";

// This helps display stars from numeric ratings.
const STARS = (n) => "★".repeat(Math.max(0, Math.min(5, n)));

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // This loads owner dashboard data when the page opens.
  useEffect(() => {
    ownerAPI
      .dashboard()
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(err.response?.data?.detail || "Failed to load dashboard"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
      }}
    >
      <Navbar
        onSearch={({ find, near }) =>
          navigate(
            `/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`,
          )
        }
      />

      <div
        style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px 60px" }}
      >
        {/* This is the top section with title and owner actions. */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: "#2d2d2d",
            }}
          >
            Owner Dashboard
          </h1>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/owner/profile")}
              style={{
                background: "#fff",
                color: "#333",
                border: "1px solid #d0d0d0",
                borderRadius: 6,
                padding: "9px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              My Profile
            </button>

            <button
              onClick={() => navigate("/search?q=Restaurants&loc=")}
              style={{
                background: "#d32323",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "9px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Claim Restaurant
            </button>
          </div>
        </div>

        {loading && <div style={{ color: "#999" }}>Loading…</div>}
        {error && (
          <div style={{ color: "#d32323", fontWeight: 700, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {data && (
          <>
            {/* This section shows analytics cards. */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
                marginBottom: 28,
              }}
            >
              <StatCard
                title="Restaurants"
                value={data.analytics.restaurant_count}
                icon="🏪"
              />
              <StatCard
                title="Total Reviews"
                value={data.analytics.review_count}
                icon="✏️"
              />
              <StatCard
                title="Avg Rating"
                value={
                  data.analytics.average_rating > 0
                    ? `${data.analytics.average_rating} ★`
                    : "—"
                }
                icon="⭐"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 28,
              }}
            >
              {/* This section shows all restaurants owned by the current owner. */}
              <section>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#2d2d2d",
                    }}
                  >
                    Your Restaurants
                  </h2>

                  <button
                    onClick={() => navigate("/search?q=Restaurants&loc=")}
                    style={{
                      background: "#d32323",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "7px 12px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    + Claim a Restaurant
                  </button>
                </div>

                {(data.restaurants || []).length === 0 ? (
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
                    <p
                      style={{
                        margin: "0 0 12px",
                        fontWeight: 700,
                        color: "#555",
                      }}
                    >
                      No restaurants yet
                    </p>
                    <p style={{ margin: "0 0 16px", fontSize: 13 }}>
                      Search for your restaurant and claim it to start managing
                      it.
                    </p>
                    <button
                      onClick={() => navigate("/search?q=Restaurants&loc=")}
                      style={{
                        background: "#d32323",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "9px 16px",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontFamily: "inherit",
                      }}
                    >
                      Find & Claim Restaurant
                    </button>
                  </div>
                ) : (
                  (data.restaurants || []).map((r) => (
                    <div
                      key={r.id}
                      style={{
                        background: "#fff",
                        border: "1px solid #e8e8e8",
                        borderRadius: 10,
                        padding: "16px 18px",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 16,
                          color: "#2d2d2d",
                          marginBottom: 4,
                        }}
                      >
                        {r.name}
                      </div>

                      <div
                        style={{ color: "#666", fontSize: 13, marginBottom: 8 }}
                      >
                        {r.cuisine_type} · {r.city}
                        {r.state ? `, ${r.state}` : ""}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ color: "#d32323", fontSize: 14 }}>
                          {STARS(Math.round(r.average_rating || 0))}
                        </span>

                        <span style={{ color: "#888", fontSize: 13 }}>
                          {r.average_rating?.toFixed(1) || "0.0"} (
                          {r.review_count} reviews)
                        </span>

                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            background: r.is_open ? "#dcfce7" : "#fee2e2",
                            color: r.is_open ? "#166534" : "#991b1b",
                          }}
                        >
                          {r.is_open ? "Open" : "Closed"}
                        </span>
                      </div>

                      <div
                        style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
                      >
                        <button
                          onClick={() => navigate(`/restaurant/${r.id}`)}
                          style={{
                            background: "#fff",
                            border: "1px solid #d0d0d0",
                            borderRadius: 6,
                            padding: "7px 12px",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: 13,
                            fontFamily: "inherit",
                            color: "#333",
                          }}
                        >
                          View Details
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/owner/restaurants/${r.id}/edit`)
                          }
                          style={{
                            background: "#d32323",
                            border: "none",
                            borderRadius: 6,
                            padding: "7px 12px",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: 13,
                            fontFamily: "inherit",
                            color: "#fff",
                          }}
                        >
                          Edit Restaurant
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </section>

              {/* This section shows the most recent reviews for the owner's restaurants. */}
              <section>
                <h2
                  style={{
                    margin: "0 0 14px",
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#2d2d2d",
                  }}
                >
                  Recent Reviews
                </h2>

                {(data.recent_reviews || []).length === 0 ? (
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
                    No reviews yet for your restaurants.
                  </div>
                ) : (
                  (data.recent_reviews || []).map((review) => (
                    <div
                      key={review.id}
                      style={{
                        background: "#fff",
                        border: "1px solid #e8e8e8",
                        borderRadius: 10,
                        padding: "14px 16px",
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 800,
                            color: "#333",
                            fontSize: 14,
                          }}
                        >
                          {review.user_name}
                        </div>

                        <div style={{ fontSize: 12, color: "#aaa" }}>
                          {review.created_at
                            ? new Date(review.created_at).toLocaleDateString()
                            : ""}
                        </div>
                      </div>

                      <div
                        style={{
                          color: "#d32323",
                          marginBottom: 6,
                          fontSize: 15,
                        }}
                      >
                        {STARS(review.rating)}
                        <span
                          style={{ color: "#888", fontSize: 12, marginLeft: 6 }}
                        >
                          {review.rating}/5
                        </span>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          color: "#555",
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}
                      >
                        {review.comment || <em>No comment</em>}
                      </p>
                    </div>
                  ))
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// This small reusable card shows dashboard stats.
function StatCard({ title, value, icon }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e7e7e7",
        borderRadius: 12,
        padding: "20px 22px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 32 }}>{icon}</div>
      <div>
        <div
          style={{
            fontSize: 13,
            color: "#888",
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#2d2d2d" }}>
          {value}
        </div>
      </div>
    </div>
  );
}
