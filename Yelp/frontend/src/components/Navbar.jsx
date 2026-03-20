import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SearchAutocomplete from "./SearchAutocomplete";
import { CityAutocomplete } from "./CityAutocomplete";

export default function Navbar({
  onSearch,
  defaultFind = "",
  defaultNear = "",
  hideSearch = false,
}) {
  const { user, owner, logout } = useAuth();
  const navigate = useNavigate();

  const getInitialNear = () => {
    if (defaultNear) return defaultNear;
    try {
      const src =
        JSON.parse(localStorage.getItem("user") || "{}").pref_locations_json ||
        "[]";
      return JSON.parse(src)?.[0] || "";
    } catch {
      return "";
    }
  };

  const [find, setFind] = useState(defaultFind);
  const [near, setNear] = useState(getInitialNear);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const menuRef = useRef(null);

  const currentAccount = owner || user;
  const isOwnerLoggedIn = !!owner;

  const getUserLocation = () => {
    try {
      const src =
        user?.pref_locations_json ||
        JSON.parse(localStorage.getItem("user") || "{}").pref_locations_json ||
        "[]";
      return JSON.parse(src)?.[0] || "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    setFind(defaultFind);
  }, [defaultFind]);

  useEffect(() => {
    setNear(defaultNear);
  }, [defaultNear]);

  useEffect(() => {
    if (!defaultNear) {
      const s = getUserLocation();
      if (s) setNear(s);
    }
  }, [user, defaultNear]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const runSearch = (nextFind, nextNear) => {
    if (onSearch) {
      onSearch({ find: nextFind, near: nextNear });
    } else {
      navigate(
        `/search?q=${encodeURIComponent(nextFind || "Restaurants")}&loc=${encodeURIComponent(
          nextNear || ""
        )}`
      );
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    runSearch(find, near);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate(isOwnerLoggedIn ? "/owner/login" : "/login");
  };

  const initials = currentAccount?.name
    ? currentAccount.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
    : "U";

  return (
    <nav className="sticky top-0 z-[1000] bg-white border-b border-gray-200 font-sans">
      <div className="px-4 md:px-6">
        <div className="flex items-center gap-3 md:gap-5 min-h-[64px] md:min-h-[72px]">
          <Link
            to={owner ? "/owner/dashboard" : "/"}
            className="flex-shrink-0 flex items-center no-underline"
          >
            <YelpLogoDark />
          </Link>

          {!hideSearch && (
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-[760px] h-11 bg-white border border-gray-300 rounded overflow-visible shadow-sm"
              style={{ position: "relative" }}
            >
              <div
                className="flex flex-[1.5] items-center px-3 gap-2 border-r border-gray-200 min-w-0"
                style={{ position: "relative", zIndex: 40 }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#999"
                  strokeWidth="2.3"
                  className="flex-shrink-0"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>

                <div className="flex-1 min-w-0">
                  <SearchAutocomplete
                    value={find}
                    onChange={setFind}
                    onSelect={(val) => {
                      setFind(val);
                    }}
                    onClear={() => {
                      setFind("");
                      runSearch("", near);
                    }}
                    placeholder="restaurants, tacos, coffee..."
                    inputStyle={{
                      fontSize: "14px",
                      height: "30px",
                      border: "none",
                      background: "transparent",
                      boxShadow: "none",
                      color: "#374151",
                      paddingRight: find ? "22px" : "0",
                    }}
                  />
                </div>
              </div>

              <div
                className="flex flex-1 items-center px-3 gap-2 relative z-20 min-w-0"
                style={{ overflow: "visible" }}
              >
                <svg
                  width="12"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#999"
                  strokeWidth="2.3"
                  className="flex-shrink-0"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>

                <div className="flex-1 min-w-0">
                  <CityAutocomplete
                    value={near}
                    onChange={(c) => setNear(c)}
                    onSelect={(city) => {
                      setNear(city);
                    }}
                    onClear={() => {
                      setNear("");
                      runSearch(find, "");
                    }}
                    placeholder="City..."
                    inputStyle={{
                      border: "none",
                      outline: "none",
                      fontSize: "14px",
                      background: "transparent",
                      padding: "4px 2px",
                      width: "100%",
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#d32323] border-none border-l border-[#c61f1f] cursor-pointer w-[54px] h-full flex items-center justify-center flex-shrink-0 rounded-r"
                aria-label="Search"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </form>
          )}

          {!hideSearch && (
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="md:hidden ml-auto flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-gray-50"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#555"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          )}

          <div className="ml-auto flex items-center gap-1 md:gap-2 flex-shrink-0">
            {isOwnerLoggedIn && (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/owner/restaurants/add")}
                  className="hidden md:block text-gray-700 text-[13px] font-semibold px-3 py-1 bg-transparent border border-gray-300 rounded cursor-pointer hover:bg-gray-50 font-sans whitespace-nowrap"
                >
                  + Add Restaurant
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/owner/claim")}
                  className="hidden md:block text-white text-[13px] font-semibold px-3 py-1 border-none rounded cursor-pointer font-sans whitespace-nowrap"
                  style={{ background: "#d32323" }}
                >
                  + Claim Restaurant
                </button>
              </>
            )}

            {!owner && (
              <button
                type="button"
                onClick={() => navigate(user ? "/write-review" : "/login")}
                className="hidden md:block text-gray-700 text-[13px] font-semibold px-2 py-1 bg-transparent border-none cursor-pointer hover:text-gray-900 font-sans whitespace-nowrap"
              >
                Write a Review
              </button>
            )}

            {user && (
              <Link
                to="/add-restaurant"
                className="hidden md:block text-gray-700 text-[13px] font-bold px-2 py-1 no-underline hover:text-gray-900 whitespace-nowrap"
              >
                Add Restaurant
              </Link>
            )}

            {currentAccount ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-9 h-9 rounded-full border border-gray-300 bg-gray-400 text-white flex items-center justify-center cursor-pointer font-bold text-[13px] overflow-hidden p-0"
                >
                  {currentAccount.profile_picture ? (
                    <img
                      src={currentAccount.profile_picture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-gray-200 rounded-xl shadow-xl min-w-[220px] z-[3000] overflow-hidden">
                    {(isOwnerLoggedIn
                      ? [
                        { label: "Dashboard", path: "/owner/dashboard" },
                        { label: "Analytics", path: "/owner/analytics" },
                        { label: "Reviews", path: "/owner/reviews" },
                        { label: "Profile", path: "/owner/profile" },
                      ]
                      : [
                        { label: "Profile", path: "/profile" },
                        { label: "Add Restaurant", path: "/add-restaurant" },
                        { label: "Favorites", path: "/favorites" },
                        { label: "History", path: "/history" },
                      ]
                    ).map(({ label, path }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate(path);
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 bg-white border-none cursor-pointer hover:bg-gray-50 font-sans"
                      >
                        {label}
                      </button>
                    ))}

                    <div className="h-px bg-gray-100" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-sm text-[#d32323] bg-white border-none cursor-pointer hover:bg-gray-50 font-sans"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="no-underline text-gray-700 border border-gray-300 rounded px-3 py-2 text-[13px] font-bold whitespace-nowrap hover:bg-gray-50"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="no-underline bg-[#d32323] text-white rounded px-3 py-2 text-[13px] font-bold whitespace-nowrap hover:bg-[#b51d1d]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {!hideSearch && mobileSearchOpen && (
          <form
            onSubmit={(e) => {
              handleSearch(e);
              setMobileSearchOpen(false);
            }}
            className="md:hidden pb-3 flex gap-2"
          >
            <div
              className="flex flex-1 bg-white border border-gray-300 rounded overflow-visible"
              style={{ position: "relative" }}
            >
              <div className="flex-1 px-3 py-2 min-w-0 relative z-40">
                <SearchAutocomplete
                  value={find}
                  onChange={setFind}
                  onSelect={(val) => {
                    setFind(val);
                  }}
                  onClear={() => {
                    setFind("");
                    runSearch("", near);
                  }}
                  placeholder="Search restaurants..."
                  inputStyle={{
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    background: "transparent",
                    padding: "4px 2px",
                    width: "100%",
                  }}
                />
              </div>

              <div
                className="border-l border-gray-200 px-2 py-1 min-w-[100px]"
                style={{ position: "relative", zIndex: 50 }}
              >
                <CityAutocomplete
                  value={near}
                  onChange={(c) => setNear(c)}
                  onSelect={(city) => {
                    setNear(city);
                  }}
                  onClear={() => {
                    setNear("");
                    runSearch(find, "");
                  }}
                  placeholder="city..."
                  inputStyle={{
                    height: "30px",
                    border: "none",
                    borderRadius: "0",
                    padding: "0 2px",
                    fontSize: "15px",
                    background: "transparent",
                    boxShadow: "none",
                    color: "#333",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-[#d32323] text-white border-none rounded px-4 cursor-pointer font-bold text-sm"
            >
              Go
            </button>
          </form>
        )}
      </div>
    </nav>
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
        fill="#d32323"
        letterSpacing="-1"
      >
        yelp
      </text>
      <g transform="translate(74,14)">
        {[0, 72, 144, 216, 288].map((d, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-7"
            rx="3.5"
            ry="7.5"
            fill="#d32323"
            transform={`rotate(${d})`}
          />
        ))}
        <circle cx="0" cy="0" r="3.2" fill="#d32323" />
      </g>
    </svg>
  );
}
