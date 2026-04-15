import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { getHomeRoute, getUser, isLoggedIn } from "./utils/api";
import AdminDashboard from "./pages/AdminDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import BuyerOrders from "./pages/BuyerOrders";
import BuyerRequests from "./pages/BuyerRequests";
import FarmerDashboard from "./pages/FarmerDashboard";
import FarmerOrders from "./pages/FarmerOrders";
import Insurance from "./pages/Insurance";
import Inventory from "./pages/Inventory";
import Login from "./pages/Login";
import Marketplace from "./pages/Marketplace";
import MyRequests from "./pages/MyRequests";
import Notifications from "./pages/Notifications";
import Register from "./pages/Register";
import RequestProduce from "./pages/RequestProduce";

function ProtectedRoute({ children, role }) {
  const user = getUser();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={getHomeRoute(user)} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  if (isLoggedIn()) {
    return <Navigate to={getHomeRoute()} replace />;
  }

  return children;
}

function HomeRedirect() {
  return <Navigate to={isLoggedIn() ? getHomeRoute() : "/login"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/marketplace"
          element={
            <ProtectedRoute>
              <Marketplace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer-dashboard"
          element={
            <ProtectedRoute role="buyer">
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer-orders"
          element={
            <ProtectedRoute role="buyer">
              <BuyerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/request-produce"
          element={
            <ProtectedRoute role="buyer">
              <RequestProduce />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-requests"
          element={
            <ProtectedRoute role="buyer">
              <MyRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer-dashboard"
          element={
            <ProtectedRoute role="farmer">
              <FarmerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute role="farmer">
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer-orders"
          element={
            <ProtectedRoute role="farmer">
              <FarmerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insurance"
          element={
            <ProtectedRoute role="farmer">
              <Insurance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer-requests"
          element={
            <ProtectedRoute role="farmer">
              <BuyerRequests />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
