import { Link, useNavigate } from "react-router-dom";
import SearchAutocomplete from "./SearchAutocomplete";
import { CityAutocomplete } from "./CityAutocomplete";
import { useAuth } from "../context/AuthContext";

export default function YelpTopHeader({
  find,
  setFind,
  near,
  setNear,
  handleSearch,
  user,
  userMenu,
  setUserMenu,
  logout,
  navigate,
  restOpen,
  setRestOpen,
  setSearchParams,
  setPage,
  showWhiteBorder = true,
  isHomeHero = false,
}) {
  const textColor = isHomeHero ? "#fff" : "#333";
  const subBorder = isHomeHero ? "1px solid rgba(255,255,255,0.15)" : "1px solid #ebebeb";
  const restaurantFill = isHomeHero ? "#fff" : "#555";
  const restaurantActiveBorder = isHomeHero ? "2px solid #fff" : "2px solid #d32323";
  const restaurantColor = isHomeHero ? "#fff" : restOpen ? "#d32323" : "#333";
  const logoVariant = isHomeHero ? <YelpLogoWhite /> : <YelpLogoDark />;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div
      style={{
        position: isHomeHero ? "absolute" : "relative",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "0 32px",
        background: isHomeHero ? "transparent" : "#ffffff",
        borderBottom: isHomeHero ? "none" : "1px solid #ebebeb",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", height: "64px", gap: "24px" }}>
        <Link
          to="/"
          style={{
            textDecoration: "none",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            marginRight: "8px",
          }}
        >
          {logoVariant}
        </Link>

        <form
          onSubmit={handleSearch}
          style={{
            flex: 1,
            maxWidth: "760px",
            display: "flex",
            height: "44px",
            background: "#fff",
            borderRadius: "4px",
            overflow: "hidden",
            boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
            border: isHomeHero ? "none" : "1px solid #e5e5e5",
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
                setSearchParams({ q: val || "Restaurants", loc: near || "" });
                if (setPage) setPage(1);
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
              background: "#c60000",
              border: "none",
              cursor: "pointer",
              width: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#a50000")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#c60000")}
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
            gap: "8px",
            flexShrink: 0,
            position: "relative",
          }}
        >
          {["Yelp for Business"].map((t) => (
            <a
              key={t}
              href="#"
              style={{
                color: textColor,
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
                padding: "6px 10px",
                whiteSpace: "nowrap",
                opacity: 0.92,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.92")}
            >
              {t}
            </a>
          ))}

          <button
            onClick={() => navigate(user ? "/write-review" : "/login")}
            style={{ background: "none", border: "none", cursor: "pointer", color: textColor, fontSize: "13px", fontWeight: "600", padding: "6px 10px", whiteSpace: "nowrap", opacity: 0.92, fontFamily: "inherit" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.92")}
          >
            Write a Review
          </button>

          {user && (
            <Link
              to="/add-restaurant"
              style={{
                color: isHomeHero ? "#fff" : "#333",
                fontSize: "13px",
                fontWeight: "700",
                textDecoration: "none",
                padding: "6px 10px",
                whiteSpace: "nowrap",
                opacity: 0.95,
              }}
            >
              Add Restaurant
            </Link>
          )}

          {user ? (
            <>
              <button
                onClick={() => setUserMenu(!userMenu)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: isHomeHero ? "1px solid rgba(255,255,255,0.4)" : "1px solid #ddd",
                  background: isHomeHero ? "rgba(255,255,255,0.15)" : "#efefef",
                  color: isHomeHero ? "#fff" : "#444",
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

              {userMenu && (
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
                      setUserMenu(false);
                      navigate("/profile");
                    }}
                  />
                  <MenuRow
                    label="Add Restaurant"
                    onClick={() => {
                      setUserMenu(false);
                      navigate("/add-restaurant");
                    }}
                  />
                  <MenuRow
                    label="Favorites"
                    onClick={() => {
                      setUserMenu(false);
                      navigate("/favorites");
                    }}
                  />
                  <MenuRow
                    label="History"
                    onClick={() => {
                      setUserMenu(false);
                      navigate("/history");
                    }}
                  />
                  <MenuRow
                    label="Log Out"
                    onClick={() => {
                      setUserMenu(false);
                      logout();
                      navigate("/login");
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  color: isHomeHero ? "#fff" : "#333",
                  fontSize: "13px",
                  fontWeight: "700",
                  textDecoration: "none",
                  padding: "9px 16px",
                  border: isHomeHero ? "1px solid rgba(255,255,255,0.5)" : "1px solid #ccc",
                  borderRadius: "4px",
                  background: "transparent",
                }}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                style={{
                  color: "#c60000",
                  fontSize: "13px",
                  fontWeight: "700",
                  textDecoration: "none",
                  padding: "9px 16px",
                  background: "#fff",
                  borderRadius: "4px",
                  border: "1px solid transparent",
                }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          borderBottom: showWhiteBorder ? subBorder : "none",
        }}
      >
        <div
          style={{ position: "relative", display: "inline-block" }}
        >
          <button
            onMouseEnter={() => setRestOpen(true)}
            onMouseLeave={() => setRestOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0 16px",
              height: "42px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              color: restaurantColor,
              fontFamily: "inherit",
              borderBottom: restOpen ? restaurantActiveBorder : "2px solid transparent",
            }}
          >
            Restaurants
            <svg width="10" height="6" viewBox="0 0 10 6" fill={restaurantFill}>
              <path d="M0 0l5 6 5-6z" />
            </svg>
          </button>

          {restOpen && (
            <div
              onMouseEnter={() => setRestOpen(true)}
              onMouseLeave={() => setRestOpen(false)}
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                minWidth: "220px",
                background: "#fff",
                borderRadius: "8px",
                boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
                padding: "8px 0",
                borderTop: "4px solid #d32323",
                zIndex: 2000,
              }}
            >
              {[
                "All Restaurants",
                "American",
                "Italian",
                "Mexican",
                "Chinese",
                "Japanese",
                "Indian",
                "Thai",
                "Mediterranean",
                "Breakfast & Brunch",
                "Burgers",
                "Pizza",
                "Sushi",
                "Seafood",
                "Steakhouses",
                "Vegan",
              ].map((sub) => (
                <button
                  key={sub}
                  onClick={() => {
                    setRestOpen(false);
                    if (setSearchParams) {
                      setSearchParams({ q: sub, loc: near });
                    }
                    if (setPage) {
                      setPage(1);
                    }
                    navigate(`/search?q=${encodeURIComponent(sub)}&loc=${encodeURIComponent(near || "")}`);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    fontSize: "14px",
                    color: "#333",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f7f7f7";
                    e.currentTarget.style.color = "#d32323";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.color = "#333";
                  }}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
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

function YelpLogoWhite() {
  return (
    <svg width="88" height="36" viewBox="0 0 88 36" fill="none">
      <text x="0" y="30" fontFamily="Georgia,'Times New Roman',serif" fontSize="32" fontWeight="700" fill="#fff" letterSpacing="-1">
        yelp
      </text>
      <g transform="translate(74,14)">
        {[0, 72, 144, 216, 288].map((d, i) => (
          <ellipse key={i} cx="0" cy="-7" rx="3.5" ry="7.5" fill="#fff" transform={`rotate(${d})`} />
        ))}
        <circle cx="0" cy="0" r="3.2" fill="#fff" />
      </g>
    </svg>
  );
}

function YelpLogoDark() {
  return (
    <svg width="88" height="36" viewBox="0 0 88 36" fill="none">
      <text x="0" y="30" fontFamily="Georgia,'Times New Roman',serif" fontSize="32" fontWeight="700" fill="#000" letterSpacing="-1">
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