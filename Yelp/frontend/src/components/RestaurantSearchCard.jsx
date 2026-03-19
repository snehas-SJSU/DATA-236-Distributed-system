import { Link } from "react-router-dom";

export default function RestaurantSearchCard({ restaurant, index }) {
  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: "20px",
          padding: "22px 0",
          borderTop: index === 0 ? "1px solid #ebebeb" : "none",
          borderBottom: "1px solid #ebebeb",
        }}
      >
        <div
          style={{
            width: "220px",
            height: "220px",
            borderRadius: "8px",
            overflow: "hidden",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <img
            src={restaurant.image}
            alt={restaurant.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "#fff",
              color: "#2d2d2d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: "700",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            {index + 1}
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "34px",
              lineHeight: 1.08,
              fontWeight: "700",
              color: "#2d2d2d",
              letterSpacing: "-0.3px",
            }}
          >
            {restaurant.name}
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
              flexWrap: "wrap",
            }}
          >
            <Stars rating={restaurant.average_rating} />
            <span
              style={{
                fontSize: "16px",
                color: "#2d2d2d",
                fontWeight: "600",
              }}
            >
              {restaurant.average_rating.toFixed(1)}
            </span>
            <span style={{ fontSize: "15px", color: "#666" }}>
              ({restaurant.review_count} review
              {restaurant.review_count !== 1 ? "s" : ""})
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "10px",
              fontSize: "15px",
              color: "#444",
            }}
          >
            <span>{restaurant.address}</span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <InfoChip>{restaurant.cuisine_type}</InfoChip>
          </div>

          <p
            style={{
              margin: "0 0 14px",
              fontSize: "16px",
              lineHeight: 1.55,
              color: "#555",
              maxWidth: "780px",
            }}
          >
            {restaurant.description}
          </p>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {restaurant.keywords.map((keyword) => (
              <span
                key={keyword}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: "34px",
                  padding: "0 14px",
                  borderRadius: "999px",
                  background: "#f2f2f2",
                  fontSize: "14px",
                  color: "#555",
                  fontWeight: "600",
                }}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Stars({ rating }) {
  const fullStars = Math.round(rating);

  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "4px",
            background: i < fullStars ? "#d32323" : "#e2e2e2",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            lineHeight: 1,
          }}
        >
          ★
        </div>
      ))}
    </div>
  );
}

function InfoChip({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "32px",
        padding: "0 12px",
        borderRadius: "999px",
        border: "1px solid #e0e0e0",
        background: "#fff",
        fontSize: "14px",
        color: "#555",
        fontWeight: "600",
      }}
    >
      {children}
    </span>
  );
}