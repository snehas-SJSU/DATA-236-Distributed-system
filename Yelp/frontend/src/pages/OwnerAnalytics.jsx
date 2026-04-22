import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ownerAPI } from "../services/api";

// ── helpers ────────────────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString();
const avg = (arr, key) =>
  arr.length ? arr.reduce((s, x) => s + (x[key] || 0), 0) / arr.length : 0;

// Simple bar using a div
function Bar({ pct, color = "#d32323", height = 10 }) {
  return (
    <div
      style={{
        background: "#f3f3f3",
        borderRadius: 99,
        height,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(100, pct)}%`,
          background: color,
          height: "100%",
          borderRadius: 99,
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

// Donut ring (pure SVG)
function Donut({ positive = 0, neutral = 0, negative = 0 }) {
  const total = positive + neutral + negative || 1;
  const r = 50;
  const circ = 2 * Math.PI * r;
  const posLen = (positive / total) * circ;
  const neuLen = (neutral / total) * circ;
  const negLen = (negative / total) * circ;

  // offsets: positive starts at top, then neutral, then negative
  const posOff = circ * 0.25; // start at 12 o'clock
  const neuOff = posOff - posLen;
  const negOff = neuOff - neuLen;

  const stroke = (len, offset, color) => (
    <circle
      cx="60"
      cy="60"
      r={r}
      fill="none"
      stroke={color}
      strokeWidth="18"
      strokeDasharray={`${len} ${circ - len}`}
      strokeDashoffset={offset}
      strokeLinecap="butt"
    />
  );

  return (
    <svg viewBox="0 0 120 120" width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
      {stroke(posLen, posOff, "#22c55e")}
      {stroke(neuLen, neuOff, "#eab308")}
      {stroke(negLen, negOff, "#ef4444")}
    </svg>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, color, title, value, sub }) {
  return (
    <div
      style={{
        background: color || "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: 14,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#999",
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#1d1d1d", lineHeight: 1 }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────────
export default function OwnerAnalytics() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("all"); // "all" or restaurant id

  useEffect(() => {
    ownerAPI
      .dashboard()
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(err.response?.data?.detail || "Failed to load analytics")
      )
      .finally(() => setLoading(false));
  }, []);

  // Derived data for selected restaurant (or all)
  const restaurants = data?.restaurants || [];
  const analytics = data?.analytics || {};

  const filteredRests =
    selectedId === "all"
      ? restaurants
      : restaurants.filter((r) => String(r.id) === String(selectedId));

  const totalViews = filteredRests.reduce((s, r) => s + (r.view_count || 0), 0);
  const totalReviews = filteredRests.reduce((s, r) => s + (r.review_count || 0), 0);
  const avgRating =
    filteredRests.filter((r) => r.review_count > 0).length > 0
      ? (
          filteredRests.reduce((s, r) => s + (r.average_rating || 0), 0) /
          filteredRests.filter((r) => r.review_count > 0).length
        ).toFixed(2)
      : "—";

  // Use global ratings distribution & sentiment when "all" is selected
  const dist =
    selectedId === "all"
      ? analytics.ratings_distribution || {}
      : (() => {
          // For a single restaurant, use its own review_count proxy
          // (we only have the distribution at global level from backend,
          //  so re-derive from all reviews in data.recent_reviews that match)
          const rev = (data?.recent_reviews || []).filter(
            (r) => String(r.restaurant_id) === String(selectedId)
          );
          const d = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          rev.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) d[r.rating]++; });
          return d;
        })();

  const sentiment =
    selectedId === "all"
      ? analytics.sentiment || {}
      : (() => {
          const rev = (data?.recent_reviews || []).filter(
            (r) => String(r.restaurant_id) === String(selectedId)
          );
          const s = { positive: 0, neutral: 0, negative: 0 };
          rev.forEach((r) => {
            if (r.rating >= 4) s.positive++;
            else if (r.rating === 3) s.neutral++;
            else s.negative++;
          });
          return s;
        })();

  const sentTotal =
    (sentiment.positive || 0) + (sentiment.neutral || 0) + (sentiment.negative || 0);

  const distTotal = Object.values(dist).reduce((s, v) => s + v, 0) || 1;

  // Best / worst restaurant by average rating
  const ranked = [...restaurants].sort(
    (a, b) => (b.average_rating || 0) - (a.average_rating || 0)
  );

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
            `/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`
          )
        }
      />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 80px" }}>
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <button
              onClick={() => navigate("/owner/dashboard")}
              style={backBtn}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#888"
                strokeWidth="2.5"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to Dashboard
            </button>
            <h1
              style={{
                margin: "8px 0 4px",
                fontSize: 28,
                fontWeight: 800,
                color: "#1d1d1d",
              }}
            >
              Analytics
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "#888" }}>
              Performance metrics and insights across your restaurants.
            </p>
          </div>

          {/* Restaurant filter */}
          {!loading && restaurants.length > 1 && (
            <div>
              <label
                htmlFor="rest-picker"
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#999",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Filter by restaurant
              </label>
              <select
                id="rest-picker"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Restaurants</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ color: "#aaa", fontSize: 15 }} role="status">
            Loading analytics…
          </div>
        )}
        {error && (
          <div style={errorBox} role="alert">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* ── KPI row ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
                marginBottom: 28,
              }}
            >
              <StatCard
                icon="🏪"
                iconBg="#fed7aa"
                color="#fff7ed"
                title="Restaurants"
                value={
                  selectedId === "all"
                    ? fmt(restaurants.length)
                    : filteredRests.length
                }
              />
              <StatCard
                icon="👁️"
                iconBg="#ddd6fe"
                color="#f5f3ff"
                title="Total Views"
                value={fmt(totalViews)}
                sub={
                  selectedId !== "all"
                    ? undefined
                    : restaurants.length > 0
                    ? `~${fmt(Math.round(totalViews / restaurants.length))} / restaurant`
                    : undefined
                }
              />
              <StatCard
                icon="✏️"
                iconBg="#bae6fd"
                color="#f0f9ff"
                title="Total Reviews"
                value={fmt(totalReviews)}
              />
              <StatCard
                icon="⭐"
                iconBg="#fef08a"
                color="#fefce8"
                title="Avg Rating"
                value={avgRating !== "—" ? `${avgRating} ★` : "—"}
                sub={totalReviews > 0 ? `from ${fmt(totalReviews)} reviews` : "No reviews yet"}
              />
            </div>

            {/* ── Charts row ── */}
            {totalReviews > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 20,
                  marginBottom: 28,
                }}
              >
                {/* Ratings distribution */}
                <section style={card} aria-label="Ratings distribution">
                  <h2 style={sectionTitle}>Ratings Distribution</h2>
                  <p style={subText}>
                    {distTotal} total review{distTotal !== 1 ? "s" : ""}
                  </p>
                  <div style={{ marginTop: 16 }}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = dist[star] || 0;
                      const pct = Math.round((count / distTotal) * 100);
                      return (
                        <div
                          key={star}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 10,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#555",
                              width: 14,
                              textAlign: "right",
                            }}
                          >
                            {star}
                          </span>
                          <span style={{ color: "#d32323", fontSize: 12 }}>★</span>
                          <div style={{ flex: 1 }}>
                            <Bar pct={pct} color="#d32323" height={10} />
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              color: "#888",
                              width: 36,
                              textAlign: "right",
                            }}
                          >
                            {count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Sentiment donut */}
                <section style={card} aria-label="Sentiment analysis">
                  <h2 style={sectionTitle}>Sentiment Analysis</h2>
                  <p style={subText}>Based on star rating buckets</p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      marginTop: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <Donut
                        positive={sentiment.positive || 0}
                        neutral={sentiment.neutral || 0}
                        negative={sentiment.negative || 0}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          pointerEvents: "none",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: "#1d1d1d",
                            lineHeight: 1,
                          }}
                        >
                          {sentTotal > 0
                            ? `${Math.round(((sentiment.positive || 0) / sentTotal) * 100)}%`
                            : "—"}
                        </div>
                        <div
                          style={{ fontSize: 10, color: "#aaa", fontWeight: 600 }}
                        >
                          positive
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      {[
                        {
                          key: "positive",
                          label: "Positive (4–5 ★)",
                          color: "#16a34a",
                          bar: "#22c55e",
                        },
                        {
                          key: "neutral",
                          label: "Neutral (3 ★)",
                          color: "#ca8a04",
                          bar: "#eab308",
                        },
                        {
                          key: "negative",
                          label: "Negative (1–2 ★)",
                          color: "#dc2626",
                          bar: "#ef4444",
                        },
                      ].map(({ key, label, color, bar }) => {
                        const count = sentiment[key] || 0;
                        const pct =
                          sentTotal > 0
                            ? Math.round((count / sentTotal) * 100)
                            : 0;
                        return (
                          <div key={key} style={{ marginBottom: 12 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 4,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color,
                                }}
                              >
                                {label}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color,
                                }}
                              >
                                {count} ({pct}%)
                              </span>
                            </div>
                            <Bar pct={pct} color={bar} height={8} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ── Restaurant performance table ── */}
            {restaurants.length > 0 && selectedId === "all" && (
              <section style={{ ...card, marginBottom: 28 }} aria-label="Restaurant performance">
                <h2 style={{ ...sectionTitle, marginBottom: 4 }}>
                  Restaurant Performance
                </h2>
                <p style={{ ...subText, marginBottom: 16 }}>
                  Ranked by average rating
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 13,
                    }}
                  >
                    <thead>
                      <tr>
                        {[
                          "Restaurant",
                          "Cuisine",
                          "City",
                          "Avg Rating",
                          "Reviews",
                          "Views",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "8px 12px",
                              textAlign: "left",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#999",
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              borderBottom: "2px solid #f0f0f0",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ranked.map((r, i) => (
                        <tr
                          key={r.id}
                          style={{
                            background: i % 2 === 0 ? "#fff" : "#fafafa",
                            cursor: "pointer",
                          }}
                          onClick={() => navigate(`/restaurant/${r.id}`)}
                        >
                          <td
                            style={{
                              padding: "10px 12px",
                              fontWeight: 700,
                              color: "#1d1d1d",
                            }}
                          >
                            {r.name}
                          </td>
                          <td style={{ padding: "10px 12px", color: "#555" }}>
                            {r.cuisine_type}
                          </td>
                          <td style={{ padding: "10px 12px", color: "#555" }}>
                            {r.city}
                            {r.state ? `, ${r.state}` : ""}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ color: "#d32323", fontWeight: 700 }}>
                              {r.average_rating > 0
                                ? `${r.average_rating.toFixed(1)} ★`
                                : "—"}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              color: "#555",
                              textAlign: "center",
                            }}
                          >
                            {r.review_count}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              color: "#555",
                              textAlign: "center",
                            }}
                          >
                            {fmt(r.view_count || 0)}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span
                              style={{
                                padding: "3px 10px",
                                borderRadius: 99,
                                fontSize: 11,
                                fontWeight: 700,
                                background: r.is_open ? "#dcfce7" : "#fee2e2",
                                color: r.is_open ? "#166534" : "#991b1b",
                              }}
                            >
                              {r.is_open ? "Open" : "Closed"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── Recent Reviews summary ── */}
            {(data.recent_reviews || []).length > 0 && (
              <section style={card} aria-label="Recent reviews summary">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <h2 style={sectionTitle}>Recent Reviews</h2>
                    <p style={{ ...subText, marginTop: 2 }}>
                      Latest customer feedback
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/owner/reviews")}
                    style={outlineBtn}
                  >
                    View All →
                  </button>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {(data.recent_reviews || [])
                    .filter(
                      (rev) =>
                        selectedId === "all" ||
                        String(rev.restaurant_id) === String(selectedId)
                    )
                    .slice(0, 5)
                    .map((rev) => {
                      const rest = restaurants.find(
                        (r) => r.id === rev.restaurant_id
                      );
                      return (
                        <article
                          key={rev.id}
                          style={{
                            display: "flex",
                            gap: 14,
                            padding: "12px 14px",
                            background: "#fafafa",
                            borderRadius: 10,
                            border: "1px solid #f0f0f0",
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "#d32323",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {(rev.user_name || "A")[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: 4,
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: 13,
                                  color: "#1d1d1d",
                                }}
                              >
                                {rev.user_name}
                              </span>
                              <time
                                style={{ fontSize: 11, color: "#bbb" }}
                                dateTime={rev.created_at}
                              >
                                {rev.created_at
                                  ? new Date(rev.created_at).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      }
                                    )
                                  : ""}
                              </time>
                            </div>
                            {rest && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#d32323",
                                  fontWeight: 600,
                                  marginBottom: 2,
                                }}
                              >
                                📍 {rest.name}
                              </div>
                            )}
                            <div
                              style={{
                                color: "#d32323",
                                fontSize: 13,
                                marginBottom: 3,
                              }}
                            >
                              {"★".repeat(rev.rating)}
                              <span
                                style={{ color: "#aaa", fontSize: 11, marginLeft: 4 }}
                              >
                                {rev.rating}/5
                              </span>
                            </div>
                            {rev.comment && (
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 13,
                                  color: "#555",
                                  lineHeight: 1.5,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {rev.comment}
                              </p>
                            )}
                          </div>
                        </article>
                      );
                    })}
                </div>
                {(data.recent_reviews || []).length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      color: "#aaa",
                      fontSize: 14,
                    }}
                  >
                    No reviews yet.
                  </div>
                )}
              </section>
            )}

            {/* Empty state */}
            {restaurants.length === 0 && (
              <div
                style={{
                  ...card,
                  textAlign: "center",
                  padding: "56px 24px",
                  color: "#aaa",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                <p
                  style={{
                    fontWeight: 700,
                    color: "#555",
                    margin: "0 0 8px",
                    fontSize: 16,
                  }}
                >
                  No data yet
                </p>
                <p style={{ margin: "0 0 20px", fontSize: 14 }}>
                  Claim or add a restaurant to see your analytics.
                </p>
                <button
                  onClick={() => navigate("/owner/claim")}
                  style={redBtn}
                >
                  + Claim a Restaurant
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── styles ─────────────────────────────────────────────────────────────────────
const card = {
  background: "#fff",
  border: "1px solid #e8e8e8",
  borderRadius: 14,
  padding: "20px 22px",
};
const sectionTitle = { margin: 0, fontSize: 17, fontWeight: 800, color: "#1d1d1d" };
const subText = { margin: 0, fontSize: 12, color: "#aaa" };
const backBtn = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#888",
  fontSize: 13,
  fontWeight: 600,
  padding: 0,
  display: "flex",
  alignItems: "center",
  gap: 5,
  fontFamily: "inherit",
};
const outlineBtn = {
  background: "#fff",
  color: "#333",
  border: "1px solid #d0d0d0",
  borderRadius: 8,
  padding: "7px 14px",
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
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};
const selectStyle = {
  padding: "9px 14px",
  border: "1px solid #d0d0d0",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "inherit",
  background: "#fff",
  cursor: "pointer",
  color: "#333",
};
const errorBox = {
  marginBottom: 16,
  padding: "10px 14px",
  background: "#fef2f2",
  color: "#b91c1c",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 14,
};
