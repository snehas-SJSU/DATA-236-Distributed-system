import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StarRating from "./StarRating";
import { restaurantAPI, ownerAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const PLACEHOLDER_COLORS = [
  ["#e74c3c", "#c0392b"],
  ["#3498db", "#2980b9"],
  ["#2ecc71", "#27ae60"],
  ["#9b59b6", "#8e44ad"],
  ["#f39c12", "#e67e22"],
  ["#1abc9c", "#16a085"],
  ["#e91e63", "#c2185b"],
  ["#ff5722", "#e64a19"],
];

export default function RestaurantCard({
  restaurant,
  index = 0,
  showNumber = true,
}) {
  const { user, owner } = useAuth();
  const navigate = useNavigate();

  const [fav, setFav] = useState(restaurant.is_favorited || false);
  const [favLoading, setFavLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");

  const colors = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];

  const toggleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    setFavLoading(true);
    try {
      if (fav) {
        await restaurantAPI.unfavorite(restaurant.id);
      } else {
        await restaurantAPI.favorite(restaurant.id);
      }
      setFav(!fav);
    } catch {
      // ignore favorite toggle error for now
    }
    setFavLoading(false);
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!owner) return;

    setClaimLoading(true);
    setClaimMessage("");

    try {
      await ownerAPI.claimRestaurant(restaurant.id);
      setClaimMessage("Restaurant claimed successfully");
      setTimeout(() => {
        navigate("/owner/dashboard");
      }, 800);
    } catch (err) {
      setClaimMessage(
        err.response?.data?.detail || "Failed to claim restaurant",
      );
    } finally {
      setClaimLoading(false);
    }
  };

  const priceColor = {
    $: "#2e7d32",
    $$: "#f57c00",
    $$$: "#c62828",
    $$$$: "#b71c1c",
  };

  const isClaimableByOwner = !!owner && !restaurant.owner_id;
  const isAlreadyClaimed = !!restaurant.owner_id;

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "16px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      {showNumber && (
        <div style={{ width: "20px", flexShrink: 0, paddingTop: "2px" }}>
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#999" }}>
            {index + 1}
          </span>
        </div>
      )}

      <Link
        to={`/restaurant/${restaurant.id}`}
        style={{ textDecoration: "none", flexShrink: 0 }}
      >
        <div
          style={{
            width: "166px",
            height: "124px",
            borderRadius: "4px",
            overflow: "hidden",
            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {restaurant.photos?.[0] ||
          restaurant.photo_url ||
          restaurant.image ? (
            <img
              src={
                restaurant.photos?.[0] ||
                restaurant.photo_url ||
                restaurant.image
              }
              alt={restaurant.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: "40px" }}>{restaurant.emoji || "🍽️"}</span>
          )}
        </div>
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <Link
            to={`/restaurant/${restaurant.id}`}
            style={{ textDecoration: "none" }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#0073bb",
                margin: 0,
                lineHeight: 1.3,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {restaurant.name}
            </h3>
          </Link>

          {user && (
            <button
              onClick={toggleFav}
              disabled={favLoading}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                flexShrink: 0,
                color: fav ? "#d32323" : "#ccc",
                fontSize: "18px",
              }}
            >
              {fav ? "♥" : "♡"}
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            margin: "4px 0",
          }}
        >
          <StarRating rating={restaurant.average_rating || 0} size={14} />
          <span style={{ fontSize: "13px", color: "#999" }}>
            {restaurant.review_count || 0} reviews
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "6px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "13px", color: "#666" }}>
            {restaurant.cuisine_type}
          </span>

          {restaurant.price_range && (
            <>
              <span style={{ color: "#ccc" }}>•</span>
              <span
                style={{
                  fontSize: "13px",
                  color: priceColor[restaurant.price_range] || "#666",
                  fontWeight: "600",
                }}
              >
                {restaurant.price_range}
              </span>
            </>
          )}

          <span style={{ color: "#ccc" }}>•</span>

          <span
            style={{
              fontSize: "13px",
              color: restaurant.is_open ? "#2e7d32" : "#c62828",
              fontWeight: "600",
            }}
          >
            {restaurant.is_open ? "Open Now" : "Closed"}
          </span>
        </div>

        {restaurant.address && (
          <p
            style={{
              fontSize: "13px",
              color: "#999",
              margin: "0 0 6px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <svg
              width="11"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#bbb"
              strokeWidth="2"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            {restaurant.address}
          </p>
        )}

        {restaurant.latest_review && (
          <p
            style={{
              fontSize: "13px",
              color: "#666",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: "#999" }}>"{restaurant.latest_review}"</span>
          </p>
        )}

        {restaurant.amenities?.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginTop: "8px",
              flexWrap: "wrap",
            }}
          >
            {restaurant.amenities.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "12px",
                  color: "#555",
                  background: "#f5f5f5",
                  border: "1px solid #e0e0e0",
                  borderRadius: "3px",
                  padding: "2px 8px",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {owner && (
          <div style={{ marginTop: "10px" }}>
            {isClaimableByOwner ? (
              <button
                onClick={handleClaim}
                disabled={claimLoading}
                style={{
                  background: "#d32323",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: claimLoading ? "not-allowed" : "pointer",
                  opacity: claimLoading ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                {claimLoading ? "Claiming..." : "Claim Restaurant"}
              </button>
            ) : isAlreadyClaimed ? (
              <button
                disabled
                style={{
                  background: "#f3f4f6",
                  color: "#6b7280",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "not-allowed",
                  fontFamily: "inherit",
                }}
              >
                Already Claimed
              </button>
            ) : null}

            {claimMessage && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: claimMessage.toLowerCase().includes("success")
                    ? "#166534"
                    : "#b91c1c",
                }}
              >
                {claimMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
