import { ClipboardList, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppFrame from "../components/layout/AppFrame";
import {
  apiFetch,
  deliveryModeLabel,
  formatCurrency,
  formatDate,
  statusLabel,
} from "../utils/api";
import { getSocket } from "../utils/useSocket";

const toneClass = (status) => {
  if (status === "approved" || status === "delivered") return "success";
  if (status === "rejected") return "error";
  if (status === "on_route") return "info";
  return "pending";
};

export default function FarmerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      const data = await apiFetch("/orders/farmer");
      setOrders(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message);
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const metrics = useMemo(() => {
    const activeOrders = orders.filter(
      (item) => item.status !== "delivered" && item.status !== "rejected"
    ).length;
    const deliveredValue = orders
      .filter((item) => item.status === "delivered")
      .reduce((sum, item) => sum + Number(item.totalCost || 0), 0);

    return [
      {
        label: "Total orders",
        value: orders.length,
        caption: "All incoming buyer orders in your sales pipeline.",
      },
      {
        label: "Orders in motion",
        value: activeOrders,
        caption: "Orders still waiting for approval, dispatch, or delivery.",
      },
      {
        label: "Delivered revenue",
        value: formatCurrency(deliveredValue),
        caption: "Value realized from completed deliveries.",
      },
    ];
  }, [orders]);

  const updateStatus = async (id, status) => {
    try {
      setError("");
      await apiFetch(`/orders/status/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      // Emit real-time update so buyers see it instantly
      getSocket().emit("update_delivery_status", { orderId: id, status });
      await loadOrders();
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  return (
    <AppFrame>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">Farmer orders</span>
          <h1>Move buyer orders through approval, dispatch, and delivery with less friction.</h1>
          <p>
            Track order status, keep buyer details close at hand, and update the
            delivery pipeline from one dedicated operations view.
          </p>
          <div className="button-row">
            <button
              type="button"
              className="button button-primary"
              onClick={() => navigate("/inventory")}
            >
              Manage inventory
              <ShoppingBag size={16} />
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

      {error ? <div className="alert error">{error}</div> : null}

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Incoming orders</span>
            <h2>Orders requiring action</h2>
          </div>
        </div>

        <div className="list">
          {orders.map((order) => (
            <article key={order._id} className="record-row stacked">
              <div className="record-main">
                <div className="record-title">{order.productId?.name}</div>
                <div className="record-subtitle">
                  {order.quantity} {order.productId?.unit} for {order.buyerId?.name}
                </div>
                <div className="record-subtitle">
                  {deliveryModeLabel(order.deliveryMode)}
                  {order.deliveryFee
                    ? ` • Delivery fee ${formatCurrency(order.deliveryFee)}`
                    : ""}
                </div>
                <div className="record-subtitle">
                  Buyer phone: {order.buyerId?.phone || "Not shared"}
                </div>
                <div className="record-subtitle">{formatDate(order.createdAt)}</div>
              </div>

              <div className="button-row">
                <span className={`status-pill ${toneClass(order.status)}`}>
                  {statusLabel(order.status)}
                </span>
                <span className="chip outline">{formatCurrency(order.totalCost)}</span>
              </div>

              <div className="button-row">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-chat", { detail: order }))}
                >
                  <span style={{ fontSize: "16px", marginRight: "6px" }}>💬</span>
                  Message Buyer
                </button>

                {order.status === "pending" ? (
                  <>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => updateStatus(order._id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="button button-danger"
                      onClick={() => updateStatus(order._id, "rejected")}
                    >
                      Reject
                    </button>
                  </>
                ) : null}

                {order.status === "approved" ? (
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => updateStatus(order._id, "on_route")}
                  >
                    Mark on route
                  </button>
                ) : null}

                {order.status === "on_route" ? (
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => updateStatus(order._id, "delivered")}
                  >
                    Mark delivered
                  </button>
                ) : null}
              </div>
            </article>
          ))}

          {!orders.length ? (
            <div className="empty-state">
              No orders yet. Keep your listings active and watch the demand board for
              new buyer opportunities.
            </div>
          ) : null}
        </div>
      </section>
    </AppFrame>
  );
}
