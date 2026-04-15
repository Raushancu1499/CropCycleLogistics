import {
  ClipboardList,
  Gauge,
  LogOut,
  Megaphone,
  PackageSearch,
  PanelLeftClose,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Store,
  Warehouse,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredHomeRoute, getStoredRoleLabel, getStoredUser } from "./layoutUtils";

export default function Sidebar({ isOpen, onClose, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const role = user?.role;
  const dashboardPath = getStoredHomeRoute(user);

  const menu =
    role === "admin"
      ? [
          { label: "Dashboard", icon: Gauge, path: dashboardPath },
          { label: "Marketplace", icon: Store, path: "/marketplace" },
          { label: "Ad Revenue", icon: Megaphone, path: "/admin-dashboard" },
        ]
      : role === "farmer"
        ? [
            { label: "Dashboard", icon: Gauge, path: dashboardPath },
            { label: "Buyer Demand", icon: PackageSearch, path: "/buyer-requests" },
            { label: "My Inventory", icon: Warehouse, path: "/inventory" },
            { label: "Orders", icon: ShoppingBag, path: "/farmer-orders" },
            { label: "Insurance", icon: ShieldCheck, path: "/insurance" },
            { label: "Marketplace", icon: Store, path: "/marketplace" },
          ]
        : [
            { label: "Dashboard", icon: Gauge, path: dashboardPath },
            { label: "Request Produce", icon: ClipboardList, path: "/request-produce" },
            { label: "My Requests", icon: PackageSearch, path: "/my-requests" },
            { label: "Marketplace", icon: Store, path: "/marketplace" },
            { label: "My Orders", icon: ShoppingBag, path: "/buyer-orders" },
          ];

  const openPath = (path) => {
    navigate(path);
    onClose?.();
  };

  return (
    <aside className={`sidebar${isOpen ? " open" : ""}`}>
      <div className="sidebar-shell">
        <button
          aria-label="Close navigation"
          className="sidebar-close"
          onClick={onClose}
          type="button"
        >
          <PanelLeftClose size={18} />
        </button>

        <div>
          <div className="sidebar-brand">
            <div className="brand-mark">
              <Sprout size={14} />
              <span>CropCycle</span>
            </div>
            <p className="sidebar-copy">
              Fresh produce coordination for buyers, farmers, and logistics planning.
            </p>
          </div>

          <div className="sidebar-meta">
            <span className="eyebrow">Signed in as</span>
            <strong>{user?.name || "Guest"}</strong>
            <span className="role-pill">{getStoredRoleLabel(role)}</span>
            <span className="meta-text">{user?.location || "No location saved"}</span>
          </div>

          <nav className="sidebar-links">
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));

              return (
                <button
                  key={item.path}
                  className={`sidebar-link${isActive ? " active" : ""}`}
                  onClick={() => openPath(item.path)}
                  type="button"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <button className="sidebar-link danger" onClick={onLogout} type="button">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
