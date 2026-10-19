"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, BookOpen, Zap, Maximize2 } from "lucide-react";
import Link from "next/link";

interface Citation {
  courseCode: string;
  sourceType: string;
  title: string;
}

interface MessageItem {
  sender: "ai" | "user";
  text: string;
  citations?: Citation[];
  isCacheHit?: boolean;
}

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const fetchQuota = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const res = await fetch("http://localhost:3001/ai/copilot/usage", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRemainingQuota(data.remainingQueries);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Say hello when opened first time
  useEffect(() => {
    if (isOpen) {
      fetchQuota();
      if (messages.length === 0) {
        setMessages([
          {
            sender: "ai",
            text: "Hi! I am your AI Study Copilot, grounded in your enrolled course syllabi, slides, and rubrics. How can I help you study today?",
          },
        ]);
      }
    }
  }, [isOpen, messages]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const msg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: msg }]);
    setIsTyping(true);

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:3001/ai/copilot/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: msg, courseCode: "CS301" }),
      });

      if (res.status === 429) {
        const errData = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `⚠️ Rate limit reached: ${errData.message || "Daily query limit exceeded"}.`,
          },
        ]);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.answer,
            citations: data.citations,
            isCacheHit: data.isCacheHit,
          },
        ]);
        if (typeof data.remainingQueries === "number") {
          setRemainingQuota(data.remainingQueries);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "I encountered an issue searching the course vector index. Please try again." },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Unable to reach AI copilot service." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          className="ai-copilot-trigger"
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            border: "none",
            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 1000,
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="ai-copilot-window"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 380,
            height: 530,
            borderRadius: 18,
            background: "var(--bg-primary, #ffffff)",
            border: "1px solid var(--border-primary, rgba(226, 232, 240, 0.9))",
            boxShadow: "0 14px 44px rgba(0,0,0,0.18)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Bot size={20} />
              <div>
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>AI Study Copilot</span>
                {remainingQuota !== null && (
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.72rem",
                      opacity: 0.9,
                    }}
                  >
                    {remainingQuota} daily queries remaining
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link
                href="/dashboard/copilot"
                title="Open Full Copilot Studio"
                style={{
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <Maximize2 size={16} />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                }}
              >
                {m.sender === "ai" && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      background: "rgba(99, 102, 241, 0.15)",
                      color: "#6366f1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={16} />
                  </div>
                )}
                <div>
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      fontSize: "0.88rem",
                      lineHeight: 1.45,
                      background: m.sender === "user" ? "#6366f1" : "var(--bg-secondary, #f8fafc)",
                      color: m.sender === "user" ? "#fff" : "var(--text-primary, #0f172a)",
                      borderBottomRightRadius: m.sender === "user" ? 4 : 12,
                      borderBottomLeftRadius: m.sender === "ai" ? 4 : 12,
                      border: m.sender === "ai" ? "1px solid var(--border-primary, #e2e8f0)" : "none",
                    }}
                  >
                    {m.text}

                    {m.citations && m.citations.length > 0 && (
                      <div
                        style={{
                          marginTop: 8,
                          paddingTop: 6,
                          borderTop: "1px solid rgba(0,0,0,0.08)",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                        }}
                      >
                        {m.citations.map((c, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: "0.7rem",
                              background: "rgba(99, 102, 241, 0.1)",
                              color: "#6366f1",
                              padding: "2px 6px",
                              borderRadius: 4,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <BookOpen size={9} />
                            {c.sourceType}
                          </span>
                        ))}
                      </div>
                    )}

                    {m.isCacheHit && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: "0.68rem",
                          color: "#10b981",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          fontWeight: 600,
                        }}
                      >
                        <Zap size={9} /> Cached FAQ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, alignSelf: "flex-start" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bot size={16} />
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: "var(--bg-secondary, #f8fafc)",
                    color: "var(--text-secondary, #64748b)",
                    fontSize: "0.85rem",
                    display: "flex",
                    gap: 4,
                  }}
                >
                  <span className="dot-typing">.</span>
                  <span className="dot-typing" style={{ animationDelay: "0.2s" }}>
                    .
                  </span>
                  <span className="dot-typing" style={{ animationDelay: "0.4s" }}>
                    .
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: 12,
              borderTop: "1px solid var(--border-primary, rgba(226,232,240,0.8))",
              background: "var(--bg-primary, #ffffff)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                background: "var(--bg-secondary, #f1f5f9)",
                padding: "8px 12px",
                borderRadius: 20,
                border: "1px solid var(--border-primary, #e2e8f0)",
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask grounded course question..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text-primary, #0f172a)",
                  fontSize: "0.88rem",
                }}
              />
              <button
                onClick={sendMessage}
                disabled={isTyping || !input.trim()}
                style={{
                  background: "#6366f1",
                  color: "#fff",
                  border: "none",
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  opacity: !input.trim() || isTyping ? 0.6 : 1,
                }}
              >
                <Send size={13} style={{ marginLeft: -2 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
