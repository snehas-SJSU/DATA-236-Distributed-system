import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ownerAPI } from "../services/api";

const STARS = (n) => "★".repeat(Math.max(0, Math.min(5, n)));

export default function OwnerDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRestId, setSelectedRestId] = useState(null);
  const [restReviews, setRestReviews] = useState([]);
  const [revLoading, setRevLoading] = useState(false);

  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewMinRating, setReviewMinRating] = useState("");

  // Load the main owner dashboard data.
  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await ownerAPI.dashboard();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Load reviews for one selected restaurant using current sort/filter values.
  const fetchRestaurantReviews = async (
    restaurantId,
    sortValue = reviewSort,
    minRatingValue = reviewMinRating,
  ) => {
    setRevLoading(true);

    try {
      const params = { sort_by: sortValue };

      if (minRatingValue !== "") {
        params.min_rating = Number(minRatingValue);
      }

      const res = await ownerAPI.getRestaurantReviews(restaurantId, params);
      setRestReviews(res.data || []);
    } catch (err) {
      setRestReviews([]);
    } finally {
      setRevLoading(false);
    }
  };

  // Open or close one restaurant review panel.
  const toggleRestaurantReviews = async (restaurantId) => {
    if (selectedRestId === restaurantId) {
      setSelectedRestId(null);
      setRestReviews([]);
      return;
    }

    // Reset filters when opening a different restaurant.
    setSelectedRestId(restaurantId);
    setReviewSort("newest");
    setReviewMinRating("");

    await fetchRestaurantReviews(restaurantId, "newest", "");
  };

  // Apply current sort/filter values to the currently open restaurant.
  const applyFilters = async () => {
    if (!selectedRestId) return;
    await fetchRestaurantReviews(selectedRestId, reviewSort, reviewMinRating);
  };

  const analytics = data?.analytics || {};
  const totalReviews = analytics.review_count || 0;

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
            `/search?q=${encodeURIComponent(
              find || "Restaurants",
            )}&loc=${encodeURIComponent(near || "")}`,
          )
        }
      />

      <main
        style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px 60px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: 28,
                fontWeight: 800,
                color: "#2d2d2d",
              }}
            >
              Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "#888" }}>
              Manage your restaurants, view reviews, and track performance.
            </p>
          </div>
        </div>

        {loading && (
          <div style={{ color: "#999" }} role="status">
            Loading…
          </div>
        )}

        {error && (
          <div
            style={{ color: "#d32323", fontWeight: 700, marginBottom: 16 }}
            role="alert"
          >
            {error}
          </div>
        )}

        {data && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 16,
                marginBottom: 28,
              }}
            >
              <StatCard
                title="Restaurants"
                value={analytics.restaurant_count || 0}
                icon="🏪"
                color="#fff7ed"
                iconBg="#fed7aa"
              />
              <StatCard
                title="Total Reviews"
                value={totalReviews}
                icon="✏️"
                color="#f0f9ff"
                iconBg="#bae6fd"
              />
              <StatCard
                title="Total Views"
                value={analytics.total_views || 0}
                icon="👁️"
                color="#f5f3ff"
                iconBg="#ddd6fe"
              />
              <StatCard
                title="Avg Rating"
                value={
                  analytics.average_rating > 0
                    ? `${analytics.average_rating} ★`
                    : "—"
                }
                icon="⭐"
                color="#fefce8"
                iconBg="#fef08a"
              />
            </div>

            {totalReviews > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 20,
                  marginBottom: 28,
                }}
              >
                <section style={card} aria-label="Ratings distribution">
                  <h2 style={sectionTitle}>Ratings Distribution</h2>

                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = analytics.ratings_distribution?.[star] || 0;
                    const pct =
                      totalReviews > 0
                        ? Math.round((count / totalReviews) * 100)
                        : 0;

                    return (
                      <div
                        key={star}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#555",
                            width: 16,
                            textAlign: "right",
                          }}
                        >
                          {star}
                        </span>
                        <span style={{ color: "#d32323" }}>★</span>

                        <div
                          style={{
                            flex: 1,
                            background: "#f3f3f3",
                            borderRadius: 4,
                            height: 12,
                            overflow: "hidden",
                          }}
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              background: "#d32323",
                              height: "100%",
                              borderRadius: 4,
                              transition: "width 0.4s",
                            }}
                          />
                        </div>

                        <span
                          style={{ fontSize: 12, color: "#888", width: 24 }}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </section>

                <section style={card} aria-label="Sentiment analysis">
                  <h2 style={sectionTitle}>Overall Sentiment</h2>

                  {[
                    {
                      key: "positive",
                      label: "Positive (4–5 ★)",
                      color: "#16a34a",
                      barBg: "#22c55e",
                    },
                    {
                      key: "neutral",
                      label: "Neutral (3 ★)",
                      color: "#ca8a04",
                      barBg: "#eab308",
                    },
                    {
                      key: "negative",
                      label: "Negative (1–2 ★)",
                      color: "#dc2626",
                      barBg: "#ef4444",
                    },
                  ].map(({ key, label, color, barBg }) => {
                    const count = analytics.sentiment?.[key] || 0;
                    const pct =
                      totalReviews > 0
                        ? Math.round((count / totalReviews) * 100)
                        : 0;

                    return (
                      <div key={key} style={{ marginBottom: 14 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 5,
                          }}
                        >
                          <span
                            style={{ fontSize: 13, fontWeight: 700, color }}
                          >
                            {label}
                          </span>
                          <span
                            style={{ fontSize: 13, fontWeight: 700, color }}
                          >
                            {count} ({pct}%)
                          </span>
                        </div>

                        <div
                          style={{
                            background: "#f3f3f3",
                            borderRadius: 6,
                            height: 10,
                            overflow: "hidden",
                          }}
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              background: barBg,
                              height: "100%",
                              borderRadius: 6,
                              transition: "width 0.4s",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <p
                    style={{ margin: "12px 0 0", fontSize: 12, color: "#888" }}
                  >
                    Based on {totalReviews} review
                    {totalReviews !== 1 ? "s" : ""}
                  </p>
                </section>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 28,
              }}
            >
              <section aria-label="Your restaurants">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <h2 style={sectionTitle}>Your Restaurants</h2>
                  <button
                    onClick={() => navigate("/owner/claim")}
                    style={{ ...redBtn, fontSize: 12, padding: "6px 12px" }}
                  >
                    + Claim
                  </button>
                </div>

                {(data.restaurants || []).length === 0 ? (
                  <div
                    style={{
                      ...card,
                      textAlign: "center",
                      padding: "36px 20px",
                      color: "#999",
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 10 }}>🏪</div>
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontWeight: 700,
                        color: "#555",
                      }}
                    >
                      No restaurants yet
                    </p>
                    <p style={{ margin: "0 0 16px", fontSize: 13 }}>
                      Claim a restaurant to start managing it.
                    </p>
                    <button
                      onClick={() => navigate("/owner/claim")}
                      style={redBtn}
                    >
                      Find & Claim
                    </button>
                  </div>
                ) : (
                  (data.restaurants || []).map((r) => (
                    <article
                      key={r.id}
                      style={{ ...card, marginBottom: 14 }}
                      aria-label={r.name}
                    >
                      {r.photos?.length > 0 && (
                        <div
                          style={{ display: "flex", gap: 6, marginBottom: 10 }}
                        >
                          {r.photos.slice(0, 3).map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`${r.name} photo ${i + 1}`}
                              style={{
                                width: 60,
                                height: 50,
                                objectFit: "cover",
                                borderRadius: 6,
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 16,
                          color: "#2d2d2d",
                          marginBottom: 3,
                        }}
                      >
                        {r.name}
                      </div>

                      <div
                        style={{ color: "#666", fontSize: 13, marginBottom: 8 }}
                      >
                        {r.cuisine_type} · {r.city}
                        {r.state ? `, ${r.state}` : ""}
                        {r.price_range ? ` · ${r.price_range}` : ""}
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
                        <span
                          style={{ color: "#d32323", fontSize: 14 }}
                          aria-label={`${r.average_rating} stars`}
                        >
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
                            fontSize: 11,
                            fontWeight: 700,
                            background: r.is_open ? "#dcfce7" : "#fee2e2",
                            color: r.is_open ? "#166534" : "#991b1b",
                          }}
                        >
                          {r.is_open ? "Open" : "Closed"}
                        </span>
                      </div>

                      <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        <button
                          onClick={() => navigate(`/restaurant/${r.id}`)}
                          style={outlineBtn}
                          aria-label={`View ${r.name}`}
                        >
                          View
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/owner/restaurants/${r.id}/edit`)
                          }
                          style={redBtn}
                          aria-label={`Edit ${r.name}`}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => toggleRestaurantReviews(r.id)}
                          style={{
                            ...outlineBtn,
                            color: selectedRestId === r.id ? "#d32323" : "#333",
                            borderColor:
                              selectedRestId === r.id ? "#d32323" : "#d0d0d0",
                          }}
                          aria-expanded={selectedRestId === r.id}
                        >
                          Reviews {selectedRestId === r.id ? "▲" : "▼"}
                        </button>
                      </div>

                      {selectedRestId === r.id && (
                        <div
                          style={{
                            marginTop: 14,
                            borderTop: "1px solid #f0f0f0",
                            paddingTop: 14,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                              marginBottom: 12,
                              alignItems: "center",
                            }}
                          >
                            <label
                              htmlFor={`sort-${r.id}`}
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#555",
                              }}
                            >
                              Sort:
                            </label>

                            <select
                              id={`sort-${r.id}`}
                              value={reviewSort}
                              onChange={(e) => setReviewSort(e.target.value)}
                              style={selectSm}
                            >
                              <option value="newest">Newest</option>
                              <option value="oldest">Oldest</option>
                              <option value="highest">Highest ★</option>
                              <option value="lowest">Lowest ★</option>
                            </select>

                            <label
                              htmlFor={`min-${r.id}`}
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#555",
                              }}
                            >
                              Min:
                            </label>

                            <select
                              id={`min-${r.id}`}
                              value={reviewMinRating}
                              onChange={(e) =>
                                setReviewMinRating(e.target.value)
                              }
                              style={selectSm}
                            >
                              <option value="">All</option>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <option key={s} value={s}>
                                  {s}★
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={applyFilters}
                              style={{
                                ...outlineBtn,
                                padding: "4px 10px",
                                fontSize: 12,
                              }}
                            >
                              Apply
                            </button>
                          </div>

                          {revLoading ? (
                            <div
                              style={{ color: "#aaa", fontSize: 13 }}
                              role="status"
                            >
                              Loading…
                            </div>
                          ) : restReviews.length === 0 ? (
                            <div style={{ color: "#aaa", fontSize: 13 }}>
                              No reviews match filters.
                            </div>
                          ) : (
                            restReviews.map((rev) => (
                              <div
                                key={rev.id}
                                style={{
                                  borderBottom: "1px solid #f5f5f5",
                                  paddingBottom: 10,
                                  marginBottom: 10,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: 3,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      fontSize: 13,
                                      color: "#333",
                                    }}
                                  >
                                    {rev.user_name}
                                  </span>

                                  <time
                                    style={{ fontSize: 11, color: "#aaa" }}
                                    dateTime={rev.created_at}
                                  >
                                    {rev.created_at
                                      ? new Date(
                                          rev.created_at,
                                        ).toLocaleDateString()
                                      : ""}
                                  </time>
                                </div>

                                <div
                                  style={{
                                    color: "#d32323",
                                    fontSize: 13,
                                    marginBottom: 3,
                                  }}
                                >
                                  {STARS(rev.rating)}
                                  <span
                                    style={{
                                      color: "#888",
                                      fontSize: 11,
                                      marginLeft: 4,
                                    }}
                                  >
                                    {rev.rating}/5
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
                                  {rev.comment || (
                                    <em style={{ color: "#aaa" }}>
                                      No comment
                                    </em>
                                  )}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </article>
                  ))
                )}
              </section>

              <section aria-label="Recent reviews">
                <h2 style={{ ...sectionTitle, marginBottom: 16 }}>
                  Recent Reviews
                </h2>

                {(data.recent_reviews || []).length === 0 ? (
                  <div
                    style={{
                      ...card,
                      textAlign: "center",
                      padding: "36px 20px",
                      color: "#999",
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 10 }}>✏️</div>
                    <p style={{ margin: 0, fontWeight: 700, color: "#555" }}>
                      No reviews yet
                    </p>
                  </div>
                ) : (
                  (data.recent_reviews || []).map((review) => (
                    <article
                      key={review.id}
                      style={{ ...card, marginBottom: 12 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            color: "#333",
                            fontSize: 14,
                          }}
                        >
                          {review.user_name}
                        </span>

                        <time
                          style={{ fontSize: 12, color: "#aaa" }}
                          dateTime={review.created_at}
                        >
                          {review.created_at
                            ? new Date(review.created_at).toLocaleDateString()
                            : ""}
                        </time>
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
                          style={{
                            color: "#888",
                            fontSize: 12,
                            marginLeft: 6,
                          }}
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
                    </article>
                  ))
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color, iconBg }) {
  return (
    <div
      style={{
        background: color || "#fff",
        border: "1px solid #e7e7e7",
        borderRadius: 14,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: iconBg || "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          flexShrink: 0,
        }}
        role="img"
        aria-label={title}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            color: "#888",
            fontWeight: 700,
            marginBottom: 2,
            textTransform: "uppercase",
            letterSpacing: 0.5,
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

const card = {
  background: "#fff",
  border: "1px solid #e8e8e8",
  borderRadius: 12,
  padding: "16px 18px",
};

const sectionTitle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: "#2d2d2d",
};

const outlineBtn = {
  background: "#fff",
  color: "#333",
  border: "1px solid #d0d0d0",
  borderRadius: 8,
  padding: "7px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const redBtn = {
  background: "#d32323",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "7px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const selectSm = {
  padding: "4px 8px",
  border: "1px solid #d0d0d0",
  borderRadius: 6,
  fontSize: 12,
  fontFamily: "inherit",
  background: "#fff",
  cursor: "pointer",
};
