/**
 * Search: filters + list (SearchResultRow).
 * Query string drives q/loc/cuisine/keywords; results refetch when params change.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import SearchResultRow from "../components/SearchResultRow";
import { restaurantAPI } from "../services/api";

const CUISINES = [
  "American",
  "Italian",
  "Mexican",
  "Chinese",
  "Japanese",
  "Indian",
  "Thai",
  "Mediterranean",
  "Vegan",
  "Breakfast & Brunch",
];

const KEYWORDS = [
  "Wifi",
  "Outdoor Seating",
  "Parking",
  "Delivery",
  "Takeout",
  "Dine-in",
  "Reservations",
  "Live Music",
  "Pet Friendly",
  "Family Friendly",
  "Quiet",
];

const PRICES = ["$", "$$", "$$$", "$$$$"];

const normalize = (value) => (value || "").trim().toLowerCase();

/** Pretty-print location for headings (URL may be lowercase, e.g. san+jose). */
function formatLocationForTitle(loc) {
  const s = (loc || "").trim();
  if (!s) return "";
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = (searchParams.get("q") || "").trim();
  const urlLocation = (searchParams.get("loc") || "").trim();
  const priceParam = (searchParams.get("price") || "").trim();
  const openParam = searchParams.get("open") === "1";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const mergeParams = useCallback(
    (patch) => {
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        Object.entries(patch).forEach(([key, value]) => {
          if (value === "" || value == null) p.delete(key);
          else p.set(key, String(value));
        });
        return p;
      });
    },
    [setSearchParams]
  );

  const matchedCuisine = useMemo(() => {
    return CUISINES.find((c) => normalize(c) === normalize(urlQuery)) || "";
  }, [urlQuery]);

  const matchedKeyword = useMemo(() => {
    return KEYWORDS.find((k) => normalize(k) === normalize(urlQuery)) || "";
  }, [urlQuery]);

  const effectiveCuisine = matchedCuisine || "";
  const effectiveKeyword = !matchedCuisine ? matchedKeyword : "";
  const effectiveQuery = matchedCuisine || matchedKeyword ? "" : urlQuery;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const normalizedQuery = normalize(effectiveQuery);
        const isGeneric =
          !normalizedQuery ||
          normalizedQuery === "restaurants" ||
          normalizedQuery === "all restaurants";

        const params = {
          q: isGeneric ? "" : effectiveQuery,
          cuisine: effectiveCuisine,
          location: urlLocation || "",
          keywords: effectiveKeyword || "",
          limit: 20,
        };

        if (PRICES.includes(priceParam)) {
          params.price_range = priceParam;
        }

        if (openParam) {
          params.open_now = true;
        }

        const res = await restaurantAPI.search(params);

        if (!cancelled) {
          setResults(res?.data?.restaurants || []);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [effectiveQuery, effectiveCuisine, effectiveKeyword, urlLocation, priceParam, openParam]);

  const updateSearchParams = ({ q, loc }) => {
    mergeParams({
      q: (q || "").trim() || undefined,
      loc: (loc || "").trim() || undefined,
    });
  };

  const handleNavbarSearch = ({ find, near }) => {
    updateSearchParams({ q: find || "", loc: near || "" });
  };

  const toggleKeyword = (value) => {
    const isSame = normalize(urlQuery) === normalize(value);
    mergeParams({ q: isSame ? "" : value });
  };

  const clearKeyword = () => {
    mergeParams({ q: "" });
  };

  const togglePrice = (p) => {
    mergeParams({ price: priceParam === p ? "" : p });
  };

  const toggleOpen = () => {
    mergeParams({ open: openParam ? "" : "1" });
  };

  const isGenericQuery = useMemo(() => {
    const n = normalize(urlQuery);
    return !n || n === "restaurants" || n === "all restaurants";
  }, [urlQuery]);

  const locationLabel = useMemo(() => formatLocationForTitle(urlLocation), [urlLocation]);

  /** Restaurant-only app: titles always say “restaurants”, not generic Yelp categories. */
  const pageTitle = useMemo(() => {
    const locSuffix = locationLabel ? ` near ${locationLabel}` : "";
    if (matchedCuisine) {
      return `Best ${matchedCuisine} restaurants${locSuffix}`;
    }
    if (matchedKeyword) {
      return `Restaurants with “${matchedKeyword}”${locSuffix}`;
    }
    if (urlQuery && !isGenericQuery) {
      return `Restaurants matching “${urlQuery}”${locSuffix}`;
    }
    return `Restaurants${locSuffix}`;
  }, [matchedCuisine, matchedKeyword, urlQuery, locationLabel, isGenericQuery]);

  const resultSummary = loading
    ? "Searching…"
    : `${results.length} restaurant${results.length === 1 ? "" : "s"} found`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f3f0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar
        onSearch={handleNavbarSearch}
        defaultFind={urlQuery}
        defaultNear={urlLocation}
      />

      <div
        className="search-split"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          flex: 1,
          minHeight: 0,
          maxWidth: "100%",
        }}
      >
        <div
          style={{
            minWidth: 0,
            overflow: "auto",
            padding: "16px 24px 48px 28px",
            borderRight: "none",
            background: "#fff",
            boxShadow: "none",
          }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              margin: "0 0 6px",
              color: "#333",
              lineHeight: 1.2,
            }}
          >
            {pageTitle}
          </h1>

          <p style={{ margin: "0 0 4px", fontSize: 14, color: "#666" }}>{resultSummary}</p>

          <p
            style={{
              margin: "0 0 16px",
              fontSize: 13,
              color: "#999",
              fontStyle: "italic",
            }}
          >
            Only restaurants and dining — no other business types.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: "1px solid #eee",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#666",
                textTransform: "uppercase",
              }}
            >
              Refine
            </span>

            {PRICES.map((p) => {
              const active = priceParam === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePrice(p)}
                  style={chipStyle(active)}
                >
                  {p} Price
                </button>
              );
            })}

            <button type="button" onClick={toggleOpen} style={chipStyle(openParam)}>
              Open now
            </button>
          </div>

          {matchedCuisine && (
            <p style={{ marginBottom: 8, color: "#666", fontSize: 14 }}>
              <span style={{ color: "#d32323", fontWeight: 700 }}>{matchedCuisine}</span> results.
            </p>
          )}

          {matchedKeyword && (
            <p style={{ marginBottom: 8, color: "#666", fontSize: 14 }}>
              <span style={{ color: "#d32323", fontWeight: 700 }}>{matchedKeyword}</span> results.
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              padding: "0 0 8px",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, color: "#888", fontWeight: 700 }}>
              Dining & features
            </span>

            {KEYWORDS.map((item) => {
              const active = normalize(urlQuery) === normalize(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleKeyword(item)}
                  style={chipStyle(active)}
                >
                  {item}
                </button>
              );
            })}

            {matchedKeyword && (
              <button type="button" onClick={clearKeyword} style={chipStyle(false)}>
                Clear keyword
              </button>
            )}
          </div>

          <div style={{ marginTop: 8 }}>
            {loading ? (
              <div style={{ textAlign: "center", color: "#aaa", padding: "56px 0" }}>
                Loading…
              </div>
            ) : results.length === 0 ? (
              <div style={{ textAlign: "center", color: "#999", padding: "64px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>🍽️</div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#555", margin: 0 }}>
                  No results found
                </p>
                <p style={{ fontSize: 14, color: "#999", marginTop: 8 }}>
                  Try different filters or location.
                </p>
              </div>
            ) : (
              results.map((r, i) => (
                <SearchResultRow key={r.id} restaurant={r} index={i} />
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .search-result-row {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 400px) {
          .search-result-row img[alt=""] {
            max-height: 220px;
            object-fit: cover;
          }
        }
      `}</style>
    </div>
  );
}

function chipStyle(active) {
  return {
    padding: "6px 12px",
    borderRadius: 999,
    border: active ? "1px solid #d32323" : "1px solid #d0d0d0",
    background: active ? "#fff5f5" : "#fff",
    color: active ? "#d32323" : "#555",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "inherit",
  };
}