import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { aiAPI } from "../services/api";

/* -------------------------------------------------------
   Quick prompts shown when chat is empty
-------------------------------------------------------- */
const QUICK_ACTIONS = [
  "Find dinner tonight",
  "Best rated near me",
  "Vegan options",
];

export default function ChatPanel() {
  const navigate = useNavigate();

  /* -------------------------------------------------------
     Chat state
  -------------------------------------------------------- */
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* -------------------------------------------------------
     Send a message to the AI assistant
     - supports both form submit and quick action click
     - stores recommendations inside the assistant message
  -------------------------------------------------------- */
  const sendMessage = async (eOrText) => {
    if (typeof eOrText !== "string") {
      eOrText?.preventDefault?.();
    }

    const textToSend = typeof eOrText === "string" ? eOrText : message.trim();

    if (!textToSend) return;

    const userMessage = {
      role: "user",
      content: textToSend,
    };

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
        content: res.data.reply,
        recommendations: res.data.recommendations || [],
      };

      setHistory([...nextHistory, assistantMessage]);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not get AI response");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------
     Clear the whole chat
  -------------------------------------------------------- */
  const clearChat = () => {
    setHistory([]);
    setMessage("");
    setError("");
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e5e5",
        borderRadius: "14px",
        padding: "18px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        height: "540px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* -------------------------------------------------------
         Header
      -------------------------------------------------------- */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "14px",
          flexShrink: 0,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: "800",
              color: "#222",
            }}
          >
            Sparky 🤖
          </h3>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "13px",
              color: "#777",
            }}
          >
            Ask for restaurants by cuisine, vibe, price, or dietary needs.
          </p>
        </div>

        <button
          aria-label="Clear chat"
          onClick={clearChat}
          style={{
            background: "#fff",
            border: "1px solid #d6d6d6",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Clear Chat
        </button>
      </div>

      {/* -------------------------------------------------------
         Chat history area
      -------------------------------------------------------- */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid #efefef",
          borderRadius: "10px",
          padding: "12px",
          background: "#fafafa",
          marginBottom: "14px",
          minHeight: 0,
        }}
      >
        {history.length === 0 ? (
          <div style={{ color: "#888", fontSize: "14px", lineHeight: 1.6 }}>
            Try asking:
            <div style={{ marginTop: "8px" }}>• I want Italian food</div>
            <div>• Show me vegan options</div>
            <div>• I want something casual</div>
          </div>
        ) : (
          history.map((item, index) => (
            <div key={index} style={{ marginBottom: "14px" }}>
              {/* -------------------------------
                 Message bubble
              -------------------------------- */}
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    item.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    background: item.role === "user" ? "#d32323" : "#fff",
                    color: item.role === "user" ? "#fff" : "#333",
                    border: item.role === "user" ? "none" : "1px solid #e3e3e3",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    fontSize: "14px",
                    lineHeight: 1.5,
                    boxShadow:
                      item.role === "user"
                        ? "none"
                        : "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  {item.content}
                </div>
              </div>

              {/* -------------------------------
                 Recommendation cards
                 These now stay attached to the
                 assistant message they belong to
              -------------------------------- */}
              {item.role === "assistant" &&
                item.recommendations?.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "800",
                        color: "#333",
                        marginBottom: "10px",
                      }}
                    >
                      Recommendations
                    </div>

                    <div style={{ display: "grid", gap: "10px" }}>
                      {item.recommendations.map((restaurant) => (
                        <button
                          key={restaurant.id}
                          aria-label={`Open restaurant ${restaurant.name}`}
                          onClick={() =>
                            navigate(`/restaurant/${restaurant.id}`)
                          }
                          style={{
                            textAlign: "left",
                            background: "#fff",
                            border: "1px solid #e5e5e5",
                            borderRadius: "10px",
                            padding: "12px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "800",
                              color: "#0073bb",
                              marginBottom: "4px",
                            }}
                          >
                            {restaurant.name}
                          </div>

                          <div
                            style={{
                              fontSize: "13px",
                              color: "#666",
                              marginBottom: "6px",
                            }}
                          >
                            {restaurant.cuisine_type} • {restaurant.city} •{" "}
                            {restaurant.price_range || "N/A"}
                          </div>

                          <div
                            style={{
                              fontSize: "13px",
                              color: "#444",
                              marginBottom: "4px",
                            }}
                          >
                            Rating: {restaurant.average_rating ?? 0}
                          </div>

                          <div
                            style={{
                              fontSize: "13px",
                              color: "#777",
                            }}
                          >
                            Why: {restaurant.reason}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ))
        )}

        {/* -------------------------------------------------------
           Loading + error state
        -------------------------------------------------------- */}
        {loading && (
          <div style={{ color: "#999", fontSize: "14px" }}>Thinking...</div>
        )}

        {error && (
          <div style={{ color: "#b91c1c", fontSize: "14px", marginTop: "8px" }}>
            {error}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------
         Quick actions only when chat is empty
      -------------------------------------------------------- */}
      {history.length === 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "12px",
            flexShrink: 0,
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => sendMessage(action)}
              style={{
                background: "#fff",
                border: "1px solid #d6d6d6",
                borderRadius: "999px",
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#555",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* -------------------------------------------------------
         Input area
      -------------------------------------------------------- */}
      <form
        onSubmit={sendMessage}
        style={{ display: "flex", gap: "10px", flexShrink: 0 }}
      >
        <input
          aria-label="Ask for restaurant recommendations"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask for restaurant recommendations..."
          style={{
            flex: 1,
            height: "44px",
            borderRadius: "10px",
            border: "1px solid #d6d6d6",
            padding: "0 14px",
            fontSize: "14px",
            fontFamily: "inherit",
            outline: "none",
          }}
        />

        <button
          aria-label="Send message"
          type="submit"
          disabled={loading}
          style={{
            background: "#d32323",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "0 18px",
            fontSize: "14px",
            fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            fontFamily: "inherit",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
