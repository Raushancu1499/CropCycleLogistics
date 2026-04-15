import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const notifications = await apiFetch("/notifications");
        if (active) {
          setUnread(
            Array.isArray(notifications)
              ? notifications.filter((item) => !item.read).length
              : 0
          );
        }
      } catch {
        if (active) {
          setUnread(0);
        }
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 20000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <button
      type="button"
      className="notification-button"
      onClick={() => navigate("/notifications")}
      aria-label="Open notifications"
    >
      <Bell size={18} />
      {unread > 0 && <span className="notification-count">{unread}</span>}
    </button>
  );
}
