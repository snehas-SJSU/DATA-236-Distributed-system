import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { CityAutocomplete } from "../components/CityAutocomplete";
import { ownerAPI } from "../services/api";

export default function OwnerProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", restaurant_location: "" });
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([ownerAPI.getProfile(), ownerAPI.dashboard()])
      .then(([profileRes, dashRes]) => {
        setForm({
          name: profileRes.data.name || "",
          email: profileRes.data.email || "",
          restaurant_location: profileRes.data.restaurant_location || "",
        });
        setRestaurants(dashRes.data.restaurants || []);
      })
      .catch((err) => setError(err.response?.data?.detail || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await ownerAPI.updateProfile(form);
      setForm({ name: res.data.name || "", email: res.data.email || "", restaurant_location: res.data.restaurant_location || "" });
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>
      <Navbar onSearch={({ find, near }) => navigate(`/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`)} />

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <button onClick={() => navigate("/owner/dashboard")} style={backBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
              Back to Dashboard
            </button>
            <h1 style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 800, color: "#2d2d2d" }}>Profile</h1>
          </div>
        </div>

        {loading && <div style={{ color: "#999" }} role="status">Loading…</div>}

        {!loading && (
          <>
            {/* ── Owner account details ── */}
            <section aria-label="Owner account details" style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "24px", marginBottom: 24 }}>
              <h2 style={{ margin: "0 0 18px", fontSize: 18, fontWeight: 800, color: "#2d2d2d" }}>Account Details</h2>

              {message && <div style={successBox} role="status">{message}</div>}
              {error && <div style={errorBox} role="alert">{error}</div>}

              <form onSubmit={handleSubmit} aria-label="Update owner profile">
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="owner-name" style={labelStyle}>Owner Name</label>
                  <input id="owner-name" type="text" name="name" value={form.name} onChange={handleChange} style={inputStyle} placeholder="Enter your name" required />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="owner-email" style={labelStyle}>Email</label>
                  <input id="owner-email" type="email" name="email" value={form.email} onChange={handleChange} style={inputStyle} placeholder="Enter your email" required />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Restaurant Location</label>
                  <CityAutocomplete
                    value={form.restaurant_location}
                    onChange={(city) => setForm(p => ({ ...p, restaurant_location: city }))}
                    placeholder="City, State (e.g. San Jose, CA)"
                    inputStyle={{ ...inputStyle, height: 42, padding: "0 12px" }}
                  />
                </div>
                <button type="submit" disabled={saving} aria-busy={saving}
                  style={{ background: "#d32323", color: "#fff", border: "none", borderRadius: 6, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontFamily: "inherit" }}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </form>
            </section>

            {/* ── Managed restaurants overview ── */}
            <section aria-label="Your managed restaurants">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#2d2d2d" }}>
                  Your Restaurants ({restaurants.length})
                </h2>
                <button onClick={() => navigate("/owner/claim")} style={redBtn}>+ Claim a Restaurant</button>
              </div>

              {restaurants.length === 0 ? (
                <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: "28px 20px", textAlign: "center", color: "#999" }}>
                  <p style={{ margin: "0 0 12px", fontWeight: 700, color: "#555" }}>No restaurants yet</p>
                  <p style={{ margin: "0 0 16px", fontSize: 13 }}>Claim a restaurant to start managing it.</p>
                  <button onClick={() => navigate("/owner/claim")} style={redBtn}>Find & Claim Restaurant</button>
                </div>
              ) : (
                restaurants.map((r) => (
                  <article key={r.id} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: "16px 18px", marginBottom: 12 }} aria-label={r.name}>
                    {/* Photos */}
                    {r.photos?.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                        {r.photos.slice(0, 4).map((url, i) => (
                          <img key={i} src={url} alt={`${r.name} photo ${i + 1}`} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }} />
                        ))}
                      </div>
                    )}

                    <div style={{ fontWeight: 800, fontSize: 16, color: "#2d2d2d", marginBottom: 3 }}>{r.name}</div>
                    <div style={{ fontSize: 13, color: "#555", marginBottom: 3 }}>{r.cuisine_type} · {r.price_range || "—"}</div>
                    <div style={{ fontSize: 13, color: "#666", marginBottom: 3 }}>
                      📍 {[r.address, r.city, r.state, r.zip_code].filter(Boolean).join(", ")}
                    </div>
                    {r.contact_phone && <div style={{ fontSize: 13, color: "#666", marginBottom: 3 }}>📞 {r.contact_phone}</div>}
                    {r.contact_email && <div style={{ fontSize: 13, color: "#666", marginBottom: 3 }}>✉ {r.contact_email}</div>}
                    {r.hours_text && <div style={{ fontSize: 13, color: "#666", marginBottom: 3 }}>🕐 {r.hours_text}</div>}
                    {r.description && <p style={{ margin: "6px 0 10px", fontSize: 13, color: "#888", lineHeight: 1.5 }}>{r.description}</p>}

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      <button onClick={() => navigate(`/restaurant/${r.id}`)} style={outlineBtn} aria-label={`View ${r.name}`}>View</button>
                      <button onClick={() => navigate(`/owner/restaurants/${r.id}/edit`)} style={redBtn} aria-label={`Edit ${r.name}`}>Edit</button>
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

const labelStyle = { display: "block", marginBottom: 6, fontSize: 14, fontWeight: 700, color: "#333" };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d0d0d0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const outlineBtn = { background: "#fff", color: "#333", border: "1px solid #d0d0d0", borderRadius: 6, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
const backBtn = { background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 13, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" };
const redBtn = { background: "#d32323", color: "#fff", border: "none", borderRadius: 6, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
const successBox = { marginBottom: 16, padding: "10px 12px", borderRadius: 8, background: "#ecfdf3", color: "#166534", fontWeight: 700, fontSize: 14 };
const errorBox = { marginBottom: 16, padding: "10px 12px", borderRadius: 8, background: "#fef2f2", color: "#b91c1c", fontWeight: 700, fontSize: 14 };
