import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { aiAPI, toAbsoluteMediaUrl } from "../services/api";

const QUICK_ACTIONS = [
  "Find dinner tonight",
  "Best rated near me",
  "Vegan options",
];

const DEFAULT_RESTAURANT_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";

function decorateAssistantReply(text = "") {
  const lower = text.toLowerCase();
  if (lower.includes("romantic anniversary")) return `${text} ❤️`;
  if (lower.includes("romantic dinner")) return `${text} 🌹`;
  if (lower.includes("vegan-friendly")) return `${text} 🥗`;
  if (lower.includes("affordable")) return `${text} 💸`;
  if (lower.includes("tonight")) return `${text} 🌙`;
  if (lower.includes("right now")) return `${text} ⏰`;
  return text;
}

function getRecommendationId(restaurant) {
  return restaurant?.id || restaurant?.restaurant_id || restaurant?._id || null;
}

export default function ChatPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const storageKey = `sparky_chat_${user?.id || "guest"}`;
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);

  // ✅ sessionStorage — chat persists per user
  const [history, setHistory] = useState(() => {
    try {
      // Try to get user id from localStorage directly for init
      const storedUser = localStorage.getItem("user");
      const userId = storedUser ? JSON.parse(storedUser)?.id : "guest";
      const key = `sparky_chat_${userId || "guest"}`;
      const saved = sessionStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // ✅ Save to sessionStorage whenever history changes
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(history));
    } catch {
      // storage full or unavailable — ignore
    }
  }, [history, storageKey]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [history, loading, error]);

  const isSmallScreen = windowWidth < 640;
  const isMediumScreen = windowWidth < 900;

  const sendMessage = async (eOrText) => {
    if (typeof eOrText !== "string") eOrText?.preventDefault?.();
    const textToSend = typeof eOrText === "string" ? eOrText : message.trim();
    if (!textToSend || loading) return;

    const userMessage = { role: "user", content: textToSend };
    const nextHistory = [...history, userMessage];

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await aiAPI.chat({
        message: textToSend,
        conversation_history: history,
      });

      const assistantMessage = {
        role: "assistant",
        content: decorateAssistantReply(res.data.reply || ""),
        recommendations: res.data.recommendations || [],
      };

      setHistory([...nextHistory, assistantMessage]);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not get AI response");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // ✅ Clear chat + sessionStorage
  const clearChat = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {}
    setHistory([]);
    setMessage("");
    setError("");
    inputRef.current?.focus();
  };

  const renderAssistantEmptyState = () => (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "999px",
          background: "#f3e3e1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        🌟
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #dfe3eb",
            borderRadius: "16px",
            padding: "12px 14px",
            marginBottom: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              lineHeight: 1.4,
              color: "#273142",
              fontWeight: "700",
            }}
          >
            Hi! I'm{" "}
            <span style={{ color: "#c43a31", fontWeight: "800" }}>
              Sparky🌟
            </span>{" "}
            How can I help you find a restaurant?
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #dfe3eb",
            borderRadius: "16px",
            padding: "12px 14px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#7b8698",
              fontWeight: "700",
              marginBottom: "6px",
            }}
          >
            Try asking me:
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#c43a31",
              lineHeight: 1.5,
              fontWeight: "600",
            }}
          >
            "Find me a cozy Italian restaurant"
            <br />
            "Something romantic for dinner"
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: "#f5f6f8",
        border: "1px solid #ececec",
        borderRadius: isSmallScreen ? "16px" : "20px",
        boxShadow: "0 16px 36px rgba(0,0,0,0.10)",
        height: isSmallScreen ? "480px" : isMediumScreen ? "500px" : "520px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: "#c43a31",
          padding: isSmallScreen ? "12px 14px" : "14px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: isSmallScreen ? "36px" : "40px",
              height: isSmallScreen ? "36px" : "40px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isSmallScreen ? "18px" : "20px",
              flexShrink: 0,
            }}
          >
            🌟
          </div>
          <div>
            <h3
              id="sparky-chat-heading"
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: "800",
                color: "#fff",
                lineHeight: 1.1,
              }}
            >
              Sparky
            </h3>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "11px",
                color: "rgba(255,255,255,0.88)",
                lineHeight: 1.3,
                fontWeight: "500",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "140px",
              }}
            >
              AI restaurant assistant
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Clear chat"
          onClick={clearChat}
          style={{
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.20)",
            color: "#fff",
            borderRadius: "10px",
            padding: isSmallScreen ? "7px 10px" : "8px 12px",
            fontSize: isSmallScreen ? "11px" : "12px",
            fontWeight: "700",
            cursor: "pointer",
            fontFamily: "inherit",
            lineHeight: 1.2,
          }}
        >
          Clear
          <br />
          Chat
        </button>
      </div>

      {/* ── Chat body ── */}
      <div
        ref={chatBodyRef}
        role="log"
        aria-live="polite"
        aria-labelledby="sparky-chat-heading"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: isSmallScreen ? "12px" : "14px",
          background: "#f5f6f8",
          minHeight: 0,
        }}
      >
        {history.length === 0
          ? renderAssistantEmptyState()
          : history.map((item, index) => (
              <div key={index} style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      item.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: isSmallScreen ? "92%" : "84%",
                      background: item.role === "user" ? "#c43a31" : "#fff",
                      color: item.role === "user" ? "#fff" : "#273142",
                      border:
                        item.role === "user" ? "none" : "1px solid #dfe3eb",
                      borderRadius:
                        item.role === "user"
                          ? "18px 18px 6px 18px"
                          : "18px 18px 18px 6px",
                      padding: isSmallScreen ? "10px 13px" : "11px 14px",
                      fontSize: isSmallScreen ? "13px" : "13px",
                      lineHeight: 1.5,
                      whiteSpace: "pre-line",
                      boxShadow:
                        item.role === "user"
                          ? "none"
                          : "0 2px 8px rgba(0,0,0,0.03)",
                      wordBreak: "break-word",
                      fontWeight: item.role === "user" ? "600" : "500",
                    }}
                  >
                    {item.content}
                  </div>
                </div>

                {/* Restaurant recommendation cards */}
                {item.role === "assistant" &&
                  item.recommendations?.length > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "800",
                          color: "#333",
                          marginBottom: "8px",
                        }}
                      >
                        Recommendations
                      </div>

                      <div style={{ display: "grid", gap: "8px" }}>
                        {item.recommendations.map((restaurant) => {
                          const restaurantId = getRecommendationId(restaurant);
                          const cardImage =
                            toAbsoluteMediaUrl(restaurant.photos?.[0]) ||
                            toAbsoluteMediaUrl(restaurant.image) ||
                            restaurant.image ||
                            DEFAULT_RESTAURANT_IMAGE;
                          return (
                            <button
                              key={restaurantId || restaurant.name}
                              type="button"
                              onClick={() => {
                                if (!restaurantId) return;
                                navigate(`/restaurant/${restaurantId}`);
                              }}
                              style={{
                                textAlign: "left",
                                background: "#fff",
                                border: "1px solid #e6e6e6",
                                borderRadius: "12px",
                                padding: "10px",
                                cursor: "pointer",
                                fontFamily: "inherit",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                                opacity: restaurantId ? 1 : 0.65,
                              }}
                              disabled={!restaurantId}
                              title={
                                restaurantId
                                  ? "Open restaurant details"
                                  : "Restaurant details unavailable"
                              }
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "10px",
                                }}
                              >
                                <div
                                  style={{
                                    width: isSmallScreen ? "54px" : "60px",
                                    height: isSmallScreen ? "54px" : "60px",
                                    borderRadius: "10px",
                                    overflow: "hidden",
                                    flexShrink: 0,
                                    background: "#f4f4f4",
                                  }}
                                >
                                  <img
                                    src={cardImage}
                                    alt={restaurant.name}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      display: "block",
                                    }}
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        DEFAULT_RESTAURANT_IMAGE;
                                    }}
                                  />
                                </div>

                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: "800",
                                      color: "#0073bb",
                                      marginBottom: "3px",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {restaurant.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#666",
                                      marginBottom: "3px",
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    {restaurant.cuisine_type} ·{" "}
                                    {restaurant.city} ·{" "}
                                    {restaurant.price_range || "N/A"}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#444",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    ⭐ {restaurant.average_rating ?? 0}
                                  </div>
                                  {restaurant.reason && (
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        color: "#777",
                                        lineHeight: 1.4,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {restaurant.reason}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            ))}

        {loading && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#fff",
              border: "1px solid #dfe3eb",
              borderRadius: "14px",
              padding: "9px 12px",
              color: "#777",
              fontSize: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            Thinking... 🤔
          </div>
        )}

        {error && (
          <div
            style={{
              color: "#b91c1c",
              fontSize: "12px",
              marginTop: "8px",
              background: "#fff",
              border: "1px solid #f3d2d2",
              borderRadius: "12px",
              padding: "9px 11px",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Quick action chips — just above input bar */}
      {(
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            padding: "10px 14px 8px",
            flexShrink: 0,
            background: "#f5f6f8",
            borderTop: "1px solid #ececec",
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => sendMessage(action)}
              disabled={loading}
              style={{
                background: "#fff",
                border: "1px solid #d6dce5",
                borderRadius: "999px",
                padding: "7px 11px",
                fontSize: "11px",
                fontWeight: "600",
                color: loading ? "#aaa" : "#4f5968",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* input bar */}
      <form
        onSubmit={sendMessage}
        style={{
          display: "flex",
          gap: "10px",
          flexShrink: 0,
          padding: "12px 14px 14px",
          background: "#fff",
          borderTop: "1px solid #ececec",
        }}
      >
        <input
          ref={inputRef}
          aria-label="Ask for restaurant recommendations"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask Sparky anything..."
          style={{
            flex: 1,
            height: "40px",
            borderRadius: "20px",
            border: "1px solid #d8dee8",
            padding: "0 14px",
            fontSize: "13px",
            fontFamily: "inherit",
            outline: "none",
            minWidth: 0,
            background: "#f8f9fb",
            color: "#333",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#c43a31",
            color: "#fff",
            border: "none",
            borderRadius: "20px",
            minWidth: "70px",
            padding: "0 16px",
            fontSize: "13px",
            fontWeight: "800",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            fontFamily: "inherit",
            flexShrink: 0,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
