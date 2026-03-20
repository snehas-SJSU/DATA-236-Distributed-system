import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import StarRating from "../components/StarRating";
import { restaurantAPI, reviewAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function RestaurantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, owner } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [editingReview, setEditingReview] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [restRes, revRes] = await Promise.all([
        restaurantAPI.getById(id),
        reviewAPI.getByRestaurant(id),
      ]);
      setRestaurant(restRes.data);
      setReviews(revRes.data || []);
    } catch (err) {
      setMsg(err.response?.data?.detail || "Failed to load restaurant details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFavorite = async () => {
    try {
      if (restaurant.is_favorited) {
        await restaurantAPI.unfavorite(id);
      } else {
        await restaurantAPI.favorite(id);
      }
      setRestaurant((prev) => ({
        ...prev,
        is_favorited: !prev.is_favorited,
      }));
    } catch (err) {
      setMsg(err.response?.data?.detail || "Could not update favorites");
    }
  };

  const startEditReview = (review) => {
    setEditingReview({
      id: review.id,
      rating: review.rating,
      comment: review.comment || "",
    });
  };

  const saveEditReview = async (e) => {
    e.preventDefault();
    if (!editingReview) return;

    setEditSaving(true);
    try {
      await reviewAPI.update(editingReview.id, {
        rating: editingReview.rating,
        comment: editingReview.comment,
      });
      setEditingReview(null);
      await load();
    } catch (err) {
      setMsg(err.response?.data?.detail || "Could not update review");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await reviewAPI.delete(reviewId);
      await load();
    } catch (err) {
      setMsg(err.response?.data?.detail || "Could not delete review");
    }
  };

  const claimRestaurant = async () => {
    try {
      const res = await restaurantAPI.claim(id);
      setRestaurant(res.data);
      setMsg("Restaurant claimed successfully!");
      setTimeout(() => {
        navigate("/owner/dashboard");
      }, 800);
    } catch (err) {
      setMsg(err.response?.data?.detail || "Could not claim restaurant");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading…</div>
    );
  }

  if (!restaurant) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        {msg || "Restaurant not found"}
      </div>
    );
  }

  const heroImage = restaurant.photos?.[0] || restaurant.image;

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
        onSearch={({ find, near }) =>
          navigate(
            `/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`,
          )
        }
        defaultFind=""
        defaultNear={restaurant.city || ""}
      />

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px 60px" }}>
        {heroImage && (
          <img
            src={heroImage}
            alt={restaurant.name}
            style={{
              width: "100%",
              height: 360,
              objectFit: "cover",
              borderRadius: 12,
              marginTop: 20,
            }}
          />
        )}

        {restaurant.photos?.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 10,
              overflowX: "auto",
            }}
          >
            {restaurant.photos.slice(1, 5).map((photo, idx) => (
              <img
                key={idx}
                src={photo}
                alt={`${restaurant.name} ${idx + 2}`}
                style={{
                  height: 120,
                  width: 160,
                  objectFit: "cover",
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        )}

        {owner && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 22,
              marginBottom: 16,
            }}
          >
            <button
              onClick={() => navigate("/owner/dashboard")}
              style={secondaryBtn}
            >
              Back to Dashboard
            </button>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 0.9fr",
            gap: 28,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 34,
                color: "#2d2d2d",
                fontWeight: 800,
              }}
            >
              {restaurant.name}
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 10,
                flexWrap: "wrap",
              }}
            >
              <StarRating rating={restaurant.average_rating || 0} showNumber />
              <span style={{ color: "#666", fontWeight: 700 }}>
                {restaurant.review_count} review
                {restaurant.review_count !== 1 ? "s" : ""}
              </span>
              <span style={{ color: "#666" }}>
                {restaurant.price_range || "$$"}
              </span>
              <span
                style={{
                  background: "#f0f0f0",
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#555",
                }}
              >
                {restaurant.cuisine_type}
              </span>
              {restaurant.is_open ? (
                <span
                  style={{ color: "#166534", fontWeight: 700, fontSize: 13 }}
                >
                  ● Open
                </span>
              ) : (
                <span
                  style={{ color: "#d32323", fontWeight: 700, fontSize: 13 }}
                >
                  ● Closed
                </span>
              )}
            </div>

            <p style={{ color: "#555", lineHeight: 1.7, marginTop: 12 }}>
              {restaurant.description || "No description yet."}
            </p>

            {(restaurant.keywords?.length > 0 ||
              restaurant.amenities?.length > 0) && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 18,
                }}
              >
                {(restaurant.keywords || []).slice(0, 8).map((item) => (
                  <span key={`kw-${item}`} style={chip}>
                    {item}
                  </span>
                ))}

                {(restaurant.amenities || []).slice(0, 4).map((item) => (
                  <span key={`am-${item}`} style={chipAlt}>
                    {item}
                  </span>
                ))}

                {((restaurant.keywords || []).length > 8 ||
                  (restaurant.amenities || []).length > 4) && (
                  <span style={moreChip}>+ more</span>
                )}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              {user && (
                <button
                  onClick={() => navigate(`/review/${restaurant.id}`)}
                  style={primaryBtn}
                >
                  ✏ Write a Review
                </button>
              )}

              {user && (
                <button
                  onClick={toggleFavorite}
                  style={{
                    ...secondaryBtn,
                    background: restaurant.is_favorited ? "#fff5f5" : "#fff",
                    color: restaurant.is_favorited ? "#d32323" : "#333",
                    borderColor: restaurant.is_favorited
                      ? "#d32323"
                      : "#d6d6d6",
                  }}
                >
                  {restaurant.is_favorited
                    ? "♥ Remove Favorite"
                    : "♡ Save as Favorite"}
                </button>
              )}

              {owner && !restaurant.owner_id && (
                <button onClick={claimRestaurant} style={secondaryBtn}>
                  🏷 Claim Restaurant
                </button>
              )}

              {!user && !owner && (
                <button onClick={() => navigate("/login")} style={secondaryBtn}>
                  Log in to write a review
                </button>
              )}
            </div>

            {msg && (
              <div
                style={{
                  marginBottom: 16,
                  color: msg.toLowerCase().includes("success")
                    ? "#166534"
                    : "#d32323",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {msg}
              </div>
            )}

            <section>
              <h2 style={sectionTitle}>Reviews ({reviews.length})</h2>

              {reviews.length === 0 ? (
                <div
                  style={{
                    color: "#777",
                    padding: "24px 0",
                    borderTop: "1px solid #ececec",
                  }}
                >
                  No reviews yet. Be the first to write one!
                </div>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      borderBottom: "1px solid #ececec",
                      padding: "18px 0",
                    }}
                  >
                    {editingReview?.id === review.id ? (
                      <form onSubmit={saveEditReview}>
                        <div
                          style={{
                            fontWeight: 800,
                            marginBottom: 8,
                            color: "#333",
                          }}
                        >
                          Edit your review
                        </div>

                        <div
                          style={{ display: "flex", gap: 4, marginBottom: 10 }}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setEditingReview((prev) => ({
                                  ...prev,
                                  rating: star,
                                }))
                              }
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 28,
                                color:
                                  star <= editingReview.rating
                                    ? "#d32323"
                                    : "#ddd",
                                padding: 2,
                              }}
                            >
                              ★
                            </button>
                          ))}
                        </div>

                        <textarea
                          value={editingReview.comment}
                          onChange={(e) =>
                            setEditingReview((prev) => ({
                              ...prev,
                              comment: e.target.value,
                            }))
                          }
                          rows={4}
                          style={{
                            width: "100%",
                            border: "1px solid #ccc",
                            borderRadius: 8,
                            padding: "10px 12px",
                            fontSize: 14,
                            fontFamily: "inherit",
                            resize: "vertical",
                            boxSizing: "border-box",
                          }}
                        />

                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            type="submit"
                            disabled={editSaving}
                            style={{
                              ...secondaryBtn,
                              background: "#d32323",
                              color: "#fff",
                              border: "none",
                              padding: "8px 14px",
                              fontSize: 13,
                            }}
                          >
                            {editSaving ? "Saving…" : "Save"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingReview(null)}
                            style={{
                              ...secondaryBtn,
                              padding: "8px 14px",
                              fontSize: 13,
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 800,
                                color: "#333",
                                marginBottom: 4,
                              }}
                            >
                              {review.user_name}
                            </div>
                            <StarRating rating={review.rating} />
                          </div>

                          <div
                            style={{
                              color: "#aaa",
                              fontSize: 13,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {review.created_at
                              ? new Date(review.created_at).toLocaleDateString()
                              : ""}
                          </div>
                        </div>

                        <p
                          style={{
                            color: "#555",
                            lineHeight: 1.65,
                            margin: "10px 0 8px",
                          }}
                        >
                          {review.comment || ""}
                        </p>

                        {review.photo_urls?.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                              marginBottom: 8,
                            }}
                          >
                            {review.photo_urls.map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt="review"
                                style={{
                                  height: 80,
                                  width: 110,
                                  objectFit: "cover",
                                  borderRadius: 6,
                                }}
                              />
                            ))}
                          </div>
                        )}

                        {user && user.id === review.user_id && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => startEditReview(review)}
                              style={{
                                ...secondaryBtn,
                                padding: "7px 12px",
                                fontSize: 12,
                              }}
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => deleteReview(review.id)}
                              style={{
                                ...secondaryBtn,
                                padding: "7px 12px",
                                fontSize: 12,
                                color: "#d32323",
                                borderColor: "#f5b8b8",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </section>
          </div>

          <aside>
            <div
              style={{
                border: "1px solid #e6e6e6",
                borderRadius: 12,
                padding: 20,
                position: "sticky",
                top: 88,
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 16,
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                Restaurant Info
              </h3>

              <Info
                label="Address"
                value={[
                  restaurant.address,
                  restaurant.city,
                  restaurant.state,
                  restaurant.zip_code,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
              <Info
                label="Phone"
                value={restaurant.contact_phone || "Not provided"}
              />
              <Info
                label="Email"
                value={restaurant.contact_email || "Not provided"}
              />
              <Info
                label="Hours"
                value={restaurant.hours_text || "Not provided"}
              />
              <Info
                label="Price range"
                value={restaurant.price_range || "Not provided"}
              />
              <Info
                label="Status"
                value={restaurant.is_open ? "Open" : "Closed"}
              />

              {restaurant.owner_id && (
                <div
                  style={{
                    marginTop: 14,
                    padding: "8px 12px",
                    background: "#f0fff4",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#166534",
                    fontWeight: 700,
                  }}
                >
                  ✓ Owner managed
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 12,
          color: "#888",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ color: "#333", fontSize: 14, lineHeight: 1.5 }}>
        {value}
      </div>
    </div>
  );
}

const chip = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 10px",
  borderRadius: 999,
  background: "#f4f4f4",
  color: "#555",
  fontSize: 12,
  fontWeight: 700,
};

const chipAlt = {
  ...chip,
  background: "#fff5f5",
  color: "#b91c1c",
};

const moreChip = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 10px",
  borderRadius: 999,
  background: "#f9f9f9",
  color: "#777",
  fontSize: 12,
  fontWeight: 700,
  border: "1px solid #e5e5e5",
};

const sectionTitle = {
  fontSize: 22,
  margin: "0 0 8px",
  color: "#2d2d2d",
  fontWeight: 800,
};

const primaryBtn = {
  background: "#d32323",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "11px 18px",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 14,
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
};

const secondaryBtn = {
  background: "#fff",
  color: "#333",
  border: "1px solid #d6d6d6",
  borderRadius: 8,
  padding: "11px 18px",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 14,
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
};
