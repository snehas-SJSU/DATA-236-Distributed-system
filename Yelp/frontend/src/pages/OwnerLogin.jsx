import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function OwnerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await authAPI.loginOwner({ email, password });
      login(res.data.owner, res.data.access_token, "owner");
      navigate("/owner/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally { setLoading(false); }
  };

  return (
    <div style={shell} className="owner-login-layout">
      {/* Left panel — branding */}
      {/* <div style={leftPanel} className="owner-login-left">
        <div style={{ position: "relative", zIndex: 2 }}>

          <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", fontFamily: "Georgia,serif", letterSpacing: -2, marginBottom: 12 }}>
            yelp<span style={{ fontSize: 16, verticalAlign: "super", marginLeft: 2 }}>★</span>
          </div>
          <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 12px", lineHeight: 1.2 }}>
            Grow your<br />restaurant business
          </h2>
          <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 14, lineHeight: 1.7, margin: "0 0 32px", maxWidth: 260 }}>
            Manage your listing, respond to reviews, upload photos, and track your performance — all in one place.
          </p>


          {[
            "Claim & manage your restaurant profile",
            "View and respond to customer reviews",
            "Track ratings and performance analytics",
            "Upload photos and update business hours",
          ].map((feat) => (
            <div key={feat} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.5 }}>{feat}</span>
            </div>
          ))}
        </div>


        <div style={{ position: "absolute", bottom: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)", zIndex: 1 }} />
        <div style={{ position: "absolute", top: -40, right: 40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)", zIndex: 1 }} />
      </div> */}

      {/* Right panel — form */}
      <div style={rightPanel}>
        <div style={formCard}>
          {/* Back to home */}
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 13, fontWeight: 600, padding: "0 0 20px", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Back to home
          </button>

          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#2d2d2d" }}>Log In</h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#999" }}>Welcome back! Sign in to manage your restaurant.</p>

          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fff5f5", border: "1px solid #fcc", borderRadius: 8, color: "#d32323", fontWeight: 700, fontSize: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            <label style={labelStyle}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Enter Your Email" required autoComplete="email"
              style={inputStyle} />

            <label style={{ ...labelStyle, marginTop: 14 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Your password" required autoComplete="current-password"
              style={inputStyle} />

            <button type="submit" disabled={loading}
              style={{ width: "100%", height: 46, background: loading ? "#e0e0e0" : "#d32323", color: loading ? "#aaa" : "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 22, transition: "background 0.15s" }}>
              {loading ? "Signing in…" : "Login"}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: "16px", background: "#fafafa", borderRadius: 10, border: "1px solid #f0f0f0" }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "#555", fontWeight: 600 }}>Don't have an account?</p>
            <Link to="/owner/signup" style={{ color: "#d32323", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
              Create an account →
            </Link>
          </div>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#bbb" }}>
            Not a business owner?{" "}
            <Link to="/login" style={{ color: "#555", fontWeight: 600 }}>User login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const shell      = { fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif", display: "flex", minHeight: "100vh" };
const leftPanel  = { background: "linear-gradient(145deg, #d32323 0%, #a01818 100%)", padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", overflow: "hidden" };
const rightPanel = { flex: 1, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" };
const formCard   = { width: "100%", maxWidth: 400, background: "#fff", borderRadius: 16, padding: "32px 32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #ececec" };
const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 6 };
const inputStyle = { width: "100%", height: 44, border: "1px solid #d0d0d0", borderRadius: 10, padding: "0 14px", boxSizing: "border-box", fontSize: 14, fontFamily: "inherit", color: "#222", background: "#fff", outline: "none" };
