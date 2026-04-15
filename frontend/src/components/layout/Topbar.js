import { CalendarRange, LogOut, MapPin, Menu } from "lucide-react";
import NotificationBell from "../NotificationBell";

export default function Topbar({ onLogout, onMenuToggle, user }) {
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <header className="topbar">
      <div className="topbar-leading">
        <button
          aria-label="Open navigation"
          className="topbar-menu"
          onClick={onMenuToggle}
          type="button"
        >
          <Menu size={18} />
        </button>

        <div>
          <div className="topbar-title">CropCycle Logistics</div>
          <div className="topbar-subtitle">
            <span className="inline-meta">
              <CalendarRange size={14} />
              {today}
            </span>
            {user?.location ? (
              <span className="inline-meta">
                <MapPin size={14} />
                {user.location}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <NotificationBell />
        <div className="topbar-profile">
          <span className="eyebrow">Account</span>
          <strong>{user?.name || "Unknown user"}</strong>
        </div>
        <button type="button" className="button button-secondary" onClick={onLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
