import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { CityAutocomplete, StateAutocomplete } from "../components/CityAutocomplete";
import { restaurantAPI } from "../services/api";

const CUISINES = [
  "American", "Italian", "Mexican", "Chinese", "Japanese",
  "Indian", "Thai", "Mediterranean", "Vegan", "Breakfast & Brunch",
];

export default function AddRestaurant() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", cuisine_type: "", address: "", city: "", state: "",
    zip_code: "", contact_phone: "", contact_email: "", description: "",
    hours_text: "", keywords: "", photo_urls: "", price_range: "$$", amenities: "",
  });

  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const canSubmit = useMemo(() =>
    form.name.trim() && form.cuisine_type.trim() && form.address.trim() && form.city.trim()
  , [form]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // Called when user selects a city from autocomplete
  // Auto-fills state too
  const onCitySelect = (city, state) => {
    setForm((p) => ({ ...p, city, state: p.state || state }));
  };

  // Called when user selects a state from autocomplete
  const onStateSelect = (state) => {
    setForm((p) => ({ ...p, state }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const photos   = form.photo_urls.split(",").map((s) => s.trim()).filter(Boolean);
      const keywords = form.keywords.split(",").map((s) => s.trim()).filter(Boolean);

      const payload = {
        name:          form.name.trim(),
        cuisine_type:  form.cuisine_type.trim(),
        address:       form.address.trim(),
        city:          form.city.trim(),
        state:         form.state.trim().toUpperCase() || null,
        zip_code:      form.zip_code.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        contact_email: form.contact_email.trim() || null,
        description:   form.description.trim() || null,
        hours_text:    form.hours_text.trim() || null,
        photos:        photos.length ? photos : null,
        keywords:      keywords.length ? keywords : null,
        price_range:   form.price_range || null,
        amenities:     form.amenities.split(",").map((s) => s.trim()).filter(Boolean),
      };

      const created      = await restaurantAPI.create(payload);
      const restaurantId = created.data.id;

      if (files.length) {
        const fd = new FormData();
        for (const f of files) fd.append("files", f);
        await restaurantAPI.uploadPhotos(restaurantId, fd);
      }

      setMsg("Restaurant created successfully!");
      setTimeout(() => navigate(`/restaurant/${restaurantId}`), 800);
    } catch (err) {
      setMsg(err.response?.data?.detail || "Failed to create restaurant");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>
      <Navbar
        onSearch={({ find, near }) => navigate(`/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`)}
        defaultFind=""
        defaultNear=""
      />

      <div style={{ maxWidth: "880px", margin: "0 auto", padding: "26px 24px 60px" }}>
        <h1 style={{ margin: "0 0 10px", fontSize: "28px", fontWeight: "800", color: "#2d2d2d" }}>
          Add a restaurant
        </h1>
        <p style={{ margin: "0 0 18px", color: "#666", fontSize: "14px", lineHeight: 1.6 }}>
          Required: restaurant name, cuisine type, address, city.
        </p>

        {msg && (
          <div style={{ marginBottom: "14px", fontSize: "14px", fontWeight: "700", color: msg.includes("created") ? "#166534" : "#d32323" }}>
            {msg}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ background: "#fff", border: "1px solid #e7e7e7", borderRadius: "10px", padding: "20px" }}>

          <Row>
            <Field label="Restaurant name *">
              <Input name="name" value={form.name} onChange={onChange} placeholder="e.g., Pasta Milano" />
            </Field>
            <Field label="Cuisine type *">
              <select name="cuisine_type" value={form.cuisine_type} onChange={onChange} style={inputStyle}>
                <option value="">Select cuisine</option>
                {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </Row>

          <Field label="Street address *">
            <Input name="address" value={form.address} onChange={onChange} placeholder="e.g., 123 Main St" />
          </Field>

          {/* City + State side by side */}
          <Row>
            <Field label="City *">
              <CityAutocomplete
                value={form.city}
                onChange={onCitySelect}
                placeholder="Type city name..."
              />
            </Field>
            <Field label="State">
              <StateAutocomplete
                value={form.state}
                onChange={onStateSelect}
              />
            </Field>
          </Row>

          <Field label="ZIP code">
            <Input
              name="zip_code"
              value={form.zip_code}
              onChange={onChange}
              placeholder="e.g., 95112 (optional)"
              inputMode="numeric"
              style={{ maxWidth: 200 }}
            />
          </Field>

          <Row>
            <Field label="Contact phone">
              <Input name="contact_phone" value={form.contact_phone} onChange={onChange} placeholder="(optional)" />
            </Field>
            <Field label="Contact email">
              <Input name="contact_email" value={form.contact_email} onChange={onChange} placeholder="(optional)" />
            </Field>
          </Row>

          <Field label="Description">
            <textarea name="description" value={form.description} onChange={onChange} placeholder="(optional)" style={{ ...inputStyle, height: 110, paddingTop: 10, resize: "vertical" }} />
          </Field>

          <Field label="Hours">
            <textarea name="hours_text" value={form.hours_text} onChange={onChange} placeholder="e.g., Mon-Fri 9am-9pm; Sat-Sun 10am-10pm (optional)" style={{ ...inputStyle, height: 80, paddingTop: 10, resize: "vertical" }} />
          </Field>

          <Row>
            <Field label="Price range">
              <select name="price_range" value={form.price_range} onChange={onChange} style={inputStyle}>
                {["$", "$$", "$$$", "$$$$"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Amenities (comma-separated)">
              <Input name="amenities" value={form.amenities} onChange={onChange} placeholder="wifi, outdoor seating, delivery" />
            </Field>
          </Row>

          <Field label="Keywords (comma-separated)">
            <Input name="keywords" value={form.keywords} onChange={onChange} placeholder="quiet, family-friendly, outdoor seating, wifi" />
          </Field>

          <Field label="Photo URLs (comma-separated)">
            <Input name="photo_urls" value={form.photo_urls} onChange={onChange} placeholder="https://... , https://..." />
          </Field>

          <Field label="Upload photos (optional)">
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            {files.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 13, color: "#666", fontWeight: 600 }}>
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </div>
            )}
          </Field>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              type="submit"
              disabled={!canSubmit || saving}
              style={{
                background: !canSubmit || saving ? "#e6e6e6" : "#d32323",
                color: !canSubmit || saving ? "#888" : "#fff",
                border: "none", borderRadius: 8, padding: "12px 16px",
                fontWeight: 800, fontFamily: "inherit",
                cursor: !canSubmit || saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Create restaurant"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ background: "#fff", color: "#333", border: "1px solid #d0d0d0", borderRadius: 8, padding: "12px 16px", fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 0 }}>{children}</div>;
}
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#444", marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}
function Input({ style: extraStyle, ...props }) {
  return <input {...props} style={{ ...inputStyle, ...extraStyle }} />;
}
const inputStyle = {
  width: "100%", height: "42px", border: "1px solid #ccc", borderRadius: "8px",
  padding: "0 12px", boxSizing: "border-box", fontSize: "14px",
  fontFamily: "inherit", color: "#222", background: "#fff",
};
