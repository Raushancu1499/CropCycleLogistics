export const HOME_ROUTE_BY_ROLE = {
  admin: "/admin-dashboard",
  farmer: "/farmer-dashboard",
  buyer: "/buyer-dashboard",
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const clearStoredSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getStoredHomeRoute = (user = getStoredUser()) =>
  HOME_ROUTE_BY_ROLE[user?.role] || "/login";

export const getStoredRoleLabel = (role) =>
  (
    {
      admin: "Admin",
      farmer: "Farmer",
      buyer: "Buyer",
    }[role] || "User"
  );
