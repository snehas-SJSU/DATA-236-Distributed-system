import { useState, useRef, useEffect, useCallback } from "react";
import { restaurantAPI } from "../services/api";

const CUISINE_SUGGESTIONS = [
  { label: "American",           category: "Cuisine" },
  { label: "Italian",            category: "Cuisine" },
  { label: "Mexican",            category: "Cuisine" },
  { label: "Chinese",            category: "Cuisine" },
  { label: "Japanese",           category: "Cuisine" },
  { label: "Indian",             category: "Cuisine" },
  { label: "Thai",               category: "Cuisine" },
  { label: "Mediterranean",      category: "Cuisine" },
  { label: "Vegan",              category: "Cuisine" },
  { label: "Breakfast & Brunch", category: "Cuisine" },
  { label: "Pizza",              category: "Cuisine" },
  { label: "Sushi",              category: "Cuisine" },
  { label: "Burgers",            category: "Cuisine" },
  { label: "Seafood",            category: "Cuisine" },
  { label: "Steakhouses",        category: "Cuisine" },
];

const KEYWORD_SUGGESTIONS = [
  { label: "quiet",           category: "Keyword" },
  { label: "family-friendly", category: "Keyword" },
  { label: "outdoor seating", category: "Keyword" },
  { label: "wifi",            category: "Keyword" },
  { label: "romantic",        category: "Keyword" },
  { label: "delivery",        category: "Keyword" },
  { label: "takeout",         category: "Keyword" },
  { label: "live music",      category: "Keyword" },
  { label: "pet friendly",    category: "Keyword" },
  { label: "happy hour",      category: "Keyword" },
];

const MEAL_SUGGESTIONS = [
  { label: "Lunch",      category: "Meal" },
  { label: "Dinner",     category: "Meal" },
  { label: "Breakfast",  category: "Meal" },
  { label: "Brunch",     category: "Meal" },
  { label: "Coffee",     category: "Meal" },
  { label: "Dessert",    category: "Meal" },
  { label: "Late Night", category: "Meal" },
];

const ALL_STATIC = [...CUISINE_SUGGESTIONS, ...MEAL_SUGGESTIONS, ...KEYWORD_SUGGESTIONS];

const CATEGORY_COLORS = {
  "Cuisine":    { bg: "#fff5f5", color: "#d32323" },
  "Keyword":    { bg: "#f0f7ff", color: "#0073bb" },
  "Meal":       { bg: "#f0fff4", color: "#166534" },
  "Restaurant": { bg: "#faf5ff", color: "#6b21a8" },
};

const CATEGORY_ICONS = {
  "Cuisine":    "🍽️",
  "Keyword":    "🔑",
  "Meal":       "⏰",
  "Restaurant": "📍",
};

export default function SearchAutocomplete({
  value = "",
  onChange,
  onSelect,
  placeholder = "restaurants, tacos, coffee...",
  inputStyle = {},
  fetchLive = true,
}) {
  const [open, setOpen]               = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [liveResults, setLiveResults] = useState([]);
  const [fetching, setFetching]       = useState(false);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);
  const debounce = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (q) => {
    if (!fetchLive || q.trim().length < 2) { setLiveResults([]); return; }
    setFetching(true);
    try {
      const res = await restaurantAPI.search({ q: q.trim(), limit: 6, sort_by: "rating" });
      setLiveResults(
        (res.data.restaurants || []).map((r) => ({
          label:    r.name,
          category: "Restaurant",
          id:       r.id,
          sub:      `${r.cuisine_type}${r.city ? " · " + r.city : ""}`,
        }))
      );
    } catch {
      setLiveResults([]);
    } finally {
      setFetching(false);
    }
  }, [fetchLive]);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange?.(val);
    setOpen(true);
    setHighlighted(0);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.("");
    onSelect?.("");
    setLiveResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const suggestions = (() => {
    const q = value.trim().toLowerCase();
    if (!q) return ALL_STATIC.slice(0, 10);
    const filtered = ALL_STATIC.filter((s) => s.label.toLowerCase().includes(q));
    return [...liveResults, ...filtered].slice(0, 10);
  })();

  const handleSelect = (item) => {
    onChange?.(item.label);
    onSelect?.(item.label);
    setOpen(false);
    setLiveResults([]);
  };

  const handleKeyDown = (e) => {
    if (!open) { if (e.key === "ArrowDown") setOpen(true); return; }
    if (e.key === "ArrowDown")  { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[highlighted]) handleSelect(suggestions[highlighted]);
      else { onSelect?.(value); setOpen(false); }
    }
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          border: "none", outline: "none", fontSize: "14px",
          width: "100%", fontFamily: "inherit", color: "#333",
          background: "transparent", paddingRight: value ? "22px" : "0",
          ...inputStyle,
        }}
      />

      {/* ✕ Clear button */}
      {value && (
        <button
          onMouseDown={handleClear}
          style={{
            position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "#aaa", fontSize: "14px", lineHeight: 1,
            padding: "2px 4px", display: "flex", alignItems: "center",
          }}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: -14,
          width: "360px", background: "#fff",
          border: "1px solid #e0e0e0", borderRadius: "10px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.14)", zIndex: 9999, overflow: "hidden",
        }}>
          <div style={{
            padding: "8px 14px", fontSize: 11, fontWeight: 800, color: "#aaa",
            textTransform: "uppercase", letterSpacing: "0.8px",
            borderBottom: "1px solid #f5f5f5", background: "#fafafa",
          }}>
            {value.trim().length < 2
              ? "Suggested searches"
              : fetching ? "Searching…"
              : `${suggestions.length} suggestion${suggestions.length !== 1 ? "s" : ""}`}
          </div>

          {suggestions.length === 0 && !fetching && value.trim().length >= 2 && (
            <div style={{ padding: "16px 14px", color: "#aaa", fontSize: 13 }}>
              No suggestions — press Enter to search anyway
            </div>
          )}

          {suggestions.map((item, i) => {
            const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS["Keyword"];
            return (
              <div
                key={`${item.category}-${item.label}-${i}`}
                onMouseDown={() => handleSelect(item)}
                onMouseEnter={() => setHighlighted(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 14px", cursor: "pointer",
                  background: i === highlighted ? "#f9f9f9" : "#fff",
                  borderBottom: i < suggestions.length - 1 ? "1px solid #f5f5f5" : "none",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: colors.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, flexShrink: 0,
                }}>
                  {CATEGORY_ICONS[item.category] || "🔍"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.label}
                  </div>
                  {item.sub && <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>{item.sub}</div>}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 800, color: colors.color,
                  background: colors.bg, borderRadius: 4, padding: "2px 6px",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  {item.category}
                </span>
              </div>
            );
          })}

          {value.trim() && (
            <div
              onMouseDown={() => { onSelect?.(value); setOpen(false); }}
              onMouseEnter={() => setHighlighted(suggestions.length)}
              style={{
                padding: "9px 14px", cursor: "pointer",
                background: highlighted === suggestions.length ? "#f9f9f9" : "#fff",
                borderTop: "1px solid #f0f0f0",
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 13, color: "#555", fontWeight: 600,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Search for "<span style={{ color: "#d32323" }}>{value}</span>"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
