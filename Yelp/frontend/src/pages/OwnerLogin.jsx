import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function OwnerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await authAPI.loginOwner({ email, password });
      login(res.data.owner, res.data.access_token, "owner");
      navigate("/owner/dashboard");
    } catch (err) { setError(err.response?.data?.detail || "Login failed"); } finally { setLoading(false); }
  };

  return <AuthShell title="Owner Log In" subtitle="Manage your restaurant listing" error={error}><form onSubmit={submit}><Input value={email} onChange={setEmail} placeholder="Email" /><Input value={password} onChange={setPassword} placeholder="Password" type="password" /><button style={submitBtn} disabled={loading}>{loading ? "Logging in..." : "Log In"}</button><p style={{ fontSize: 12, color: "#666" }}>Need an owner account? <Link to="/owner/signup">Sign up</Link></p></form></AuthShell>;
}

function AuthShell({ title, subtitle, error, children }) { return <div style={shell}><div style={card}><h1 style={{ marginTop: 0, color: "#d32323" }}>{title}</h1><p style={{ color: "#666" }}>{subtitle}</p>{error && <div style={{ color: "#d32323", marginBottom: 10, fontWeight: 700 }}>{error}</div>}{children}<p style={{ fontSize: 12, color: "#666" }}><Link to="/login">User login</Link></p></div></div>; }
function Input({ value, onChange, ...props }) { return <input {...props} value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", height: 40, marginBottom: 10, border: "1px solid #ccc", borderRadius: 6, padding: "0 12px" }} />; }
const shell = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" };
const card = { width: 420, background: "#fff", border: "1px solid #e7e7e7", borderRadius: 12, padding: 24 };
const submitBtn = { width: "100%", height: 40, background: "#d32323", color: "#fff", border: "none", borderRadius: 6, fontWeight: 800, cursor: "pointer", marginBottom: 10 };
