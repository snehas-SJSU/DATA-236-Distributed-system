import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { profileAPI, reviewAPI } from "../services/api";

const STARS = (n) => "★".repeat(Math.max(0, Math.min(5, n)));

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState({
    reviews: [],
    restaurants_added: [],
  });
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState("");
  const [uploadingReviewId, setUploadingReviewId] = useState(null);
  const [photoMsg, setPhotoMsg] = useState("");
  const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState(null);
  const [pageMsg, setPageMsg] = useState("");
  const photoInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    profileAPI
      .getHistory()
      .then((res) => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (review) => {
    setEditingReview({
      id: review.id,
      rating: review.rating,
      comment: review.comment || "",
    });
    setEditMsg("");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editingReview) return;
    setEditSaving(true);
    setEditMsg("");
    try {
      await reviewAPI.update(editingReview.id, {
        rating: editingReview.rating,
        comment: editingReview.comment,
      });
      setEditingReview(null);
      load();
    } catch (err) {
      setEditMsg(err.response?.data?.detail || "Could not update review");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await reviewAPI.delete(reviewId);
      setPageMsg("Review deleted successfully.");
      load();
    } catch (err) {
      setPageMsg(err.response?.data?.detail || "Could not delete review");
    } finally {
      setConfirmDeleteReviewId(null);
    }
  };

  const triggerPhotoUpload = (reviewId) => {
    setUploadingReviewId(reviewId);
    setPhotoMsg("");
    photoInputRef.current?.click();
  };

  const handlePhotoFiles = async (e) => {
    const files = e.target.files;
    if (!files || !files.length || !uploadingReviewId) return;

    const fd = new FormData();
    for (const f of files) fd.append("files", f);

    try {
      await reviewAPI.uploadPhotos(uploadingReviewId, fd);
      setPhotoMsg("Photos added successfully!");
      setPageMsg("");
      load();
    } catch (err) {
      setPhotoMsg(err.response?.data?.detail || "Photo upload failed");
    } finally {
      e.target.value = "";
      setUploadingReviewId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7" }}>
      <Navbar
        onSearch={({ find, near }) =>
          navigate(
            `/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(
              near || ""
            )}`
          )
        }
      />

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotoFiles}
        style={{ display: "none" }}
      />

      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 20px 50px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            border: "none",
            background: "transparent",
            marginBottom: 12,
            cursor: "pointer",
            color: "#777",
            fontSize: 16,
            padding: 0,
          }}
        >
          ← back
        </button>

        <div style={{ marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>
            Your History
          </h1>
          <p style={{ margin: "6px 0 0", color: "#777", fontSize: 14 }}>
            Reviews and restaurants you added.
          </p>
        </div>

        {photoMsg && (
          <div
            style={{
              marginBottom: 12,
              color: "#166534",
              background: "#f0fff4",
              border: "1px solid #bbf7d0",
              padding: "10px 12px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {photoMsg}
          </div>
        )}

        {pageMsg && (
          <div
            style={{
              marginBottom: 12,
              color: pageMsg.toLowerCase().includes("could not") ? "#b42318" : "#166534",
              background: pageMsg.toLowerCase().includes("could not") ? "#fff4f4" : "#f0fff4",
              border: pageMsg.toLowerCase().includes("could not")
                ? "1px solid #fecaca"
                : "1px solid #bbf7d0",
              padding: "10px 12px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {pageMsg}
          </div>
        )}

        {loading ? (
          <div style={{ color: "#999", padding: "30px 0" }}>Loading…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <section>
              <SectionHeader title="Your Reviews" count={history.reviews.length} />

              <div style={{ display: "grid", gap: 12 }}>
                {history.reviews.map((review) => {
                  const img = review.restaurant_image || review.restaurant_photos?.[0];

                  if (editingReview?.id === review.id) {
                    return (
                      <article key={review.id} style={cardBase}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 16,
                            color: "#0073bb",
                            marginBottom: 10,
                          }}
                        >
                          {review.restaurant_name}
                        </div>

                        <form onSubmit={saveEdit}>
                          <div style={{ marginBottom: 10 }}>
                            <label
                              style={{
                                display: "block",
                                fontWeight: 700,
                                fontSize: 12,
                                marginBottom: 6,
                                color: "#555",
                              }}
                            >
                              Rating
                            </label>

                            <div style={{ display: "flex", gap: 6 }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() =>
                                    setEditingReview((p) => ({
                                      ...p,
                                      rating: s,
                                    }))
                                  }
                                  style={{
                                    fontSize: 22,
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: s <= editingReview.rating ? "#d32323" : "#ccc",
                                    padding: 0,
                                  }}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>

                          <div style={{ marginBottom: 10 }}>
                            <label
                              style={{
                                display: "block",
                                fontWeight: 700,
                                fontSize: 12,
                                marginBottom: 6,
                                color: "#555",
                              }}
                            >
                              Comment
                            </label>

                            <textarea
                              value={editingReview.comment}
                              onChange={(e) =>
                                setEditingReview((p) => ({
                                  ...p,
                                  comment: e.target.value,
                                }))
                              }
                              style={{
                                width: "100%",
                                boxSizing: "border-box",
                                height: 90,
                                border: "1px solid #d7d7d7",
                                borderRadius: 10,
                                padding: "10px 12px",
                                fontSize: 13,
                                resize: "vertical",
                                fontFamily: "inherit",
                              }}
                            />
                          </div>

                          {editMsg && (
                            <div
                              style={{
                                color: "#d32323",
                                fontSize: 12,
                                marginBottom: 8,
                                fontWeight: 700,
                              }}
                            >
                              {editMsg}
                            </div>
                          )}

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button type="submit" disabled={editSaving} style={solidBtn}>
                              {editSaving ? "Saving…" : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingReview(null)}
                              style={outlineBtn}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </article>
                    );
                  }

                  return (
                    <article key={review.id} style={cardBase}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/restaurant/${review.restaurant_id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            navigate(`/restaurant/${review.restaurant_id}`);
                          }
                        }}
                        style={{
                          display: "flex",
                          gap: 12,
                          cursor: "pointer",
                        }}
                      >
                        <div style={imgBox}>
                          {img ? <img src={img} alt="" style={imgStyle} /> : "🍽️"}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 16, color: "#0073bb" }}>
                            {review.restaurant_name}
                          </div>

                          <div style={{ margin: "4px 0 6px" }}>
                            <span style={{ color: "#d32323", fontSize: 14 }}>
                              {STARS(review.rating)}
                            </span>
                            <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>
                              {review.rating}/5
                            </span>
                          </div>

                          <p
                            style={{
                              fontSize: 13,
                              color: "#555",
                              margin: 0,
                              lineHeight: 1.5,
                            }}
                          >
                            {review.comment || "No comment"}
                          </p>
                        </div>
                      </div>

                      {review.photo_urls?.length > 0 && (
                        <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" }}>
                          {review.photo_urls.map((u, i) => (
                            <img key={i} src={u} alt="" style={smallPhoto} />
                          ))}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        <button onClick={() => startEdit(review)} style={outlineBtn}>
                          Edit
                        </button>
                        <button
                          onClick={() => triggerPhotoUpload(review.id)}
                          style={outlineBtn}
                        >
                          Photos
                        </button>
                        <button
                          onClick={() => setConfirmDeleteReviewId(review.id)}
                          style={deleteBtn}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section>
              <SectionHeader title="Restaurants" count={history.restaurants_added.length} />

              <div style={{ display: "grid", gap: 12 }}>
                {history.restaurants_added.map((item) => (
                  <article key={item.id} style={cardBase}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/restaurant/${item.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          navigate(`/restaurant/${item.id}`);
                        }
                      }}
                      style={{ display: "flex", gap: 12, cursor: "pointer" }}
                    >
                      <div style={imgBox}>
                        {item.photos?.[0] || item.image ? (
                          <img
                            src={item.photos?.[0] || item.image}
                            alt=""
                            style={imgStyle}
                          />
                        ) : (
                          "🍽️"
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>
                          {item.name}
                        </div>

                        <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                          {item.cuisine_type} · {item.city}
                          {item.state ? `, ${item.state}` : ""}
                          {item.price_range ? ` · ${item.price_range}` : ""}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            flexWrap: "wrap",
                            marginTop: 6,
                            fontSize: 13,
                          }}
                        >
                          <span style={{ color: "#d32323" }}>
                            {STARS(Math.round(item.average_rating || 0))}
                          </span>
                          <span style={{ fontWeight: 700 }}>
                            {(item.average_rating || 0).toFixed(1)}
                          </span>
                          <span style={{ color: "#999" }}>
                            ({item.review_count || 0}{" "}
                            {(item.review_count || 0) === 1 ? "review" : "reviews"})
                          </span>
                          {typeof item.is_open === "boolean" && (
                            <span
                              style={{
                                color: item.is_open ? "#166534" : "#d32323",
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                            >
                              ● {item.is_open ? "Open" : "Closed"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {confirmDeleteReviewId && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: 18,
                fontWeight: 800,
                color: "#2d2d2d",
              }}
            >
              Delete review?
            </h3>

            <p
              style={{
                margin: "0 0 18px",
                fontSize: 14,
                color: "#666",
                lineHeight: 1.5,
              }}
            >
              This action cannot be undone.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setConfirmDeleteReviewId(null)}
                style={modalCancelBtn}
              >
                Cancel
              </button>

              <button
                onClick={() => deleteReview(confirmDeleteReviewId)}
                style={modalDeleteBtn}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, count }) {
  return (
    <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
      {title} ({count})
    </h2>
  );
}

const cardBase = {
  background: "#fff",
  border: "1px solid #e8e8e8",
  borderRadius: 12,
  padding: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
};

const imgBox = {
  width: 70,
  height: 70,
  borderRadius: 10,
  overflow: "hidden",
  background: "#eee",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const imgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const smallPhoto = {
  width: 70,
  height: 70,
  borderRadius: 8,
  objectFit: "cover",
  flexShrink: 0,
};

const outlineBtn = {
  background: "#fff",
  border: "1px solid #ddd",
  padding: "6px 10px",
  borderRadius: 8,
  fontSize: 12,
  cursor: "pointer",
};

const deleteBtn = {
  ...outlineBtn,
  color: "#d32323",
  border: "1px solid #f3c2c2",
};

const solidBtn = {
  background: "#d32323",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: 8,
  fontSize: 12,
  cursor: "pointer",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalCard = {
  width: 360,
  maxWidth: "calc(100vw - 32px)",
  background: "#fff",
  borderRadius: 14,
  padding: 20,
  boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
  border: "1px solid #ececec",
};

const modalCancelBtn = {
  background: "#fff",
  border: "1px solid #ddd",
  color: "#444",
  padding: "9px 14px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const modalDeleteBtn = {
  background: "#d32323",
  border: "none",
  color: "#fff",
  padding: "9px 14px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};