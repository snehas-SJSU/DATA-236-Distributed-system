import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { fetchFavorites } from "../store/slices/favoritesSlice";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const email = form.email.trim();

    if (!email || !form.password) {
      return "Please fill in all fields.";
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      const res = await authAPI.loginUser(payload);
      login(res.data.user, res.data.access_token);
      // Pre-load favorites into Redux store after login
      dispatch(fetchFavorites());
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <header style={{ borderBottom: "1px solid #e8e8e8", padding: "13px 24px" }}>
        <Link to="/" style={{ textDecoration: "none", display: "inline-block" }}>
          <YelpLogo />
        </Link>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          gap: "80px",
        }}
      >
        <div style={{ width: "320px", flexShrink: 0 }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#d32323",
              textAlign: "center",
              margin: "0 0 10px",
            }}
          >
            Log in to Yelp
          </h1>

          <p
            style={{
              fontSize: "13px",
              color: "#555",
              textAlign: "center",
              lineHeight: 1.65,
              margin: "0 0 20px",
            }}
          >
            {/* By continuing, you agree to Yelp&apos;s{" "}
            <a href="#" style={{ color: "#0070c9", textDecoration: "none" }}>
              Terms of Service
            </a>{" "}
            and acknowledge Yelp&apos;s{" "}
            <a href="#" style={{ color: "#0070c9", textDecoration: "none" }}>
              Privacy Policy
            </a>. */}
          </p>

          {error && (
            <div
              style={{
                marginBottom: "12px",
                fontSize: "13px",
                color: "#d32323",
                background: "#fff5f5",
                border: "1px solid #fcc",
                borderRadius: "4px",
                padding: "8px 12px",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FInput
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />

            <div style={{ marginTop: "10px" }}>
              <FInput
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: "44px",
                background: "#d32323",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
                marginTop: "12px",
                fontFamily: "inherit",
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "18px" }}>
            {/* <a
              href="#"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#0070c9",
                textDecoration: "none",
                marginBottom: "10px",
              }}
            >
              Login via email link
            </a> */}

            <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
              New to Yelp?{" "}
              <Link
                to="/signup"
                style={{
                  color: "#0070c9",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="yelp-illus">
          <YelpStorefront />
        </div>
      </main>

      <style>{`
        .yelp-illus { display: flex; }
        @media (max-width: 820px) { .yelp-illus { display: none; } }
      `}</style>
    </div>
  );
}

function SocialBtn({ icon, label }) {
  return (
    <button
      style={{
        width: "100%",
        height: "44px",
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        fontSize: "15px",
        fontWeight: "600",
        color: "#222",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f7f7")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function FInput({ type, name, placeholder, value, onChange }) {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        height: "44px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "0 12px",
        fontSize: "15px",
        color: "#222",
        fontFamily: "inherit",
        background: "#fff",
        display: "block",
        boxSizing: "border-box",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "#0070c9";
        e.target.style.boxShadow = "0 0 0 2px rgba(0,112,201,0.15)";
        e.target.style.outline = "none";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "#ccc";
        e.target.style.boxShadow = "none";
      }}
    />
  );
}

function YelpLogo() {
  return (
    <svg width="105" height="42" viewBox="0 0 105 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        x="0"
        y="34"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="36"
        fontWeight="700"
        fill="#000"
        letterSpacing="-1.5"
      >
        yelp
      </text>

      <g transform="translate(89, 18)">
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-7"
            rx="4"
            ry="8"
            fill="#d32323"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle cx="0" cy="0" r="3.5" fill="#d32323" />
      </g>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="21" viewBox="0 0 814 1000" fill="#000" xmlns="http://www.w3.org/2000/svg">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.3 134.4-316.7 266.5-316.7 49.8 0 91.4 33.2 122.5 33.2 30 0 76.5-35.4 134.2-35.4 21.5 0 108.2 1.9 163.7 62.2zm-187.8-220.4c27.4-36.7 47.5-88.5 47.5-140.4 0-7.1-.6-14.3-1.9-20.1-45.1 1.7-99 30.1-132.6 72.4-26.1 31.9-50.2 83.8-50.2 136.4 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 40.2 0 89-26.7 121.7-67.7z"/>
    </svg>
  );
}

function YelpStorefront() {
  return (
    <svg
      width="460"
      height="480"
      viewBox="0 0 460 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="circleClip">
          <circle cx="220" cy="210" r="170"/>
        </clipPath>
      </defs>

      <circle cx="220" cy="210" r="170" fill="#e8e4db"/>

      <g clipPath="url(#circleClip)">
        <rect x="50" y="60" width="340" height="300" fill="#dedad2"/>
        {[90, 140, 190, 250, 310, 360].map((x) => (
          <line key={x} x1={x} y1="60" x2={x} y2="360" stroke="#ccc8be" strokeWidth="1.5"/>
        ))}
        {[100, 140, 180, 220, 260, 300, 340].map((y) => (
          <line key={y} x1="50" y1={y} x2="390" y2={y} stroke="#ccc8be" strokeWidth="1"/>
        ))}
        {[
          [60, 120, 25, 50],
          [68, 180, 18, 35],
          [60, 230, 25, 55],
          [355, 120, 25, 50],
          [362, 180, 18, 35],
          [355, 230, 25, 55],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="1" fill="none" stroke="#bbb8ae" strokeWidth="1"/>
        ))}

        <rect x="100" y="70" width="240" height="295" fill="#f2efe8" stroke="#1a1a1a" strokeWidth="2.5"/>

        <rect x="108" y="82" width="62" height="80" fill="#8a9eaa" stroke="#1a1a1a" strokeWidth="2"/>
        <line x1="139" y1="82" x2="139" y2="162" stroke="#1a1a1a" strokeWidth="1.5"/>
        <rect x="110" y="84" width="27" height="76" fill="#96abb7"/>
        <rect x="141" y="84" width="27" height="76" fill="#96abb7"/>
        <rect x="106" y="160" width="66" height="5" rx="1" fill="#e0dcd4" stroke="#1a1a1a" strokeWidth="1.5"/>

        <rect x="179" y="82" width="82" height="80" fill="#8a9eaa" stroke="#1a1a1a" strokeWidth="2"/>
        <line x1="220" y1="82" x2="220" y2="162" stroke="#1a1a1a" strokeWidth="1.5"/>
        <rect x="181" y="84" width="37" height="76" fill="#96abb7"/>
        <rect x="221" y="84" width="37" height="76" fill="#96abb7"/>
        <rect x="177" y="160" width="86" height="5" rx="1" fill="#e0dcd4" stroke="#1a1a1a" strokeWidth="1.5"/>

        <rect x="270" y="82" width="62" height="80" fill="#8a9eaa" stroke="#1a1a1a" strokeWidth="2"/>
        <line x1="301" y1="82" x2="301" y2="162" stroke="#1a1a1a" strokeWidth="1.5"/>
        <rect x="272" y="84" width="27" height="76" fill="#96abb7"/>
        <rect x="303" y="84" width="27" height="76" fill="#96abb7"/>
        <rect x="268" y="160" width="66" height="5" rx="1" fill="#e0dcd4" stroke="#1a1a1a" strokeWidth="1.5"/>

        <rect x="316" y="151" width="14" height="9" rx="1" fill="#c0392b" stroke="#1a1a1a" strokeWidth="1.5"/>
        {[0, 60, 120, 180, 240, 300].map((a, i) => {
          const r = (a * Math.PI) / 180;
          return (
            <ellipse
              key={i}
              cx={323 + Math.cos(r) * 5}
              cy={143 + Math.sin(r) * 5}
              rx="3.5"
              ry="3.5"
              fill="#fff"
              stroke="#ddd"
              strokeWidth="0.5"
            />
          );
        })}
        <circle cx="323" cy="143" r="3" fill="#f5c518"/>
        <line x1="323" y1="150" x2="323" y2="153" stroke="#2a7a2a" strokeWidth="2"/>

        <rect x="100" y="166" width="240" height="8" fill="#e8e4dc" stroke="#1a1a1a" strokeWidth="1.5"/>
        {Array.from({ length: 24 }, (_, i) => (
          <rect key={i} x={103 + i * 10} y="167" width="6" height="5" fill="#d8d4cc" stroke="#bbb" strokeWidth="0.5"/>
        ))}
        <rect x="100" y="174" width="240" height="4" fill="#dedad2" stroke="#1a1a1a" strokeWidth="1.5"/>

        <rect x="106" y="182" width="228" height="26" fill="#fff" stroke="#1a1a1a" strokeWidth="2"/>
        <rect x="109" y="185" width="222" height="20" fill="#fff" stroke="#1a1a1a" strokeWidth="1"/>

        <rect x="100" y="208" width="22" height="135" fill="#e8e4dc" stroke="#1a1a1a" strokeWidth="2"/>
        <rect x="318" y="208" width="22" height="135" fill="#e8e4dc" stroke="#1a1a1a" strokeWidth="2"/>

        <rect x="104" y="278" width="14" height="10" rx="1" fill="#d4aa40" stroke="#aa8820" strokeWidth="1"/>
        <text x="107" y="286" fontSize="7" fill="#7a6010" fontFamily="Arial">★</text>

        <rect x="122" y="208" width="88" height="100" fill="#b8cdd8" stroke="#1a1a1a" strokeWidth="2"/>
        <path d="M122 240 Q166 215 210 240" fill="#9ab5c2" stroke="#1a1a1a" strokeWidth="1.5"/>
        <ellipse cx="145" cy="268" rx="10" ry="12" fill="#6a8090" opacity="0.7"/>
        <ellipse cx="145" cy="252" rx="7" ry="7" fill="#6a8090" opacity="0.7"/>
        <ellipse cx="175" cy="268" rx="10" ry="12" fill="#6a8090" opacity="0.7"/>
        <ellipse cx="175" cy="252" rx="7" ry="7" fill="#6a8090" opacity="0.7"/>

        <rect x="230" y="208" width="88" height="100" fill="#b8cdd8" stroke="#1a1a1a" strokeWidth="2"/>
        <path d="M230 240 Q274 215 318 240" fill="#9ab5c2" stroke="#1a1a1a" strokeWidth="1.5"/>
        <ellipse cx="253" cy="268" rx="10" ry="12" fill="#6a8090" opacity="0.7"/>
        <ellipse cx="253" cy="252" rx="7" ry="7" fill="#6a8090" opacity="0.7"/>
        <ellipse cx="283" cy="268" rx="10" ry="12" fill="#6a8090" opacity="0.7"/>
        <ellipse cx="283" cy="252" rx="7" ry="7" fill="#6a8090" opacity="0.7"/>

        <rect x="196" y="218" width="48" height="125" fill="#444" stroke="#1a1a1a" strokeWidth="2"/>
        <rect x="199" y="221" width="19" height="26" rx="1" fill="#383838" stroke="#555" strokeWidth="1"/>
        <rect x="221" y="221" width="19" height="26" rx="1" fill="#383838" stroke="#555" strokeWidth="1"/>
        <circle cx="237" cy="270" r="3" fill="#999" stroke="#777" strokeWidth="1"/>
        <rect x="192" y="340" width="56" height="8" rx="1" fill="#d8d4cc" stroke="#1a1a1a" strokeWidth="1.5"/>

        <path d="M196 348 Q210 348 220 365 Q230 380 220 400 Q210 415 186 415 Q162 415 152 400 Q142 380 152 365 Q162 348 196 348Z" fill="#c0392b"/>
        <ellipse cx="220" cy="350" rx="30" ry="10" fill="#c0392b"/>
        <ellipse cx="214" cy="346" rx="12" ry="5" fill="rgba(255,255,255,0.13)"/>
      </g>

      <line x1="52" y1="330" x2="38" y2="390" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
      <line x1="72" y1="330" x2="86" y2="390" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
      <line x1="43" y1="360" x2="81" y2="360" stroke="#1a1a1a" strokeWidth="2"/>
      <rect x="38" y="312" width="44" height="36" rx="2" fill="#fff" stroke="#1a1a1a" strokeWidth="2.5"/>
      <line x1="44" y1="322" x2="76" y2="322" stroke="#ccc" strokeWidth="1.5"/>
      <line x1="44" y1="330" x2="76" y2="330" stroke="#ccc" strokeWidth="1.5"/>
      <line x1="44" y1="338" x2="70" y2="338" stroke="#ccc" strokeWidth="1.5"/>

      <circle cx="356" cy="340" r="11" fill="none" stroke="#1a1a1a" strokeWidth="2.5"/>
      <line x1="356" y1="351" x2="356" y2="388" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="340" y1="365" x2="372" y2="365" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="356" y1="388" x2="346" y2="415" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="356" y1="388" x2="366" y2="415" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>

      <circle cx="392" cy="344" r="11" fill="none" stroke="#1a1a1a" strokeWidth="2.5"/>
      <line x1="392" y1="355" x2="392" y2="390" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="376" y1="368" x2="408" y2="368" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="392" y1="390" x2="382" y2="415" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="392" y1="390" x2="402" y2="415" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>

      <circle cx="426" cy="342" r="11" fill="none" stroke="#1a1a1a" strokeWidth="2.5"/>
      <line x1="426" y1="353" x2="426" y2="388" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="410" y1="366" x2="442" y2="366" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="426" y1="388" x2="416" y2="415" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="426" y1="388" x2="436" y2="415" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>

      <g transform="translate(410, 318)">
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <ellipse key={i} cx="0" cy="-8" rx="4" ry="8.5" fill="#d32323" transform={`rotate(${deg})`}/>
        ))}
        <circle cx="0" cy="0" r="3.5" fill="#d32323"/>
      </g>

      <ellipse cx="295" cy="78" rx="9" ry="4" fill="#d32323" transform="rotate(-30 295 78)"/>
      <ellipse cx="88" cy="188" rx="8" ry="3.5" fill="#d32323" transform="rotate(15 88 188)"/>
      <ellipse cx="148" cy="68" rx="7" ry="3" fill="#d32323" transform="rotate(20 148 68)"/>
      <ellipse cx="310" cy="175" rx="7" ry="3" fill="#d32323" transform="rotate(-10 310 175)"/>
      <ellipse cx="162" cy="128" rx="8" ry="3.5" fill="#2563eb" transform="rotate(-20 162 128)"/>
      <ellipse cx="98" cy="290" rx="8" ry="3.5" fill="#2563eb" transform="rotate(10 98 290)"/>
      <ellipse cx="335" cy="248" rx="7" ry="3" fill="#2563eb" transform="rotate(15 335 248)"/>
      <ellipse cx="270" cy="105" rx="6" ry="2.5" fill="#2563eb" transform="rotate(-25 270 105)"/>
    </svg>
  );
}