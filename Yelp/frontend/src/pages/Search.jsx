import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import RestaurantCard from "../components/RestaurantCard";
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

const normalize = (value) => (value || "").trim().toLowerCase();

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = (searchParams.get("q") || "").trim();
  const urlLocation = (searchParams.get("loc") || "").trim();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

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

        const res = await restaurantAPI.search({
          q: isGeneric ? "" : effectiveQuery,
          cuisine: effectiveCuisine,
          location: urlLocation || "",
          keywords: effectiveKeyword || "",
          limit: 20,
        });

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
  }, [effectiveQuery, effectiveCuisine, effectiveKeyword, urlLocation]);

  const updateSearchParams = ({ q = "", loc = "" }) => {
    const params = {};

    if ((q || "").trim()) params.q = q.trim();
    if ((loc || "").trim()) params.loc = loc.trim();

    setSearchParams(params);
  };

  const handleNavbarSearch = ({ find, near }) => {
    updateSearchParams({
      q: find || "",
      loc: near || "",
    });
  };

  const toggleKeyword = (value) => {
    const isSame = normalize(urlQuery) === normalize(value);

    updateSearchParams({
      q: isSame ? "" : value,
      loc: urlLocation,
    });
  };

  const clearKeyword = () => {
    updateSearchParams({
      q: "",
      loc: urlLocation,
    });
  };

  const headingLabel =
    matchedCuisine || matchedKeyword || effectiveQuery || "Restaurants";

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar
        onSearch={handleNavbarSearch}
        defaultFind={urlQuery}
        defaultNear={urlLocation}
      />

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 24px 60px" }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            margin: "0 0 18px",
            color: "#333",
          }}
        >
          Best {headingLabel}
          {urlLocation ? (
            <span style={{ color: "#666", fontWeight: 500 }}> near {urlLocation}</span>
          ) : null}
        </h2>

        {matchedCuisine && (
          <div style={{ marginBottom: 10, color: "#777", fontSize: 14, fontWeight: 600 }}>
            <span style={{ color: "#d32323" }}>{matchedCuisine}</span> search results.
          </div>
        )}

        {matchedKeyword && (
          <div style={{ marginBottom: 10, color: "#777", fontSize: 14, fontWeight: 600 }}>
            <span style={{ color: "#d32323" }}>{matchedKeyword}</span> search results.
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            padding: "0 0 18px",
            borderBottom: "1px solid #eee",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 14, color: "#888", fontWeight: 700 }}>
            Keywords:
          </span>

          {KEYWORDS.map((item) => {
            const active = normalize(urlQuery) === normalize(item);

            return (
              <button
                key={item}
                onClick={() => toggleKeyword(item)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: active ? "1px solid #d32323" : "1px solid #d0d0d0",
                  background: active ? "#fff5f5" : "#fff",
                  color: active ? "#d32323" : "#555",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "inherit",
                }}
              >
                {item}
              </button>
            );
          })}

          {matchedKeyword && (
            <button
              onClick={clearKeyword}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid #d0d0d0",
                background: "#fff",
                color: "#888",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              ✕ Clear
            </button>
          )}

          <span style={{ marginLeft: "auto", fontSize: 14, color: "#666" }}>
            {loading ? "Searching..." : `${results.length} results`}
          </span>
        </div>

        <div style={{ marginTop: 20 }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#aaa", padding: "56px 0" }}>
              Loading...
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", padding: "64px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🍽️</div>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#555", margin: 0 }}>
                No results found
              </p>
              <p style={{ fontSize: 14, color: "#999", marginTop: 8 }}>
                Try a different restaurant name, keyword, city, or ZIP.
              </p>
            </div>
          ) : (
            results.map((r, i) => (
              <RestaurantCard key={r.id} restaurant={r} index={i} showNumber />
            ))
          )}
        </div>
      </div>
    </div>
  );
}