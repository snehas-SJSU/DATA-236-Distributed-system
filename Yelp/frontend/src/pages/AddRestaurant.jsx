import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { CityAutocomplete, StateAutocomplete } from "../components/CityAutocomplete";
import { restaurantAPI } from "../services/api";

const CUISINES = [
  "American", "Italian", "Mexican", "Chinese", "Japanese",
  "Indian", "Thai", "Mediterranean", "Vegan", "Breakfast & Brunch",
  "Korean", "French", "Greek", "Spanish", "Middle Eastern", "Vietnamese", "Other",
];

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

const AMENITIES_LIST = [
  "Wifi", "Outdoor Seating", "Parking", "Delivery", "Takeout",
  "Dine-in", "Reservations", "Live Music", "Pet Friendly", "Family Friendly",
  "Wheelchair Accessible", "Happy Hour", "Late Night", "Catering", "Bar",
  "Vegan Options", "Gluten-Free Options", "TV", "Romantic", "Quiet",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const defaultHours = () =>
  DAYS.reduce((acc, d) => ({ ...acc, [d]: { open: "9:00 AM", close: "9:00 PM", closed: false } }), {});

const hoursToText = (hours) =>
  DAYS.filter(d => !hours[d].closed)
    .map(d => `${d}: ${hours[d].open}–${hours[d].close}`)
    .join(", ") || "";

const textToHours = (text) => {
  const base = defaultHours();
  if (!text) return base;
  text.split(",").forEach(part => {
    const m = part.trim().match(/^(\w+):\s*(.+?)–(.+)$/);
    if (m) {
      const day = DAYS.find(d => d.toLowerCase() === m[1].toLowerCase());
      if (day) {
        base[day] = { open: m[2].trim(), close: m[3].trim(), closed: false };
      }
    }
  });
  return base;
};

export default function AddRestaurant() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEdit = Boolean(editId);
  const fileRef = useRef(null);

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
    price_range: "$$",
  });

  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [hours, setHours] = useState(defaultHours());
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("error");

  useEffect(() => {
    if (!isEdit) return;
    restaurantAPI.getById(editId)
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
          price_range: r.price_range || "$$",
        });
        const amenities = Array.isArray(r.amenities) ? r.amenities : [];
        const keywords = Array.isArray(r.keywords) ? r.keywords : [];
        setSelectedAmenities([...new Set([...amenities, ...keywords])]);
        setHours(textToHours(r.hours_text || ""));
        setExistingPhotos(Array.isArray(r.photos) ? r.photos : []);
      })
      .catch(() => {
        setMsg("Could not load restaurant details.");
        setMsgType("error");
      })
      .finally(() => setLoadingExisting(false));
  }, [editId, isEdit]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  const canSubmit = useMemo(
    () => form.name.trim() && form.cuisine_type.trim() && form.address.trim() && form.city.trim(),
    [form]
  );

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const toggleAmenity = (item) => {
    setSelectedAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const toggleDayClosed = (day) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], closed: !prev[day].closed } }));
  };

  const setDayTime = (day, field, val) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: val } }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewFiles(files);
    setPhotoPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeNewPhoto = (idx) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    cuisine_type: form.cuisine_type.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim().toUpperCase() || null,
    zip_code: form.zip_code.trim() || null,
    contact_phone: form.contact_phone.trim() || null,
    contact_email: form.contact_email.trim() || null,
    description: form.description.trim() || null,
    hours_text: hoursToText(hours) || null,
    keywords: selectedAmenities,
    amenities: selectedAmenities,
    price_range: form.price_range || null,
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      let restaurantId;
      if (isEdit) {
        await restaurantAPI.update(editId, buildPayload());
        restaurantId = editId;
      } else {
        const created = await restaurantAPI.create(buildPayload());
        restaurantId = created.data.id;
      }

      if (newFiles.length > 0) {
        try {
          const fd = new FormData();
          for (const f of newFiles) fd.append("files", f);
          await restaurantAPI.uploadPhotos(restaurantId, fd);
        } catch {
          setMsg(isEdit ? "Restaurant updated, but photo upload failed." : "Restaurant created, but photo upload failed.");
          setMsgType("warning");
          setSaving(false);
          setTimeout(() => navigate(`/restaurant/${restaurantId}`), 2500);
          return;
        }
      }

      setMsgType("success");
      setMsg(isEdit ? "Restaurant updated successfully!" : "Restaurant created successfully!");
      setTimeout(() => navigate(`/restaurant/${restaurantId}`), 900);
    } catch (err) {
      setMsgType("error");
      setMsg(
        err.response?.data?.detail ||
          (isEdit ? "Failed to update restaurant" : "Failed to create restaurant")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingExisting) {
    return (
      <div style={pageStyle}>
        <Navbar
          onSearch={({ find, near }) =>
            navigate(`/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`)
          }
        />
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "40px 24px", color: "#6b7280" }}>
          Loading restaurant details…
        </div>
      </div>
    );
  }

  const msgColors = {
    error: {
      color: "#b42318",
      background: "#fef3f2",
      border: "1px solid #fecdca",
    },
    success: {
      color: "#067647",
      background: "#ecfdf3",
      border: "1px solid #abefc6",
    },
    warning: {
      color: "#b54708",
      background: "#fffaeb",
      border: "1px solid #fedf89",
    },
  };

  return (
    <div style={pageStyle}>
      <Navbar
        onSearch={({ find, near }) =>
          navigate(`/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`)
        }
      />

      <main style={mainStyle}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={backButtonStyle}
          aria-label="Go back"
        >
          <span style={backIconStyle}>←</span>
          <span style={backTextStyle}>back</span>
        </button>

        <div style={heroCardStyle}>
          <div>
            <div style={eyebrowStyle}>{isEdit ? "Update listing" : "Create listing"}</div>
            <h1 style={titleStyle}>{isEdit ? "Edit restaurant" : "Add a restaurant"}</h1>
            <p style={subtitleStyle}>
              Share the essentials first, then add details that help people choose your place.
            </p>
          </div>

          {/* <div style={heroBadgeStyle}>
            <div style={heroBadgeValueStyle}>{selectedAmenities.length}</div>
            <div style={heroBadgeLabelStyle}>Amenities selected</div>
          </div> */}
        </div>

        {msg && (
          <div role="alert" style={{ ...alertStyle, ...msgColors[msgType] }}>
            {msg}
          </div>
        )}

        <form onSubmit={onSubmit} style={formShellStyle}>
          <Section title="Basic details">
            <Row>
              <Field label="Restaurant name *" htmlFor="rest-name">
                <Input
                  id="rest-name"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="e.g., Pasta Milano"
                  required
                />
              </Field>

              <Field label="Cuisine type *" htmlFor="rest-cuisine">
                <select
                  id="rest-cuisine"
                  name="cuisine_type"
                  value={form.cuisine_type}
                  onChange={onChange}
                  required
                  style={inputStyle}
                >
                  <option value="">Select cuisine</option>
                  {CUISINES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </Row>

            <Field label="Street address *" htmlFor="rest-address">
              <Input
                id="rest-address"
                name="address"
                value={form.address}
                onChange={onChange}
                placeholder="e.g., 123 Main St"
                required
              />
            </Field>

            <Row>
              <Field label="City *" htmlFor="rest-city">
                <CityAutocomplete
                  value={form.city}
                  onChange={(city, state) =>
                    setForm((p) => ({ ...p, city, state: p.state || state }))
                  }
                  placeholder="City name..."
                />
              </Field>

              <Field label="State" htmlFor="rest-state">
                <StateAutocomplete
                  value={form.state}
                  onChange={(state) => setForm((p) => ({ ...p, state }))}
                />
              </Field>
            </Row>

            <Row>
              <Field label="ZIP code" htmlFor="rest-zip">
                <Input
                  id="rest-zip"
                  name="zip_code"
                  value={form.zip_code}
                  onChange={onChange}
                  placeholder="e.g., 95112"
                  inputMode="numeric"
                />
              </Field>

              <Field label="Price range" htmlFor="rest-price">
                <select
                  id="rest-price"
                  name="price_range"
                  value={form.price_range}
                  onChange={onChange}
                  style={inputStyle}
                >
                  {PRICE_RANGES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
            </Row>
          </Section>

          <Section
            title="Contact information"
            subtitle="Optional, but useful for customers who want to reach out directly."
          >
            <Row>
              <Field label="Contact phone" htmlFor="rest-phone">
                <Input
                  id="rest-phone"
                  name="contact_phone"
                  value={form.contact_phone}
                  onChange={onChange}
                  placeholder="(optional)"
                  type="tel"
                />
              </Field>

              <Field label="Contact email" htmlFor="rest-email">
                <Input
                  id="rest-email"
                  name="contact_email"
                  value={form.contact_email}
                  onChange={onChange}
                  placeholder="(optional)"
                  type="email"
                />
              </Field>
            </Row>

            <Field label="Description" htmlFor="rest-desc">
              <textarea
                id="rest-desc"
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Tell people what makes this place special..."
                style={textareaStyle}
              />
            </Field>
          </Section>

          <Section
            title="Hours of operation"
            subtitle="Set opening and closing hours for each day."
          >
            <div style={hoursCardStyle}>
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  style={{
                    ...hoursRowStyle,
                    borderBottom: i < DAYS.length - 1 ? "1px solid #eef2f6" : "none",
                  }}
                >
                  <div style={hoursDayStyle}>{day}</div>

                  <label style={checkboxLabelStyle}>
                    <input
                      type="checkbox"
                      checked={hours[day].closed}
                      onChange={() => toggleDayClosed(day)}
                      style={{ cursor: "pointer" }}
                    />
                    Closed
                  </label>

                  {!hours[day].closed ? (
                    <div style={hoursInputsWrapStyle}>
                      <input
                        type="text"
                        value={hours[day].open}
                        onChange={(e) => setDayTime(day, "open", e.target.value)}
                        placeholder="9:00 AM"
                        style={timeInputStyle}
                      />
                      <span style={hoursDividerStyle}>to</span>
                      <input
                        type="text"
                        value={hours[day].close}
                        onChange={(e) => setDayTime(day, "close", e.target.value)}
                        placeholder="9:00 PM"
                        style={timeInputStyle}
                      />
                    </div>
                  ) : (
                    <div style={closedPillStyle}>Closed all day</div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Amenities"
            subtitle="Pick the features that best describe the restaurant."
          >
            <div style={amenitiesHeaderStyle}>
              <span style={amenitiesCountStyle}>
                {selectedAmenities.length} selected
              </span>
            </div>

            <div style={chipWrapStyle}>
              {AMENITIES_LIST.map((item) => {
                const selected = selectedAmenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAmenity(item)}
                    style={{
                      ...chipStyle,
                      ...(selected ? chipSelectedStyle : chipUnselectedStyle),
                    }}
                  >
                    <span style={{ opacity: selected ? 1 : 0.65 }}>
                      {selected ? "✓ " : "+ "}
                    </span>
                    {item}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section
            title="Photos"
            subtitle="A few strong photos can make the listing feel much more complete."
          >
            {isEdit && existingPhotos.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={subLabelStyle}>Current photos</div>
                <div style={photoGridStyle}>
                  {existingPhotos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Current restaurant photo ${i + 1}`}
                      style={photoThumbStyle}
                    />
                  ))}
                </div>
              </div>
            )}

            <Field
              label={isEdit ? "Upload new photos (optional)" : "Upload photos (optional)"}
              htmlFor="rest-photos"
            >
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={uploadBoxStyle}
              >
                <div style={uploadIconStyle}>+</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#101828" }}>
                  Choose photos
                </div>
              </button>

              <input
                ref={fileRef}
                id="rest-photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              {photoPreviews.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={subLabelStyle}>Selected photos</div>
                  <div style={photoGridStyle}>
                    {photoPreviews.map((src, idx) => (
                      <div key={idx} style={{ position: "relative" }}>
                        <img
                          src={src}
                          alt={`Selected photo ${idx + 1}`}
                          style={photoThumbStyle}
                        />
                        <button
                          type="button"
                          onClick={() => removeNewPhoto(idx)}
                          style={removePhotoBtnStyle}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newFiles.length > 0 && (
                <div style={helperTextStyle}>
                  {newFiles.length} photo{newFiles.length !== 1 ? "s" : ""} selected
                </div>
              )}
            </Field>
          </Section>

          <div style={actionBarStyle}>
            <div style={requiredHintStyle}>* Required fields</div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={secondaryButtonStyle}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!canSubmit || saving}
                style={{
                  ...primaryButtonStyle,
                  ...((!canSubmit || saving) ? primaryButtonDisabledStyle : {}),
                }}
              >
                {saving ? "Saving…" : isEdit ? "Save changes" : "Create restaurant"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section style={sectionStyle}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={sectionTitleStyle}>{title}</h2>
        {subtitle && <p style={sectionSubtitleStyle}>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ children }) {
  return <div className="form-grid-2" style={rowStyle}>{children}</div>;
}

function Field({ label, htmlFor, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={htmlFor} style={fieldLabelStyle}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ style: extraStyle, ...props }) {
  return <input {...props} style={{ ...inputStyle, ...extraStyle }} />;
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
};

const mainStyle = {
  maxWidth: "980px",
  margin: "0 auto",
  padding: "28px 24px 64px",
};

const backButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "transparent",
  border: "none",
  padding: 0,
  marginBottom: 18,
  cursor: "pointer",
  color: "#6b7280",
  fontFamily: "inherit",
};

const backIconStyle = {
  fontSize: 16,
  lineHeight: 1,
  fontWeight: 500,
};

const backTextStyle = {
  fontSize: 16,
  lineHeight: 1,
  fontWeight: 700,
  letterSpacing: "-0.02em",
};

const heroCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  padding: "24px 24px 22px",
  borderRadius: 20,
  background: "linear-gradient(135deg, #ffffff 0%, #fff7f7 100%)",
  border: "1px solid #f1f5f9",
  boxShadow: "0 10px 30px rgba(16,24,40,0.06)",
  marginBottom: 18,
  flexWrap: "wrap",
};

const eyebrowStyle = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#d32323",
  marginBottom: 8,
};

const titleStyle = {
  margin: 0,
  fontSize: "34px",
  lineHeight: 1.1,
  fontWeight: 800,
  color: "#101828",
};

const subtitleStyle = {
  margin: "10px 0 0",
  color: "#667085",
  fontSize: 15,
  lineHeight: 1.6,
  maxWidth: 620,
};

const heroBadgeStyle = {
  minWidth: 130,
  padding: "16px 18px",
  borderRadius: 16,
  background: "#fff",
  border: "1px solid #eaecf0",
  boxShadow: "0 6px 18px rgba(16,24,40,0.05)",
};

const heroBadgeValueStyle = {
  fontSize: 28,
  fontWeight: 800,
  color: "#101828",
  lineHeight: 1,
};

const heroBadgeLabelStyle = {
  marginTop: 6,
  fontSize: 13,
  color: "#667085",
  fontWeight: 600,
};

const alertStyle = {
  marginBottom: 16,
  fontSize: 14,
  fontWeight: 700,
  borderRadius: 12,
  padding: "12px 14px",
};

const formShellStyle = {
  display: "grid",
  gap: 18,
};

const sectionStyle = {
  background: "#fff",
  border: "1px solid #eaecf0",
  borderRadius: 20,
  padding: 22,
  boxShadow: "0 8px 24px rgba(16,24,40,0.04)",
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: 20,
  fontWeight: 800,
  color: "#101828",
};

const sectionSubtitleStyle = {
  margin: "6px 0 0",
  fontSize: 14,
  color: "#667085",
  lineHeight: 1.6,
};

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const fieldLabelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 800,
  color: "#344054",
  marginBottom: 8,
};

const subLabelStyle = {
  fontSize: 13,
  fontWeight: 800,
  color: "#344054",
  marginBottom: 10,
};

const inputStyle = {
  width: "100%",
  height: "46px",
  border: "1px solid #d0d5dd",
  borderRadius: "12px",
  padding: "0 14px",
  boxSizing: "border-box",
  fontSize: "14px",
  fontFamily: "inherit",
  color: "#101828",
  background: "#fff",
  outline: "none",
  boxShadow: "0 1px 2px rgba(16,24,40,0.02)",
};

const textareaStyle = {
  ...inputStyle,
  height: 120,
  paddingTop: 12,
  resize: "vertical",
};

const hoursCardStyle = {
  border: "1px solid #eaecf0",
  borderRadius: 16,
  overflow: "hidden",
  background: "#fcfcfd",
};

const hoursRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "14px 16px",
  flexWrap: "wrap",
  background: "#fff",
};

const hoursDayStyle = {
  width: 44,
  fontSize: 13,
  fontWeight: 800,
  color: "#344054",
  flexShrink: 0,
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "#475467",
  cursor: "pointer",
  userSelect: "none",
  minWidth: 90,
};

const hoursInputsWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const timeInputStyle = {
  width: 110,
  height: 40,
  padding: "0 12px",
  border: "1px solid #d0d5dd",
  borderRadius: 10,
  fontSize: 13,
  fontFamily: "inherit",
  color: "#101828",
  background: "#fff",
};

const hoursDividerStyle = {
  fontSize: 13,
  color: "#98a2b3",
  fontWeight: 700,
};

const closedPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  height: 32,
  padding: "0 12px",
  borderRadius: 999,
  background: "#f2f4f7",
  color: "#475467",
  fontSize: 12,
  fontWeight: 700,
};

const amenitiesHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const amenitiesCountStyle = {
  display: "inline-flex",
  alignItems: "center",
  height: 28,
  padding: "0 10px",
  borderRadius: 999,
  background: "#fff1f1",
  color: "#d32323",
  fontSize: 12,
  fontWeight: 800,
};

const chipWrapStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const chipStyle = {
  padding: "10px 14px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "all 0.15s",
};

const chipSelectedStyle = {
  background: "#d32323",
  color: "#fff",
  border: "1px solid #d32323",
  boxShadow: "0 4px 12px rgba(211,35,35,0.18)",
};

const chipUnselectedStyle = {
  background: "#fff",
  color: "#344054",
  border: "1px solid #d0d5dd",
};

const uploadBoxStyle = {
  width: "100%",
  border: "2px dashed #d0d5dd",
  borderRadius: 16,
  padding: "24px 18px",
  background: "#fcfcfd",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "block",
  textAlign: "center",
};

const uploadIconStyle = {
  width: 42,
  height: 42,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fff",
  border: "1px solid #eaecf0",
  fontSize: 22,
  fontWeight: 700,
  color: "#d32323",
  marginBottom: 10,
};

const photoGridStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const photoThumbStyle = {
  width: 96,
  height: 96,
  objectFit: "cover",
  borderRadius: 14,
  border: "1px solid #eaecf0",
  boxShadow: "0 4px 14px rgba(16,24,40,0.06)",
};

const removePhotoBtnStyle = {
  position: "absolute",
  top: -6,
  right: -6,
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: "#101828",
  color: "#fff",
  border: "2px solid #fff",
  cursor: "pointer",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 10px rgba(16,24,40,0.18)",
};

const helperTextStyle = {
  marginTop: 8,
  fontSize: 13,
  color: "#667085",
};

const actionBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  background: "#fff",
  border: "1px solid #eaecf0",
  borderRadius: 20,
  padding: "18px 20px",
  boxShadow: "0 8px 24px rgba(16,24,40,0.04)",
  flexWrap: "wrap",
};

const requiredHintStyle = {
  fontSize: 13,
  color: "#667085",
  fontWeight: 600,
};

const primaryButtonStyle = {
  background: "#d32323",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 800,
  fontFamily: "inherit",
  cursor: "pointer",
  fontSize: 14,
  boxShadow: "0 8px 18px rgba(211,35,35,0.22)",
};

const primaryButtonDisabledStyle = {
  background: "#e4e7ec",
  color: "#98a2b3",
  boxShadow: "none",
  cursor: "not-allowed",
};

const secondaryButtonStyle = {
  background: "#fff",
  color: "#344054",
  border: "1px solid #d0d5dd",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 800,
  fontFamily: "inherit",
  cursor: "pointer",
  fontSize: 14,
};