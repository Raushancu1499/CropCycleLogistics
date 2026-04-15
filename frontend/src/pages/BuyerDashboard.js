import { ArrowRight, ClipboardList, LoaderCircle, Store } from "lucide-react";
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

const toneClass = (status) => {
  if (status === "matched" || status === "selected" || status === "delivered") return "success";
  if (status === "closed") return "info";
  if (status === "rejected" || status === "declined") return "error";
  if (status === "in_review" || status === "on_route") return "info";
  return "pending";
};

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({
    stats: {
      openRequirements: 0,
      reviewingRequirements: 0,
      matchedRequirements: 0,
      urgentRequirements: 0,
      pendingOrders: 0,
      totalSpent: 0,
      responseCoverage: 0,
    },
    urgentBoard: [],
    recentResponses: [],
    activeOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/requirements/dashboard/buyer");
        setDashboard({
          stats: data?.stats || {},
          urgentBoard: Array.isArray(data?.urgentBoard) ? data.urgentBoard : [],
          recentResponses: Array.isArray(data?.recentResponses) ? data.recentResponses : [],
          activeOrders: Array.isArray(data?.activeOrders) ? data.activeOrders : [],
        });
      } catch {
        setDashboard({
          stats: {
            openRequirements: 0,
            reviewingRequirements: 0,
            matchedRequirements: 0,
            urgentRequirements: 0,
            pendingOrders: 0,
            totalSpent: 0,
            responseCoverage: 0,
          },
          urgentBoard: [],
          recentResponses: [],
          activeOrders: [],
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const metrics = useMemo(
    () => [
      {
        label: "Open requirements",
        value: dashboard.stats.openRequirements || 0,
        caption: "Demand briefs that still need farmer coverage.",
      },
      {
        label: "Reviewing responses",
        value: dashboard.stats.reviewingRequirements || 0,
        caption: "Requirements with active farmer quotes to compare.",
      },
      {
        label: "Matched suppliers",
        value: dashboard.stats.matchedRequirements || 0,
        caption: "Briefs where you have already selected a farmer.",
      },
      {
        label: "Response coverage",
        value: `${dashboard.stats.responseCoverage || 0}%`,
        caption: "Share of active requirements that already have responses.",
      },
      {
        label: "Pending orders",
        value: dashboard.stats.pendingOrders || 0,
        caption: "Marketplace orders still in motion.",
      },
      {
        label: "Spend to date",
        value: formatCurrency(dashboard.stats.totalSpent || 0),
        caption: "Delivered order value across completed purchases.",
      },
    ],
    [dashboard.stats]
  );

  return (
    <AppFrame>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">Buyer control center</span>
          <h1>Watch sourcing briefs move from open demand to selected supplier.</h1>
          <p>
            Track which requests need more farmer coverage, compare the latest quotes,
            and keep existing orders moving without losing the operational picture.
          </p>
          <div className="button-row">
            <button
              type="button"
              className="button button-primary"
              onClick={() => navigate("/request-produce")}
            >
              Post a requirement
              <ClipboardList size={16} />
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/marketplace")}
            >
              Explore marketplace
              <Store size={16} />
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

      {loading ? (
        <section className="surface-card">
          <div className="empty-state">
            <LoaderCircle size={18} className="spin" />
            Loading buyer dashboard...
          </div>
        </section>
      ) : (
        <section className="two-column">
          <div className="surface-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Urgent buyer actions</span>
                <h2>Requirements that need follow-through</h2>
              </div>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => navigate("/my-requests")}
              >
                Manage all
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="list">
              {dashboard.urgentBoard.map((request) => (
                <article key={request._id} className="record-row stacked">
                  <div className="record-main">
                    <div className="record-title">{request.productName}</div>
                    <div className="record-subtitle">
                      {request.quantity} {request.unit} needed by {formatDate(request.neededDate)}
                    </div>
                    <div className="record-subtitle">
                      {request.location} | {deliveryModeLabel(request.preferredDeliveryMode)}
                    </div>
                  </div>
                  <div className="button-row">
                    <span className={`status-pill ${toneClass(request.status)}`}>
                      {statusLabel(request.status)}
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => navigate("/my-requests")}
                    >
                      Open request
                    </button>
                  </div>
                </article>
              ))}

              {!dashboard.urgentBoard.length && (
                <div className="empty-state">
                  No urgent sourcing briefs right now. Post a new requirement or review your order pipeline.
                </div>
              )}
            </div>
          </div>

          <div className="surface-card soft">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Farmer response inbox</span>
                <h2>Latest quotes submitted to your briefs</h2>
              </div>
            </div>

            <div className="list">
              {dashboard.recentResponses.map((response) => (
                <article key={response._id} className="record-row stacked">
                  <div className="record-main">
                    <div className="record-title">{response.productName}</div>
                    <div className="record-subtitle">
                      {response.farmerName} quoted {formatCurrency(response.unitPrice)} / {response.unit}
                    </div>
                    <div className="record-subtitle">
                      {response.proposedQuantity} {response.unit} by {formatDate(response.earliestFulfillmentDate)}
                    </div>
                    {response.responseMessage ? (
                      <p className="muted-copy">{response.responseMessage}</p>
                    ) : null}
                  </div>
                  <div className="button-row">
                    <span className={`status-pill ${toneClass(response.status)}`}>
                      {statusLabel(response.status)}
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => navigate("/my-requests")}
                    >
                      Compare
                    </button>
                  </div>
                </article>
              ))}

              {!dashboard.recentResponses.length && (
                <div className="empty-state">
                  No farmer quotes yet. Keep briefs open or increase specificity in your request.
                </div>
              )}
            </div>
          </div>

          <div className="surface-card" style={{ gridColumn: "1 / -1" }}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">Order pipeline</span>
                <h2>Marketplace orders still moving</h2>
              </div>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => navigate("/buyer-orders")}
              >
                View orders
              </button>
            </div>

            <div className="list">
              {dashboard.activeOrders.map((order) => (
                <article key={order._id} className="record-row">
                  <div className="record-main">
                    <div className="record-title">{order.productId?.name}</div>
                    <div className="record-subtitle">
                      {order.quantity} {order.productId?.unit} from {order.farmerId?.name}
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
                    onClick={() => navigate("/buyer-orders")}
                  >
                    Open
                  </button>
                </article>
              ))}

              {!dashboard.activeOrders.length && (
                <div className="empty-state">
                  No active marketplace orders right now. Post a brief or place a new order to keep the pipeline moving.
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </AppFrame>
  );
}
