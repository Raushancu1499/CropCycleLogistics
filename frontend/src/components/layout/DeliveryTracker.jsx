import { useEffect, useState, useCallback } from "react";
import { useSocketEvents } from "../../utils/useSocket";

const STATUS_ICONS = {
  pending: "🕐",
  approved: "✅",
  rejected: "❌",
  on_route: "🚚",
  delivered: "📦",
};

const STATUS_COLORS = {
  pending: "#f59e0b",
  approved: "#16a34a",
  rejected: "#ef4444",
  on_route: "#7c3aed",
  delivered: "#0891b2",
};

const S = {
  container: {
    position: "fixed",
    top: "80px",
    right: "20px",
    zIndex: 1300,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    pointerEvents: "none",
  },
  toast: (color) => ({
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    padding: "14px 18px",
    minWidth: "280px",
    maxWidth: "340px",
    borderLeft: `4px solid ${color}`,
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    pointerEvents: "all",
    animation: "slideInToast 0.3s cubic-bezier(0.34,1.56,0.64,1)",
  }),
  icon: (color) => ({
    fontSize: "22px",
    lineHeight: 1,
    flexShrink: 0,
    filter: `drop-shadow(0 0 4px ${color}40)`,
  }),
  body: { flex: 1 },
  title: { fontWeight: 700, fontSize: "13px", color: "#111827", margin: "0 0 3px" },
  sub: { fontSize: "12px", color: "#6b7280", margin: 0 },
  close: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    fontSize: "16px",
    lineHeight: 1,
    padding: "0",
    flexShrink: 0,
  },
};

export default function DeliveryTracker() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const onDeliveryUpdate = useCallback((payload) => {
    const id = `${payload.orderId}-${Date.now()}`;
    setToasts((prev) => [{ ...payload, id }, ...prev.slice(0, 4)]);
    setTimeout(() => dismiss(id), 6000);
  }, [dismiss]);

  useSocketEvents({ onDeliveryUpdate });

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes slideInToast {
          from { opacity:0; transform:translateX(40px) scale(0.95); }
          to   { opacity:1; transform:translateX(0)    scale(1);    }
        }
      `}</style>
      <div id="delivery-toasts" style={S.container}>
        {toasts.map((t) => {
          const color = STATUS_COLORS[t.status] || "#16a34a";
          const icon = STATUS_ICONS[t.status] || "📋";
          return (
            <div key={t.id} style={S.toast(color)}>
              <span style={S.icon(color)}>{icon}</span>
              <div style={S.body}>
                <p style={S.title}>Delivery Update — {t.orderCode || "Order"}</p>
                <p style={S.sub}>
                  Status changed to <strong>{t.status?.replace(/_/g, " ")}</strong>
                  {t.updatedBy ? ` by ${t.updatedBy}` : ""}
                </p>
              </div>
              <button style={S.close} onClick={() => dismiss(t.id)} aria-label="Dismiss">✕</button>
            </div>
          );
        })}
      </div>
    </>
  );
}
