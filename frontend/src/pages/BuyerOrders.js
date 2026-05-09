import { ArrowRight, ShoppingBag, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FarmerProfileModal from "../components/FarmerProfileModal";
import AppFrame from "../components/layout/AppFrame";
import {
  apiFetch,
  deliveryModeLabel,
  formatCurrency,
  formatDate,
  statusLabel,
} from "../utils/api";

const toneClass = (status) => {
  if (status === "approved" || status === "delivered") return "success";
  if (status === "rejected") return "error";
  if (status === "on_route") return "info";
  return "pending";
};

export default function BuyerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      try {
        const data = await apiFetch("/orders/buyer");
        if (active) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      }
    };

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const activeOrders = orders.filter((item) => item.status !== "delivered").length;
    const deliveredValue = orders
      .filter((item) => item.status === "delivered")
      .reduce((sum, item) => sum + Number(item.totalCost || 0), 0);

    return [
      {
        label: "Total orders",
        value: orders.length,
        caption: "Every order placed from the marketplace.",
      },
      {
        label: "Orders in progress",
        value: activeOrders,
        caption: "Purchases still moving through approval or delivery.",
      },
      {
        label: "Delivered value",
        value: formatCurrency(deliveredValue),
        caption: "Completed order spend across fulfilled deliveries.",
      },
    ];
  }, [orders]);

  return (
    <AppFrame>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">Buyer orders</span>
          <h1>Track every produce order from placement to delivery.</h1>
          <p>
            Follow current order status, review totals, and reopen farmer details
            whenever you need to place a repeat order.
          </p>
          <div className="button-row">
            <button
              type="button"
              className="button button-primary"
              onClick={() => navigate("/marketplace")}
            >
              Browse marketplace
              <Store size={16} />
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/request-produce")}
            >
              Post a requirement
              <ArrowRight size={16} />
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

      {error ? <div className="alert error">{error}</div> : null}

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Order history</span>
            <h2>Recent purchase activity</h2>
          </div>
          <div className="inline-meta">
            <ShoppingBag size={16} />
            {orders.length} order{orders.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="list">
          {orders.map((order) => (
            <article key={order._id} className="record-row">
              <div className="record-main">
                <div className="record-title">{order.productId?.name}</div>
                <div className="record-subtitle">
                  {order.quantity} {order.productId?.unit} from {order.farmerId?.name}
                </div>
                <div className="record-subtitle">
                  {deliveryModeLabel(order.deliveryMode)}
                  {order.deliveryFee
                    ? ` • Delivery fee ${formatCurrency(order.deliveryFee)}`
                    : ""}
                </div>
                <div className="record-subtitle">{formatDate(order.createdAt)}</div>
              </div>

              <div className="record-side">
                <div className="price-tag">{formatCurrency(order.totalCost)}</div>
                <span className={`status-pill ${toneClass(order.status)}`}>
                  {statusLabel(order.status)}
                </span>
              </div>

              <div className="button-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-chat", { detail: order }))}
                >
                  <span style={{ fontSize: "16px", marginRight: "6px" }}>💬</span>
                  Message Farmer
                </button>

                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setSelectedFarmer(order.farmerId?._id)}
                >
                  Farmer details
                </button>
              </div>
            </article>
          ))}

          {!orders.length ? (
            <div className="empty-state">
              You have not placed any orders yet. Start in the marketplace to source
              your next shipment.
            </div>
          ) : null}
        </div>
      </section>

      {selectedFarmer ? (
        <FarmerProfileModal
          farmerId={selectedFarmer}
          onClose={() => setSelectedFarmer(null)}
        />
      ) : null}
    </AppFrame>
  );
}
