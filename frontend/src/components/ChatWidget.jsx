import { useEffect, useRef, useState, useCallback } from "react";
import { apiFetch, formatDate, getUser } from "../utils/api";
import { useOrderChat } from "../utils/useSocket";

// ─── Inline styles (no external CSS dependency) ────────────────────────────
const S = {
  fab: {
    position: "fixed",
    bottom: "28px",
    right: "28px",
    zIndex: 1200,
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#16a34a,#15803d)",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 6px 24px rgba(22,163,74,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.2s,box-shadow 0.2s",
    color: "#fff",
  },
  badge: {
    position: "absolute",
    top: "4px",
    right: "4px",
    background: "#ef4444",
    color: "#fff",
    borderRadius: "50%",
    fontSize: "11px",
    fontWeight: 700,
    minWidth: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 3px",
    border: "2px solid #fff",
  },
  panel: {
    position: "fixed",
    bottom: "100px",
    right: "28px",
    zIndex: 1199,
    width: "380px",
    maxWidth: "calc(100vw - 40px)",
    height: "560px",
    maxHeight: "calc(100vh - 120px)",
    borderRadius: "20px",
    background: "#fff",
    boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    animation: "slideUpChat 0.25s cubic-bezier(0.34,1.56,0.64,1)",
  },
  header: {
    background: "linear-gradient(135deg,#16a34a,#15803d)",
    color: "#fff",
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  headerTitle: { fontWeight: 700, fontSize: "15px", margin: 0 },
  headerSub: { fontSize: "12px", opacity: 0.85, margin: 0 },
  closeBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: "20px",
    lineHeight: 1,
    padding: "2px 6px",
    borderRadius: "6px",
  },
  inbox: {
    flex: 1,
    overflowY: "auto",
    padding: "8px",
  },
  inboxItem: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "12px",
    cursor: "pointer",
    background: active ? "#f0fdf4" : "transparent",
    borderLeft: active ? "3px solid #16a34a" : "3px solid transparent",
    marginBottom: "4px",
    transition: "background 0.15s",
  }),
  avatar: (color) => ({
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: "16px",
    flexShrink: 0,
  }),
  inboxMeta: { flex: 1, minWidth: 0 },
  inboxName: {
    fontWeight: 600,
    fontSize: "13px",
    color: "#111827",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  inboxPreview: {
    fontSize: "12px",
    color: "#6b7280",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  inboxUnread: {
    background: "#16a34a",
    color: "#fff",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 7px",
    flexShrink: 0,
  },
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  msgRow: (isMine) => ({
    display: "flex",
    flexDirection: isMine ? "row-reverse" : "row",
    alignItems: "flex-end",
    gap: "8px",
  }),
  bubble: (isMine) => ({
    maxWidth: "72%",
    padding: "9px 13px",
    borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    background: isMine ? "linear-gradient(135deg,#16a34a,#15803d)" : "#f3f4f6",
    color: isMine ? "#fff" : "#111827",
    fontSize: "13px",
    lineHeight: "1.45",
    wordBreak: "break-word",
    boxShadow: isMine ? "0 2px 8px rgba(22,163,74,0.3)" : "0 1px 4px rgba(0,0,0,0.08)",
  }),
  bubbleMeta: (isMine) => ({
    fontSize: "10px",
    color: isMine ? "rgba(255,255,255,0.7)" : "#9ca3af",
    marginTop: "3px",
    textAlign: isMine ? "right" : "left",
  }),
  statusCard: {
    background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "12px",
    color: "#1d4ed8",
    fontWeight: 600,
    textAlign: "center",
  },
  typingIndicator: {
    fontSize: "12px",
    color: "#6b7280",
    fontStyle: "italic",
    padding: "0 4px",
  },
  inputBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 14px",
    borderTop: "1px solid #f3f4f6",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: "1.5px solid #e5e7eb",
    borderRadius: "24px",
    padding: "9px 16px",
    fontSize: "13px",
    outline: "none",
    resize: "none",
    fontFamily: "inherit",
    lineHeight: "1.4",
    maxHeight: "80px",
    overflowY: "auto",
  },
  sendBtn: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#16a34a,#15803d)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(22,163,74,0.35)",
    transition: "transform 0.15s",
  },
  backBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    cursor: "pointer",
    color: "#fff",
    borderRadius: "8px",
    padding: "4px 8px",
    fontSize: "18px",
    lineHeight: 1,
    marginRight: "4px",
  },
  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
    fontSize: "13px",
    gap: "8px",
  },
};

const AVATAR_COLORS = ["#16a34a", "#2563eb", "#7c3aed", "#ea580c", "#0891b2"];
function avatarColor(id) {
  let h = 0;
  for (let i = 0; i < (id || "").length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xfffffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Chat pane for one order ──────────────────────────────────────────────
function ChatPane({ orderId, orderCode, partnerName, onBack }) {
  const user = getUser();
  const { messages, isTyping, sendMessage, sendTyping } = useOrderChat(orderId);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  const deliveryUpdates = messages.filter((m) => m.__type === "status");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
    sendTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div style={S.header}>
        <button style={S.backBtn} onClick={onBack} title="Back to inbox">‹</button>
        <div
          style={avatarS(partnerName)}
        >
          {initials(partnerName)}
        </div>
        <div>
          <p style={S.headerTitle}>{partnerName}</p>
          <p style={S.headerSub}>Order #{orderCode}</p>
        </div>
      </div>

      <div style={S.chatArea}>
        {messages.length === 0 && (
          <div style={S.empty}>
            <span style={{ fontSize: "32px" }}>💬</span>
            <p>No messages yet.<br />Start the conversation!</p>
          </div>
        )}
        {messages.map((m) => {
          if (m.__type === "status") return null; // rendered inline
          const isMine = m.senderId === user?.id || m.senderId?._id === user?.id;
          return (
            <div key={m._id} style={S.msgRow(isMine)}>
              {!isMine && (
                <div style={S.avatar(avatarColor(String(m.senderId)))}>
                  {initials(m.senderName)}
                </div>
              )}
              <div>
                {!isMine && (
                  <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 2px 4px" }}>
                    {m.senderRole === "farmer" ? "🌾" : "🛒"} {m.senderName}
                  </p>
                )}
                <div style={S.bubble(isMine)}>{m.text}</div>
                <p style={S.bubbleMeta(isMine)}>
                  {m.createdAt ? formatDate(m.createdAt, { hour: "numeric", minute: "2-digit" }) : ""}
                </p>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <p style={S.typingIndicator}>{isTyping.userName} is typing…</p>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={S.inputBar}>
        <textarea
          id="chat-input"
          style={S.input}
          placeholder="Type a message…"
          value={text}
          rows={1}
          onChange={(e) => {
            setText(e.target.value);
            sendTyping(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <button id="chat-send-btn" style={S.sendBtn} onClick={handleSend} title="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </>
  );
}

function avatarS(name) {
  return {
    width: "36px", height: "36px", borderRadius: "50%",
    background: "rgba(255,255,255,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: "14px", flexShrink: 0,
  };
}

// ─── Inbox pane ──────────────────────────────────────────────────────────
function InboxPane({ inbox, loading, selected, onSelect }) {
  if (loading) {
    return (
      <div style={S.empty}>
        <div className="spinner" />
        <p>Loading chats…</p>
      </div>
    );
  }
  if (inbox.length === 0) {
    return (
      <div style={S.empty}>
        <span style={{ fontSize: "40px" }}>💬</span>
        <p>No conversations yet.<br />Chats appear when you have orders.</p>
      </div>
    );
  }
  return (
    <div style={S.inbox}>
      {inbox.map((c) => {
        const user = getUser();
        const partnerIsfarmer = user?.role === "buyer";
        const partner = partnerIsfarmer ? c.farmer : c.buyer;
        const partnerName = partner?.name || "Unknown";
        const isActive = selected === c.orderId;
        return (
          <div
            key={c.orderId}
            id={`chat-inbox-${c.orderId}`}
            style={S.inboxItem(isActive)}
            onClick={() => onSelect(c)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onSelect(c)}
          >
            <div style={S.avatar(avatarColor(String(partner?._id || "")))}>
              {initials(partnerName)}
            </div>
            <div style={S.inboxMeta}>
              <p style={S.inboxName}>{partnerName}</p>
              <p style={S.inboxPreview}>
                {c.lastMessage ? c.lastMessage.text : `Order #${c.orderCode} · ${c.orderStatus || "—"}`}
              </p>
            </div>
            {c.unreadCount > 0 && (
              <span style={S.inboxUnread}>{c.unreadCount}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Root widget ─────────────────────────────────────────────────────────
export default function ChatWidget({ unreadCount = 0 }) {
  const [open, setOpen] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeChat, setActiveChat] = useState(null); // { orderId, orderCode, partnerName }
  const [totalUnread, setTotalUnread] = useState(unreadCount);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/chat");
      setInbox(data);
      setTotalUnread(data.reduce((s, c) => s + (c.unreadCount || 0), 0));
    } catch {
      // silently ignore — user might not have orders yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadInbox();
  }, [open, loadInbox]);

  useEffect(() => {
    const handleOpenChat = (e) => {
      const order = e.detail;
      setOpen(true);
      setActiveChat({
        orderId: order._id,
        orderCode: order.orderCode || order._id.slice(-6).toUpperCase(),
        partnerName: order.buyerId?.name || order.farmerId?.name || "User",
      });
    };
    window.addEventListener("open-chat", handleOpenChat);
    return () => window.removeEventListener("open-chat", handleOpenChat);
  }, []);

  const handleSelectChat = (c) => {
    const user = getUser();
    const partnerIsfarmer = user?.role === "buyer";
    const partner = partnerIsfarmer ? c.farmer : c.buyer;
    setActiveChat({
      orderId: c.orderId,
      orderCode: c.orderCode,
      partnerName: partner?.name || "User",
    });
    // mark as read locally
    setInbox((prev) =>
      prev.map((item) =>
        item.orderId === c.orderId ? { ...item, unreadCount: 0 } : item
      )
    );
    setTotalUnread((n) => Math.max(0, n - (c.unreadCount || 0)));
  };

  return (
    <>
      <style>{`
        @keyframes slideUpChat {
          from { opacity:0; transform:translateY(20px) scale(0.96); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
        #chat-fab:hover { transform:scale(1.08); box-shadow:0 10px 32px rgba(22,163,74,0.55)!important; }
        #chat-send-btn:hover { transform:scale(1.12); }
      `}</style>

      {/* Floating action button */}
      <button
        id="chat-fab"
        style={S.fab}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        title="Instant Chat"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        )}
        {!open && totalUnread > 0 && (
          <span style={S.badge}>{totalUnread > 9 ? "9+" : totalUnread}</span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div id="chat-panel" style={S.panel}>
          {/* Header (shared) */}
          {!activeChat && (
            <div style={S.header}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
              <div>
                <p style={S.headerTitle}>Messages</p>
                <p style={S.headerSub}>Buyers &amp; Farmers instant chat</p>
              </div>
              <button style={S.closeBtn} onClick={() => setOpen(false)}>✕</button>
            </div>
          )}

          {activeChat ? (
            <ChatPane
              orderId={activeChat.orderId}
              orderCode={activeChat.orderCode}
              partnerName={activeChat.partnerName}
              onBack={() => setActiveChat(null)}
            />
          ) : (
            <InboxPane
              inbox={inbox}
              loading={loading}
              selected={activeChat?.orderId}
              onSelect={handleSelectChat}
            />
          )}
        </div>
      )}
    </>
  );
}
