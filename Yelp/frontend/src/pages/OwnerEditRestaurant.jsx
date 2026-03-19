import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ownerAPI, restaurantAPI } from "../services/api";

export default function OwnerEditRestaurant() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    cuisine_type: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    contact_phone: "",
    contact_email: "",
    description: "",
    hours_text: "",
    photos: "",
    keywords: "",
    price_range: "",
    amenities: "",
    is_open: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    restaurantAPI
      .getById(id)
      .then((res) => {
        const r = res.data;

        setForm({
          name: r.name || "",
          cuisine_type: r.cuisine_type || "",
          address: r.address || "",
          city: r.city || "",
          state: r.state || "",
          zip_code: r.zip_code || "",
          contact_phone: r.contact_phone || "",
          contact_email: r.contact_email || "",
          description: r.description || "",
          hours_text: r.hours_text || "",
          photos: Array.isArray(r.photos) ? r.photos.join(", ") : "",
          keywords: Array.isArray(r.keywords) ? r.keywords.join(", ") : "",
          price_range: r.price_range || "",
          amenities: Array.isArray(r.amenities) ? r.amenities.join(", ") : "",
          is_open: typeof r.is_open === "boolean" ? r.is_open : true,
        });
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Failed to load restaurant");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toList = (value) => {
    if (!value.trim()) return [];
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      name: form.name,
      cuisine_type: form.cuisine_type,
      address: form.address,
      city: form.city,
      state: form.state || null,
      zip_code: form.zip_code || null,
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
      description: form.description || null,
      hours_text: form.hours_text || null,
      photos: toList(form.photos),
      keywords: toList(form.keywords),
      price_range: form.price_range || null,
      amenities: toList(form.amenities),
      is_open: form.is_open,
    };

    try {
      await ownerAPI.updateRestaurant(id, payload);
      setMessage("Restaurant updated successfully");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update restaurant");
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
        style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 60px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
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
            Edit Restaurant
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
              <div style={gridStyle}>
                <div>
                  <label style={labelStyle}>Restaurant Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Restaurant name"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Cuisine Type</label>
                  <input
                    name="cuisine_type"
                    value={form.cuisine_type}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Indian, Italian, Mexican..."
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Street address"
                />
              </div>

              <div style={gridStyle}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="City"
                  />
                </div>

                <div>
                  <label style={labelStyle}>State</label>
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="State"
                  />
                </div>
              </div>

              <div style={gridStyle}>
                <div>
                  <label style={labelStyle}>Zip Code</label>
                  <input
                    name="zip_code"
                    value={form.zip_code}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Zip code"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Price Range</label>
                  <input
                    name="price_range"
                    value={form.price_range}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="$, $$, $$$"
                  />
                </div>
              </div>

              <div style={gridStyle}>
                <div>
                  <label style={labelStyle}>Contact Phone</label>
                  <input
                    name="contact_phone"
                    value={form.contact_phone}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Contact Email</label>
                  <input
                    name="contact_email"
                    value={form.contact_email}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Email"
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Hours</label>
                <input
                  name="hours_text"
                  value={form.hours_text}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Mon-Sun 11AM-10PM"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  style={textareaStyle}
                  placeholder="Write a short restaurant description"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Photos</label>
                <input
                  name="photos"
                  value={form.photos}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Comma-separated photo URLs"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Keywords</label>
                <input
                  name="keywords"
                  value={form.keywords}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Comma-separated keywords"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Amenities</label>
                <input
                  name="amenities"
                  value={form.amenities}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Comma-separated amenities"
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    ...labelStyle,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    name="is_open"
                    checked={form.is_open}
                    onChange={handleChange}
                  />
                  Restaurant is open
                </label>
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
                {saving ? "Saving..." : "Save Restaurant Changes"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  marginBottom: 16,
};

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

const textareaStyle = {
  ...inputStyle,
  minHeight: 110,
  resize: "vertical",
};
