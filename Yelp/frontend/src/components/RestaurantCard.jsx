import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StarRating from "./StarRating";
import { restaurantAPI, ownerAPI, toAbsoluteMediaUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";

const PLACEHOLDER_COLORS = [
  ["#e74c3c","#c0392b"],["#3498db","#2980b9"],["#2ecc71","#27ae60"],
  ["#9b59b6","#8e44ad"],["#f39c12","#e67e22"],["#1abc9c","#16a085"],
  ["#e91e63","#c2185b"],["#ff5722","#e64a19"],
];

export default function RestaurantCard({ restaurant, index = 0, showNumber = true }) {
  const { user, owner } = useAuth();
  const navigate = useNavigate();
  const [fav, setFav] = useState(restaurant.is_favorited || false);
  const [favLoading, setFavLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const colors = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];

  const toggleFav = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    setFavLoading(true);
    try {
      if (fav) await restaurantAPI.unfavorite(restaurant.id);
      else await restaurantAPI.favorite(restaurant.id);
      setFav(!fav);
    } catch {}
    setFavLoading(false);
  };

  const handleClaim = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!owner) return;
    setClaimLoading(true); setClaimMessage("");
    try {
      await ownerAPI.claimRestaurant(restaurant.id);
      setClaimMessage("Restaurant claimed successfully");
      setTimeout(() => navigate("/owner/dashboard"), 800);
    } catch (err) {
      setClaimMessage(err.response?.data?.detail || "Failed to claim restaurant");
    } finally { setClaimLoading(false); }
  };

  const priceColor = { $:"text-green-700", $$:"text-orange-600", $$$:"text-red-700", $$$$:"text-red-900" };
  const isClaimableByOwner = !!owner && !restaurant.owner_id;
  const isAlreadyClaimed   = !!restaurant.owner_id;
  const photoSrc = toAbsoluteMediaUrl(
    restaurant.photos?.[0] || restaurant.photo_url || restaurant.image
  );

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100">
      {showNumber && (
        <div className="w-5 flex-shrink-0 pt-0.5">
          <span className="text-sm font-bold text-gray-400">{index + 1}</span>
        </div>
      )}

      {/* Photo */}
      <Link to={`/restaurant/${restaurant.id}`} className="no-underline flex-shrink-0">
        <div className="w-[120px] h-[90px] sm:w-[166px] sm:h-[124px] rounded overflow-hidden flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
          {photoSrc ? (
            <img src={photoSrc}
              alt={`${restaurant.name} restaurant photo`}
              className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">{restaurant.emoji || "🍽️"}</span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/restaurant/${restaurant.id}`} className="no-underline group">
            <h3 className="text-base font-bold text-[#0073bb] m-0 leading-snug group-hover:underline">
              {restaurant.name}
            </h3>
          </Link>
          {user && (
            <button onClick={toggleFav} disabled={favLoading}
              className={`bg-transparent border-none cursor-pointer p-0.5 flex-shrink-0 text-lg ${fav ? "text-[#d32323]" : "text-gray-300"}`}>
              {fav ? "♥" : "♡"}
            </button>
          )}
        </div>

        {/* Stars + review count */}
        <div className="flex items-center gap-1.5 my-1">
          <StarRating rating={restaurant.average_rating || 0} size={14} />
          <span className="text-[13px] text-gray-400">{restaurant.review_count || 0} reviews</span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-[13px] text-gray-500">{restaurant.cuisine_type}</span>
          {restaurant.price_range && (
            <>
              <span className="text-gray-300">•</span>
              <span className={`text-[13px] font-semibold ${priceColor[restaurant.price_range] || "text-gray-500"}`}>
                {restaurant.price_range}
              </span>
            </>
          )}
          <span className="text-gray-300">•</span>
          <span className={`text-[13px] font-semibold ${restaurant.is_open ? "text-green-700" : "text-red-700"}`}>
            {restaurant.is_open ? "Open Now" : "Closed"}
          </span>
        </div>

        {restaurant.address && (
          <p className="text-[13px] text-gray-400 m-0 mb-1.5 flex items-center gap-1">
            <svg width="11" height="13" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            {restaurant.address}
          </p>
        )}

        {restaurant.amenities?.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {[...new Set(restaurant.amenities)].map(tag => (
              <span key={tag} className="text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        )}

        {owner && (
          <div className="mt-2.5">
            {isClaimableByOwner ? (
              <button onClick={handleClaim} disabled={claimLoading}
                className={`bg-[#d32323] text-white border-none rounded-md px-3 py-2 text-[13px] font-bold font-sans ${claimLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:bg-[#b51d1d]"}`}>
                {claimLoading ? "Claiming..." : "Claim Restaurant"}
              </button>
            ) : isAlreadyClaimed ? (
              <button disabled className="bg-gray-100 text-gray-500 border-none rounded-md px-3 py-2 text-[13px] font-bold cursor-not-allowed font-sans">
                Already Claimed
              </button>
            ) : null}
            {claimMessage && (
              <div className={`mt-2 text-xs font-semibold ${claimMessage.includes("success") ? "text-green-700" : "text-red-700"}`}>
                {claimMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
