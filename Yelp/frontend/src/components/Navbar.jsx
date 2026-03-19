import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CityAutocomplete } from "./CityAutocomplete";

export default function Navbar({
  onSearch,
  defaultFind = "",
  defaultNear = "",
}) {
  const { user, owner, logout } = useAuth();
  const navigate = useNavigate();

  const [find, setFind] = useState(defaultFind);
  const [near, setNear] = useState(defaultNear);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  const currentAccount = owner || user;
  const isOwnerLoggedIn = !!owner;

  useEffect(() => {
    setFind(defaultFind);
  }, [defaultFind]);

  useEffect(() => {
    setNear(defaultNear);
  }, [defaultNear]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    if (onSearch) {
      onSearch({ find, near });
    } else {
      navigate(
        `/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`,
      );
    }
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate(isOwnerLoggedIn ? "/owner/login" : "/login");
  };

  const handleWriteReview = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate("/write-review");
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
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "#fff",
        borderBottom: "1px solid #e8e8e8",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "100%",
          padding: "0 24px",
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            minHeight: "72px",
          }}
        >
          <Link
            to={owner ? "/owner/dashboard" : "/"}
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
              maxWidth: "760px",
              display: "flex",
              alignItems: "center",
              height: "44px",
              background: "#fff",
              border: "1px solid #dcdcdc",
              borderRadius: "4px",
              overflow: "visible",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                flex: "1.5",
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
                gap: "10px",
                borderRight: "1px solid #e5e5e5",
                minWidth: 0,
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#999"
                strokeWidth="2.3"
                style={{ flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <input
                value={find}
                onChange={(e) => setFind(e.target.value)}
                placeholder="restaurants, tacos, coffee..."
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "15px",
                  width: "100%",
                  fontFamily: "inherit",
                  color: "#333",
                  background: "transparent",
                  minWidth: 0,
                }}
              />
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                gap: "8px",
                position: "relative",
                zIndex: 20,
                minWidth: 0,
              }}
            >
              <svg
                width="12"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#999"
                strokeWidth="2.3"
                style={{ flexShrink: 0 }}
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>

              <div style={{ flex: 1, minWidth: 0 }}>
                <CityAutocomplete
                  value={near}
                  onChange={(city) => setNear(city)}
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
              style={{
                background: "#d32323",
                border: "none",
                borderLeft: "1px solid #c61f1f",
                cursor: "pointer",
                width: "54px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                borderRadius: "0 4px 4px 0",
              }}
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

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              style={topLinkStyle}
            >
              Yelp for Business
            </a>

            {!owner && (
              <button
                onClick={handleWriteReview}
                style={{
                  ...topLinkStyle,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Write a Review
              </button>
            )}

            {user && (
              <Link
                to="/add-restaurant"
                style={{
                  ...topLinkStyle,
                  textDecoration: "none",
                  fontWeight: "700",
                }}
              >
                Add Restaurant
              </Link>
            )}

            {currentAccount ? (
              <div style={{ position: "relative" }} ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "1px solid #ddd",
                    background: "#aaa",
                    color: "#fff",
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
                  {currentAccount.profile_picture ? (
                    <img
                      src={currentAccount.profile_picture}
                      alt="Profile"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    initials
                  )}
                </button>

                {menuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      background: "#fff",
                      border: "1px solid #e0e0e0",
                      borderRadius: "10px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.16)",
                      minWidth: "220px",
                      zIndex: 3000,
                      overflow: "hidden",
                    }}
                  >
                    {(isOwnerLoggedIn
                      ? [
                          {
                            label: "Owner Dashboard",
                            path: "/owner/dashboard",
                          },
                          { label: "Owner Profile", path: "/owner/profile" },
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
                        onClick={() => {
                          setMenuOpen(false);
                          navigate(path);
                        }}
                        style={menuItemStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f7f7f7";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fff";
                        }}
                      >
                        {label}
                      </button>
                    ))}

                    <div style={{ height: "1px", background: "#eee" }} />

                    <button
                      onClick={handleLogout}
                      style={{ ...menuItemStyle, color: "#d32323" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f7f7f7";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                      }}
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
                  style={{
                    textDecoration: "none",
                    color: "#333",
                    border: "1px solid #d0d0d0",
                    borderRadius: "4px",
                    padding: "8px 14px",
                    fontSize: "13px",
                    fontWeight: "700",
                    whiteSpace: "nowrap",
                  }}
                >
                  Log In
                </Link>

                <Link
                  to="/signup"
                  style={{
                    textDecoration: "none",
                    background: "#d32323",
                    color: "#fff",
                    borderRadius: "4px",
                    padding: "8px 14px",
                    fontSize: "13px",
                    fontWeight: "700",
                    whiteSpace: "nowrap",
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const topLinkStyle = {
  color: "#333",
  fontSize: "13px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "6px 10px",
  whiteSpace: "nowrap",
};

const menuItemStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "12px 16px",
  fontSize: "14px",
  color: "#333",
  background: "#fff",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

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
