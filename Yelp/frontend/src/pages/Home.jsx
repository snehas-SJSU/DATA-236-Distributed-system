/**
 * Home page: restaurant hero carousel, “Top rated” grid, optional “Recent activity”
 * when logged in, and fixed Sparky chat. Desktop uses extra right padding so the
 * grid never sits under the floating panel (see SPARKY_* constants + sparkyReserve).
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toSearchPath } from "../utils/searchUrl";
import { useDispatch } from "react-redux";
import { restaurantAPI, profileAPI, toAbsoluteMediaUrl } from "../services/api";
import { fetchRestaurants } from "../store/slices/restaurantSlice";
import { useAuth } from "../context/AuthContext";
import ChatPanel from "../components/ChatPanel";
import Navbar from "../components/Navbar";

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

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Max items shown in “Recent activity” after merging history reviews + added restaurants. */
const RECENT_ACTIVITY_LIMIT = 12;

/** Drop duplicate API rows so the same restaurant does not appear twice. */
function dedupeRestaurantsById(list) {
  const seen = new Set();
  const out = [];
  for (const r of safeArray(list)) {
    const id = r?.id ?? r?._id;
    if (id != null && id !== "") {
      const key = String(id);
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(r);
  }
  return out;
}

function normalizeHistoryReviews(reviews) {
  return safeArray(reviews)
    .sort((a, b) => {
      const dateA = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, RECENT_ACTIVITY_LIMIT)
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

/** Match fixed Sparky: `right: 24px`, width `min(336px, …)`, plus gap so cards never sit under it. */
const SPARKY_WIDTH = 336;
const SPARKY_RIGHT_PX = 24;
const SPARKY_CARD_GAP_PX = 20;

/** Build recent-activity cards from /user/history (reviews + restaurants you added). */
function buildRecentActivityList(historyData) {
  const reviews = safeArray(historyData?.reviews);
  const addedRaw = safeArray(historyData?.restaurants_added);

  const fromReviews = normalizeHistoryReviews(reviews);
  const seen = new Set(fromReviews.map((r) => String(r?.id ?? "")));

  const fromAdded = [];
  for (const r of addedRaw) {
    const id = r?.id ?? r?._id;
    if (id == null || id === "") continue;
    const key = String(id);
    if (seen.has(key)) continue;
    seen.add(key);
    fromAdded.push({
      ...r,
      id: typeof id === "string" ? id : String(id),
    });
  }

  return dedupeRestaurantsById([...fromReviews, ...fromAdded]).slice(
    0,
    RECENT_ACTIVITY_LIMIT
  );
}

function HomeSpotlightCard({ r, navigate, imageHeight = 200 }) {
  const rawPhoto = safeArray(r?.photos)[0];
  const photo = rawPhoto ? toAbsoluteMediaUrl(rawPhoto) : null;

  return (
    <div
      onClick={() => r?.id && navigate(`/restaurant/${r.id}`)}
      style={{
        border: "1px solid #e8e8e8",
        borderRadius: "12px",
        overflow: "hidden",
        cursor: r?.id ? "pointer" : "default",
        transition: "box-shadow 0.15s, transform 0.15s",
        background: "#fff",
      }}
      onMouseEnter={(e) => {
        if (!r?.id) return;
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div
        style={{
          height: imageHeight,
          overflow: "hidden",
          background: "#f3f3f3",
          position: "relative",
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt={`${r?.name || "Restaurant"} restaurant`}
            loading="lazy"
            decoding="async"
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
            {safeNumber(r?.review_count, 0) === 1 ? "review" : "reviews"})
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dispatch = useDispatch();

  const [heroSlides, setHeroSlides] = useState(FALLBACK_SLIDES);
  const [slideIdx, setSlideIdx] = useState(0);
  const [mainRestaurants, setMainRestaurants] = useState([]);
  const [recentActivityRestaurants, setRecentActivityRestaurants] = useState([]);
  const [wide, setWide] = useState(
    typeof window !== "undefined" && window.innerWidth >= 1024
  );

  const [find, setFind] = useState("");

  const getUserLocation = () => {
    try {
      return JSON.parse(user?.pref_locations_json || "[]")?.[0] || "";
    } catch {
      return "";
    }
  };

  const [near, setNear] = useState(getUserLocation());

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
          image: toAbsoluteMediaUrl(safeArray(r?.photos)[0]) || FALLBACK_SLIDES[0].image,
          heading: r?.name || "Restaurant",
          subheading: [r?.cuisine_type, r?.city].filter(Boolean).join(" · "),
          rating: safeNumber(r?.average_rating, 0),
          cta: "Restaurants",
        }));

        setHeroSlides(
          slides.length >= 2 ? slides : [...slides, ...FALLBACK_SLIDES].slice(0, 4)
        );

        const byRating = (a, b) =>
          safeNumber(b?.average_rating, 0) - safeNumber(a?.average_rating, 0);
        const highRated = [...list]
          .filter((r) => safeNumber(r?.average_rating, 0) >= 4)
          .sort(byRating);
        const mainSource =
          highRated.length > 0 ? highRated : [...list].sort(byRating);
        setMainRestaurants(dedupeRestaurantsById(mainSource).slice(0, 12));
      } else {
        setHeroSlides(FALLBACK_SLIDES);
        setMainRestaurants([]);
      }

      if (isLoggedIn) {
        try {
          const historyRes = await profileAPI.getHistory();
          setRecentActivityRestaurants(
            buildRecentActivityList(historyRes?.data)
          );
        } catch (err) {
          console.error("Failed to load history:", err);
          setRecentActivityRestaurants([]);
        }
      } else {
        setRecentActivityRestaurants([]);
      }
    } catch (err) {
      console.error("Home page load failed:", err);
      setHeroSlides(FALLBACK_SLIDES);
      setMainRestaurants([]);
      setRecentActivityRestaurants([]);
    }
  }, [isLoggedIn, user?.id]);

  useEffect(() => {
    const saved = getUserLocation();
    if (saved) setNear(saved);
  }, [user]);

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const goToSearch = (query, location) => {
    navigate(toSearchPath({ q: query, loc: location }));
  };

  const slide = heroSlides[slideIdx] || FALLBACK_SLIDES[0];
  const HERO_PADDING = 32;
  const SEARCH_BAR_LEFT_OFFSET = 120;

  const mainEmptyMessage = "No top rated restaurants yet.";
  const recentEmptyMessage = "No recent activity yet — ";
  // Wide layout only: mirror fixed Sparky inset + panel width + breathing room (see SPARKY_*).
  const sparkyReserve = wide
    ? SPARKY_RIGHT_PX + SPARKY_WIDTH + SPARKY_CARD_GAP_PX
    : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#f4f3f0",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
      }}
    >
      <Navbar
        onSearch={({ find: q, near: loc }) => {
          if (loc) setNear(loc);
          if (q !== undefined) setFind(q);
          navigate(toSearchPath({ q: q, loc: loc }));
        }}
        defaultFind={find}
        defaultNear={near}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "700px",
          maxHeight: "900px",
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

      <main
        style={{
          maxWidth: wide ? "none" : 1080,
          margin: wide ? 0 : "0 auto",
          width: "100%",
          boxSizing: "border-box",
          padding: wide
            ? `40px ${sparkyReserve}px 56px 32px`
            : "28px 16px 520px",
        }}
      >
        <section aria-labelledby="home-main-heading">
          <h2
            id="home-main-heading"
            style={{
              fontSize: "22px",
              fontWeight: "700",
              margin: "0 0 8px",
              color: "#222",
            }}
          >
            Top rated restaurants
          </h2>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#666" }}>
            Highly rated picks from our directory.
          </p>

          {mainRestaurants.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#aaa",
                padding: "32px 0",
                fontSize: 15,
              }}
            >
              {mainEmptyMessage}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: wide
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
                gap: wide ? 12 : 20,
              }}
            >
              {mainRestaurants.map((r, index) => (
                <HomeSpotlightCard
                  key={r?.id ?? `main-${index}`}
                  r={r}
                  navigate={navigate}
                  imageHeight={wide ? 268 : 200}
                />
              ))}
            </div>
          )}
        </section>

        {isLoggedIn && (
          <section
            aria-labelledby="home-recent-heading"
            style={{ marginTop: 52, paddingTop: 40, borderTop: "1px solid #e2e0dc" }}
          >
            <h2
              id="home-recent-heading"
              style={{
                fontSize: "22px",
                fontWeight: "700",
                margin: "0 0 8px",
                color: "#222",
              }}
            >
              Recent activity
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#666" }}>
              Restaurants you have reviewed or visited recently.
            </p>

            {recentActivityRestaurants.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#aaa",
                  padding: "28px 0",
                  fontSize: 15,
                }}
              >
                {recentEmptyMessage}
                <button
                  type="button"
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
                  Write your first review!
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: wide
                    ? "repeat(2, minmax(0, 1fr))"
                    : "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
                  gap: wide ? 12 : 20,
                }}
              >
                {recentActivityRestaurants.map((r, index) => (
                  <HomeSpotlightCard
                    key={r?.id ?? `recent-${index}`}
                    r={r}
                    navigate={navigate}
                    imageHeight={wide ? 268 : 200}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <div
        style={{
          position: "fixed",
          right: wide ? 24 : 12,
          bottom: 24,
          width: "min(336px, calc(100vw - 24px))",
          maxHeight: "calc(100vh - 96px)",
          zIndex: 300,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <ChatPanel />
      </div>
    </div>
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
