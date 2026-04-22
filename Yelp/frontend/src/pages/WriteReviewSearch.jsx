import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { restaurantAPI } from "../services/api";
import Navbar from "../components/Navbar";
import SearchAutocomplete from "../components/SearchAutocomplete";
import { CityAutocomplete } from "../components/CityAutocomplete";

export default function WriteReviewSearch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery]       = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => { if (!user) navigate("/login"); }, [user, navigate]);

  const handleSearch = async (q = query, loc = location) => {
    // Allow search by name alone, location alone, or both
    if (!q.trim() && !loc.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await restaurantAPI.search({
        q: q.trim() || "",
        location: loc.trim(),
        sort_by: "rating",
        limit: 20,
      });
      setResults(res.data.restaurants || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const handleQuerySelect  = (val) => { setQuery(val);    handleSearch(val, location); };
  const handleLocationSelect = (city) => { setLocation(city); handleSearch(query, city); };

  // Debounce on query typing
  useEffect(() => {
    if (!query.trim() && !location.trim()) { setResults([]); setSearched(false); return; }
    const timer = setTimeout(() => handleSearch(query, location), 450);
    return () => clearTimeout(timer);
  }, [query, location]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>
      {/* Clean navbar — no search bar */}
      <Navbar hideSearch />

      <main style={{ maxWidth: 700, margin: "0 auto", padding: "36px 24px 60px" }}>

        {/* Back button */}
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 14, fontWeight: 600, padding: "0 0 18px", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Back
        </button>

        <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "#2d2d2d" }}>Write a Review</h1>
        <p style={{ color: "#888", fontSize: 14, margin: "0 0 24px" }}>
          Search by restaurant name or city, then select from the results below.
        </p>

        {/* Search bar */}
        <div style={{ display: "flex", background: "#fff", border: "1px solid #d0d0d0", borderRadius: 10, overflow: "visible", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 24, position: "relative", zIndex: 100 }}>
          {/* Name field */}
          <div style={{ flex: 2, display: "flex", alignItems: "center", padding: "0 14px", gap: 8, borderRight: "1px solid #ececec", position: "relative", zIndex: 200 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <SearchAutocomplete value={query} onChange={setQuery} onSelect={handleQuerySelect}
              placeholder="Restaurant name…"
              inputStyle={{ fontSize: 15, height: 50, border: "none", background: "transparent", boxShadow: "none" }} />
          </div>

          {/* City field */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 10px", gap: 8, position: "relative", zIndex: 150 }}>
            <svg width="12" height="15" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <CityAutocomplete value={location} onChange={setLocation} onSelect={handleLocationSelect}
              placeholder="City (optional)"
              inputStyle={{ height: "36px", border: "none", borderRadius: 0, padding: "0 4px", fontSize: 14, background: "transparent", boxShadow: "none" }} />
          </div>

          {/* Search button */}
          <button onClick={() => handleSearch(query, location)} aria-label="Search"
            style={{ background: "#d32323", border: "none", borderRadius: "0 10px 10px 0", cursor: "pointer", width: 52, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

        {/* States */}
        {loading && (
          <div style={{ textAlign: "center", color: "#aaa", padding: "48px 0" }} role="status">
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            Searching…
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
            <p style={{ fontWeight: 700, color: "#555", fontSize: 16, margin: "0 0 6px" }}>No restaurants found</p>
            <p style={{ color: "#999", fontSize: 14, margin: 0 }}>Try a different name or city.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div>
            <p style={{ fontSize: 13, color: "#aaa", fontWeight: 600, margin: "0 0 14px" }}>
              {results.length} result{results.length !== 1 ? "s" : ""} — tap to write your review
            </p>
            {results.map((r) => (
              <button key={r.id} onClick={() => navigate(`/review/${r.id}`)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1px solid #ececec", borderRadius: 12, padding: "14px 16px", marginBottom: 10, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "box-shadow 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.09)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ width: 60, height: 60, borderRadius: 10, flexShrink: 0, overflow: "hidden", background: "#f3f3f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {r.photos?.[0]
                    ? <img src={r.photos[0]} alt={`${r.name}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 26 }}>🍽️</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#2d2d2d", marginBottom: 2 }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
                    {r.cuisine_type}{r.city ? ` · ${r.city}` : ""}{r.price_range ? ` · ${r.price_range}` : ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#d32323", fontSize: 13 }}>{"★".repeat(Math.round(r.average_rating || 0))}</span>
                    <span style={{ fontSize: 12, color: "#bbb" }}>{r.review_count || 0} reviews</span>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {!searched && !loading && (
          <div style={{ textAlign: "center", padding: "56px 0 32px", color: "#bbb" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>✏️</div>
            <p style={{ fontSize: 15, color: "#aaa", margin: 0 }}>Search for a restaurant above to get started</p>
          </div>
        )}
      </main>
    </div>
  );
}
