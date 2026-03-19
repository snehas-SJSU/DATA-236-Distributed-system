import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { restaurantAPI, reviewAPI } from "../services/api";

export default function WriteReview() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hovered, setHovered] = useState(0);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    restaurantAPI
      .getById(restaurantId)
      .then((res) => setRestaurant(res.data))
      .catch(() => setMsg("Restaurant not found"));
  }, [restaurantId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setMsg("Please write a comment.");
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      const res = await reviewAPI.create(restaurantId, { rating, comment });
      const reviewId = res.data?.id;
      // Upload photos to the review (not the restaurant)
      if (photoFiles.length > 0 && reviewId) {
        const fd = new FormData();
        for (const f of photoFiles) fd.append("files", f);
        await reviewAPI.uploadPhotos(reviewId, fd);
      }
      navigate(`/restaurant/${restaurantId}`);
    } catch (err) {
      setMsg(err.response?.data?.detail || "Failed to submit review");
    } finally {
      setSaving(false);
    }
  };

  const LABELS = ["", "Eek! Methinks not.", "Meh. I've experienced better.", "A-OK.", "Yay! I'm a fan.", "Woohoo! As good as it gets!"];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" }}>
      <Navbar
        onSearch={({ find, near }) =>
          navigate(`/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`)
        }
      />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 60px" }}>
        <h1 style={{ marginTop: 0, fontSize: 28, fontWeight: 800, color: "#2d2d2d" }}>Write a Review</h1>
        {restaurant && (
          <p style={{ color: "#555", marginBottom: 20, fontSize: 16 }}>
            Reviewing <strong>{restaurant.name}</strong>
            {restaurant.city ? ` — ${restaurant.city}` : ""}
          </p>
        )}

        {msg && (
          <div style={{ marginBottom: 14, color: "#d32323", fontWeight: 700, fontSize: 14, background: "#fff5f5", border: "1px solid #fcc", borderRadius: 6, padding: "10px 14px" }}>
            {msg}
          </div>
        )}

        <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #e6e6e6", borderRadius: 12, padding: 24 }}>
          {/* Star Rating */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 800, marginBottom: 10, fontSize: 15, color: "#333" }}>Your rating *</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                    fontSize: 36,
                    color: star <= (hovered || rating) ? "#d32323" : "#ddd",
                    transition: "color 0.1s",
                    lineHeight: 1,
                  }}
                  aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
              <span style={{ marginLeft: 10, color: "#555", fontSize: 14, fontWeight: 600 }}>
                {LABELS[hovered || rating]}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 15, color: "#333" }}>Your review *</div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={7}
              placeholder="What did you like or dislike? Describe the food, service, atmosphere…"
              style={{
                width: "100%",
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: "12px 14px",
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Photo Upload */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 15, color: "#333" }}>Add photos (optional)</div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed #ccc",
                borderRadius: 8,
                padding: "14px 24px",
                background: "#fafafa",
                cursor: "pointer",
                fontSize: 14,
                color: "#666",
                fontFamily: "inherit",
              }}
            >
              + Choose photos
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
              style={{ display: "none" }}
            />
            {photoFiles.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 13, color: "#555" }}>
                {photoFiles.length} photo{photoFiles.length !== 1 ? "s" : ""} selected:{" "}
                {photoFiles.map((f) => f.name).join(", ")}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving ? "#e0e0e0" : "#d32323",
                color: saving ? "#888" : "#fff",
                border: "none",
                borderRadius: 8,
                padding: "13px 24px",
                fontWeight: 800,
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: 15,
                fontFamily: "inherit",
              }}
            >
              {saving ? "Submitting…" : "Post Review"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: "#fff",
                color: "#333",
                border: "1px solid #d0d0d0",
                borderRadius: 8,
                padding: "13px 24px",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 15,
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
