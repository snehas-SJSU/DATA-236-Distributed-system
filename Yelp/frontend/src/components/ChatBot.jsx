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

export default function ChatBot({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your Yelp AI assistant. Tell me what you're craving or what kind of dining experience you're looking for, and I'll find the perfect restaurants for you! 🍽️",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const userMsg = { role: "user", content: userText, timestamp: new Date() };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      const res = await chatAPI.sendMessage({
        message: userText,
        conversation_history: messages.map(m => ({ role: m.role, content: m.content })),
      });
      const aiContent = res.data.response || res.data.message || "Here are my recommendations!";
      const restaurants = res.data.restaurants || [];
      setMessages(prev => [...prev, {
        role: "assistant",
        content: aiContent,
        restaurants,
        timestamp: new Date(),
      }]);
    } catch {
      // Mock response when backend not connected
      const mockResponse = getMockResponse(userText);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: mockResponse.text,
        restaurants: mockResponse.restaurants,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Chat cleared! What are you looking for today? 🍽️",
      timestamp: new Date(),
    }]);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
      padding: "0 28px 28px 0",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{
        width: "400px", height: "600px", background: "#fff",
        borderRadius: "12px", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        overflow: "hidden",
        animation: "slideUp 0.25s ease",
      }}>

        {/* ── Header ── */}
        <div style={{
          background: "linear-gradient(135deg, #1a1a2e, #16213e)",
          padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px",
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "linear-gradient(135deg, #c60000, #ff4444)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
          }}>✨</div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontWeight: "700", fontSize: "14px", margin: 0 }}>Yelp AI Assistant</p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: 0 }}>
              {loading ? "Thinking…" : "Online · Ready to help"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button onClick={clearChat} title="Clear chat" style={{
              background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)",
              width: "28px", height: "28px", borderRadius: "4px", cursor: "pointer", fontSize: "14px",
            }}>↺</button>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)",
              width: "28px", height: "28px", borderRadius: "4px", cursor: "pointer", fontSize: "16px",
            }}>✕</button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: "8px" }}>
              <div style={{
                maxWidth: "85%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user" ? "#c60000" : "#f5f5f5",
                color: msg.role === "user" ? "#fff" : "#333",
                fontSize: "14px", lineHeight: 1.55,
              }}>
                {msg.content}
              </div>

              {/* Restaurant cards in response */}
              {msg.restaurants?.length > 0 && (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {msg.restaurants.map((r, ri) => (
                    <Link key={ri} to={`/restaurant/${r.id}`} style={{ textDecoration: "none" }}>
                      <div style={{
                        background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px",
                        padding: "10px 12px", display: "flex", gap: "10px", alignItems: "center",
                        cursor: "pointer",
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#c60000"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#e8e8e8"}
                      >
                        <div style={{
                          width: "44px", height: "44px", borderRadius: "6px", background: "#f5f5f5",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0,
                        }}>
                          {r.emoji || "🍽️"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: "700", color: "#0073bb", margin: "0 0 2px" }}>{r.name}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "12px", color: "#f15c4f" }}>{"★".repeat(Math.round(r.average_rating || 0))}</span>
                            <span style={{ fontSize: "12px", color: "#999" }}>{r.average_rating?.toFixed(1)} · {r.price_range}</span>
                          </div>
                          <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>{r.cuisine_type}</p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <span style={{ fontSize: "11px", color: "#bbb" }}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}

          {/* Loading dots */}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <div style={{
                background: "#f5f5f5", padding: "10px 16px", borderRadius: "16px 16px 16px 4px",
                display: "flex", gap: "4px", alignItems: "center",
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: "7px", height: "7px", borderRadius: "50%", background: "#bbb",
                    animation: `bounce 1.2s ${i*0.2}s infinite`,
                  }}/>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {/* ── Quick actions ── */}
        {messages.length <= 1 && (
          <div style={{ padding: "0 16px 8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {QUICK_ACTIONS.map(q => (
              <button key={q} onClick={() => sendMessage(q)} style={{
                fontSize: "12px", padding: "5px 10px", borderRadius: "16px",
                border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer",
                color: "#555", fontFamily: "inherit", whiteSpace: "nowrap",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#c60000"; e.currentTarget.style.color = "#c60000"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#555"; }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* ── Input ── */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #f0f0f0", display: "flex", gap: "8px" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about restaurants…"
            disabled={loading}
            style={{
              flex: 1, border: "1px solid #e0e0e0", borderRadius: "24px",
              padding: "9px 16px", fontSize: "14px", fontFamily: "inherit",
              outline: "none", color: "#333", background: "#f9f9f9",
            }}
            onFocus={e => { e.target.style.borderColor = "#c60000"; e.target.style.background = "#fff"; }}
            onBlur={e => { e.target.style.borderColor = "#e0e0e0"; e.target.style.background = "#f9f9f9"; }}
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{
            width: "38px", height: "38px", borderRadius: "50%",
            background: input.trim() ? "#c60000" : "#e0e0e0",
            border: "none", cursor: input.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%,80%,100% { transform: translateY(0); }
          40%          { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

/* Mock AI response for demo */
function getMockResponse(query) {
  const q = query.toLowerCase();
  if (q.includes("vegan") || q.includes("vegetarian")) {
    return {
      text: "Based on your query, here are some great plant-based options nearby! 🌿",
      restaurants: [
        { id: 7, name: "Green Bowl Vegan", average_rating: 4.6, price_range: "$", cuisine_type: "Vegan", emoji: "🥗" },
      ],
    };
  }
  if (q.includes("romantic") || q.includes("date") || q.includes("anniversary")) {
    return {
      text: "For a romantic evening, I'd recommend these highly-rated spots with great ambiance: 🕯️",
      restaurants: [
        { id: 3, name: "Iron & Grill Steakhouse", average_rating: 4.9, price_range: "$$$", cuisine_type: "American", emoji: "🥩" },
        { id: 8, name: "Pasta Milano", average_rating: 4.8, price_range: "$$$", cuisine_type: "Italian", emoji: "🍕" },
      ],
    };
  }
  if (q.includes("cheap") || q.includes("budget") || q.includes("affordable")) {
    return {
      text: "Here are some delicious budget-friendly options: 💰",
      restaurants: [
        { id: 2, name: "Casa Fuego Mexican", average_rating: 4.7, price_range: "$", cuisine_type: "Mexican", emoji: "🌮" },
        { id: 4, name: "Blue Leaf Coffee", average_rating: 4.6, price_range: "$", cuisine_type: "Coffee & Tea", emoji: "☕" },
      ],
    };
  }
  return {
    text: `Great choice! Based on your request for "${query}", here are my top picks nearby: 🌟`,
    restaurants: [
      { id: 1, name: "The Golden Fork", average_rating: 4.8, price_range: "$$", cuisine_type: "Italian", emoji: "🍝" },
      { id: 5, name: "Sakura Japanese", average_rating: 4.7, price_range: "$$", cuisine_type: "Japanese", emoji: "🍣" },
    ],
  };
}
