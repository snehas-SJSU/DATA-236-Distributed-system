/**
 * Build /search URL with only non-empty params (restaurant search; no default q=Restaurants).
 */
export function toSearchPath({ q, loc } = {}) {
  const p = new URLSearchParams();
  const qt = (q ?? "").trim();
  const lt = (loc ?? "").trim();
  if (qt) p.set("q", qt);
  if (lt) p.set("loc", lt);
  const s = p.toString();
  return s ? `/search?${s}` : "/search";
}
