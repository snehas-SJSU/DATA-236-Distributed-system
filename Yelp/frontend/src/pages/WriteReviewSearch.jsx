import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { restaurantAPI } from "../services/api";
import SearchAutocomplete from "../components/SearchAutocomplete";
import { CityAutocomplete } from "../components/CityAutocomplete";

/**
 * WriteReviewSearch — shown when user clicks "Write a Review" from navbar.
 * User searches for a restaurant by name using autocomplete, then selects it.
 */
export default function WriteReviewSearch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery]       = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);

  // Redirect to login if not logged in
  useEffect(() => { if (!user) navigate("/login"); }, [user, navigate]);

  const handleSearch = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await restaurantAPI.search({
        q: q.trim(),
        location: location.trim(),
        sort_by: "rating",
        limit: 20,
      });
      setResults(res.data.restaurants || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Search when user picks from autocomplete
  const handleQuerySelect = (val) => {
    setQuery(val);
    handleSearch(val);
  };

  // Debounced search as user types
  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearched(false); return; }
    const timer = setTimeout(() => handleSearch(query), 500);
    return () => clearTimeout(timer);
  }, [query, location]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#c60000", padding: "0 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "center", height: 60, gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", fontSize: 22, padding: 4, lineHeight: 1 }} aria-label="Go back">←</button>
          <span style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>Write a Review</span>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 60px" }}>
        <p style={{ color: "#555", fontSize: 15, margin: "0 0 24px" }}>
          Search for the restaurant you want to review, then select it from the results.
        </p>

        {/* Search form */}
        <div style={{ display: "flex", gap: 0, background: "#fff", border: "1px solid #ccc", borderRadius: 8, overflow: "visible", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: 24, position: "relative", zIndex: 100 }}>

          {/* Restaurant name — SearchAutocomplete */}
          <div style={{ flex: 2, display: "flex", alignItems: "center", padding: "0 14px", gap: 8, borderRight: "1px solid #e0e0e0", position: "relative", zIndex: 200 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <SearchAutocomplete
              value={query}
              onChange={(val) => setQuery(val)}
              onSelect={handleQuerySelect}
              placeholder="Restaurant name…"
              inputStyle={{ fontSize: 15, height: 48 }}
            />
          </div>

          {/* Location — CityAutocomplete */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 8px", gap: 8, position: "relative", zIndex: 150 }}>
            <svg width="12" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <CityAutocomplete
              value={location}
              onChange={(city) => setLocation(city)}
              placeholder="City (optional)"
              inputStyle={{ height: "36px", border: "none", borderRadius: 0, padding: "0 4px", fontSize: 14, background: "transparent", boxShadow: "none" }}
            />
          </div>

          <button
            onClick={() => handleSearch(query)}
            style={{ background: "#d32323", border: "none", cursor: "pointer", width: 52, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: "0 8px 8px 0" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

        {/* Loading */}
        {loading && <div style={{ textAlign: "center", color: "#aaa", padding: "40px 0" }}>Searching…</div>}

        {/* No results */}
        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
            <p style={{ fontWeight: 700, color: "#555", fontSize: 16, margin: "0 0 6px" }}>No restaurants found</p>
            <p style={{ color: "#999", fontSize: 14, margin: 0 }}>Try a different name or clear the city filter.</p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div>
            <p style={{ fontSize: 13, color: "#888", fontWeight: 700, margin: "0 0 12px" }}>
              {results.length} result{results.length !== 1 ? "s" : ""} — click a restaurant to write your review
            </p>
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/review/${r.id}`)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
              >
                <div style={{ width: 64, height: 64, borderRadius: 8, flexShrink: 0, overflow: "hidden", background: "linear-gradient(135deg,#e74c3c,#c0392b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {r.photos?.[0]
                    ? <img src={r.photos[0]} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 28 }}>🍽️</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#2d2d2d", marginBottom: 2 }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: "#777", marginBottom: 3 }}>
                    {r.cuisine_type}{r.city ? ` · ${r.city}` : ""}{r.price_range ? ` · ${r.price_range}` : ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#d32323", fontSize: 13 }}>
                      {"★".repeat(Math.round(r.average_rating || 0))}{"☆".repeat(5 - Math.round(r.average_rating || 0))}
                    </span>
                    <span style={{ fontSize: 12, color: "#aaa" }}>{r.review_count || 0} reviews</span>
                  </div>
                </div>
                <div style={{ color: "#ccc", fontSize: 20, flexShrink: 0 }}>›</div>
              </button>
            ))}
          </div>
        )}

        {/* Initial prompt */}
        {!searched && !loading && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✏️</div>
            <p style={{ fontSize: 15, color: "#999", margin: 0 }}>Type a restaurant name above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
