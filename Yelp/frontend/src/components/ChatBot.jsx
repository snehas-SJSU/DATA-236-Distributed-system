import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { chatAPI } from "../services/api";

const QUICK_ACTIONS = [
  "Find dinner tonight 🍽️",
  "Best rated near me ⭐",
  "Vegan options 🥗",
  "Romantic dinner for 2 💑",
  "Cheap eats under $15 💰",
];

const DEFAULT_RESTAURANT_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";

export default function ChatBot({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm Sparky. Tell me what you're craving, and I’ll help you find the right restaurant. 🍽️",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput("");

    const userMsg = {
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chatAPI.sendMessage({
        message: userText,
        conversation_history: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      // Support your real backend response shape first, while keeping fallback compatibility.
      const aiContent =
        res.data.reply ||
        res.data.response ||
        res.data.message ||
        "Here are my recommendations!";

      const restaurants =
        res.data.recommendations || res.data.restaurants || [];

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiContent,
          restaurants,
          timestamp: new Date(),
        },
      ]);
    } catch {
      const mockResponse = getMockResponse(userText);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: mockResponse.text,
          restaurants: mockResponse.restaurants,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared. What would you like to find next? 🍽️",
        timestamp: new Date(),
      },
    ]);
    setInput("");
    inputRef.current?.focus();
  };

  const getRestaurantImage = (restaurant) => {
    if (restaurant?.photos?.length > 0) {
      return restaurant.photos[0];
    }

    if (restaurant?.image) {
      return restaurant.image;
    }

    return DEFAULT_RESTAURANT_IMAGE;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.18)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        padding: "0 28px 28px 0",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "420px",
          height: "600px",
          background: "#f7f7f7",
          borderRadius: "22px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 22px 60px rgba(0,0,0,0.22)",
          overflow: "hidden",
          animation: "slideUp 0.25s ease",
          border: "1px solid #ececec",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#c43a31",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
            }}
          >
            🤖
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                color: "#fff",
                fontWeight: "800",
                fontSize: "15px",
                margin: 0,
              }}
            >
              Sparky
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: "12px",
                margin: 0,
              }}
            >
              {loading ? "Thinking..." : "Your restaurant discovery assistant"}
            </p>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={clearChat}
              title="Clear chat"
              style={{
                background: "rgba(255,255,255,0.14)",
                border: "none",
                color: "#fff",
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ↺
            </button>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.14)",
                border: "none",
                color: "#fff",
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            background: "#f7f7f7",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                gap: "8px",
              }}
            >
              <div
                style={{
                  maxWidth: "88%",
                  padding: "12px 15px",
                  borderRadius:
                    msg.role === "user"
                      ? "18px 18px 6px 18px"
                      : "18px 18px 18px 6px",
                  background: msg.role === "user" ? "#c43a31" : "#ffffff",
                  color: msg.role === "user" ? "#fff" : "#333",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  boxShadow:
                    msg.role === "user"
                      ? "none"
                      : "0 4px 14px rgba(0,0,0,0.05)",
                  border: msg.role === "user" ? "none" : "1px solid #efefef",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg.content}
              </div>

              {msg.restaurants?.length > 0 && (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {msg.restaurants.map((r, ri) => (
                    <Link
                      key={ri}
                      to={`/restaurant/${r.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        style={{
                          background: "#fff",
                          border: "1px solid #e8e8e8",
                          borderRadius: "14px",
                          padding: "12px",
                          display: "flex",
                          gap: "12px",
                          alignItems: "center",
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                          transition: "border-color 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#c43a31";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e8e8e8";
                        }}
                      >
                        <img
                          src={getRestaurantImage(r)}
                          alt={r.name}
                          style={{
                            width: "70px",
                            height: "70px",
                            borderRadius: "12px",
                            objectFit: "cover",
                            flexShrink: 0,
                            background: "#f1f1f1",
                          }}
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_RESTAURANT_IMAGE;
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: "14px",
                              fontWeight: "800",
                              color: "#0073bb",
                              margin: "0 0 4px",
                              wordBreak: "break-word",
                            }}
                          >
                            {r.name}
                          </p>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              flexWrap: "wrap",
                              marginBottom: "4px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#f15c4f",
                              }}
                            >
                              {"★".repeat(Math.round(r.average_rating || 0))}
                            </span>

                            <span
                              style={{
                                fontSize: "12px",
                                color: "#777",
                              }}
                            >
                              {r.average_rating?.toFixed?.(1) || "0.0"} ·{" "}
                              {r.price_range || "N/A"}
                            </span>
                          </div>

                          <p
                            style={{
                              fontSize: "12px",
                              color: "#888",
                              margin: "0 0 3px",
                            }}
                          >
                            {r.cuisine_type}
                            {r.city ? ` · ${r.city}` : ""}
                          </p>

                          {r.reason && (
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#666",
                                margin: 0,
                                lineHeight: 1.45,
                                wordBreak: "break-word",
                              }}
                            >
                              {r.reason}
                            </p>
                          )}
                        </div>

                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#ccc"
                          strokeWidth="2"
                          style={{ flexShrink: 0 }}
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <span style={{ fontSize: "11px", color: "#bbb" }}>
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <div
                style={{
                  background: "#ffffff",
                  padding: "12px 16px",
                  borderRadius: "18px 18px 18px 6px",
                  display: "flex",
                  gap: "5px",
                  alignItems: "center",
                  border: "1px solid #efefef",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "#bbb",
                      animation: `bounce 1.2s ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        <div
          style={{
            padding: "0 16px 10px",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            background: "#f7f7f7",
          }}
        >
          {QUICK_ACTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              style={{
                fontSize: "12px",
                padding: "7px 12px",
                borderRadius: "18px",
                border: "1px solid #e0e0e0",
                background: "#fff",
                cursor: "pointer",
                color: "#555",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                fontWeight: "600",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#c43a31";
                e.currentTarget.style.color = "#c43a31";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e0e0e0";
                e.currentTarget.style.color = "#555";
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div
          style={{
            padding: "12px 16px 16px",
            borderTop: "1px solid #ececec",
            display: "flex",
            gap: "8px",
            background: "#fff",
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about restaurants..."
            disabled={loading}
            style={{
              flex: 1,
              border: "1px solid #e0e0e0",
              borderRadius: "18px",
              padding: "12px 14px",
              fontSize: "14px",
              fontFamily: "inherit",
              outline: "none",
              color: "#333",
              background: "#fafafa",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#c43a31";
              e.target.style.background = "#fff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e0e0e0";
              e.target.style.background = "#fafafa";
            }}
          />

          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              minWidth: "78px",
              height: "46px",
              borderRadius: "16px",
              background: input.trim() ? "#c43a31" : "#e0e0e0",
              border: "none",
              cursor: input.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#fff",
              fontSize: "14px",
              fontWeight: "700",
              fontFamily: "inherit",
            }}
          >
            Send
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

function getMockResponse(query) {
  // Fallback used only when the AI API is unreachable.
  // Returns no restaurant cards to avoid broken navigation from stale IDs.
  return {
    text: "I'm having trouble connecting right now. Please try again in a moment! 🔄",
    restaurants: [],
  };
}
