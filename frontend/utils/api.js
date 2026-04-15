export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";
export const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

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
  user?.role === "admin"
    ? "/admin-dashboard"
    : user?.role === "farmer"
      ? "/farmer-dashboard"
      : "/buyer-dashboard";

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

export const deliveryModeLabel = (value) => {
  if (value === "buyer_pickup") return "Buyer pickup";
  if (value === "farmer_delivery") return "Farmer delivery";
  if (value === "either") return "Pickup or delivery";
  return statusLabel(value);
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
