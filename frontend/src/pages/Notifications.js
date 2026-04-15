import { BellRing } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppFrame from "../components/layout/AppFrame";
import { apiFetch, formatDate } from "../utils/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      const data = await apiFetch("/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message);
      setNotifications([]);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      setError("");
      await apiFetch("/notifications/mark-read", { method: "PUT" });
      await loadNotifications();
    } catch (markError) {
      setError(markError.message);
    }
  };

  const metrics = useMemo(() => {
    const unread = notifications.filter((item) => !item.read).length;
    const read = notifications.filter((item) => item.read).length;

    return [
      {
        label: "Total notifications",
        value: notifications.length,
        caption: "Operational alerts generated across orders and listings.",
      },
      {
        label: "Unread",
        value: unread,
        caption: "Updates that still need a review or follow-up.",
      },
      {
        label: "Read",
        value: read,
        caption: "Notifications already acknowledged by the workspace.",
      },
    ];
  }, [notifications]);

  return (
    <AppFrame>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">Notifications</span>
          <h1>Stay on top of activity without losing track of the details.</h1>
          <p>
            Review new alerts, mark updates as read, and keep product, demand, and
            order changes visible for the whole workflow.
          </p>
          <div className="button-row">
            <button type="button" className="button button-primary" onClick={markAllRead}>
              Mark all as read
              <BellRing size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="card-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-caption">{metric.caption}</div>
          </article>
        ))}
      </section>

      {error ? <div className="alert error">{error}</div> : null}

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Activity feed</span>
            <h2>Recent product and order updates</h2>
          </div>
        </div>

        <div className="notification-list">
          {notifications.map((notification) => (
            <article
              key={notification._id || notification.message}
              className={`notification-card${notification.read ? " read" : ""}`}
            >
              <div className="button-row notification-card__header">
                <span className={`status-pill ${notification.read ? "closed" : "info"}`}>
                  {notification.read ? "Read" : "Unread"}
                </span>
                {notification.createdAt ? (
                  <span className="record-subtitle">{formatDate(notification.createdAt)}</span>
                ) : null}
              </div>
              <p>{notification.message}</p>
            </article>
          ))}

          {!notifications.length ? (
            <div className="empty-state">
              No notifications yet. New order and inventory updates will appear here.
            </div>
          ) : null}
        </div>
      </section>
    </AppFrame>
  );
}
