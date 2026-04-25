/**
 * Home page: restaurant hero carousel, all restaurants grid, and fixed Sparky chat.
 * Desktop uses extra right padding so the grid never sits under the floating panel
 * (see SPARKY_* constants + sparkyReserve).
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toSearchPath } from "../utils/searchUrl";
import { useDispatch } from "react-redux";
import { restaurantAPI, toAbsoluteMediaUrl } from "../services/api";
import { fetchRestaurants } from "../store/slices/restaurantSlice";
import { useAuth } from "../context/AuthContext";
import ChatPanel from "../components/ChatPanel";
import SearchResultRow from "../components/SearchResultRow";
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

const PAGE_SIZE = 10;

/** Match fixed Sparky: `right: 24px`, width `min(336px, …)`, plus gap so cards never sit under it. */
const SPARKY_WIDTH = 336;
const SPARKY_RIGHT_PX = 24;
const SPARKY_CARD_GAP_PX = 20;

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dispatch = useDispatch();

  const [heroSlides, setHeroSlides] = useState(FALLBACK_SLIDES);
  const [slideIdx, setSlideIdx] = useState(0);
  const [mainRestaurants, setMainRestaurants] = useState([]);
  const [wide, setWide] = useState(
    typeof window !== "undefined" && window.innerWidth >= 1024
  );

  const [page, setPage] = useState(1);

  const [find, setFind] = useState("");

  const getUserLocation = () => {
    try {
      return JSON.parse(user?.pref_locations_json || "[]")?.[0] || "";
    } catch {
      return "";
    }
  };

  const [near, setNear] = useState(getUserLocation());


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
        const sorted = [...list].sort(byRating);
        setMainRestaurants(dedupeRestaurantsById(sorted));
      } else {
        setHeroSlides(FALLBACK_SLIDES);
        setMainRestaurants([]);
      }
    } catch (err) {
      console.error("Home page load failed:", err);
      setHeroSlides(FALLBACK_SLIDES);
      setMainRestaurants([]);
      setRecentActivityRestaurants([]);
    }
  }, [user?.id]);

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

  const mainEmptyMessage = "No restaurants available yet.";
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
              margin: "0 0 4px",
              color: "#222",
            }}
          >
            Restaurants
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#666" }}>
            {mainRestaurants.length} restaurant{mainRestaurants.length !== 1 ? "s" : ""} available
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
            <>
              <div>
                {mainRestaurants
                  .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                  .map((r, index) => (
                    <SearchResultRow
                      key={r?.id ?? `main-${index}`}
                      restaurant={r}
                      index={(page - 1) * PAGE_SIZE + index}
                    />
                  ))}
              </div>

              {/* Pagination */}
              {Math.ceil(mainRestaurants.length / PAGE_SIZE) > 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 32,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={page === 1}
                    style={paginationBtn(page === 1)}
                  >
                    ← Prev
                  </button>

                  {Array.from({ length: Math.ceil(mainRestaurants.length / PAGE_SIZE) }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={paginationBtn(false, n === page)}
                    >
                      {n}
                    </button>
                  ))}

                  <button
                    onClick={() => { setPage((p) => Math.min(Math.ceil(mainRestaurants.length / PAGE_SIZE), p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={page === Math.ceil(mainRestaurants.length / PAGE_SIZE)}
                    style={paginationBtn(page === Math.ceil(mainRestaurants.length / PAGE_SIZE))}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
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

function paginationBtn(disabled, active = false) {
  return {
    padding: "7px 14px",
    borderRadius: 4,
    border: active ? "2px solid #d32323" : "1px solid #d0d0d0",
    background: active ? "#d32323" : disabled ? "#f5f5f5" : "#fff",
    color: active ? "#fff" : disabled ? "#bbb" : "#333",
    cursor: disabled ? "default" : "pointer",
    fontWeight: 700,
    fontSize: 14,
    fontFamily: "inherit",
    minWidth: 38,
  };
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
