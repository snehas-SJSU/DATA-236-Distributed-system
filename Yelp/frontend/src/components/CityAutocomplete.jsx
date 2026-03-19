import { useState, useRef, useEffect } from "react";

export const US_CITIES = [
  { city: "New York",           state: "NY" },
  { city: "Los Angeles",        state: "CA" },
  { city: "Chicago",            state: "IL" },
  { city: "Houston",            state: "TX" },
  { city: "Phoenix",            state: "AZ" },
  { city: "Philadelphia",       state: "PA" },
  { city: "San Antonio",        state: "TX" },
  { city: "San Diego",          state: "CA" },
  { city: "Dallas",             state: "TX" },
  { city: "San Jose",           state: "CA" },
  { city: "Austin",             state: "TX" },
  { city: "Jacksonville",       state: "FL" },
  { city: "Fort Worth",         state: "TX" },
  { city: "Columbus",           state: "OH" },
  { city: "Charlotte",          state: "NC" },
  { city: "Indianapolis",       state: "IN" },
  { city: "San Francisco",      state: "CA" },
  { city: "Seattle",            state: "WA" },
  { city: "Denver",             state: "CO" },
  { city: "Nashville",          state: "TN" },
  { city: "Oklahoma City",      state: "OK" },
  { city: "El Paso",            state: "TX" },
  { city: "Washington",         state: "DC" },
  { city: "Las Vegas",          state: "NV" },
  { city: "Louisville",         state: "KY" },
  { city: "Memphis",            state: "TN" },
  { city: "Portland",           state: "OR" },
  { city: "Baltimore",          state: "MD" },
  { city: "Milwaukee",          state: "WI" },
  { city: "Albuquerque",        state: "NM" },
  { city: "Tucson",             state: "AZ" },
  { city: "Fresno",             state: "CA" },
  { city: "Sacramento",         state: "CA" },
  { city: "Mesa",               state: "AZ" },
  { city: "Kansas City",        state: "MO" },
  { city: "Atlanta",            state: "GA" },
  { city: "Omaha",              state: "NE" },
  { city: "Colorado Springs",   state: "CO" },
  { city: "Raleigh",            state: "NC" },
  { city: "Long Beach",         state: "CA" },
  { city: "Virginia Beach",     state: "VA" },
  { city: "Minneapolis",        state: "MN" },
  { city: "Tampa",              state: "FL" },
  { city: "New Orleans",        state: "LA" },
  { city: "Arlington",          state: "TX" },
  { city: "Bakersfield",        state: "CA" },
  { city: "Honolulu",           state: "HI" },
  { city: "Anaheim",            state: "CA" },
  { city: "Aurora",             state: "CO" },
  { city: "Santa Ana",          state: "CA" },
  { city: "Corpus Christi",     state: "TX" },
  { city: "Riverside",          state: "CA" },
  { city: "St. Louis",          state: "MO" },
  { city: "Lexington",          state: "KY" },
  { city: "Pittsburgh",         state: "PA" },
  { city: "Stockton",           state: "CA" },
  { city: "Cincinnati",         state: "OH" },
  { city: "St. Paul",           state: "MN" },
  { city: "Greensboro",         state: "NC" },
  { city: "Toledo",             state: "OH" },
  { city: "Newark",             state: "NJ" },
  { city: "Plano",              state: "TX" },
  { city: "Henderson",          state: "NV" },
  { city: "Lincoln",            state: "NE" },
  { city: "Buffalo",            state: "NY" },
  { city: "Fort Wayne",         state: "IN" },
  { city: "Jersey City",        state: "NJ" },
  { city: "Chula Vista",        state: "CA" },
  { city: "Orlando",            state: "FL" },
  { city: "St. Petersburg",     state: "FL" },
  { city: "Norfolk",            state: "VA" },
  { city: "Chandler",           state: "AZ" },
  { city: "Laredo",             state: "TX" },
  { city: "Madison",            state: "WI" },
  { city: "Durham",             state: "NC" },
  { city: "Lubbock",            state: "TX" },
  { city: "Winston-Salem",      state: "NC" },
  { city: "Garland",            state: "TX" },
  { city: "Glendale",           state: "AZ" },
  { city: "Hialeah",            state: "FL" },
  { city: "Reno",               state: "NV" },
  { city: "Baton Rouge",        state: "LA" },
  { city: "Irvine",             state: "CA" },
  { city: "Chesapeake",         state: "VA" },
  { city: "Irving",             state: "TX" },
  { city: "Scottsdale",         state: "AZ" },
  { city: "Fremont",            state: "CA" },
  { city: "Gilbert",            state: "AZ" },
  { city: "San Bernardino",     state: "CA" },
  { city: "Birmingham",         state: "AL" },
  { city: "Rochester",          state: "NY" },
  { city: "Richmond",           state: "VA" },
  { city: "Spokane",            state: "WA" },
  { city: "Des Moines",         state: "IA" },
  { city: "Montgomery",         state: "AL" },
  { city: "Modesto",            state: "CA" },
  { city: "Fayetteville",       state: "NC" },
  { city: "Tacoma",             state: "WA" },
  { city: "Shreveport",         state: "LA" },
  { city: "Fontana",            state: "CA" },
  { city: "Moreno Valley",      state: "CA" },
  { city: "Glendale",           state: "CA" },
  { city: "Akron",              state: "OH" },
  { city: "Yonkers",            state: "NY" },
  { city: "Huntington Beach",   state: "CA" },
  { city: "Little Rock",        state: "AR" },
  { city: "Grand Rapids",       state: "MI" },
  { city: "Salt Lake City",     state: "UT" },
  { city: "Tallahassee",        state: "FL" },
  { city: "Huntsville",         state: "AL" },
  { city: "Worcester",          state: "MA" },
  { city: "Knoxville",          state: "TN" },
  { city: "Fort Lauderdale",    state: "FL" },
  { city: "Santa Clara",        state: "CA" },
  { city: "Providence",         state: "RI" },
  { city: "Garden Grove",       state: "CA" },
  { city: "Oceanside",          state: "CA" },
  { city: "Chattanooga",        state: "TN" },
  { city: "Rancho Cucamonga",   state: "CA" },
  { city: "Santa Rosa",         state: "CA" },
  { city: "Elk Grove",          state: "CA" },
  { city: "Ontario",            state: "CA" },
  { city: "Salem",              state: "OR" },
  { city: "Cary",               state: "NC" },
  { city: "Eugene",             state: "OR" },
  { city: "Peoria",             state: "AZ" },
  { city: "Corona",             state: "CA" },
  { city: "Fort Collins",       state: "CO" },
  { city: "Jackson",            state: "MS" },
  { city: "Alexandria",         state: "VA" },
  { city: "Hayward",            state: "CA" },
  { city: "Lancaster",          state: "CA" },
  { city: "Salinas",            state: "CA" },
  { city: "Palmdale",           state: "CA" },
  { city: "Sunnyvale",          state: "CA" },
  { city: "Pomona",             state: "CA" },
  { city: "Escondido",          state: "CA" },
  { city: "Torrance",           state: "CA" },
  { city: "Pasadena",           state: "CA" },
  { city: "Paterson",           state: "NJ" },
  { city: "Bridgeport",         state: "CT" },
  { city: "McAllen",            state: "TX" },
  { city: "Mesquite",           state: "TX" },
  { city: "Syracuse",           state: "NY" },
  { city: "Surprise",           state: "AZ" },
  { city: "Roseville",          state: "CA" },
  { city: "Rockford",           state: "IL" },
  { city: "Joliet",             state: "IL" },
  { city: "Savannah",           state: "GA" },
  { city: "Killeen",            state: "TX" },
  { city: "Tempe",              state: "AZ" },
  { city: "Overland Park",      state: "KS" },
  { city: "Warren",             state: "MI" },
  { city: "Springfield",        state: "MO" },
  { city: "Boston",             state: "MA" },
  { city: "Detroit",            state: "MI" },
  { city: "Miami",              state: "FL" },
  { city: "Cleveland",          state: "OH" },
  { city: "Tulsa",              state: "OK" },
  { city: "Wichita",            state: "KS" },
  { city: "Arlington",          state: "VA" },
  { city: "Bakersfield",        state: "CA" },
  { city: "Aurora",             state: "IL" },
];

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

/**
 * CityAutocomplete
 * Props:
 *   value       - current city string
 *   onChange    - (city, state) => void — called when city is selected OR cleared
 *   placeholder - input placeholder
 *   inputStyle  - optional style overrides
 */
export function CityAutocomplete({ value, onChange, placeholder = "Type city name...", inputStyle = {} }) {
  const [query, setQuery]           = useState(value || "");
  const [open, setOpen]             = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim().length === 0 ? [] :
    US_CITIES.filter(({ city }) =>
      city.toLowerCase().startsWith(query.trim().toLowerCase())
    ).slice(0, 8);

  const handleSelect = ({ city, state }) => {
    setQuery(city);
    setOpen(false);
    onChange(city, state);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery("");
    setOpen(false);
    onChange("", "");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); if (filtered[highlighted]) handleSelect(filtered[highlighted]); }
    if (e.key === "Escape")    { setOpen(false); }
  };

  const baseStyle = {
    width: "100%", height: "42px", border: "1px solid #ccc",
    borderRadius: "8px", padding: "0 32px 0 12px",
    boxSizing: "border-box", fontSize: "14px",
    fontFamily: "inherit", color: "#222", background: "#fff",
    ...inputStyle,
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlighted(0); }}
        onFocus={() => { if (query.trim()) setOpen(true); }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        style={baseStyle}
      />

      {/* ✕ Clear button */}
      {query && (
        <button
          onMouseDown={handleClear}
          style={{
            position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "#aaa", fontSize: "13px", lineHeight: 1,
            padding: "2px 4px", display: "flex", alignItems: "center",
          }}
          aria-label="Clear city"
        >
          ✕
        </button>
      )}

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #ddd", borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999,
          maxHeight: "260px", overflowY: "auto",
        }}>
          {filtered.map(({ city, state }, i) => (
            <div
              key={`${city}-${state}`}
              onMouseDown={() => handleSelect({ city, state })}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                padding: "10px 14px", cursor: "pointer", fontSize: "14px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: i === highlighted ? "#fff5f5" : "#fff",
                color: i === highlighted ? "#d32323" : "#222",
                borderBottom: i < filtered.length - 1 ? "1px solid #f5f5f5" : "none",
              }}
            >
              <span style={{ fontWeight: 600 }}>{city}</span>
              <span style={{
                fontSize: "12px", fontWeight: 700,
                color: i === highlighted ? "#d32323" : "#999",
                background: i === highlighted ? "#ffe5e5" : "#f0f0f0",
                borderRadius: "4px", padding: "2px 6px",
              }}>
                {state}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * StateAutocomplete
 */
export function StateAutocomplete({ value, onChange, inputStyle = {} }) {
  const [query, setQuery]           = useState(value || "");
  const [open, setOpen]             = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim().length === 0 ? [] :
    US_STATES.filter(s => s.toLowerCase().startsWith(query.trim().toLowerCase())).slice(0, 8);

  const handleSelect = (state) => {
    setQuery(state);
    setOpen(false);
    onChange(state);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery("");
    setOpen(false);
    onChange("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); if (filtered[highlighted]) handleSelect(filtered[highlighted]); }
    if (e.key === "Escape")    { setOpen(false); }
  };

  const baseStyle = {
    width: "100%", height: "42px", border: "1px solid #ccc",
    borderRadius: "8px", padding: "0 32px 0 12px",
    boxSizing: "border-box", fontSize: "14px",
    fontFamily: "inherit", color: "#222", background: "#fff",
    textTransform: "uppercase",
    ...inputStyle,
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder="e.g. CA"
        maxLength={2}
        onChange={(e) => {
          const val = e.target.value.toUpperCase().slice(0, 2);
          setQuery(val);
          setOpen(true);
          setHighlighted(0);
          if (val.length === 2 && US_STATES.includes(val)) onChange(val);
        }}
        onFocus={() => { if (query.trim()) setOpen(true); }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        style={baseStyle}
      />

      {/* ✕ Clear button */}
      {query && (
        <button
          onMouseDown={handleClear}
          style={{
            position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "#aaa", fontSize: "13px", lineHeight: 1,
            padding: "2px 4px", display: "flex", alignItems: "center",
          }}
          aria-label="Clear state"
        >
          ✕
        </button>
      )}

      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #ddd", borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999,
          maxHeight: "220px", overflowY: "auto",
        }}>
          {filtered.map((state, i) => (
            <div
              key={state}
              onMouseDown={() => handleSelect(state)}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                padding: "10px 14px", cursor: "pointer", fontSize: "14px",
                fontWeight: 700, letterSpacing: "1px",
                background: i === highlighted ? "#fff5f5" : "#fff",
                color: i === highlighted ? "#d32323" : "#222",
                borderBottom: i < filtered.length - 1 ? "1px solid #f5f5f5" : "none",
              }}
            >
              {state}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
