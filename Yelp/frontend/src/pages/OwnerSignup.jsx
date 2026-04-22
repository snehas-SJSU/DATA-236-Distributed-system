import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { CityAutocomplete } from "../components/CityAutocomplete";

export default function OwnerSignup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm]     = useState({ name: "", email: "", password: "", restaurant_location: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await authAPI.signupOwner(form);
      login(res.data.owner, res.data.access_token, "owner");
      navigate("/owner/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed");
    } finally { setLoading(false); }
  };

  return (
    <div style={shell}>
      <div style={card}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#d32323", fontFamily: "Georgia,serif", letterSpacing: -1, marginBottom: 4 }}>yelp</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#2d2d2d" }}>Sign Up</h1>
          <p style={{ margin: "6px 0 0", color: "#888", fontSize: 14 }}>Create an account to manage your restaurants.</p>
        </div>

        {error && <div style={{ color: "#d32323", marginBottom: 14, fontWeight: 700, fontSize: 14, background: "#fff5f5", border: "1px solid #fcc", borderRadius: 6, padding: "8px 12px" }}>{error}</div>}

        <form onSubmit={submit}>
          <label style={labelStyle}>Full Name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" required style={inputStyle} />

          <label style={labelStyle}>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" required style={inputStyle} />

          <label style={labelStyle}>Password</label>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Create a password" required style={inputStyle} />

          <label style={labelStyle}>Restaurant Location</label>
          <CityAutocomplete
            value={form.restaurant_location}
            onChange={(city) => setForm({ ...form, restaurant_location: city })}
            placeholder="City, State (e.g. San Jose, CA)"
            inputStyle={{ ...inputStyle, height: 42, boxShadow: "none" }}
          />

          <button type="submit" disabled={loading} style={submitBtn}>{loading ? "Creating…" : "Create account"}</button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#888", margin: "14px 0 0" }}>
          Already have an owner account?{" "}
          <Link to="/owner/login" style={{ color: "#d32323", fontWeight: 700 }}>Log in</Link>
        </p>
        <p style={{ textAlign: "center", fontSize: 13, color: "#888", margin: "8px 0 0" }}>
          Not a business owner?{" "}
          <Link to="/signup" style={{ color: "#d32323", fontWeight: 700 }}>User signup</Link>
        </p>
      </div>
    </div>
  );
}

const shell      = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" };
const card       = { width: 420, background: "#fff", border: "1px solid #e7e7e7", borderRadius: 14, padding: "28px 28px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" };
const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 5, marginTop: 12 };
const inputStyle = { width: "100%", height: 42, border: "1px solid #d0d0d0", borderRadius: 8, padding: "0 12px", boxSizing: "border-box", fontSize: 14, fontFamily: "inherit", color: "#222", background: "#fff", marginBottom: 2 };
const submitBtn  = { width: "100%", height: 44, background: "#d32323", color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer", fontSize: 15, fontFamily: "inherit", marginTop: 18 };
