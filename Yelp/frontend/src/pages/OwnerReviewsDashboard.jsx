import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ownerAPI } from "../services/api";

const STARS = (n) => "★".repeat(Math.max(0, Math.min(5, n)));

export default function OwnerReviewsDashboard() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [selectedId, setSelectedId]   = useState("all");
  const [reviews, setReviews]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [revLoading, setRevLoading]   = useState(false);
  const [sortBy, setSortBy]           = useState("newest");
  const [minRating, setMinRating]     = useState("");
  const [error, setError]             = useState("");

  // Load owned restaurants on mount
  useEffect(() => {
    ownerAPI.dashboard()
      .then(res => {
        const rests = res.data.restaurants || [];
        setRestaurants(rests);
        // Load all reviews across all restaurants initially
        loadAllReviews(rests, "newest", "");
      })
      .catch(err => setError(err.response?.data?.detail || "Failed to load restaurants"))
      .finally(() => setLoading(false));
  }, []);

  const loadAllReviews = async (rests, sort, minR) => {
    setRevLoading(true);
    try {
      const all = [];
      for (const r of rests) {
        const params = { sort_by: sort };
        if (minR) params.min_rating = minR;
        const res = await ownerAPI.getRestaurantReviews(r.id, params);
        (res.data || []).forEach(rev => all.push({ ...rev, restaurant_name: r.name }));
      }
      // Sort combined list
      if (sort === "newest") all.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      else if (sort === "oldest") all.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
      else if (sort === "highest") all.sort((a,b) => b.rating - a.rating);
      else if (sort === "lowest") all.sort((a,b) => a.rating - b.rating);
      setReviews(all);
    } catch { setReviews([]); }
    finally { setRevLoading(false); }
  };

  const loadRestaurantReviews = async (restId, sort, minR) => {
    setRevLoading(true);
    try {
      const params = { sort_by: sort };
      if (minR) params.min_rating = minR;
      const res = await ownerAPI.getRestaurantReviews(restId, params);
      const rest = restaurants.find(r => r.id === restId);
      setReviews((res.data || []).map(rev => ({ ...rev, restaurant_name: rest?.name || "" })));
    } catch { setReviews([]); }
    finally { setRevLoading(false); }
  };

  const applyFilters = () => {
    if (selectedId === "all") loadAllReviews(restaurants, sortBy, minRating);
    else loadRestaurantReviews(selectedId, sortBy, minRating);
  };

  const handleRestaurantChange = (id) => {
    setSelectedId(id);
    if (id === "all") loadAllReviews(restaurants, sortBy, minRating);
    else loadRestaurantReviews(id, sortBy, minRating);
  };

  // Rating distribution for current reviews
  const dist = [5,4,3,2,1].map(s => ({
    star: s,
    count: reviews.filter(r => r.rating === s).length,
  }));
  const total = reviews.length;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>
      <Navbar onSearch={({ find, near }) => navigate(`/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`)} />

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px 60px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <button onClick={() => navigate("/owner/dashboard")} style={backBtn}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
              Back to Dashboard
            </button>
            <h1 style={{ margin: "8px 0 4px", fontSize: 26, fontWeight: 800, color: "#2d2d2d" }}>Reviews</h1>
            <p style={{ margin: 0, fontSize: 14, color: "#888" }}>Read-only view of all customer reviews for your restaurants.</p>
          </div>
        </div>

        {error && <div style={errorBox} role="alert">{error}</div>}
        {loading && <div style={{ color: "#999" }} role="status">Loading…</div>}

        {!loading && (
          <>
            {/* Filters bar */}
            <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
              {/* Restaurant selector */}
              <div>
                <label style={labelStyle} htmlFor="rest-filter">Restaurant</label>
                <select id="rest-filter" value={selectedId} onChange={e => handleRestaurantChange(e.target.value)} style={selectStyle}>
                  <option value="all">All Restaurants</option>
                  {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label style={labelStyle} htmlFor="sort-filter">Sort by</label>
                <select id="sort-filter" value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="highest">Highest rating</option>
                  <option value="lowest">Lowest rating</option>
                </select>
              </div>

              {/* Min rating */}
              <div>
                <label style={labelStyle} htmlFor="min-rating">Min rating</label>
                <select id="min-rating" value={minRating} onChange={e => setMinRating(e.target.value)} style={selectStyle}>
                  <option value="">All ratings</option>
                  {[5,4,3,2,1].map(s => <option key={s} value={s}>{s} ★ & above</option>)}
                </select>
              </div>

              <button onClick={applyFilters} style={{ ...redBtn, alignSelf: "flex-end" }}>Apply Filters</button>

              <div style={{ marginLeft: "auto", fontSize: 13, color: "#888", fontWeight: 600 }}>
                {revLoading ? "Loading…" : `${reviews.length} review${reviews.length !== 1 ? "s" : ""}`}
              </div>
            </div>

            {/* Rating distribution summary */}
            {total > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "18px 20px", marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
                  {/* Average */}
                  <div style={{ textAlign: "center", minWidth: 80 }}>
                    <div style={{ fontSize: 40, fontWeight: 800, color: "#2d2d2d", lineHeight: 1 }}>
                      {(reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)}
                    </div>
                    <div style={{ color: "#d32323", fontSize: 18, margin: "4px 0 2px" }}>{"★".repeat(Math.round(reviews.reduce((s,r)=>s+r.rating,0)/total))}</div>
                    <div style={{ fontSize: 12, color: "#aaa" }}>{total} reviews</div>
                  </div>
                  {/* Bars */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    {dist.map(({ star, count }) => {
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#666", width: 14, textAlign: "right" }}>{star}</span>
                          <span style={{ color: "#d32323", fontSize: 12 }}>★</span>
                          <div style={{ flex: 1, background: "#f3f3f3", borderRadius: 4, height: 10, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, background: "#d32323", height: "100%", borderRadius: 4, transition: "width 0.3s" }} />
                          </div>
                          <span style={{ fontSize: 11, color: "#aaa", width: 22 }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews list */}
            {revLoading ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa" }} role="status">Loading reviews…</div>
            ) : reviews.length === 0 ? (
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "48px 24px", textAlign: "center", color: "#aaa" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✏️</div>
                <p style={{ fontWeight: 700, color: "#555", margin: "0 0 6px" }}>No reviews found</p>
                <p style={{ fontSize: 13, margin: 0 }}>Try adjusting the filters above.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {reviews.map((rev) => (
                  <article key={`${rev.restaurant_name}-${rev.id}`} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#2d2d2d", marginBottom: 2 }}>{rev.user_name}</div>
                        {rev.restaurant_name && (
                          <div style={{ fontSize: 12, color: "#d32323", fontWeight: 600, marginBottom: 4 }}>
                            📍 {rev.restaurant_name}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#d32323", fontSize: 16 }} aria-label={`${rev.rating} stars`}>{STARS(rev.rating)}</span>
                          <span style={{ fontSize: 13, color: "#888" }}>{rev.rating}/5</span>
                        </div>
                      </div>
                      <time style={{ fontSize: 12, color: "#aaa" }} dateTime={rev.created_at}>
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : ""}
                      </time>
                    </div>

                    <p style={{ margin: "0 0 10px", color: "#555", fontSize: 14, lineHeight: 1.6 }}>
                      {rev.comment || <em style={{ color: "#bbb" }}>No comment written</em>}
                    </p>

                    {/* Review photos */}
                    {rev.photo_urls?.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {rev.photo_urls.map((url, i) => (
                          <img key={i} src={url} alt={`Review photo ${i + 1}`}
                            style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }} />
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const backBtn   = { background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 13, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 };
const selectStyle = { padding: "8px 12px", border: "1px solid #d0d0d0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", background: "#fff", cursor: "pointer", color: "#333" };
const redBtn    = { background: "#d32323", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
const errorBox  = { marginBottom: 16, padding: "10px 14px", background: "#fef2f2", color: "#b91c1c", borderRadius: 8, fontWeight: 700, fontSize: 14 };
