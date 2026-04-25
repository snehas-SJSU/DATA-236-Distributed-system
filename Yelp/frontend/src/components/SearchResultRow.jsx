/**
 * One search hit: photo, stars, meta line, tags, link to restaurant detail.
 */
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import { toAbsoluteMediaUrl } from "../services/api";

function metaLine(r) {
  const parts = [
    r.city,
    r.state,
    r.zip_code,
  ].filter(Boolean);
  if (r.address && !parts.length) return r.address;
  return parts.length ? parts.join(", ") : r.address || "";
}

export default function SearchResultRow({ restaurant, index }) {
  const photo = toAbsoluteMediaUrl(
    restaurant.photos?.[0] || restaurant.photo_url || restaurant.image
  );
  const tags = [restaurant.cuisine_type, ...(restaurant.amenities || [])].filter(
    Boolean
  );
  const uniqueTags = [...new Set(tags)].slice(0, 4);

  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr",
        gap: 16,
        padding: "20px 0",
        borderBottom: "1px solid #e6e6e6",
        alignItems: "start",
      }}
      className="search-result-row"
    >
      <Link
        to={`/restaurant/${restaurant.id}`}
        style={{ position: "relative", display: "block", textDecoration: "none" }}
      >
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: 8,
            overflow: "hidden",
            background: "linear(135deg, #e8e8e8, #d4d4d4)",
            backgroundSize: "cover",
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 56,
              }}
            >
              🍽️
            </div>
          )}
        </div>
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.95)",
            color: "#333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 800,
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            border: "1px solid #e0e0e0",
          }}
        >
          {index + 1}
        </span>
      </Link>

      <div style={{ minWidth: 0, paddingRight: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ margin: "0 0 6px" }}>
              <Link
                to={`/restaurant/${restaurant.id}`}
                style={{ color: "#0073bb", fontSize: 22, fontWeight: 700, textDecoration: "none" }}
              >
                {restaurant.name}
              </Link>
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <StarRating rating={restaurant.average_rating || 0} size={16} />
              <span style={{ fontSize: 14, color: "#2d2d2d", fontWeight: 600 }}>
                {Number(restaurant.average_rating || 0).toFixed(1)}
              </span>
              <span style={{ fontSize: 14, color: "#666" }}>
                ({restaurant.review_count || 0}{" "}
                {restaurant.review_count === 1 ? "review" : "reviews"})
              </span>
            </div>
            <p style={{ margin: "0 0 8px", fontSize: 14, color: "#333", lineHeight: 1.5 }}>
              <span style={{ fontWeight: 600 }}>{metaLine(restaurant)}</span>
              {restaurant.price_range ? (
                <span>
                  {" "}
                  · <span style={{ color: "#00773a", fontWeight: 700 }}>{restaurant.price_range}</span>
                </span>
              ) : null}
              {typeof restaurant.is_open === "boolean" && (
                <span style={{ color: restaurant.is_open ? "#00773a" : "#c00", fontWeight: 700, marginLeft: 6 }}>
                  {restaurant.is_open ? "· Open" : "· Closed"}
                </span>
              )}
            </p>
            {uniqueTags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {uniqueTags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 12,
                      color: "#666",
                      background: "#f5f5f5",
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ flexShrink: 0 }}>
            <Link
              to={`/restaurant/${restaurant.id}`}
              style={{
                display: "inline-block",
                background: "#d32323",
                color: "#fff",
                fontWeight: 800,
                fontSize: 14,
                padding: "10px 20px",
                borderRadius: 4,
                textDecoration: "none",
                fontFamily: "inherit",
              }}
            >
              View
            </Link>
          </div>
        </div>
        {restaurant.description && (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "#333",
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {restaurant.description}
          </p>
        )}
      </div>
    </article>
  );
}
