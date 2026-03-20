import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { CityAutocomplete, StateAutocomplete } from "../components/CityAutocomplete";
import { ownerAPI } from "../services/api";

const CUISINES = [
  "American", "Italian", "Mexican", "Chinese", "Japanese",
  "Indian", "Thai", "Mediterranean", "Vegan", "Breakfast & Brunch",
  "Korean", "French", "Greek", "Spanish", "Middle Eastern", "Vietnamese", "Other",
];
const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

export default function OwnerAddRestaurant() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: "", cuisine_type: "", address: "", city: "", state: "",
    zip_code: "", contact_phone: "", contact_email: "", description: "",
    hours_text: "", keywords: "", price_range: "", amenities: "", is_open: true,
  });

  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotoFiles(files);
    setPhotoPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removePhoto = (idx) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const toList = (value) =>
    value.trim() ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      // 1. Create the restaurant
      const res = await ownerAPI.createRestaurant({
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
        keywords: toList(form.keywords),
        price_range: form.price_range || null,
        amenities: toList(form.amenities),
        is_open: form.is_open,
      });

      const newId = res.data.id;

      // 2. Upload photos if any
      if (photoFiles.length > 0) {
        setUploadingPhotos(true);
        const fd = new FormData();
        for (const f of photoFiles) fd.append("files", f);
        try {
          await ownerAPI.uploadRestaurantPhotos(newId, fd);
        } catch {
          setError("Restaurant created, but photo upload failed. You can add photos by editing the restaurant.");
          setUploadingPhotos(false);
          setSaving(false);
          setTimeout(() => navigate("/owner/dashboard"), 2500);
          return;
        }
        setUploadingPhotos(false);
      }

      setMessage("Restaurant created successfully! Redirecting…");
      setTimeout(() => navigate("/owner/dashboard"), 1200);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create restaurant");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = form.name.trim() && form.cuisine_type.trim() && form.address.trim() && form.city.trim();

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>
      <Navbar onSearch={({ find, near }) => navigate(`/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`)} />

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 60px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div>
            <button onClick={() => navigate("/owner/dashboard")} style={backBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
              Back to Dashboard
            </button>
            <h1 style={{ margin: "8px 0 4px", fontSize: 28, fontWeight: 800, color: "#2d2d2d" }}>Add Restaurant</h1>
            <p style={{ margin: 0, fontSize: 14, color: "#888" }}>Post a new restaurant listing. Required: name, cuisine type, address, city.</p>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "24px" }}>

          {message && <div style={successBox} role="status">{message}</div>}
          {error && <div style={errorBox} role="alert">{error}</div>}

          <form onSubmit={handleSubmit} aria-label="Add restaurant form">

            {/* Name + Cuisine */}
            <div className="form-grid-2">
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="name" style={labelStyle}>Restaurant Name *</label>
                <input id="name" name="name" value={form.name} onChange={handleChange} required style={inputStyle} placeholder="e.g. Pasta Milano" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="cuisine_type" style={labelStyle}>Cuisine Type *</label>
                <select id="cuisine_type" name="cuisine_type" value={form.cuisine_type} onChange={handleChange} required style={inputStyle}>
                  <option value="">Select cuisine</option>
                  {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Address */}
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="address" style={labelStyle}>Address *</label>
              <input id="address" name="address" value={form.address} onChange={handleChange} required style={inputStyle} placeholder="Street address" />
            </div>

            {/* City + State */}
            <div className="form-grid-2">
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>City *</label>
                <CityAutocomplete
                  value={form.city}
                  onChange={(city, state) => setForm((p) => ({ ...p, city, state: p.state || state }))}
                  placeholder="Type city name..."
                  inputStyle={{ ...inputStyle, height: 42, padding: "0 12px" }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>State</label>
                <StateAutocomplete
                  value={form.state}
                  onChange={(state) => setForm((p) => ({ ...p, state }))}
                  inputStyle={{ ...inputStyle, height: 42, padding: "0 12px" }}
                />
              </div>
            </div>

            {/* Zip + Price Range */}
            <div className="form-grid-2">
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="zip_code" style={labelStyle}>Zip Code</label>
                <input id="zip_code" name="zip_code" value={form.zip_code} onChange={handleChange} style={inputStyle} placeholder="e.g. 95112" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="price_range" style={labelStyle}>Pricing Tier</label>
                <select id="price_range" name="price_range" value={form.price_range} onChange={handleChange} style={inputStyle}>
                  <option value="">Select price range</option>
                  {PRICE_RANGES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Contact Phone + Email */}
            <div className="form-grid-2">
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="contact_phone" style={labelStyle}>Contact Phone</label>
                <input id="contact_phone" name="contact_phone" value={form.contact_phone} onChange={handleChange} style={inputStyle} placeholder="Phone number" type="tel" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="contact_email" style={labelStyle}>Contact Email</label>
                <input id="contact_email" name="contact_email" value={form.contact_email} onChange={handleChange} style={inputStyle} placeholder="Email address" type="email" />
              </div>
            </div>

            {/* Hours */}
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="hours_text" style={labelStyle}>Hours of Operation</label>
              <input id="hours_text" name="hours_text" value={form.hours_text} onChange={handleChange} style={inputStyle} placeholder="e.g. Mon–Sun 11AM–10PM" />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="description" style={labelStyle}>Description</label>
              <textarea id="description" name="description" value={form.description} onChange={handleChange} style={textareaStyle} placeholder="Write a short description of your restaurant" />
            </div>

            {/* Amenities */}
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="amenities" style={labelStyle}>
                Amenities <span style={{ fontWeight: 400, color: "#888", fontSize: 12 }}>(comma-separated)</span>
              </label>
              <input id="amenities" name="amenities" value={form.amenities} onChange={handleChange} style={inputStyle} placeholder="Parking, Delivery, Takeout, Wifi" />
            </div>

            {/* Keywords */}
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="keywords" style={labelStyle}>
                Keywords <span style={{ fontWeight: 400, color: "#888", fontSize: 12 }}>(comma-separated)</span>
              </label>
              <input id="keywords" name="keywords" value={form.keywords} onChange={handleChange} style={inputStyle} placeholder="quiet, family-friendly, outdoor seating" />
            </div>

            {/* Photos */}
            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>Restaurant Photos</div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Choose photos to upload"
                style={{ border: "2px dashed #ccc", borderRadius: 8, padding: "12px 20px", background: "#fafafa", cursor: "pointer", fontSize: 14, color: "#666", fontFamily: "inherit" }}
              >
                + Choose photos
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: "none" }} aria-label="Photo file input" />

              {photoPreviews.length > 0 && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  {photoPreviews.map((src, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img src={src} alt={`Selected photo ${idx + 1}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #e0e0e0" }} />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        aria-label={`Remove photo ${idx + 1}`}
                        style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#d32323", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {photoFiles.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 13, color: "#666" }}>
                  {photoFiles.length} photo{photoFiles.length !== 1 ? "s" : ""} selected
                </div>
              )}
            </div>

            {/* Is Open */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" name="is_open" checked={form.is_open} onChange={handleChange} aria-label="Restaurant is currently open" />
                Restaurant is currently open
              </label>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                disabled={!canSubmit || saving || uploadingPhotos}
                aria-busy={saving || uploadingPhotos}
                style={{
                  background: !canSubmit || saving ? "#e0e0e0" : "#d32323",
                  color: !canSubmit || saving ? "#aaa" : "#fff",
                  border: "none", borderRadius: 8, padding: "11px 20px",
                  fontSize: 14, fontWeight: 700,
                  cursor: !canSubmit || saving ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {uploadingPhotos ? "Uploading photos…" : saving ? "Creating…" : "Create Restaurant"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/owner/dashboard")}
                style={outlineBtn}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}

const labelStyle = { display: "block", marginBottom: 6, fontSize: 14, fontWeight: 700, color: "#333" };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d0d0d0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#fff" };
const textareaStyle = { ...inputStyle, minHeight: 110, resize: "vertical" };
const backBtn = { background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 13, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" };
const outlineBtn = { background: "#fff", color: "#333", border: "1px solid #d0d0d0", borderRadius: 8, padding: "11px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
const successBox = { marginBottom: 16, padding: "10px 12px", borderRadius: 8, background: "#ecfdf3", color: "#166534", fontWeight: 700, fontSize: 14 };
const errorBox = { marginBottom: 16, padding: "10px 12px", borderRadius: 8, background: "#fef2f2", color: "#b91c1c", fontWeight: 700, fontSize: 14 };
