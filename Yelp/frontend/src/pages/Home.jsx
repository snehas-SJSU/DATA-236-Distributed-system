import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import RestaurantCard from "../components/RestaurantCard";
import { restaurantAPI } from "../services/api";
import SearchAutocomplete from "../components/SearchAutocomplete";
import { CityAutocomplete } from "../components/CityAutocomplete";
import { useAuth } from "../context/AuthContext";
import ChatPanel from "../components/ChatPanel";

/* ---------- data (unchanged) ---------- */
const HERO_SLIDES = [
  {
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=90",
    heading: "Find your next\nfavorite restaurant",
    cta: "Restaurants",
    business: "The Golden Fork",
    author: "the business owner",
  },
  {
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=90",
    heading: "Discover hidden\ndining gems",
    cta: "Restaurants",
    business: "Casa Fuego",
    author: "Sarah K.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=90",
    heading: "The best local eats,\nreviewed",
    cta: "Restaurants",
    business: "Iron & Grill",
    author: "Marco T.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=1600&q=90",
    heading: "Book a table\ntonight",
    cta: "Restaurants",
    business: "Pasta Milano",
    author: "the business owner",
  },
];

const RECENT_ACTIVITY = [
  {
    user: "Marco T.",
    action: "wrote a review",
    target: "The Golden Fork",
    time: "2 minutes ago",
    avatar: "M",
    color: "#e74c3c",
    img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
  },
  {
    user: "Sarah K.",
    action: "added a photo",
    target: "Casa Fuego",
    time: "5 minutes ago",
    avatar: "S",
    color: "#3498db",
    img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80",
  },
  {
    user: "Priya M.",
    action: "wrote a review",
    target: "Sakura Japanese",
    time: "12 minutes ago",
    avatar: "P",
    color: "#9b59b6",
    img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80",
  },
];

const CUISINE_FILTERS = [
  "All",
  "American",
  "Italian",
  "Mexican",
  "Chinese",
  "Japanese",
  "Indian",
  "Thai",
  "Mediterranean",
  "Vegan",
];
const PRICE_FILTERS = ["Any", "$", "$$", "$$$", "$$$$"];
const SORT_OPTIONS = [
  { value: "best_match", label: "Best Match" },
  { value: "rating", label: "Rating" },
  { value: "review_count", label: "Review Count" },
  { value: "distance", label: "Distance" },
];

const MOCK = [
  /* ... your mock data unchanged ... */
];
const RESTAURANT_SUBS = [
  "All Restaurants",
  "American",
  "Italian",
  "Mexican",
  "Chinese",
  "Japanese",
  "Indian",
  "Thai",
  "Mediterranean",
  "Breakfast & Brunch",
  "Burgers",
  "Pizza",
  "Sushi",
  "Seafood",
  "Steakhouses",
  "Vegan",
];

/* ---------- small SVG icon set (inline, sized to match screenshot) ---------- */

// /* TAKEOUT */
// function IconTakeout(){
//   return(
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7" strokeLinecap="round">
//       <rect x="4" y="8" width="16" height="10" rx="2"/>
//       <path d="M8 8V6a4 4 0 0 1 8 0v2"/>
//     </svg>
//   )
// }

// /* DELIVERY */
// function IconDelivery(){
//   return(
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7" strokeLinecap="round">
//       <path d="M3 13h11v5H3z"/>
//       <path d="M14 13h3l3 3v2h-6z"/>
//       <circle cx="7" cy="19" r="1.5"/>
//       <circle cx="17" cy="19" r="1.5"/>
//     </svg>
//   )
// }

// /* HOT & TRENDY */
// function IconHot(){
//   return(
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7">
//       <path d="M12 3s4 4 0 9c0 0-2.5-2-2.5-4.5S12 6 12 3z"/>
//     </svg>
//   )
// }

// /* NEW RESTAURANTS */
// function IconNew(){
//   return(
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7">
//       <path d="M12 2l2 5 5 .5-4 3 1 5-4-2.5-4 2.5 1-5-4-3 5-.5 2-5z"/>
//     </svg>
//   )
// }

// /* BREAKFAST */
// function IconBreakfast(){
//   return(
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7">
//       <circle cx="12" cy="12" r="4"/>
//       <path d="M4 12h2M18 12h2M12 4v2M12 18v2"/>
//     </svg>
//   )
// }

// /* LUNCH */
// function IconLunch(){
//   return(
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7">
//       <path d="M3 10h18v3H3z"/>
//       <path d="M6 13v3M18 13v3"/>
//     </svg>
//   )
// }

// /* DINNER */
// function IconDinner(){
//   return(
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7">
//       <path d="M6 3v10"/>
//       <path d="M10 3v10"/>
//       <path d="M14 3v10"/>
//       <path d="M18 3v10"/>
//     </svg>
//   )
// }

// /* COFFEE */
// function IconCoffee(){
//   return(
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7">
//       <path d="M3 8h13v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/>
//       <path d="M16 10h2a2 2 0 0 1 0 4h-2"/>
//     </svg>
//   )
// }

// /* PIZZA */
// function IconPizza(){
//   return(
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7">
//       <path d="M12 2L2 22c10 0 10 0 20 0L12 2z"/>
//       <circle cx="11" cy="13" r="1"/>
//       <circle cx="14" cy="16" r="1"/>
//     </svg>
//   )
// }

// /* CHINESE */
// function IconChinese(){
//   return(
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7">
//       <path d="M4 6h16"/>
//       <path d="M7 9c2 1 3 3 5 3s3-2 5-3"/>
//     </svg>
//   )
// }
// function IconMexican() {
//   return (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M4 13c2.5-4.5 13.5-4.5 16 0" />
//       <path d="M6 13c0 3 2.5 5 6 5s6-2 6-5" />
//       <path d="M8 10c.6-.8 1.6-1.5 4-1.5S15.4 9.2 16 10" />
//     </svg>
//   );
// }

// function IconBaker() {
//   return (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M7 10a5 5 0 1 1 10 0c0 1.5-.7 2.5-1.8 3.4-.8.7-1.2 1.3-1.2 2.6h-4c0-1.3-.4-1.9-1.2-2.6C7.7 12.5 7 11.5 7 10z" />
//       <path d="M10 18h4" />
//     </svg>
//   );
// }

// function IconItalian() {
//   return (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M12 3v18" />
//       <path d="M9 5c1 1 1 2.2 1 3.5S9 11 8 12" />
//       <path d="M15 5c-1 1-1 2.2-1 3.5s1 2.5 2 3.5" />
//     </svg>
//   );
// }

// function IconTruck() {
//   return (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M3 7h11v8H3z" />
//       <path d="M14 10h3l3 3v2h-6z" />
//       <circle cx="7" cy="17" r="1.5" />
//       <circle cx="17" cy="17" r="1.5" />
//     </svg>
//   );
// }

// function IconSports() {
//   return (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M8 4v10" />
//       <path d="M8 9c1.2-1 2.4-1 3.6 0S14 10 15.2 9V4" />
//       <path d="M6 20h4" />
//       <path d="M16 6a3 3 0 0 1 0 6h-1V6z" />
//       <path d="M15 20V12" />
//     </svg>
//   );
// }
function IconTakeout() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" />
      <path d="M8 8V6a4 4 0 0 1 8 0v2" />
    </svg>
  );
}

function IconDelivery() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7h10v8H3z" />
      <path d="M13 10h4l3 3v2h-7z" />
      <circle cx="7" cy="18" r="1.5" />
      <circle cx="17" cy="18" r="1.5" />
    </svg>
  );
}

function IconHot() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3s4 4 0 9c0 0-2.5-2-2.5-4.5S12 6 12 3z" />
      <path d="M8.5 16.5C6.5 14.5 6 12.5 6.5 10.5c.5 1.2 1.4 2.2 2.5 3" />
      <path d="M15.5 16.5c1.3-1 2-2.4 2-4.2 0-2.2-1.4-4.1-3.5-5.8" />
    </svg>
  );
}

function IconNew() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l2.3 4.7 5.2.8-3.8 3.7.9 5.2L12 15.8 7.4 17.4l.9-5.2L4.5 8.5l5.2-.8L12 3z" />
    </svg>
  );
}

function IconBreakfast() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v2" />
      <path d="M12 17v2" />
      <path d="M5 12h2" />
      <path d="M17 12h2" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function IconLunch() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10h16" />
      <path d="M6 10c0 3 2.5 5 6 5s6-2 6-5" />
      <path d="M8 15l-1.5 3" />
      <path d="M16 15l1.5 3" />
    </svg>
  );
}

function IconDinner() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3v8" />
      <path d="M9 3v8" />
      <path d="M6 7h3" />
      <path d="M16 3v18" />
      <path d="M16 3c2.2 0 3 1.8 3 4v3h-3" />
    </svg>
  );
}

function IconCoffee() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 9h11v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9z" />
      <path d="M15 10h2a2.5 2.5 0 0 1 0 5h-2" />
      <path d="M8 5c0 1 1 1.5 1 2.5" />
      <path d="M11 5c0 1 1 1.5 1 2.5" />
    </svg>
  );
}

function IconPizza() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3L4 20h16L12 3z" />
      <circle cx="10" cy="11" r="1" />
      <circle cx="13.5" cy="14.5" r="1" />
      <circle cx="11.5" cy="16.5" r="1" />
    </svg>
  );
}

function IconChinese() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 4l3 7" />
      <path d="M12 4l-3 7" />
      <path d="M5 12h14" />
      <path d="M7 12c1.5 3 3 4 5 4s3.5-1 5-4" />
    </svg>
  );
}

function IconMexican() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 13c2.5-4.5 13.5-4.5 16 0" />
      <path d="M6 13c0 3 2.5 5 6 5s6-2 6-5" />
      <path d="M8 10c1-.8 2.2-1.2 4-1.2s3 .4 4 1.2" />
    </svg>
  );
}

function IconBaker() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 11a5 5 0 1 1 10 0" />
      <path d="M6 13h12" />
      <path d="M8 18h8" />
    </svg>
  );
}

function IconItalian() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4v16" />
      <path d="M9 6c1 1 1 2.2 1 3.5S9 12 8 13" />
      <path d="M15 6c-1 1-1 2.2-1 3.5s1 2.5 2 3.5" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 8h11v7H2z" />
      <path d="M13 10h4l3 3v2h-7z" />
      <circle cx="7" cy="18" r="1.5" />
      <circle cx="17" cy="18" r="1.5" />
    </svg>
  );
}

function IconSports() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#333"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 4v10" />
      <path d="M8 9c1.2-1 2.4-1 3.6 0S14 10 15.2 9V4" />
      <path d="M6 20h4" />
      <path d="M16 6a3 3 0 0 1 0 6h-1V6z" />
      <path d="M15 20V12" />
    </svg>
  );
}
/* ---------- items layout for dropdown (3 columns) ---------- */
const DROPDOWN_COLS = [
  [
    { label: "Takeout", icon: <IconTakeout /> },
    { label: "Delivery", icon: <IconDelivery /> },
    { label: "Hot & Trendy", icon: <IconHot /> },
    { label: "New Restaurants", icon: <IconNew /> },
    { label: "Breakfast & Brunch", icon: <IconBreakfast /> },
  ],
  [
    { label: "Lunch", icon: <IconLunch /> },
    { label: "Dinner", icon: <IconDinner /> },
    { label: "Coffee & Cafes", icon: <IconCoffee /> },
    { label: "Pizza", icon: <IconPizza /> },
    { label: "Chinese", icon: <IconChinese /> },
  ],
  [
    { label: "Mexican", icon: <IconMexican /> },
    { label: "Bakeries", icon: <IconBaker /> },
    { label: "Italian", icon: <IconItalian /> },
    { label: "Food Trucks", icon: <IconTruck /> },
    { label: "Sports Bars & Pubs", icon: <IconSports /> },
  ],
];

/* ---------- Home component (updated) ---------- */
export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [activityTab, setActivityTab] = useState("Nearby");
  const [find, setFind] = useState("");
  const getUserLocation = () => {
    try {
      const locs = JSON.parse(user?.pref_locations_json || "[]");
      return locs?.[0] || "";
    } catch {
      return "";
    }
  };
  const [near, setNear] = useState(getUserLocation());
  const [restOpen, setRestOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [cuisine, setCuisine] = useState("All");
  const [price, setPrice] = useState("Any");
  const [sort, setSort] = useState("best_match");
  const [openNow, setOpenNow] = useState(false);
  const [zip, setZip] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(1);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const t = setInterval(
      () => setSlideIdx((i) => (i + 1) % HERO_SLIDES.length),
      6000,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (searchParams.get("q")) fetchRestaurants();
  }, [cuisine, price, sort, openNow, page, searchParams]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await restaurantAPI.search({
        q:
          searchParams.get("q") &&
          !["restaurants", "all restaurants"].includes(
            (searchParams.get("q") || "").toLowerCase(),
          )
            ? searchParams.get("q")
            : "",
        location: zip.trim() || searchParams.get("loc") || "",
        cuisine: cuisine !== "All" ? cuisine : "",
        price_range: price !== "Any" ? price : "",
        sort_by:
          sort === "review_count"
            ? "review_count"
            : sort === "rating"
              ? "rating"
              : sort === "newest"
                ? "newest"
                : "newest",
        open_now: openNow,
        page,
        limit: 10,
      });
      setRestaurants(res.data.restaurants || []);
      setTotal(res.data.total_pages || 1);
    } catch {
      let list = [...MOCK];
      const q = (searchParams.get("q") || "").toLowerCase();
      if (q)
        list = list.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.cuisine_type.toLowerCase().includes(q),
        );
      if (zip.trim())
        list = list.filter((r) =>
          String(r.address || "")
            .toLowerCase()
            .includes(zip.trim().toLowerCase()),
        );
      if (cuisine !== "All")
        list = list.filter((r) => r.cuisine_type === cuisine);
      if (price !== "Any") list = list.filter((r) => r.price_range === price);
      if (openNow) list = list.filter((r) => r.is_open);
      if (sort === "rating")
        list.sort((a, b) => b.average_rating - a.average_rating);
      if (sort === "review_count")
        list.sort((a, b) => b.review_count - a.review_count);
      setRestaurants(list);
      setTotal(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(
      `/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`,
    );
  };

  const currentQuery = searchParams.get("q");
  const slide = HERO_SLIDES[slideIdx];

  /* helper: left alignment value so dropdown and heading align with search bar */
  const HERO_PADDING = 32; // same padding we use for hero overlay
  const SEARCH_BAR_LEFT_OFFSET = 120; // tune this to match your logo width + spacing (adjust if needed)

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        margin: 0,
        background: "#fff",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",
        position: "relative",
      }}
    >
      {!currentQuery && (
        <div
          style={{
            position: "relative",
            width: "100%",
            minHeight: "580px",
            maxHeight: "780px",
            overflow: "hidden",
          }}
        >
          {/* background images (full-bleed) */}
          {HERO_SLIDES.map((s, i) => (
            <img
              key={i}
              src={s.image}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: i === slideIdx ? 1 : 0,
                transition: "opacity 1.2s ease",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.48)",
            }}
          />

          {/* top area: logo, search, links */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              padding: `0 ${HERO_PADDING}px`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: "64px",
                gap: "24px",
              }}
            >
              <Link
                to="/"
                style={{
                  textDecoration: "none",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  marginRight: "8px",
                }}
              >
                <YelpLogo />
              </Link>

              <form
                onSubmit={handleSearch}
                style={{
                  flex: 1,
                  maxWidth: "760px",
                  display: "flex",
                  height: "44px",
                  background: "#fff",
                  borderRadius: "4px",
                  overflow: "visible",
                  boxShadow: "0 1px 8px rgba(0,0,0,0.2)",
                  position: "relative",
                  zIndex: 300,
                }}
              >
                <div
                  style={{
                    flex: "1.5",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 14px",
                    gap: "10px",
                    borderRight: "1px solid #e0e0e0",
                    position: "relative",
                    zIndex: 300,
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#999"
                    strokeWidth="2.5"
                    style={{ flexShrink: 0 }}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <SearchAutocomplete
                    value={find}
                    onChange={(val) => setFind(val)}
                    onSelect={(val) => {
                      setFind(val);
                      navigate(
                        `/search?q=${encodeURIComponent(val || "Restaurants")}&loc=${encodeURIComponent(near || "")}`,
                      );
                    }}
                    placeholder="things to do, nail salons, plumbers"
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 14px",
                    gap: "10px",
                    position: "relative",
                    zIndex: 200,
                  }}
                >
                  <svg
                    width="12"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#999"
                    strokeWidth="2.5"
                    style={{ flexShrink: 0 }}
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  <CityAutocomplete
                    value={near}
                    onChange={(city) => setNear(city)}
                    placeholder="city..."
                    inputStyle={{
                      height: "30px",
                      border: "none",
                      borderRadius: "0",
                      padding: "0 4px",
                      fontSize: "15px",
                      background: "transparent",
                      boxShadow: "none",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    background: "#c60000",
                    border: "none",
                    cursor: "pointer",
                    width: "56px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#a50000")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#c60000")
                  }
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </form>

              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                  position: "relative",
                }}
                ref={userMenuRef}
              >
                {["Yelp for Business"].map((t) => (
                  <a
                    key={t}
                    href="#"
                    style={{
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: "600",
                      textDecoration: "none",
                      padding: "6px 10px",
                      whiteSpace: "nowrap",
                      opacity: 0.92,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.opacity = "0.92")
                    }
                  >
                    {t}
                  </a>
                ))}
                <button
                  onClick={() => navigate(user ? "/write-review" : "/login")}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "600",
                    padding: "6px 10px",
                    whiteSpace: "nowrap",
                    opacity: 0.92,
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.92")}
                >
                  Write a Review
                </button>

                {user && (
                  <Link
                    to="/add-restaurant"
                    style={{
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: "700",
                      textDecoration: "none",
                      padding: "6px 10px",
                      whiteSpace: "nowrap",
                      opacity: 0.95,
                    }}
                  >
                    Add Restaurant
                  </Link>
                )}

                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.9,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="1.8"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>

                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.9,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="1.8"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </button>

                {user ? (
                  <>
                    <button
                      onClick={() => setUserMenu((v) => !v)}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.35)",
                        background: "rgba(255,255,255,0.15)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: "13px",
                        overflow: "hidden",
                        padding: 0,
                      }}
                    >
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt="Profile"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        user.name
                          ?.split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      )}
                    </button>

                    {userMenu && (
                      <div
                        style={{
                          position: "absolute",
                          top: "48px",
                          right: 0,
                          width: "220px",
                          background: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: "10px",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.16)",
                          overflow: "hidden",
                          zIndex: 3000,
                        }}
                      >
                        <MenuRow
                          label="Profile"
                          onClick={() => {
                            setUserMenu(false);
                            navigate("/profile");
                          }}
                        />
                        <MenuRow
                          label="Add Restaurant"
                          onClick={() => {
                            setUserMenu(false);
                            navigate("/add-restaurant");
                          }}
                        />
                        <MenuRow
                          label="Favorites"
                          onClick={() => {
                            setUserMenu(false);
                            navigate("/favorites");
                          }}
                        />
                        <MenuRow
                          label="History"
                          onClick={() => {
                            setUserMenu(false);
                            navigate("/history");
                          }}
                        />
                        <div style={{ height: "1px", background: "#eee" }} />
                        <MenuRow
                          label="Log Out"
                          onClick={() => {
                            setUserMenu(false);
                            logout();
                            navigate("/login");
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate("/login")}
                      style={{
                        background: "transparent",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.7)",
                        borderRadius: "4px",
                        padding: "8px 14px",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Log In
                    </button>

                    <button
                      onClick={() => navigate("/signup")}
                      style={{
                        background: "#fff",
                        color: "#d32323",
                        border: "none",
                        borderRadius: "4px",
                        padding: "8px 14px",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Row 2: category bar */}
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                borderBottom: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div
                style={{ position: "relative" }}
                onMouseEnter={() => setRestOpen(true)}
                onMouseLeave={() => setRestOpen(false)}
              >
                {/* label + chevron */}
                {/* <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 129px", height: "42px", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#fff", fontFamily: "inherit", borderBottom: restOpen ? "2px solid #fff" : "2px solid transparent" }}>
                  Restaurants
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="#fff"><path d="M0 0l5 6 5-6z" /></svg>
                </button> */}

                {/* CUSTOM DROPDOWN (replaced) */}
                {restOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      width: 500,
                      background: "#fff",
                      borderRadius: 8,
                      boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
                      padding: "14px 18px",
                      borderTop: "4px solid #d32323",
                      zIndex: 2000,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        columnGap: 4,
                        rowGap: 8,
                      }}
                    >
                      {DROPDOWN_COLS.map((col, ci) => (
                        <div
                          key={ci}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          {col.map((item) => (
                            <button
                              key={item.label}
                              onClick={() => {
                                setRestOpen(false);
                                navigate(
                                  `/search?q=${encodeURIComponent(item.label)}&loc=${encodeURIComponent(near || "")}`,
                                );
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                background: "none",
                                border: "none",
                                padding: "2px 0",
                                fontSize: 13,
                                color: "#222",
                                cursor: "pointer",
                                textAlign: "left",
                                fontWeight: 600,
                                fontFamily: "inherit",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = "#d32323";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = "#222";
                              }}
                            >
                              <span
                                style={{
                                  width: 18,
                                  height: 18,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {item.icon}
                              </span>
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle-left heading: align with search bar by using padding + offset (tweak SEARCH_BAR_LEFT_OFFSET if you need exact) */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${HERO_PADDING + SEARCH_BAR_LEFT_OFFSET}px`,
              transform: "translateY(-50%)",
              zIndex: 20,
            }}
          >
            <div
              style={{ display: "flex", gap: "18px", alignItems: "flex-start" }}
            >
              <div>
                <h1
                  style={{
                    color: "#fff",
                    fontSize: "38px",
                    fontWeight: "800",
                    margin: "0 0 24px",
                    lineHeight: 1.1,
                    textShadow: "0 1px 8px rgba(0,0,0,0.35)",
                    whiteSpace: "pre-line",
                    maxWidth: "440px",
                  }}
                >
                  {slide.heading}
                </h1>
                <button
                  onClick={() => {
                    navigate(
                      `/search?q=${encodeURIComponent(slide.cta)}&loc=${encodeURIComponent(near || "")}`,
                    );
                  }}
                  style={{
                    background: "#c60000",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "11px 22px",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#a50000")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#c60000")
                  }
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  {slide.cta}
                </button>
              </div>
            </div>
          </div>

          {/* vertical dots indicator — aligned slightly left of the CTA to match screenshot */}
          <div
            style={{
              position: "absolute",
              left: `${HERO_PADDING + SEARCH_BAR_LEFT_OFFSET - 45}px`,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIdx(i)}
                style={{
                  width: "8px",
                  height: i === slideIdx ? 26 : 8,
                  borderRadius: 6,
                  border: "none",
                  background:
                    i === slideIdx ? "#fff" : "rgba(255,255,255,0.45)",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.28s",
                }}
              />
            ))}
          </div>

          {/* photo credit bottom-left */}
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: `${HERO_PADDING + SEARCH_BAR_LEFT_OFFSET}px`,
              zIndex: 110,
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: "12px",
                margin: 0,
                fontWeight: "500",
              }}
            >
              {slide.business}
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: "11px",
                margin: "2px 0 0",
              }}
            >
              Photo by{" "}
              <strong
                style={{ color: "rgba(255,255,255,0.75)", fontWeight: "600" }}
              >
                {slide.author}
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* --- the rest of the page (search results, recent activity, footer) unchanged --- */}
      {currentQuery && (
        <>
          <Navbar
            onSearch={({ find, near }) =>
              navigate(
                `/search?q=${encodeURIComponent(find || "Restaurants")}&loc=${encodeURIComponent(near || "")}`,
              )
            }
          />
          <div
            style={{
              maxWidth: "1080px",
              margin: "0 auto",
              padding: "0 24px 60px",
            }}
          >
            {/* search results header */}
            <div style={{ padding: "20px 0 4px" }}>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  margin: 0,
                  color: "#333",
                }}
              >
                Best {currentQuery} near{" "}
                <span style={{ fontWeight: "400", color: "#666" }}>
                  {searchParams.get("loc") || getUserLocation() || "your area"}
                </span>
              </h2>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 0",
                borderBottom: "1px solid #e8e8e8",
                flexWrap: "wrap",
                background: "#fff",
                position: "sticky",
                top: "104px",
                zIndex: 10,
              }}
            >
              <FSelect
                value={cuisine}
                onChange={(v) => {
                  setCuisine(v);
                  setPage(1);
                }}
                options={CUISINE_FILTERS}
              />
              <FSelect
                value={price}
                onChange={(v) => {
                  setPrice(v);
                  setPage(1);
                }}
                options={PRICE_FILTERS}
              />
              <SortSel
                value={sort}
                onChange={(v) => {
                  setSort(v);
                  setPage(1);
                }}
                options={SORT_OPTIONS}
              />
              <TogBtn
                active={openNow}
                onClick={() => setOpenNow(!openNow)}
                label="Open Now"
              />
              <input
                value={zip}
                onChange={(e) => {
                  const next = e.target.value
                    .replace(/[^\d-]/g, "")
                    .slice(0, 10);
                  setZip(next);
                  setPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const q = searchParams.get("q") || "Restaurants";
                    const loc = zip.trim() || searchParams.get("loc") || "";
                    setSearchParams({ q, loc });
                  }
                }}
                placeholder="ZIP"
                inputMode="numeric"
                style={{
                  height: "34px",
                  width: "92px",
                  padding: "0 10px",
                  borderRadius: "4px",
                  border: "1px solid #d0d0d0",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#333",
                  fontFamily: "inherit",
                }}
              />
              <span
                style={{ marginLeft: "auto", fontSize: "13px", color: "#666" }}
              >
                {loading ? "Searching…" : `${restaurants.length} results`}
              </span>
            </div>
            <div style={{ paddingTop: "8px" }}>
              <div style={{ minWidth: 0 }}>
                {loading ? (
                  <div
                    style={{
                      padding: "80px 0",
                      textAlign: "center",
                      color: "#ccc",
                    }}
                  >
                    <p>Finding restaurants…</p>
                  </div>
                ) : restaurants.length === 0 ? (
                  <div
                    style={{
                      padding: "80px 0",
                      textAlign: "center",
                      color: "#999",
                    }}
                  >
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                      🍽️
                    </div>
                    <p
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#555",
                      }}
                    >
                      No results found
                    </p>
                  </div>
                ) : (
                  <>
                    {restaurants.map((r, i) => (
                      <RestaurantCard key={r.id} restaurant={r} index={i} />
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {!currentQuery && (
        <div
          style={{
            maxWidth: "1080px",
            margin: "0 auto",
            padding: "44px 24px 52px",
          }}
        >
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "700",
              textAlign: "center",
              margin: "0 0 14px",
              color: "#333",
            }}
          >
            Recent Activity
          </h2>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              borderBottom: "1px solid #e8e8e8",
              marginBottom: "28px",
            }}
          >
            {["Nearby", "Friends", "Following"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActivityTab(tab)}
                style={{
                  padding: "10px 24px",
                  background: "none",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  color: activityTab === tab ? "#333" : "#999",
                  borderBottom:
                    activityTab === tab
                      ? "2px solid #c60000"
                      : "2px solid transparent",
                  fontFamily: "inherit",
                  marginBottom: "-1px",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
              gap: "20px",
            }}
          >
            {RECENT_ACTIVITY.map((item, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid #e8e8e8",
                  borderRadius: "8px",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(0,0,0,0.1)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div style={{ height: "180px", overflow: "hidden" }}>
                  <img
                    src={item.img}
                    alt={item.target}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div
                  style={{
                    padding: "12px 14px",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: item.color,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: "700",
                    }}
                  >
                    {item.avatar}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "13px", color: "#333" }}>
                      <strong>{item.user}</strong> {item.action}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "13px",
                        color: "#0073bb",
                        fontWeight: "600",
                      }}
                    >
                      {item.target}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "12px",
                        color: "#999",
                      }}
                    >
                      {item.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!currentQuery && (
        <div
          style={{
            position: "fixed",
            right: "24px",
            top: "430px",
            width: "345px",
            minHeight: "500px",
            zIndex: 300,
          }}
        >
          <ChatPanel />
        </div>
      )}

      <Footer />
    </div>
  );
}

/* ---------- helpers (unchanged) ---------- */
const ddBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23666' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E") no-repeat right 10px center`;
function FSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "7px 30px 7px 12px",
        borderRadius: "4px",
        border: "1px solid #d0d0d0",
        background: `#fff ${ddBg}`,
        fontSize: "14px",
        fontWeight: "600",
        color: "#333",
        cursor: "pointer",
        fontFamily: "inherit",
        appearance: "none",
      }}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
function SortSel({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "7px 30px 7px 12px",
        borderRadius: "4px",
        border: "1px solid #d0d0d0",
        background: `#fff ${ddBg}`,
        fontSize: "14px",
        fontWeight: "600",
        color: "#333",
        cursor: "pointer",
        fontFamily: "inherit",
        appearance: "none",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
function TogBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 16px",
        borderRadius: "4px",
        border: `1px solid ${active ? "#c60000" : "#d0d0d0"}`,
        background: active ? "#fff5f5" : "#fff",
        color: active ? "#c60000" : "#555",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {active ? "✓ " : ""}
      {label}
    </button>
  );
}
function MenuRow({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: "none",
        background: "#fff",
        textAlign: "left",
        padding: "13px 15px",
        fontSize: "14px",
        color: "#333",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f7f7f7";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#fff";
      }}
    >
      {label}
    </button>
  );
}
function YelpLogo() {
  return (
    <svg width="88" height="36" viewBox="0 0 88 36" fill="none">
      <text
        x="0"
        y="30"
        fontFamily="Georgia,'Times New Roman',serif"
        fontSize="32"
        fontWeight="700"
        fill="#fff"
        letterSpacing="-1"
      >
        yelp
      </text>
      <g transform="translate(74,14)">
        {[0, 72, 144, 216, 288].map((d, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-7"
            rx="3.5"
            ry="7.5"
            fill="#fff"
            transform={`rotate(${d})`}
          />
        ))}
        <circle cx="0" cy="0" r="3.2" fill="#fff" />
      </g>
    </svg>
  );
}

function Footer() {
  const cols = [
    {
      title: "About",
      links: [
        "About Yelp",
        "Press",
        "Investor Relations",
        "Trust & Safety",
        "Content Guidelines",
      ],
    },
    {
      title: "Discover",
      links: [
        "The Local Yelp",
        "Yelp Blog",
        "Support",
        "Yelp Mobile",
        "Developers",
      ],
    },
    {
      title: "Yelp for Business",
      links: [
        "Claim your Business Page",
        "Advertise on Yelp",
        "Yelp for Business Owners",
      ],
    },
    {
      title: "Languages",
      links: ["English", "Español", "Français", "Deutsch", "中文", "日本語"],
    },
  ];
  return (
    <footer
      style={{
        background: "#f7f7f7",
        borderTop: "1px solid #e8e8e8",
        padding: "44px 24px 28px",
        marginTop: "8px",
      }}
    >
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: "32px",
            marginBottom: "36px",
          }}
        >
          {cols.map((col) => (
            <div key={col.title}>
              <h4
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#333",
                  marginBottom: "14px",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                {col.title}
              </h4>
              {col.links.map((l) => (
                <a
                  key={l}
                  href="#"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: "9px",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#333")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
                >
                  {l}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: "1px solid #e0e0e0",
            paddingTop: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <span
            style={{
              fontSize: "26px",
              fontWeight: "700",
              color: "#d32323",
              fontFamily: "Georgia,serif",
              letterSpacing: "-1px",
            }}
          >
            yelp
          </span>
          <span style={{ fontSize: "13px", color: "#999" }}>
            © 2025 Yelp Inc. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
