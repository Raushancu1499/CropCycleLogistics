export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";
export const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api$/, "");
export const HOME_ROUTE_BY_ROLE = {
  admin: "/admin-dashboard",
  farmer: "/farmer-dashboard",
  buyer: "/buyer-dashboard",
};

export const getToken = () => localStorage.getItem("token") || "";

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const isLoggedIn = () => Boolean(getToken());

export const saveSession = ({ token, user }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getHomeRoute = (user = getUser()) =>
  HOME_ROUTE_BY_ROLE[user?.role] || "/login";

export const getRoleLabel = (role) =>
  ({
    admin: "Admin",
    farmer: "Farmer",
    buyer: "Buyer",
  }[role] || "User");

export const mediaUrl = (assetPath) =>
  assetPath ? `${MEDIA_BASE_URL}${assetPath}` : "";

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatDate = (value, options = {}) => {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(value));
};

export const statusLabel = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const deliveryModeLabel = (value = "") => {
  switch (value) {
    case "buyer_pickup":
      return "Buyer pickup";
    case "farmer_delivery":
      return "Farmer delivery";
    case "either":
      return "Pickup or delivery";
    default:
      return statusLabel(value) || "Flexible";
  }
};

export const statusPalette = {
  open: { background: "#E8F3E7", color: "#1F6B39" },
  in_review: { background: "#FFF4D6", color: "#8C5A00" },
  matched: { background: "#DFF1FF", color: "#0B5AA5" },
  closed: { background: "#ECECEC", color: "#4B5563" },
  submitted: { background: "#F2F7D7", color: "#516500" },
  selected: { background: "#DCF7E7", color: "#17603A" },
  declined: { background: "#FDE2E2", color: "#B42318" },
  pending: { background: "#FFF4D6", color: "#8C5A00" },
  approved: { background: "#DFF1FF", color: "#0B5AA5" },
  on_route: { background: "#F8E7FF", color: "#6B21A8" },
  delivered: { background: "#DCF7E7", color: "#17603A" },
  rejected: { background: "#FDE2E2", color: "#B42318" },
  urgent: { background: "#FDE2E2", color: "#B42318" },
  priority: { background: "#FFF4D6", color: "#8C5A00" },
  routine: { background: "#E8F3E7", color: "#1F6B39" },
};

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (typeof data === "object" && (data.message || data.error)) ||
      (typeof data === "string" && data) ||
      "Something went wrong";
    throw new Error(message);
  }

  return data;
}

export const fetchWithAuth = (url, options = {}) =>
  fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
