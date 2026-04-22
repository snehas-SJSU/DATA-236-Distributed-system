import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const email = form.email.trim();

    if (!firstName || !lastName || !email || !form.password || !form.confirm_password) {
      return "Please fill in all fields.";
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }

    if (form.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (form.password !== form.confirm_password) {
      return "Passwords do not match.";
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
        name: `${form.first_name.trim()} ${form.last_name.trim()}`,
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      const res = await authAPI.signupUser(payload);
      login(res.data.user, res.data.access_token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans">
      <header className="border-b border-[#e6e6e6] bg-white px-8 py-[14px]">
        <Link to="/" className="inline-flex no-underline">
          <YelpLogo />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-6 sm:py-10">
        <div className="flex w-full max-w-[980px] items-center justify-center gap-12 lg:justify-between lg:gap-14">
          <section className="w-full max-w-[340px] shrink-0">
            <h1 className="mb-2 text-center text-[30px] font-bold leading-tight text-[#d32323] sm:text-[32px]">
              Sign Up for Yelp
            </h1>

            <p className="mb-[18px] text-center text-[16px] font-bold text-[#333]">
              Connect with great local businesses
            </p>

            {error && (
              <div className="mb-3 rounded border border-[#f1c2c2] bg-[#fff5f5] px-3 py-[10px] text-[13px] text-[#d32323]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-[10px] grid grid-cols-2 gap-2">
                <FInput
                  type="text"
                  name="first_name"
                  placeholder="First Name"
                  value={form.first_name}
                  onChange={handleChange}
                />
                <FInput
                  type="text"
                  name="last_name"
                  placeholder="Last Name"
                  value={form.last_name}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-[10px]">
                <FInput
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-[10px]">
                <FInput
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <FInput
                  type="password"
                  name="confirm_password"
                  placeholder="Confirm Password"
                  value={form.confirm_password}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-[42px] w-full rounded border border-[#b91c1c] bg-[#d32323] text-[16px] font-bold text-white shadow-sm transition hover:bg-[#c91f1f] disabled:cursor-not-allowed disabled:opacity-80"
              >
                {loading ? "Signing Up..." : "Sign Up"}
              </button>
            </form>

            <p className="mt-[14px] text-right text-[12px] text-[#999]">
              Already on Yelp?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#0073bb] no-underline hover:underline"
              >
                Log in
              </Link>
            </p>
          </section>

          <div className="hidden min-w-[320px] flex-1 items-center justify-center lg:flex">
            <YelpSignupStorefront />
          </div>
        </div>
      </main>
    </div>
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
      className="block h-10 w-full rounded border border-[#c8c8c8] bg-white px-3 text-[14px] text-[#222] outline-none transition focus:border-[#0073bb] focus:ring-2 focus:ring-[rgba(0,115,187,0.15)]"
    />
  );
}

function YelpLogo() {
  return (
    <svg width="72" height="32" viewBox="0 0 88 36" fill="none">
      <text
        x="0"
        y="29"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="30"
        fontWeight="700"
        fill="#000"
        letterSpacing="-1"
      >
        yelp
      </text>
      <g transform="translate(72,15)">
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-7"
            rx="3.5"
            ry="7.5"
            fill="#d32323"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle cx="0" cy="0" r="3" fill="#d32323" />
      </g>
    </svg>
  );
}

function YelpSignupStorefront() {
  return (
    <svg
      width="320"
      height="320"
      viewBox="0 0 360 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-auto w-[320px]"
    >
      <defs>
        <clipPath id="signupCircleClip">
          <circle cx="180" cy="170" r="110" />
        </clipPath>
      </defs>

      <circle cx="180" cy="170" r="110" fill="#e8e4db" />

      <g clipPath="url(#signupCircleClip)">
        <rect x="70" y="55" width="220" height="220" fill="#e3dfd7" />
        {[90, 120, 150, 180, 210, 240, 270].map((x) => (
          <line key={x} x1={x} y1="55" x2={x} y2="275" stroke="#cfc9bf" strokeWidth="1" />
        ))}
        {[80, 110, 140, 170, 200, 230, 260].map((y) => (
          <line key={y} x1="70" y1={y} x2="290" y2={y} stroke="#cfc9bf" strokeWidth="1" />
        ))}

        <rect x="115" y="70" width="130" height="170" fill="#f2efe8" stroke="#2b2b2b" strokeWidth="2" />

        <rect x="125" y="80" width="34" height="52" fill="#d4d1c8" stroke="#2b2b2b" strokeWidth="2" />
        <rect x="163" y="80" width="34" height="52" fill="#d4d1c8" stroke="#2b2b2b" strokeWidth="2" />
        <rect x="201" y="80" width="34" height="52" fill="#d4d1c8" stroke="#2b2b2b" strokeWidth="2" />

        <rect x="120" y="138" width="120" height="8" fill="#e7e2d9" stroke="#2b2b2b" strokeWidth="1.6" />
        <rect x="126" y="146" width="108" height="18" rx="2" fill="#fff" stroke="#2b2b2b" strokeWidth="1.6" />

        <rect x="125" y="170" width="46" height="58" fill="#bccfd8" stroke="#2b2b2b" strokeWidth="2" />
        <rect x="189" y="170" width="46" height="58" fill="#bccfd8" stroke="#2b2b2b" strokeWidth="2" />
        <path d="M125 188 Q148 172 171 188" fill="#aabdc7" stroke="#2b2b2b" strokeWidth="1.5" />
        <path d="M189 188 Q212 172 235 188" fill="#aabdc7" stroke="#2b2b2b" strokeWidth="1.5" />

        <rect x="172" y="176" width="16" height="52" fill="#3b3b3b" stroke="#2b2b2b" strokeWidth="2" />

        <rect x="116" y="206" width="8" height="10" fill="#d9bc4a" stroke="#a98c22" strokeWidth="1" />

        <path d="M173 228 Q180 230 187 228 L202 300 L158 300 Z" fill="#d32323" />

        <rect x="213" y="74" width="10" height="10" fill="#c0392b" stroke="#2b2b2b" strokeWidth="1" />
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <ellipse
            key={i}
            cx={218 + Math.cos((deg * Math.PI) / 180) * 4}
            cy={69 + Math.sin((deg * Math.PI) / 180) * 4}
            rx="2.4"
            ry="2.4"
            fill="#fff"
          />
        ))}
        <circle cx="218" cy="69" r="1.8" fill="#f5c518" />
      </g>

      <line x1="56" y1="248" x2="48" y2="286" stroke="#2b2b2b" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="74" y1="248" x2="82" y2="286" stroke="#2b2b2b" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="50" y="224" width="34" height="28" fill="#fff" stroke="#2b2b2b" strokeWidth="2.3" />
      <line x1="56" y1="232" x2="78" y2="232" stroke="#ccc" strokeWidth="1.3" />
      <line x1="56" y1="238" x2="78" y2="238" stroke="#ccc" strokeWidth="1.3" />
      <line x1="56" y1="244" x2="74" y2="244" stroke="#ccc" strokeWidth="1.3" />

      <circle cx="286" cy="220" r="8" fill="none" stroke="#2b2b2b" strokeWidth="2.3" />
      <line x1="286" y1="228" x2="286" y2="258" stroke="#2b2b2b" strokeWidth="2.3" />
      <line x1="274" y1="240" x2="298" y2="240" stroke="#2b2b2b" strokeWidth="2.3" />
      <line x1="286" y1="258" x2="278" y2="280" stroke="#2b2b2b" strokeWidth="2.3" />
      <line x1="286" y1="258" x2="294" y2="280" stroke="#2b2b2b" strokeWidth="2.3" />

      <circle cx="308" cy="224" r="8" fill="none" stroke="#2b2b2b" strokeWidth="2.3" />
      <line x1="308" y1="232" x2="308" y2="260" stroke="#2b2b2b" strokeWidth="2.3" />
      <line x1="296" y1="244" x2="320" y2="244" stroke="#2b2b2b" strokeWidth="2.3" />
      <line x1="308" y1="260" x2="300" y2="282" stroke="#2b2b2b" strokeWidth="2.3" />
      <line x1="308" y1="260" x2="316" y2="282" stroke="#2b2b2b" strokeWidth="2.3" />

      <circle cx="330" cy="222" r="7" fill="none" stroke="#2b2b2b" strokeWidth="2.3" />
      <line x1="330" y1="229" x2="330" y2="255" stroke="#2b2b2b" strokeWidth="2.3" />
      <line x1="320" y1="240" x2="340" y2="240" stroke="#2b2b2b" strokeWidth="2.3" />
      <line x1="330" y1="255" x2="323" y2="276" stroke="#2b2b2b" strokeWidth="2.3" />
      <line x1="330" y1="255" x2="337" y2="276" stroke="#2b2b2b" strokeWidth="2.3" />

      <g transform="translate(298, 198)">
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-5"
            rx="2.2"
            ry="4.5"
            fill="#d32323"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle cx="0" cy="0" r="2" fill="#d32323" />
      </g>

      <ellipse cx="102" cy="150" rx="6" ry="2.5" fill="#d32323" transform="rotate(-30 102 150)" />
      <ellipse cx="260" cy="198" rx="6" ry="2.5" fill="#2563eb" transform="rotate(18 260 198)" />
      <ellipse cx="230" cy="76" rx="6" ry="2.5" fill="#d32323" transform="rotate(-25 230 76)" />
      <ellipse cx="282" cy="146" rx="5" ry="2.2" fill="#2563eb" transform="rotate(22 282 146)" />
    </svg>
  );
}