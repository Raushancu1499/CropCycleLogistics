import { ClipboardList, Package, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppFrame from "../components/layout/AppFrame";
import {
  apiFetch,
  formatCurrency,
  formatDate,
  statusLabel,
} from "../utils/api";

const toneClass = (status) => {
  if (status === "approved" || status === "delivered" || status === "selected") {
    return "success";
  }
  if (status === "rejected" || status === "declined") return "error";
  if (status === "on_route" || status === "in_review") return "info";
  return "pending";
};

export default function FarmerHomePage() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [inventoryData, orderData, requestData, policyData] = await Promise.all([
          apiFetch("/products/my"),
          apiFetch("/orders/farmer"),
          apiFetch("/requirements"),
          apiFetch("/insurance"),
        ]);
        setInventory(Array.isArray(inventoryData) ? inventoryData : []);
        setOrders(Array.isArray(orderData) ? orderData : []);
        setRequests(Array.isArray(requestData) ? requestData : []);
        setPolicies(Array.isArray(policyData) ? policyData : []);
      } catch {
        setInventory([]);
        setOrders([]);
        setRequests([]);
        setPolicies([]);
      }
    };

    load();
  }, []);

  const metrics = useMemo(() => {
    const revenue = orders
      .filter((item) => item.status === "delivered")
      .reduce((sum, item) => sum + Number(item.totalCost || 0), 0);

    return [
      {
        label: "Inventory items",
        value: inventory.length,
        caption: "Live crop listings currently in your catalog.",
      },
      {
        label: "Open orders",
        value: orders.filter((item) => item.status !== "delivered" && item.status !== "rejected")
          .length,
        caption: "Orders needing approval, dispatch, or delivery updates.",
      },
      {
        label: "Delivered revenue",
        value: formatCurrency(revenue),
        caption: "Value from completed deliveries.",
      },
      {
        label: "Demand opportunities",
        value: requests.filter((item) => item.status === "open" || item.status === "in_review")
          .length,
        caption: "Buyer requests you can respond to right now.",
      },
      {
        label: "Low-stock alerts",
        value: inventory.filter((item) => Number(item.quantity) <= 10).length,
        caption: "Listings at 10 units or below that may need replenishment.",
      },
      {
        label: "Insurance policies",
        value: policies.length,
        caption: "Policies submitted and tracked in your insurance center.",
      },
    ];
  }, [inventory, orders, requests, policies]);

  return (
    <AppFrame>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">Farmer operations hub</span>
          <h1>Run sales, demand matching, and crop operations from one dashboard.</h1>
          <p>
            Keep inventory current, respond to buyer demand faster, and stay on top
            of orders before they become follow-up work.
          </p>
          <div className="button-row">
            <button
              type="button"
              className="button button-primary"
              onClick={() => navigate("/inventory")}
            >
              Manage inventory
              <Package size={16} />
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/buyer-requests")}
            >
              Review demand board
              <ClipboardList size={16} />
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

      <section className="two-column">
        <div className="surface-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Immediate action</span>
              <h2>Orders needing movement</h2>
            </div>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/farmer-orders")}
            >
              Open orders
              <ShoppingBag size={16} />
            </button>
          </div>

          <div className="list">
            {orders.slice(0, 4).map((order) => (
              <article key={order._id} className="record-row">
                <div className="record-main">
                  <div className="record-title">{order.productId?.name}</div>
                  <div className="record-subtitle">
                    {order.quantity} {order.productId?.unit} for {order.buyerId?.name}
                  </div>
                  <div className="record-subtitle">{formatDate(order.createdAt)}</div>
                </div>
                <div className="record-side">
                  <div className="price-tag">{formatCurrency(order.totalCost)}</div>
                  <span className={`status-pill ${toneClass(order.status)}`}>
                    {statusLabel(order.status)}
                  </span>
                </div>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => navigate("/farmer-orders")}
                >
                  Manage
                </button>
              </article>
            ))}

            {!orders.length && (
              <div className="empty-state">
                No orders yet. Keep your listings fresh in the marketplace to start
                bringing in buyer demand.
              </div>
            )}
          </div>
        </div>

        <div className="surface-card soft">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Buyer demand board</span>
              <h2>Fresh opportunities nearby</h2>
            </div>
          </div>

          <div className="list">
            {requests.slice(0, 3).map((request) => (
              <article key={request._id} className="record-row stacked">
                <div className="record-main">
                  <div className="record-title">{request.productName}</div>
                  <div className="record-subtitle">
                    {request.quantity} {request.unit} needed in {request.location}
                  </div>
                  <div className="record-subtitle">
                    Needed by {formatDate(request.neededDate)}
                  </div>
                </div>
                <div className="button-row">
                  <span className={`status-pill ${toneClass(request.status)}`}>
                    {statusLabel(request.status)}
                  </span>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => navigate("/buyer-requests")}
                  >
                    Respond
                  </button>
                </div>
              </article>
            ))}

            {!requests.length && (
              <div className="empty-state">
                No current requests on the demand board. Check back after buyers post
                new sourcing needs.
              </div>
            )}
          </div>
        </div>
      </section>
    </AppFrame>
  );
}
