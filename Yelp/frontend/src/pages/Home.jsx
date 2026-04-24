import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { restaurantAPI, profileAPI } from "../services/api";
import { fetchRestaurants } from "../store/slices/restaurantSlice";
import SearchAutocomplete from "../components/SearchAutocomplete";
import { CityAutocomplete } from "../components/CityAutocomplete";
import { useAuth } from "../context/AuthContext";
import ChatPanel from "../components/ChatPanel";

const FALLBACK_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=90",
    heading: "Find your next\nfavorite restaurant",
    cta: "Restaurants",
  },
  {
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=90",
    heading: "Discover hidden\ndining gems",
    cta: "Restaurants",
  },
  {
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=90",
    heading: "The best local eats,\nreviewed",
    cta: "Restaurants",
  },
  {
    image: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=1600&q=90",
    heading: "Book a table\ntonight",
    cta: "Restaurants",
  },
];

const DROPDOWN_COLS = [
  [
    { label: "Takeout", icon: "🥡" },
    { label: "Delivery", icon: "🛵" },
    { label: "Hot & Trendy", icon: "🔥" },
    { label: "New Restaurants", icon: "⭐" },
    { label: "Breakfast & Brunch", icon: "🌅" },
  ],
  [
    { label: "Lunch", icon: "🥗" },
    { label: "Dinner", icon: "🍽️" },
    { label: "Coffee & Cafes", icon: "☕" },
    { label: "Pizza", icon: "🍕" },
    { label: "Chinese", icon: "🥢" },
  ],
  [
    { label: "Mexican", icon: "🌮" },
    { label: "Bakeries", icon: "🥐" },
    { label: "Italian", icon: "🍝" },
    { label: "Food Trucks", icon: "🚚" },
    { label: "Sports Bars & Pubs", icon: "🍺" },
  ],
];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeHistoryReviews(reviews) {
  return safeArray(reviews)
    .sort((a, b) => {
      const dateA = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3)
    .map((r, index) => {
      const photos = safeArray(r?.restaurant_photos);
      const primaryPhoto =
        photos.length > 0 ? photos[0] : r?.restaurant_image || null;

      return {
        id: r?.restaurant_id ?? `history-${index}`,
        name: r?.restaurant_name || "Unknown Restaurant",
        photos: primaryPhoto ? [primaryPhoto] : [],
        average_rating: safeNumber(r?.rating, 0),
        review_count: 1,
        city: "",
        state: "",
        cuisine_type: "Recently reviewed",
        price_range: "",
        is_open: false,
      };
    });
}

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const dispatch = useDispatch();

  const [heroSlides, setHeroSlides] = useState(FALLBACK_SLIDES);
  const [slideIdx, setSlideIdx] = useState(0);
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);

  const [find, setFind] = useState("");

  const getUserLocation = () => {
    try {
      return JSON.parse(user?.pref_locations_json || "[]")?.[0] || "";
    } catch {
      return "";
    }
  };

  const [near, setNear] = useState(getUserLocation());
  const [restOpen, setRestOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const isLoggedIn = !!user;

  const loadHomeData = useCallback(async () => {
    try {
      const res = await restaurantAPI.getAll();
      const list = safeArray(res?.data);

      if (list.length > 0) {
        const withPhoto = list.filter((r) => safeArray(r?.photos).length > 0);
        const slidesSource = withPhoto.length > 0 ? withPhoto : list;

        const slides = slidesSource.slice(0, 4).map((r) => ({
          id: r?.id,
          image: safeArray(r?.photos)[0] || FALLBACK_SLIDES[0].image,
          heading: r?.name || "Restaurant",
          subheading: [r?.cuisine_type, r?.city].filter(Boolean).join(" · "),
          rating: safeNumber(r?.average_rating, 0),
          cta: "Restaurants",
        }));

        setHeroSlides(
          slides.length >= 2 ? slides : [...slides, ...FALLBACK_SLIDES].slice(0, 4)
        );
      } else {
        setHeroSlides(FALLBACK_SLIDES);
      }

      if (isLoggedIn) {
        try {
          const historyRes = await profileAPI.getHistory();
          const reviews = safeArray(historyRes?.data?.reviews);
          const recentReviewedRestaurants = normalizeHistoryReviews(reviews);
          setFeaturedRestaurants(recentReviewedRestaurants);
        } catch (err) {
          console.error("Failed to load history:", err);
          const sortedByRating = [...list]
            .filter((r) => safeNumber(r?.average_rating, 0) >= 4)
            .sort(
              (a, b) =>
                safeNumber(b?.average_rating, 0) - safeNumber(a?.average_rating, 0)
            );
          setFeaturedRestaurants(sortedByRating.slice(0, 3));
        }
      } else {
        const sortedByRating = [...list]
          .filter((r) => safeNumber(r?.average_rating, 0) >= 4)
          .sort(
            (a, b) =>
              safeNumber(b?.average_rating, 0) - safeNumber(a?.average_rating, 0)
          );
        setFeaturedRestaurants(sortedByRating.slice(0, 3));
      }
    } catch (err) {
      console.error("Home page load failed:", err);
      setHeroSlides(FALLBACK_SLIDES);
      setFeaturedRestaurants([]);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const saved = getUserLocation();
    if (saved) setNear(saved);
  }, [user]);

  useEffect(() => {
    dispatch(fetchRestaurants());
    loadHomeData();
  }, [dispatch, loadHomeData]);

  useEffect(() => {
    const refreshOnFocus = () => loadHomeData();
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") loadHomeData();
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisible);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisible);
    };
  }, [loadHomeData]);

  useEffect(() => {
    if (!heroSlides.length) return;

    const t = setInterval(() => {
      setSlideIdx((i) => (i + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(t);
  }, [heroSlides.length]);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const goToSearch = (query, location) => {
    navigate(
      `/search?q=${encodeURIComponent(query || "Restaurants")}&loc=${encodeURIComponent(
        location || ""
      )}`
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    goToSearch(find, near);
  };

  const handleCitySelect = (city) => {
    setNear(city);
    if (find.trim()) goToSearch(find, city);
  };

  const slide = heroSlides[slideIdx] || FALLBACK_SLIDES[0];
  const HERO_PADDING = 32;
  const SEARCH_BAR_LEFT_OFFSET = 120;

  const sectionTitle = isLoggedIn ? "Recent Activity" : "Top Rated Restaurants";
  const emptyMessage = isLoggedIn
    ? "No recent activity yet — "
    : "No top rated restaurants yet.";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#fff",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "580px",
          maxHeight: "780px",
          overflow: "hidden",
        }}
      >
        {heroSlides.map((s, i) => (
          <img
            key={i}
            src={s.image}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: i === slideIdx ? 1 : 0,
              transition: "opacity 1.2s ease",
            }}
          />
        ))}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.48)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            padding: `0 ${HERO_PADDING}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "64px",
              gap: "24px",
            }}
          >
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
              <YelpLogo />
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
                overflow: "visible",
                boxShadow: "0 1px 8px rgba(0,0,0,0.2)",
                position: "relative",
                zIndex: 300,
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
                <SearchIcon />
                <SearchAutocomplete
                  value={find}
                  onChange={setFind}
                  onSelect={(val) => {
                    setFind(val);
                    goToSearch(val, near);
                  }}
                  placeholder="restaurants, tacos, coffee..."
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
                <PinIcon />
                <CityAutocomplete
                  value={near}
                  onChange={setNear}
                  onSelect={handleCitySelect}
                  placeholder="city..."
                  inputStyle={{
                    height: "30px",
                    border: "none",
                    borderRadius: "0",
                    padding: "0 4px",
                    fontSize: "15px",
                    background: "transparent",
                    boxShadow: "none",
                  }}
                />
              </div>

              <button
                type="submit"
                aria-label="Search"
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#a50000")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#c60000")
                }
              >
                <SearchIconWhite />
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
              ref={userMenuRef}
            >
              <button
                onClick={() => navigate("/owner/login")}
                style={topLinkBtn}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.92")}
              >
                Yelp for Business
              </button>

              <button
                onClick={() => navigate(user ? "/write-review" : "/login")}
                style={topLinkBtn}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.92")}
              >
                Write a Review
              </button>

              {user && (
                <Link
                  to="/add-restaurant"
                  style={{
                    color: "#fff",
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
                    onClick={() => setUserMenu((v) => !v)}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,0.35)",
                      background: "rgba(255,255,255,0.15)",
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
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt="Profile"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      user.name
                        ?.split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
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
                      <div style={{ height: "1px", background: "#eee" }} />
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
                  <button
                    onClick={() => navigate("/login")}
                    style={{
                      background: "transparent",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.7)",
                      borderRadius: "4px",
                      padding: "8px 14px",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Log In
                  </button>

                  <button
                    onClick={() => navigate("/signup")}
                    style={{
                      background: "#fff",
                      color: "#d32323",
                      border: "none",
                      borderRadius: "4px",
                      padding: "8px 14px",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div
              style={{ position: "relative" }}
              onMouseEnter={() => setRestOpen(true)}
              onMouseLeave={() => setRestOpen(false)}
            >
              {restOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    width: 500,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
                    padding: "14px 18px",
                    borderTop: "4px solid #d32323",
                    zIndex: 2000,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      columnGap: 4,
                      rowGap: 8,
                    }}
                  >
                    {DROPDOWN_COLS.map((col, ci) => (
                      <div
                        key={ci}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {col.map((item) => (
                          <button
                            key={item.label}
                            onClick={() => {
                              setRestOpen(false);
                              goToSearch(item.label, near);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              background: "none",
                              border: "none",
                              padding: "2px 0",
                              fontSize: 13,
                              color: "#222",
                              cursor: "pointer",
                              textAlign: "left",
                              fontWeight: 600,
                              fontFamily: "inherit",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = "#d32323")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = "#222")
                            }
                          >
                            <span style={{ fontSize: 16 }}>{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${HERO_PADDING + SEARCH_BAR_LEFT_OFFSET}px`,
            transform: "translateY(-50%)",
            zIndex: 20,
          }}
        >
          <h1
            style={{
              color: "#fff",
              fontSize: "38px",
              fontWeight: "800",
              margin: "0 0 6px",
              lineHeight: 1.1,
              textShadow: "0 1px 8px rgba(0,0,0,0.35)",
              whiteSpace: "pre-line",
              maxWidth: "440px",
            }}
          >
            {slide.heading}
          </h1>

          {slide.subheading && (
            <p
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 15,
                margin: "0 0 18px",
                fontWeight: 600,
              }}
            >
              {slide.subheading}
            </p>
          )}

          {safeNumber(slide.rating, 0) > 0 && (
            <p
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: 14,
                margin: "0 0 18px",
              }}
            >
              {"★".repeat(Math.round(safeNumber(slide.rating, 0)))}{" "}
              {safeNumber(slide.rating, 0).toFixed(1)}
            </p>
          )}

          <button
            onClick={() =>
              slide.id
                ? navigate(`/restaurant/${slide.id}`)
                : goToSearch(slide.cta, near)
            }
            style={{
              background: "#c60000",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "11px 22px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#a50000")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#c60000")
            }
          >
            <SearchIconWhite />
            {slide.id ? "View Restaurant" : slide.cta}
          </button>
        </div>

        <div
          style={{
            position: "absolute",
            left: `${HERO_PADDING + SEARCH_BAR_LEFT_OFFSET - 45}px`,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "center",
            zIndex: 1,
          }}
        >
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIdx(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: "8px",
                height: i === slideIdx ? 26 : 8,
                borderRadius: 6,
                border: "none",
                background:
                  i === slideIdx ? "#fff" : "rgba(255,255,255,0.45)",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.28s",
              }}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "44px 24px 52px",
        }}
      >
        <h2
          style={{
            fontSize: "22px",
            fontWeight: "700",
            textAlign: "center",
            margin: "0 0 28px",
            color: "#333",
          }}
        >
          {sectionTitle}
        </h2>

        {featuredRestaurants.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#aaa",
              padding: "32px 0",
              fontSize: 15,
            }}
          >
            {isLoggedIn ? (
              <>
                {emptyMessage}
                <button
                  onClick={() => navigate("/write-review")}
                  style={{
                    color: "#d32323",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 15,
                    fontFamily: "inherit",
                  }}
                >
                  write your first review!
                </button>
              </>
            ) : (
              emptyMessage
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {featuredRestaurants.map((r, index) => (
              <div
                key={`${r?.id || "restaurant"}-${index}`}
                onClick={() => r?.id && navigate(`/restaurant/${r.id}`)}
                style={{
                  border: "1px solid #e8e8e8",
                  borderRadius: "12px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(0,0,0,0.12)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div
                  style={{
                    height: "200px",
                    overflow: "hidden",
                    background: "#f3f3f3",
                    position: "relative",
                  }}
                >
                  {safeArray(r?.photos)[0] ? (
                    <img
                      src={safeArray(r?.photos)[0]}
                      alt={`${r?.name || "Restaurant"} restaurant`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 64,
                        background: "linear-gradient(135deg,#f8f8f8,#ececec)",
                      }}
                    >
                      🍽️
                    </div>
                  )}

                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      padding: "3px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      background: r?.is_open
                        ? "rgba(22,163,74,0.9)"
                        : "rgba(220,38,38,0.9)",
                      color: "#fff",
                    }}
                  >
                    {r?.is_open ? "Open" : "Closed"}
                  </div>
                </div>

                <div style={{ padding: "14px 16px 16px" }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 16,
                      color: "#2d2d2d",
                      marginBottom: 4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r?.name || "Unknown Restaurant"}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#666",
                      marginBottom: 8,
                    }}
                  >
                    {r?.cuisine_type || "Restaurant"}
                    {r?.city ? ` · ${r.city}` : ""}
                    {r?.state ? `, ${r.state}` : ""}
                    {r?.price_range ? ` · ${r.price_range}` : ""}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "#d32323", fontSize: 14 }}>
                      {"★".repeat(Math.round(safeNumber(r?.average_rating, 0)))}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#555",
                        fontWeight: 600,
                      }}
                    >
                      {safeNumber(r?.average_rating, 0) > 0
                        ? safeNumber(r?.average_rating, 0).toFixed(1)
                        : "New"}
                    </span>
                    <span style={{ fontSize: 13, color: "#aaa" }}>
                      ({safeNumber(r?.review_count, 0)}{" "}
                      {safeNumber(r?.review_count, 0) === 1
                        ? "review"
                        : "reviews"})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          position: "fixed",
          right: "24px",
          top: "500px",
          width: "345px",
          minHeight: "500px",
          zIndex: 300,
        }}
      >
        <ChatPanel />
      </div>
    </div>
  );
}

const topLinkBtn = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "#fff",
  fontSize: "13px",
  fontWeight: "600",
  padding: "6px 10px",
  whiteSpace: "nowrap",
  opacity: 0.92,
  fontFamily: "inherit",
};

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#999"
      strokeWidth="2.5"
      style={{ flexShrink: 0 }}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="12"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#999"
      strokeWidth="2.5"
      style={{ flexShrink: 0 }}
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function SearchIconWhite() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.5"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
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
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f7f7")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
    >
      {label}
    </button>
  );
}

function YelpLogo() {
  return (
    <svg width="88" height="36" viewBox="0 0 88 36" fill="none">
      <text
        x="0"
        y="30"
        fontFamily="Georgia,'Times New Roman',serif"
        fontSize="32"
        fontWeight="700"
        fill="#fff"
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
            fill="#fff"
            transform={`rotate(${d})`}
          />
        ))}
        <circle cx="0" cy="0" r="3.2" fill="#fff" />
      </g>
    </svg>
  );
}