import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function OwnerSignup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", restaurant_location: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await authAPI.signupOwner(form);
      login(res.data.owner, res.data.access_token, "owner");
      navigate("/owner/dashboard");
    } catch (err) { setError(err.response?.data?.detail || "Signup failed"); } finally { setLoading(false); }
  };

  return <div style={shell}><div style={card}><h1 style={{ marginTop: 0, color: "#d32323" }}>Owner Sign Up</h1><p style={{ color: "#666" }}>Create an owner account and manage your restaurants.</p>{error && <div style={{ color: "#d32323", marginBottom: 10, fontWeight: 700 }}>{error}</div>}<form onSubmit={submit}><Input placeholder="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} /><Input placeholder="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} /><Input placeholder="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} /><Input placeholder="Restaurant location" value={form.restaurant_location} onChange={(v) => setForm({ ...form, restaurant_location: v })} /><button style={submitBtn} disabled={loading}>{loading ? "Creating..." : "Create owner account"}</button></form><p style={{ fontSize: 12 }}><Link to="/owner/login">Already have an owner account?</Link></p></div></div>;
}
function Input({ value, onChange, ...props }) { return <input {...props} value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", height: 40, marginBottom: 10, border: "1px solid #ccc", borderRadius: 6, padding: "0 12px" }} />; }
const shell = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" };
const card = { width: 420, background: "#fff", border: "1px solid #e7e7e7", borderRadius: 12, padding: 24 };
const submitBtn = { width: "100%", height: 40, background: "#d32323", color: "#fff", border: "none", borderRadius: 6, fontWeight: 800, cursor: "pointer", marginBottom: 10 };
