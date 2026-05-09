import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearStoredSession, getStoredUser } from "./layoutUtils";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ChatWidget from "../ChatWidget";
import DeliveryTracker from "./DeliveryTracker";
import { getSocket, disconnectSocket } from "../../utils/useSocket";

export default function AppFrame({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Establish socket connection when the frame mounts (user is logged in)
  useEffect(() => {
    getSocket(); // lazy-initialise / re-use shared socket
    return () => {
      // Only disconnect on full unmount (logout navigation handled separately)
    };
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    disconnectSocket();
    clearStoredSession();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {isSidebarOpen ? (
        <button
          aria-label="Close navigation"
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <div className="main-panel">
        <Topbar
          onLogout={handleLogout}
          onMenuToggle={() => setIsSidebarOpen((open) => !open)}
          user={user}
        />
        <main className="page-content">{children}</main>
      </div>

      {/* Real-time delivery status toasts */}
      <DeliveryTracker />

      {/* Floating chat widget (buyers ↔ farmers) */}
      {user?.role !== "admin" && <ChatWidget />}
    </div>
  );
}
