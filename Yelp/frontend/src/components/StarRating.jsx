export default function StarRating({ rating, size = 16, showNumber = false }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = rating >= i;
    const half = !filled && rating >= i - 0.5;
    stars.push(
      <span key={i} style={{ position: "relative", display: "inline-block", width: size, height: size }}>
        {/* Empty star */}
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#e0e0e0">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        {/* Filled overlay */}
        <span style={{
          position: "absolute", top: 0, left: 0,
          width: filled ? "100%" : half ? "50%" : "0%",
          overflow: "hidden", display: "inline-block",
        }}>
          <svg width={size} height={size} viewBox="0 0 24 24" fill="#f15c4f">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </span>
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
      {stars}
      {showNumber && (
        <span style={{ fontSize: size * 0.8, color: "#666", marginLeft: "4px", fontWeight: "600" }}>
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}
