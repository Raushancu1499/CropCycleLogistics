import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearStoredSession, getStoredUser } from "./layoutUtils";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppFrame({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
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
    </div>
  );
}
