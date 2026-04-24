import { useMemo } from "react";

/**
 * Sticky map panel (Yelp-style right column). Uses Google Maps embed for the
 * search area; numbered pins need backend lat/lng — this centers on location query.
 */
export default function SearchMapPanel({ locationQuery, resultLabel, compact = false }) {
  const src = useMemo(() => {
    const loc = (locationQuery || "").trim();
    const q = loc
      ? `restaurants near ${loc}`
      : "restaurants United States";
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=12&output=embed`;
  }, [locationQuery]);

  return (
    <div
      style={{
        position: compact ? "relative" : "sticky",
        top: 0,
        height: compact ? 220 : "100vh",
        minHeight: compact ? 220 : 400,
        display: "flex",
        flexDirection: "column",
        background: "#e5e3df",
        borderLeft: compact ? "none" : "1px solid #d2d2d2",
        borderBottom: compact ? "1px solid #d2d2d2" : "none",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          background: "#fff",
          borderBottom: "1px solid #e6e6e6",
          fontSize: 12,
          fontWeight: 700,
          color: "#333",
        }}
      >
        Area map{resultLabel ? ` · ${resultLabel}` : ""}
      </div>
      <iframe
        title="Search area map"
        src={src}
        style={{
          flex: 1,
          width: "100%",
          minHeight: 360,
          border: "none",
        }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
