import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import RestaurantCard from "../components/RestaurantCard";
import { CityAutocomplete } from "../components/CityAutocomplete";
import { restaurantAPI } from "../services/api";

const MOCK_RESTAURANTS = [
  {
    id: 1,
    name: "Rainbow Donuts And Boba",
    cuisine_type: "Breakfast & Brunch",
    address: "Cupertino, CA",
    description:
      "A cozy local favorite with donuts, breakfast sandwiches, and bubble tea.",
    average_rating: 4.8,
    review_count: 4,
    keywords: ["quiet", "wifi", "family-friendly"],
    image:
      "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=900&q=80",
  },
  {
    id: 2,
    name: "Mr.Taco Express",
    cuisine_type: "Mexican",
    address: "San Jose, CA",
    description:
      "Fresh tacos and quick bites with outdoor seating and casual vibes.",
    average_rating: 5.0,
    review_count: 1,
    keywords: ["outdoor seating", "family-friendly"],
    image:
      "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=900&q=80",
  },
  {
    id: 3,
    name: "Samuthr Thai Restaurant",
    cuisine_type: "Thai",
    address: "San Jose, CA",
    description:
      "Authentic Thai dishes with warm service and a relaxed atmosphere.",
    average_rating: 4.6,
    review_count: 18,
    keywords: ["quiet", "wifi"],
    image:
      "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=900&q=80",
  },
  {
    id: 4,
    name: "Pasta Milano",
    cuisine_type: "Italian",
    address: "Santa Clara, CA",
    description: "Classic Italian pasta, family dining, and friendly service.",
    average_rating: 4.7,
    review_count: 22,
    keywords: ["family-friendly", "wifi"],
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=900&q=80",
  },
  {
    id: 5,
    name: "Green Bowl Vegan",
    cuisine_type: "Vegan",
    address: "San Jose, CA",
    description:
      "Healthy bowls, fresh ingredients, and a peaceful dining space.",
    average_rating: 4.5,
    review_count: 14,
    keywords: ["quiet", "outdoor seating"],
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80",
  },
];

const CUISINES = [
  "All",
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

const PRICE_FILTERS = ["Any", "$", "$$", "$$$", "$$$$"];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top Rated" },
  { value: "review_count", label: "Most Reviewed" },
  { value: "price", label: "Price" },
];

const KEYWORD_CHIPS = [
  "quiet",
  "family-friendly",
  "outdoor seating",
  "wifi",
  "romantic",
  "delivery",
  "takeout",
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, owner } = useAuth();

  const currentQuery = searchParams.get("q") || "";
  const currentLoc = searchParams.get("loc") || "";

  const getUserLocation = () => {
    try {
      const locs = JSON.parse(user?.pref_locations_json || "[]");
      return locs?.[0] || "";
    } catch {
      return "";
    }
  };

  const [cuisine, setCuisine] = useState("All");
  const [price, setPrice] = useState("Any");
  const [sort, setSort] = useState("newest");
  const [selectedKeyword, setSelectedKeyword] = useState("");
  const [cityFilter, setCityFilter] = useState(currentLoc || "");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [remoteRestaurants, setRemoteRestaurants] = useState([]);
  const [apiFailed, setApiFailed] = useState(false);

  useEffect(() => {
    setCityFilter(currentLoc || "");
  }, [currentQuery, currentLoc, user]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const isGeneric =
          !currentQuery ||
          currentQuery.toLowerCase() === "restaurants" ||
          currentQuery.toLowerCase() === "all restaurants";

        const res = await restaurantAPI.search({
          q: isGeneric ? "" : currentQuery,
          cuisine: cuisine !== "All" ? cuisine : "",
          location: currentLoc || "",
          price_range: price !== "Any" ? price : "",
          sort_by: sort,
          keywords: selectedKeyword || "",
          page,
          limit: 10,
        });

        if (!cancelled) {
          setRemoteRestaurants(res.data.restaurants || []);
          setTotalPages(res.data.total_pages || 1);
          setApiFailed(false);
        }
      } catch {
        if (!cancelled) {
          setRemoteRestaurants([]);
          setTotalPages(1);
          setApiFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [currentQuery, currentLoc, cuisine, price, sort, selectedKeyword, page]);

  const results = useMemo(() => {
    if (!apiFailed) return remoteRestaurants;

    return MOCK_RESTAURANTS.filter((r) => {
      const q = (currentQuery || "").trim().toLowerCase();

      const matchName =
        !q ||
        q === "restaurants" ||
        r.name.toLowerCase().includes(q) ||
        r.cuisine_type.toLowerCase().includes(q) ||
        r.keywords.some((k) => k.toLowerCase().includes(q)) ||
        r.description.toLowerCase().includes(q);

      const matchCuisine = cuisine === "All" || r.cuisine_type === cuisine;
      const matchLoc =
        !currentLoc ||
        r.address.toLowerCase().includes(currentLoc.toLowerCase());
      const matchKeyword =
        !selectedKeyword ||
        r.keywords.some((k) =>
          k.toLowerCase().includes(selectedKeyword.toLowerCase()),
        );

      return matchName && matchCuisine && matchLoc && matchKeyword;
    });
  }, [
    apiFailed,
    currentQuery,
    currentLoc,
    cuisine,
    selectedKeyword,
    remoteRestaurants,
  ]);

  const handleSearch = ({ find: f, near: n }) => {
    setSearchParams({ q: f || "Restaurants", loc: n || "" });
    setPage(1);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
      }}
    >
      <Navbar
        onSearch={handleSearch}
        defaultFind={currentQuery}
        defaultNear={currentLoc || getUserLocation()}
      />

      <div
        style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 24px 60px" }}
      >
        <div
          style={{
            padding: "20px 0 4px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "700",
              margin: 0,
              color: "#333",
            }}
          >
            Best {currentQuery || "Restaurants"}
            {currentLoc ? (
              <span style={{ fontWeight: 400, color: "#666" }}>
                {" "}
                near {currentLoc}
              </span>
            ) : null}
          </h2>

          {owner && (
            <button
              onClick={() => navigate("/owner/dashboard")}
              style={{
                background: "#fff",
                color: "#333",
                border: "1px solid #d0d0d0",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Back to Dashboard
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 0",
            borderBottom: "1px solid #e8e8e8",
            flexWrap: "wrap",
            background: "#fff",
            position: "sticky",
            top: "104px",
            zIndex: 10,
          }}
        >
          <FSelect
            value={cuisine}
            onChange={(v) => {
              setCuisine(v);
              setPage(1);
            }}
            options={CUISINES}
          />

          <FSelect
            value={price}
            onChange={(v) => {
              setPrice(v);
              setPage(1);
            }}
            options={PRICE_FILTERS}
          />

          <SortSel
            value={sort}
            onChange={(v) => {
              setSort(v);
              setPage(1);
            }}
            options={SORT_OPTIONS}
          />

          <div style={{ width: 220, position: "relative", zIndex: 100 }}>
            <CityAutocomplete
              value={cityFilter}
              onChange={(city) => {
                setCityFilter(city);
                setSearchParams({
                  q: currentQuery || "Restaurants",
                  loc: city,
                });
                setPage(1);
              }}
              placeholder="Filter by city..."
              inputStyle={{
                height: "34px",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "600",
                padding: "0 32px 0 12px",
              }}
            />
          </div>

          <span style={{ marginLeft: "auto", fontSize: "13px", color: "#666" }}>
            {loading ? "Searching…" : `${results.length} results`}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            padding: "10px 0",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "#888",
              fontWeight: 700,
              alignSelf: "center",
            }}
          >
            Keywords:
          </span>

          {KEYWORD_CHIPS.map((kw) => (
            <button
              key={kw}
              onClick={() => {
                setSelectedKeyword(selectedKeyword === kw ? "" : kw);
                setPage(1);
              }}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                border: `1px solid ${
                  selectedKeyword === kw ? "#d32323" : "#d0d0d0"
                }`,
                background: selectedKeyword === kw ? "#fff5f5" : "#fff",
                color: selectedKeyword === kw ? "#d32323" : "#555",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {kw}
            </button>
          ))}

          {selectedKeyword && (
            <button
              onClick={() => {
                setSelectedKeyword("");
                setPage(1);
              }}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                border: "1px solid #d0d0d0",
                background: "#fff",
                color: "#888",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        <div style={{ paddingTop: "8px" }}>
          {loading ? (
            <div
              style={{ padding: "80px 0", textAlign: "center", color: "#ccc" }}
            >
              <p>Finding restaurants…</p>
            </div>
          ) : results.length === 0 ? (
            <div
              style={{ padding: "80px 0", textAlign: "center", color: "#999" }}
            >
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🍽️</div>
              <p style={{ fontSize: "18px", fontWeight: "700", color: "#555" }}>
                No results found
              </p>
              <p style={{ fontSize: "14px", color: "#999" }}>
                Try clearing the city filter or adjusting your search.
              </p>
            </div>
          ) : (
            results.map((r, i) => (
              <RestaurantCard key={r.id} restaurant={r} index={i} showNumber />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              paddingTop: "18px",
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={pagerBtn(page <= 1)}
            >
              Prev
            </button>

            <span
              style={{
                fontSize: "13px",
                color: "#666",
                fontWeight: "700",
                padding: "9px 4px",
              }}
            >
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={pagerBtn(page >= totalPages)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const ddBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23666' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E") no-repeat right 10px center`;

function FSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "7px 30px 7px 12px",
        borderRadius: "4px",
        border: "1px solid #d0d0d0",
        background: `#fff ${ddBg}`,
        fontSize: "14px",
        fontWeight: "600",
        color: "#333",
        cursor: "pointer",
        fontFamily: "inherit",
        appearance: "none",
      }}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

function SortSel({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "7px 30px 7px 12px",
        borderRadius: "4px",
        border: "1px solid #d0d0d0",
        background: `#fff ${ddBg}`,
        fontSize: "14px",
        fontWeight: "600",
        color: "#333",
        cursor: "pointer",
        fontFamily: "inherit",
        appearance: "none",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function pagerBtn(disabled) {
  return {
    padding: "9px 14px",
    borderRadius: "6px",
    border: "1px solid #d0d0d0",
    background: disabled ? "#f5f5f5" : "#fff",
    color: disabled ? "#aaa" : "#333",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    fontWeight: "700",
    fontSize: "13px",
  };
}
