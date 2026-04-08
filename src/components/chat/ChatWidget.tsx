"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
  needsEscalation?: boolean;
};

function getSessionId(): string {
  const key = "lalason_chat_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [escalateEmail, setEscalateEmail] = useState("");
  const [escalateName, setEscalateName] = useState("");
  const [escalateSubject, setEscalateSubject] = useState("");
  const [escalateDetail, setEscalateDetail] = useState("");
  const [escalateSending, setEscalateSending] = useState(false);
  const [escalateSent, setEscalateSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Bonjour ! 👋 Je suis l'assistant Lalason. Comment puis-je vous aider aujourd'hui ?",
        },
      ]);
    }
  }, [open, messages.length]);

  // Don't show on admin pages
  if (isAdminPage) return null;

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: getSessionId(),
          history: newMessages.slice(-6),
        }),
      });

      const data = await res.json();
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.answer ?? "Désolé, une erreur est survenue.",
          needsEscalation: data.needsEscalation,
        },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Désolé, une erreur est survenue. Réessayez plus tard." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleEscalate(e: React.FormEvent) {
    e.preventDefault();
    if (escalateSending) return;

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

    setEscalateSending(true);
    try {
      const res = await fetch("/api/chat/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          email: escalateEmail,
          name: escalateName,
          subject: escalateSubject,
          detailedMessage: escalateDetail,
          lastQuestion: lastUserMessage?.content ?? null,
        }),
      });

      if (res.ok) {
        setEscalateSent(true);
        setEscalateSubject("");
        setEscalateDetail("");
        setEscalateEmail("");
        setEscalateName("");
      }
    } finally {
      setEscalateSending(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const lastMessage = messages[messages.length - 1];
  const shouldShowEscalate = lastMessage?.role === "assistant" && lastMessage?.needsEscalation;

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le chat"
          style={{
            position: "fixed",
            bottom: 80,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-accent) 0%, #e8961a 100%)",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(245,166,35,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9998,
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1b3a4b" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: "min(380px, calc(100vw - 40px))",
            height: "min(560px, calc(100vh - 120px))",
            backgroundColor: "#0f2533",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9998,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              background: "linear-gradient(135deg, #1b3a4b 0%, #0f2533 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "white", margin: 0 }}>
                Assistant Lalason
              </p>
              <p style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.5)", margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block" }} />
                En ligne
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.6)",
                padding: 4,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <div
                  style={{
                    padding: "0.625rem 0.875rem",
                    borderRadius: 14,
                    backgroundColor: msg.role === "user" ? "var(--color-accent)" : "rgba(255,255,255,0.06)",
                    color: msg.role === "user" ? "var(--color-accent-text)" : "rgba(255,255,255,0.9)",
                    fontSize: "0.875rem",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: "flex-start" }}>
                <div
                  style={{
                    padding: "0.625rem 0.875rem",
                    borderRadius: 14,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.875rem",
                  }}
                >
                  <span style={{ display: "inline-flex", gap: 3 }}>
                    <span style={{ animation: "bounce 1.4s infinite" }}>•</span>
                    <span style={{ animation: "bounce 1.4s infinite 0.2s" }}>•</span>
                    <span style={{ animation: "bounce 1.4s infinite 0.4s" }}>•</span>
                  </span>
                </div>
              </div>
            )}

            {shouldShowEscalate && !showEscalateForm && !escalateSent && (
              <button
                onClick={() => setShowEscalateForm(true)}
                style={{
                  alignSelf: "stretch",
                  padding: "0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, var(--color-accent) 0%, #e8961a 100%)",
                  color: "var(--color-accent-text)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 4px 12px rgba(245,166,35,0.25)",
                }}
              >
                📝 Remplir le formulaire de contact
              </button>
            )}

            {showEscalateForm && !escalateSent && (
              <form
                onSubmit={handleEscalate}
                style={{
                  padding: "1rem",
                  borderRadius: 12,
                  backgroundColor: "rgba(245,166,35,0.06)",
                  border: "1px solid rgba(245,166,35,0.2)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                }}
              >
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                  Nous vous répondrons directement par email sous 24-48h.
                </p>
                <input
                  type="text"
                  placeholder="Votre nom (optionnel)"
                  value={escalateName}
                  onChange={(e) => setEscalateName(e.target.value)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "white",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                  }}
                />
                <input
                  type="email"
                  placeholder="Votre email *"
                  value={escalateEmail}
                  onChange={(e) => setEscalateEmail(e.target.value)}
                  required
                  style={{
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "white",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                  }}
                />
                <input
                  type="text"
                  placeholder="Objet de votre demande *"
                  value={escalateSubject}
                  onChange={(e) => setEscalateSubject(e.target.value)}
                  required
                  style={{
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "white",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                  }}
                />
                <textarea
                  placeholder="Décrivez votre demande en détail *"
                  value={escalateDetail}
                  onChange={(e) => setEscalateDetail(e.target.value)}
                  required
                  rows={4}
                  style={{
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "white",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    resize: "vertical",
                    minHeight: 80,
                  }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowEscalateForm(false)}
                    style={{
                      padding: "0.5rem 0.875rem",
                      backgroundColor: "transparent",
                      color: "rgba(255,255,255,0.5)",
                      fontWeight: 500,
                      fontSize: "0.8125rem",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.1)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={escalateSending}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      backgroundColor: "var(--color-accent)",
                      color: "var(--color-accent-text)",
                      fontWeight: 700,
                      fontSize: "0.8125rem",
                      borderRadius: 8,
                      border: "none",
                      cursor: escalateSending ? "not-allowed" : "pointer",
                      opacity: escalateSending ? 0.6 : 1,
                      fontFamily: "inherit",
                    }}
                  >
                    {escalateSending ? "Envoi..." : "Envoyer ma demande"}
                  </button>
                </div>
              </form>
            )}

            {escalateSent && (
              <div
                style={{
                  alignSelf: "stretch",
                  padding: "1rem",
                  borderRadius: 12,
                  backgroundColor: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  color: "#22c55e",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  textAlign: "center",
                }}
              >
                ✓ Votre demande a bien été envoyée à notre équipe.<br />
                Nous vous répondrons sous 24-48h.
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "0.875rem",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              gap: "0.5rem",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Posez votre question..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "0.625rem 0.875rem",
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "white",
                fontSize: "0.875rem",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                padding: "0.625rem 0.875rem",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-accent-text)",
                fontWeight: 600,
                borderRadius: 10,
                border: "none",
                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                opacity: !input.trim() || loading ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
