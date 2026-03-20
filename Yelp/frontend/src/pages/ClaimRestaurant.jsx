import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import SearchAutocomplete from "../components/SearchAutocomplete";
import { CityAutocomplete } from "../components/CityAutocomplete";
import { restaurantAPI, ownerAPI } from "../services/api";

export default function ClaimRestaurant() {
  const navigate = useNavigate();
  const [query, setQuery]     = useState("");
  const [city, setCity]       = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [claimingId, setClaimingId] = useState(null);
  const [msg, setMsg]   = useState("");
  const [error, setError] = useState("");

  const doSearch = async (q = query, loc = city) => {
    if (!q.trim() && !loc.trim()) return;
    setSearching(true); setSearched(false); setMsg(""); setError("");
    try {
      const res = await restaurantAPI.search({ q: q.trim(), location: loc.trim(), limit: 20 });
      setResults(res.data.restaurants || []);
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Search failed");
    } finally { setSearching(false); }
  };

  const handleQuerySelect = (val) => { setQuery(val); doSearch(val, city); };
  const handleCitySelect  = (val) => { setCity(val);  doSearch(query, val); };

  const handleClaim = async (restaurantId, restaurantName) => {
    setClaimingId(restaurantId); setMsg(""); setError("");
    try {
      await ownerAPI.claimRestaurant(restaurantId);
      setMsg(`Successfully claimed "${restaurantName}"! Redirecting…`);
      setTimeout(() => navigate("/owner/dashboard"), 1800);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not claim restaurant");
    } finally { setClaimingId(null); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>
      <Navbar onSearch={({ find, near }) => navigate(`/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`)} />

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px 60px" }}>
        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => navigate("/owner/dashboard")} style={backBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Back to Dashboard
          </button>
          <h1 style={{ margin: "8px 0 4px", fontSize: 28, fontWeight: 800, color: "#2d2d2d" }}>Claim a Restaurant</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Search for your restaurant and claim it to manage its profile.</p>
        </div>

        {/* Search bar */}
        <div style={{ display: "flex", background: "#fff", border: "1px solid #d0d0d0", borderRadius: 10, overflow: "visible", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 24, position: "relative", zIndex: 100 }}>
          <div style={{ flex: 2, display: "flex", alignItems: "center", padding: "0 14px", gap: 8, borderRight: "1px solid #e8e8e8", position: "relative", zIndex: 200 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <SearchAutocomplete value={query} onChange={setQuery} onSelect={handleQuerySelect}
              placeholder="Restaurant name…"
              inputStyle={{ fontSize: 15, height: 50, border: "none", background: "transparent", boxShadow: "none", paddingRight: query ? "28px" : "0" }} />
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 10px", gap: 8, position: "relative", zIndex: 150 }}>
            <svg width="12" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" style={{ flexShrink: 0 }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
            <CityAutocomplete value={city} onChange={setCity} onSelect={handleCitySelect}
              placeholder="City (optional)"
              inputStyle={{ height: "44px", border: "none", borderRadius: 0, padding: "0 4px", paddingRight: city ? "28px" : "4px", fontSize: 14, background: "transparent", boxShadow: "none" }} />
          </div>
          <button onClick={() => doSearch(query, city)} disabled={searching || (!query.trim() && !city.trim())} aria-label="Search"
            style={{ background: "#d32323", border: "none", borderRadius: "0 10px 10px 0", cursor: "pointer", width: 54, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: (!query.trim() && !city.trim()) ? 0.5 : 1 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </button>
        </div>

        {msg   && <div style={{ marginBottom: 16, padding: "12px 16px", background: "#ecfdf3", color: "#166534", borderRadius: 8, fontWeight: 700, fontSize: 14 }} role="alert">{msg}</div>}
        {error && <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fef2f2", color: "#b91c1c", borderRadius: 8, fontWeight: 700, fontSize: 14 }} role="alert">{error}</div>}

        {searching && <div style={{ textAlign: "center", color: "#aaa", padding: "40px 0" }} role="status">Searching…</div>}

        {!searching && searched && results.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "40px 24px", textAlign: "center", color: "#888" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
            <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 15, color: "#555" }}>No restaurants found</p>
            <p style={{ margin: 0, fontSize: 13 }}>Try a different name or city.</p>
          </div>
        )}

        {!searching && results.length > 0 && (
          <section aria-label="Search results">
            <p style={{ fontSize: 13, color: "#888", fontWeight: 700, margin: "0 0 14px" }}>
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </p>
            {results.map((r) => (
              <article key={r.id} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "16px 18px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flex: 1, minWidth: 200 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#f3f3f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {r.photos?.[0]
                      ? <img src={r.photos[0]} alt={`${r.name} restaurant photo`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 28 }}>🍽️</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#2d2d2d", marginBottom: 3 }}>{r.name}</div>
                    <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>{r.cuisine_type} · {r.city}{r.state ? `, ${r.state}` : ""}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#d32323", fontSize: 13 }}>{"★".repeat(Math.round(r.average_rating || 0))}</span>
                      <span style={{ fontSize: 12, color: "#aaa" }}>{r.review_count} reviews</span>
                      {r.owner_id
                        ? <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#fef9c3", color: "#854d0e" }}>Already claimed</span>
                        : <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#166534" }}>Available</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => navigate(`/restaurant/${r.id}`)} style={outlineBtn}>View</button>
                  {!r.owner_id && (
                    <button onClick={() => handleClaim(r.id, r.name)} disabled={claimingId === r.id}
                      style={{ ...redBtn, opacity: claimingId === r.id ? 0.7 : 1, cursor: claimingId === r.id ? "not-allowed" : "pointer" }}>
                      {claimingId === r.id ? "Claiming…" : "Claim"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        {/* How it works */}
        <aside style={{ marginTop: 32, background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "16px 20px" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#1e40af" }}>How claiming works</h3>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
            <li>Search for your restaurant by name or city above.</li>
            <li>Click <strong>Claim</strong> on an unclaimed listing.</li>
            <li>You can then edit all details from your dashboard.</li>
            <li>If your restaurant isn't listed, ask a user to add it first.</li>
          </ol>
        </aside>
      </main>
    </div>
  );
}

const outlineBtn = { background: "#fff", color: "#333", border: "1px solid #d0d0d0", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
const backBtn = { background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 13, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" };
const redBtn     = { background: "#d32323", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, fontFamily: "inherit" };
