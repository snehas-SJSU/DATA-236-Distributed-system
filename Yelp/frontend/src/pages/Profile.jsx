import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { profileAPI } from "../services/api";
import SearchAutocomplete from "../components/SearchAutocomplete";
import { CityAutocomplete } from "../components/CityAutocomplete";
import { useAuth } from "../context/AuthContext";

const countries = [
  "United States", "India", "Canada", "United Kingdom", "Australia",
  "Afghanistan", "Albania", "Algeria", "Argentina", "Austria", "Bangladesh",
  "Belgium", "Brazil", "Cambodia", "Chile", "China", "Colombia", "Croatia",
  "Czech Republic", "Denmark", "Egypt", "Ethiopia", "Finland", "France",
  "Germany", "Ghana", "Greece", "Guatemala", "Hong Kong", "Hungary",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica",
  "Japan", "Jordan", "Kazakhstan", "Kenya", "South Korea", "Kuwait",
  "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria",
  "Norway", "Pakistan", "Peru", "Philippines", "Poland", "Portugal",
  "Romania", "Russia", "Saudi Arabia", "Singapore", "South Africa", "Spain",
  "Sri Lanka", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey",
  "Ukraine", "United Arab Emirates", "Venezuela", "Vietnam", "Zimbabwe",
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC","PR","GU","VI","AS","MP",
];

const genders = ["Male", "Female", "Other", "Prefer not to say"];

const CUISINES = ["Italian", "Chinese", "Mexican", "Indian", "Japanese", "American"];
const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];
const DIETARY = ["vegetarian", "vegan", "halal", "gluten-free", "kosher", "dairy-free", "nut-free"];
const AMBIANCE = ["casual", "fine dining", "family-friendly", "romantic", "outdoor seating", "quiet", "lively"];
const SORT_PREFS = [
  { value: "rating", label: "Rating" },
  { value: "distance", label: "Distance" },
  { value: "popularity", label: "Popularity" },
  { value: "price", label: "Price" },
];

export default function Profile() {
  const { user, login, logout, token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    about_me: "",
    city: "",
    state: "",
    country: "",
    languages: "",
    gender: "",
  });

  const [prefs, setPrefs] = useState({
    cuisines: [],
    price_range: "",
    locations: [],
    search_radius_km: 10,
    dietary_needs: [],
    ambiance: [],
    sort_by: "rating",
  });

  const [find, setFind] = useState("");
  const getUserLocation = () => { try { const locs = JSON.parse(user?.pref_locations_json || "[]"); return locs?.[0] || ""; } catch { return ""; } };
  const [near, setNear] = useState(getUserLocation());
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [msg, setMsg] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);

  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  const initials = useMemo(() => {
    return user?.name
      ? user.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "U";
  }, [user?.name]);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await profileAPI.getProfile();
      const data = res.data;

      setForm({
        name: data.name || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        about_me: data.about_me || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "",
        languages: data.languages || "",
        gender: data.gender || "",
      });

      const safeJson = (v, fallback) => {
        try {
          if (!v) return fallback;
          const parsed = JSON.parse(v);
          return Array.isArray(parsed) ? parsed : fallback;
        } catch {
          return fallback;
        }
      };

      setPrefs({
        cuisines: safeJson(data.pref_cuisines_json, []),
        price_range: data.pref_price_range || "",
        locations: safeJson(data.pref_locations_json, []),
        search_radius_km:
          typeof data.pref_search_radius_km === "number"
            ? data.pref_search_radius_km
            : 10,
        dietary_needs: safeJson(data.pref_dietary_json, []),
        ambiance: safeJson(data.pref_ambiance_json, []),
        sort_by: data.pref_sort_by || "rating",
      });

      setMsg("");
    } catch (err) {
      console.log(err);
      setMsg("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = getUserLocation();
    if (saved) setNear(saved);
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near)}`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "state") {
      setForm((prev) => ({
        ...prev,
        state: value.toUpperCase().slice(0, 10),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone_number: form.phone_number.trim() || null,
        about_me: form.about_me.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim().toUpperCase() || null,
        country: form.country || null,
        languages: form.languages.trim() || null,
        gender: form.gender || null,
      };

      const res = await profileAPI.updateProfile(payload);

      localStorage.setItem("user", JSON.stringify(res.data));
      login(res.data, token, "user");
      setMsg("Profile updated successfully");
      setShowEdit(false);
      fetchProfile();
    } catch (err) {
      console.log(err);
      setMsg(err.response?.data?.detail || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrefs = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    setMsg("");
    try {
      const payload = {
        cuisines: prefs.cuisines,
        price_range: prefs.price_range || null,
        locations: prefs.locations,
        search_radius_km: Number(prefs.search_radius_km) || 10,
        dietary_needs: prefs.dietary_needs,
        ambiance: prefs.ambiance,
        sort_by: prefs.sort_by || "rating",
      };
      const res = await profileAPI.updatePreferences(payload);
      localStorage.setItem("user", JSON.stringify(res.data));
      login(res.data, token, "user");
      setMsg("Preferences saved");
      setShowPrefs(false);
      fetchProfile();
    } catch (err) {
      console.log(err);
      setMsg(err.response?.data?.detail || "Error saving preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingPhoto(true);
    setMsg("");

    try {
      const res = await profileAPI.uploadPhoto(formData);
      localStorage.setItem("user", JSON.stringify(res.data));
      login(res.data, token, "user");
      setMsg("Profile photo updated successfully");
      fetchProfile();
    } catch (err) {
      console.log(err);
      setMsg(err.response?.data?.detail || "Error uploading profile photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading...</div>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e6e6e6",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <div
          style={{
            width: "100%",
            padding: "14px 32px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              width: "100%",
            }}
          >
            <Link
              to="/"
              style={{
                textDecoration: "none",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <YelpLogoDark />
            </Link>

            <form
              onSubmit={handleSearch}
              style={{
                flex: 1,
                maxWidth: "1030px",
                display: "flex",
                height: "44px",
                background: "#fff",
                borderRadius: "4px",
                overflow: "visible",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                border: "1px solid #e5e5e5",
                position: "relative",
              }}
            >
              <div
                style={{
                  flex: "1.5",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 14px",
                  gap: "10px",
                  borderRight: "1px solid #e0e0e0",
                  position: "relative",
                  zIndex: 300,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <SearchAutocomplete
                  value={find}
                  onChange={(val) => setFind(val)}
                  onSelect={(val) => {
                    setFind(val);
                    navigate(`/search?q=${encodeURIComponent(val || "Restaurants")}&loc=${encodeURIComponent(near || "")}`);
                  }}
                  placeholder="things to do, nail salons, plumbers"
                  inputStyle={{ fontSize: "15px" }}
                />
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 14px",
                  gap: "10px",
                  position: "relative",
                  zIndex: 200,
                }}
              >
                <svg width="12" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                <CityAutocomplete
                  value={near}
                  onChange={(city) => setNear(city)}
                  onSelect={(city) => {
                    setNear(city);
                    navigate(`/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(city)}`);
                  }}
                  placeholder="city..."
                  inputStyle={{
                    height: "30px", border: "none", borderRadius: "0",
                    padding: "0 4px", fontSize: "15px",
                    background: "transparent", boxShadow: "none",
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: "#d32323",
                  border: "none",
                  cursor: "pointer",
                  width: "56px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </form>

            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexShrink: 0,
                position: "relative",
              }}
              ref={menuRef}
            >
              <button
                onClick={() => navigate("/write-review")}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#333", fontSize: "13px", fontWeight: "600", padding: "6px 10px", whiteSpace: "nowrap", fontFamily: "inherit" }}
              >
                Write a Review
              </button>

              <Link
                to="/add-restaurant"
                style={{
                  color: "#333",
                  fontSize: "13px",
                  fontWeight: "700",
                  textDecoration: "none",
                  padding: "6px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                Add Restaurant
              </Link>

              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "1px solid #ddd",
                  background: "#efefef",
                  color: "#444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "13px",
                  overflow: "hidden",
                  padding: 0,
                }}
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt="Profile"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  initials
                )}
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "48px",
                    right: 0,
                    width: "220px",
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.16)",
                    overflow: "hidden",
                    zIndex: 3000,
                  }}
                >
                  <MenuRow
                    label="Profile"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/profile");
                    }}
                  />
                  <MenuRow
                    label="Add Restaurant"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/add-restaurant");
                    }}
                  />
                  <MenuRow
                    label="Favorites"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/favorites");
                    }}
                  />
                  <MenuRow
                    label="History"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/history");
                    }}
                  />
                  <MenuRow
                    label="Log Out"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                      navigate("/login");
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="profile-layout"
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "28px 24px 50px",
        }}
      >
        <aside>
          <div
            style={{
              background: "#fff",
              border: "1px solid #e3e3e3",
              borderRadius: "8px",
              padding: "20px 18px 18px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "150px",
                height: "150px",
                margin: "0 auto 16px",
                borderRadius: "50%",
                background: "#efeff2",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8c8c96",
                fontWeight: "700",
                fontSize: "40px",
              }}
            >
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initials
              )}
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "22px",
                fontWeight: "800",
                color: "#2d2d2d",
              }}
            >
              {form.name || "User"}
            </h2>

            <p
              style={{
                margin: "0 0 18px",
                fontSize: "14px",
                color: "#6a6a6a",
                fontWeight: "600",
              }}
            >
              {[form.city, form.state || form.country].filter(Boolean).join(", ") || "No location added"}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "18px",
                marginBottom: "10px",
              }}
            >
              <ActionButton
                icon={<EditIcon />}
                label="Edit profile"
                active={showEdit}
                onClick={() => {
                  setShowPrefs(false);
                  setShowEdit(true);
                }}
              />
              <ActionButton
                icon={<PrefsIcon />}
                label="Preferences"
                active={showPrefs}
                onClick={() => {
                  setShowEdit(false);
                  setShowPrefs(true);
                }}
              />
              <ActionButton
                icon={<PhotoIcon />}
                label="Add photo"
                onClick={() => fileInputRef.current?.click()}
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setShowEdit(false);
              setShowPrefs(false);
            }}
            style={{
              marginTop: "22px",
              width: "100%",
              background: showEdit ? "#fff" : "#f4f4f4",
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid #ececec",
              padding: "16px 18px",
              fontWeight: "800",
              fontSize: "12px",
              color: "#2d2d2d",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
            }}
          >
            <OverviewIcon />
            Profile overview
          </button>
        </aside>

        <main>
          <button
            onClick={() => navigate(-1)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 13, fontWeight: 600, padding: "0 0 14px", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Back
          </button>

          {!showEdit && !showPrefs ? (
            <>
              <h1
                style={{
                  margin: "0 0 16px",
                  fontSize: "24px",
                  fontWeight: "800",
                  color: "#2d2d2d",
                  letterSpacing: "-0.3px",
                }}
              >
                More about me
              </h1>

              {msg && (
                <div
                  style={{
                    marginBottom: "12px",
                    color: msg.toLowerCase().includes("success") ? "#166534" : "#d32323",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {uploadingPhoto ? "Uploading photo..." : msg}
                </div>
              )}

              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e7e7e7",
                  borderRadius: "6px",
                  overflow: "hidden",
                  marginBottom: "24px",
                }}
              >
                <div className="form-grid-2" style={{ gap: 0 }}>
                  <OverviewCell label="Name" value={form.name || "—"} />
                  <OverviewCell label="Email" value={form.email || "—"} />
                  <OverviewCell label="Phone Number" value={form.phone_number || "—"} />
                  <OverviewCell label="Gender" value={form.gender || "—"} />
                  <OverviewCell
                    label="Location"
                    value={[form.city, form.state || form.country].filter(Boolean).join(", ") || "—"}
                  />
                  <OverviewCell label="Country" value={form.country || "—"} />
                  <OverviewCell label="Languages" value={form.languages || "—"} />
                  <OverviewCell label="State" value={form.state || "—"} />
                </div>

                <div style={{ borderTop: "1px solid #ededed", padding: "14px 16px" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "800",
                      color: "#5d5d5d",
                      marginBottom: "6px",
                    }}
                  >
                    About Me
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      lineHeight: 1.5,
                    }}
                  >
                    {form.about_me || "—"}
                  </div>
                </div>
              </div>

              <h2
                style={{
                  margin: "0 0 16px",
                  fontSize: "24px",
                  fontWeight: "800",
                  color: "#2d2d2d",
                  letterSpacing: "-0.3px",
                }}
              >
                Your activity
              </h2>

              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e7e7e7",
                  borderRadius: "6px",
                  overflow: "hidden",
                  marginBottom: "24px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                }}
              >
                <QuickLinkCard title="History" subtitle="See your previous reviews and restaurants added" onClick={() => navigate("/history")} />
                <QuickLinkCard title="Favorites" subtitle="Review saved restaurants" onClick={() => navigate("/favorites")} />
                <QuickLinkCard title="Add Restaurant" subtitle="Post a restaurant listing with details and photos" onClick={() => navigate("/add-restaurant")} />
              </div>
            </>
          ) : showEdit ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e7e7e7",
                borderRadius: "6px",
                padding: "24px",
              }}
            >
              <h2
                style={{
                  margin: "0 0 18px",
                  fontSize: "24px",
                  fontWeight: "800",
                  color: "#2d2d2d",
                }}
              >
                Edit profile
              </h2>

              {msg && (
                <div
                  style={{
                    marginBottom: "12px",
                    color: msg.toLowerCase().includes("success") ? "#166534" : "#d32323",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {uploadingPhoto ? "Uploading photo..." : msg}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <Field label="Name">
                  <Input name="name" value={form.name} onChange={handleChange} />
                </Field>

                <Field label="Email">
                  <Input name="email" value={form.email} onChange={handleChange} />
                </Field>

                <Field label="Phone Number">
                  <Input name="phone_number" value={form.phone_number} onChange={handleChange} />
                </Field>

                <Field label="Gender">
                  <CustomSelect
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    placeholder="Select gender"
                    options={genders.map((g) => ({ value: g, label: g }))}
                  />
                </Field>

                <Field label="City">
                  <Input name="city" value={form.city} onChange={handleChange} />
                </Field>

                <Field label="State">
                  <CustomSelect
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="Select state"
                    options={US_STATES.map((s) => ({ value: s, label: s }))}
                  />
                </Field>

                <Field label="Country">
                  <CustomSelect
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    placeholder="Select country"
                    options={countries.map((c) => ({ value: c, label: c }))}
                  />
                </Field>

                <Field label="Languages">
                  <Input name="languages" value={form.languages} onChange={handleChange} />
                </Field>

                <Field label="About Me">
                  <textarea
                    name="about_me"
                    value={form.about_me}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      height: "120px",
                      paddingTop: "10px",
                      resize: "vertical",
                    }}
                  />
                </Field>

                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      background: "#d32323",
                      color: "#fff",
                      border: "none",
                      padding: "12px 20px",
                      cursor: "pointer",
                      fontWeight: "800",
                      borderRadius: "4px",
                      fontFamily: "inherit",
                      fontSize: "15px",
                    }}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEdit(false)}
                    style={{
                      background: "#fff",
                      color: "#444",
                      border: "1px solid #ccc",
                      padding: "12px 20px",
                      cursor: "pointer",
                      fontWeight: "700",
                      borderRadius: "4px",
                      fontFamily: "inherit",
                      fontSize: "15px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e7e7e7",
                borderRadius: "6px",
                padding: "24px",
              }}
            >
              <h2
                style={{
                  margin: "0 0 18px",
                  fontSize: "24px",
                  fontWeight: "800",
                  color: "#2d2d2d",
                }}
              >
                AI Assistant preferences
              </h2>

              {msg && (
                <div
                  style={{
                    marginBottom: "12px",
                    color: msg.toLowerCase().includes("saved") ? "#166534" : "#d32323",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {savingPrefs ? "Saving..." : msg}
                </div>
              )}

              <form onSubmit={handleSavePrefs}>
                <Field label="Cuisine preferences">
                  <MultiChips
                    options={CUISINES}
                    value={prefs.cuisines}
                    onChange={(next) => setPrefs((p) => ({ ...p, cuisines: next }))}
                  />
                </Field>

                <Field label="Price range preference">
                  <select
                    value={prefs.price_range}
                    onChange={(e) => setPrefs((p) => ({ ...p, price_range: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">No preference</option>
                    {PRICE_RANGES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Preferred locations (comma-separated)">
                  <input
                    value={prefs.locations.join(", ")}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        locations: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="San Jose, CA, Santa Clara, CA"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Search radius (km)">
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={prefs.search_radius_km}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        search_radius_km: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </Field>

                <Field label="Dietary needs / restrictions">
                  <MultiChips
                    options={DIETARY}
                    value={prefs.dietary_needs}
                    onChange={(next) => setPrefs((p) => ({ ...p, dietary_needs: next }))}
                  />
                </Field>

                <Field label="Ambiance preferences">
                  <MultiChips
                    options={AMBIANCE}
                    value={prefs.ambiance}
                    onChange={(next) => setPrefs((p) => ({ ...p, ambiance: next }))}
                  />
                </Field>

                <Field label="Sort preference">
                  <select
                    value={prefs.sort_by}
                    onChange={(e) => setPrefs((p) => ({ ...p, sort_by: e.target.value }))}
                    style={inputStyle}
                  >
                    {SORT_PREFS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="submit"
                    disabled={savingPrefs}
                    style={{
                      background: "#d32323",
                      color: "#fff",
                      border: "none",
                      padding: "12px 20px",
                      cursor: "pointer",
                      fontWeight: "800",
                      borderRadius: "4px",
                      fontFamily: "inherit",
                      fontSize: "15px",
                    }}
                  >
                    {savingPrefs ? "Saving..." : "Save preferences"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPrefs(false)}
                    style={{
                      background: "#fff",
                      color: "#444",
                      border: "1px solid #ccc",
                      padding: "12px 20px",
                      cursor: "pointer",
                      fontWeight: "700",
                      borderRadius: "4px",
                      fontFamily: "inherit",
                      fontSize: "15px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function OverviewCell({ label, value }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRight: "1px solid #ededed",
        borderBottom: "1px solid #ededed",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: "800",
          color: "#5d5d5d",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "14px",
          color: "#666",
          lineHeight: 1.4,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: active ? "#e8e8e8" : "#ededed",
          border: active ? "1px solid #d0d0d0" : "1px solid transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontSize: "12px",
          fontWeight: "700",
          color: active ? "#2d2d2d" : "#6b6b6b",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function MenuRow({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: "none",
        background: "#fff",
        textAlign: "left",
        padding: "13px 15px",
        fontSize: "14px",
        color: "#333",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f7f7f7";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#fff";
      }}
    >
      {label}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div
        style={{
          fontWeight: 800,
          marginBottom: "8px",
          fontSize: "15px",
          color: "#444",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Input(props) {
  return <input {...props} style={inputStyle} />;
}

function CustomSelect({ name, value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleSelect = (nextValue) => {
    onChange({
      target: {
        name,
        value: nextValue,
      },
    });
    setOpen(false);
  };

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          ...inputStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span style={{ color: selected ? "#222" : "#777" }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#666"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #d9d9d9",
            borderRadius: "6px",
            boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
            maxHeight: "220px",
            overflowY: "auto",
            zIndex: 5000,
          }}
        >
          <button
            type="button"
            onClick={() => handleSelect("")}
            style={{
              width: "100%",
              border: "none",
              background: value === "" ? "#f7f7f7" : "#fff",
              textAlign: "left",
              padding: "11px 12px",
              fontSize: "14px",
              color: "#555",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {placeholder}
          </button>

          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                style={{
                  width: "100%",
                  border: "none",
                  background: active ? "#fff5f5" : "#fff",
                  textAlign: "left",
                  padding: "11px 12px",
                  fontSize: "14px",
                  color: active ? "#d32323" : "#333",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: active ? "700" : "400",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  height: "42px",
  border: "1px solid #ccc",
  padding: "0 12px",
  boxSizing: "border-box",
  fontSize: "14px",
  fontFamily: "inherit",
  color: "#222",
  background: "#fff",
  borderRadius: "4px",
};

function EditIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2f2f2f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2f2f2f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function OverviewIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2f2f2f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

function PrefsIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2f2f2f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.93 19.07l1.41-1.41" />
      <path d="M17.66 6.34l1.41-1.41" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function YelpLogoDark() {
  return (
    <svg width="88" height="36" viewBox="0 0 88 36" fill="none">
      <text
        x="0"
        y="30"
        fontFamily="Georgia,'Times New Roman',serif"
        fontSize="32"
        fontWeight="700"
        fill="#000"
        letterSpacing="-1"
      >
        yelp
      </text>
      <g transform="translate(74,14)">
        {[0, 72, 144, 216, 288].map((d, i) => (
          <ellipse key={i} cx="0" cy="-7" rx="3.5" ry="7.5" fill="#d32323" transform={`rotate(${d})`} />
        ))}
        <circle cx="0" cy="0" r="3.2" fill="#d32323" />
      </g>
    </svg>
  );
}

function MultiChips({ options, value, onChange }) {
  const set = new Set(value);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {options.map((opt) => {
        const active = set.has(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => {
              const next = active ? value.filter((v) => v !== opt) : [...value, opt];
              onChange(next);
            }}
            style={{
              borderRadius: "999px",
              border: `1px solid ${active ? "#d32323" : "#d6d6d6"}`,
              background: active ? "#fff5f5" : "#fff",
              color: active ? "#d32323" : "#444",
              padding: "7px 12px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {active ? "✓ " : ""}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function QuickLinkCard({ title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "18px 16px",
        textAlign: "left",
        background: "#fff",
        border: "none",
        borderRight: "1px solid #ededed",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <div style={{ fontSize: "15px", fontWeight: "800", color: "#2d2d2d", marginBottom: "6px" }}>{title}</div>
      <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.5 }}>{subtitle}</div>
    </button>
  );
}