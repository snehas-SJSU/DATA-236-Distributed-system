import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ownerAPI } from "../services/api";

export default function OwnerProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    restaurant_location: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    ownerAPI
      .getProfile()
      .then((res) => {
        setForm({
          name: res.data.name || "",
          email: res.data.email || "",
          restaurant_location: res.data.restaurant_location || "",
        });
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Failed to load owner profile");
      })
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
      setForm({
        name: res.data.name || "",
        email: res.data.email || "",
        restaurant_location: res.data.restaurant_location || "",
      });
      setMessage("Profile updated successfully");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

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
            `/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`,
          )
        }
      />

      <div
        style={{ maxWidth: 760, margin: "0 auto", padding: "28px 24px 60px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: "#2d2d2d",
            }}
          >
            Owner Profile
          </h1>

          <button
            onClick={() => navigate("/owner/dashboard")}
            style={{
              background: "#fff",
              color: "#333",
              border: "1px solid #d0d0d0",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Back to Dashboard
          </button>
        </div>

        {loading && <div style={{ color: "#999" }}>Loading…</div>}

        {!loading && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e8e8e8",
              borderRadius: 12,
              padding: "24px",
            }}
          >
            {message && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#ecfdf3",
                  color: "#166534",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {message}
              </div>
            )}

            {error && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Owner Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Enter your name"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Enter your email"
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Restaurant Location</label>
                <input
                  type="text"
                  name="restaurant_location"
                  value={form.restaurant_location}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Enter your restaurant location"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  background: "#d32323",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 700,
  color: "#333",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #d0d0d0",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
