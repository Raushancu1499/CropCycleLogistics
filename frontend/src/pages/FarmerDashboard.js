import {
  ClipboardList,
  LoaderCircle,
  Package,
  ShoppingBag,
  Sprout,
  TrendingUp,
} from "lucide-react";
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
  if (["approved", "delivered", "selected", "matched"].includes(status)) {
    return "success";
  }
  if (["rejected", "declined"].includes(status)) return "error";
  if (["on_route", "in_review"].includes(status)) return "info";
  return "pending";
};

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({
    stats: {
      liveOpportunities: 0,
      submittedResponses: 0,
      acceptedMatches: 0,
      activeOrders: 0,
      totalRevenue: 0,
      inventoryItems: 0,
    },
    opportunities: [],
    responsePipeline: [],
    lowStockProducts: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/requirements/dashboard/farmer");
        setDashboard({
          stats: data?.stats || {},
          opportunities: Array.isArray(data?.opportunities) ? data.opportunities : [],
          responsePipeline: Array.isArray(data?.responsePipeline)
            ? data.responsePipeline
            : [],
          lowStockProducts: Array.isArray(data?.lowStockProducts)
            ? data.lowStockProducts
            : [],
          recentOrders: Array.isArray(data?.recentOrders) ? data.recentOrders : [],
        });
      } catch {
        setDashboard({
          stats: {
            liveOpportunities: 0,
            submittedResponses: 0,
            acceptedMatches: 0,
            activeOrders: 0,
            totalRevenue: 0,
            inventoryItems: 0,
          },
          opportunities: [],
          responsePipeline: [],
          lowStockProducts: [],
          recentOrders: [],
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
        label: "Live opportunities",
        value: dashboard.stats.liveOpportunities || 0,
        caption: "Buyer requirements that still need farmer responses.",
      },
      {
        label: "Submitted responses",
        value: dashboard.stats.submittedResponses || 0,
        caption: "Proposals you have already placed and are waiting on.",
      },
      {
        label: "Accepted matches",
        value: dashboard.stats.acceptedMatches || 0,
        caption: "Requirements where the buyer selected your response.",
      },
      {
        label: "Active orders",
        value: dashboard.stats.activeOrders || 0,
        caption: "Orders currently pending approval, dispatch, or transit.",
      },
      {
        label: "Delivered revenue",
        value: formatCurrency(dashboard.stats.totalRevenue || 0),
        caption: "Revenue from completed deliveries.",
      },
      {
        label: "Inventory items",
        value: dashboard.stats.inventoryItems || 0,
        caption: "Products currently available in your catalog.",
      },
    ],
    [dashboard.stats]
  );

  return (
    <AppFrame>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">Farmer operations hub</span>
          <h1>See inventory-fit demand, response progress, and order movement in one view.</h1>
          <p>
            The dashboard now highlights the buyer opportunities most aligned with
            your stock so you can respond faster and turn inventory into revenue.
          </p>
          <div className="button-row">
            <button
              type="button"
              className="button button-primary"
              onClick={() => navigate("/buyer-requests")}
            >
              Review demand board
              <ClipboardList size={16} />
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/inventory")}
            >
              Manage inventory
              <Package size={16} />
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
            Loading farmer dashboard...
          </div>
        </section>
      ) : (
        <>
          <section className="two-column">
            <div className="surface-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Best-fit opportunities</span>
                  <h2>Buyer requests most aligned with your stock</h2>
                </div>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => navigate("/buyer-requests")}
                >
                  Open board
                </button>
              </div>

              <div className="list">
                {dashboard.opportunities.map((opportunity) => (
                  <article key={opportunity._id} className="record-row stacked">
                    <div className="record-main">
                      <div className="record-title">{opportunity.productName}</div>
                      <div className="record-subtitle">
                        {opportunity.quantity} {opportunity.unit} needed in{" "}
                        {opportunity.location}
                      </div>
                      <div className="record-subtitle">
                        Needed by {formatDate(opportunity.neededDate)}
                      </div>
                      <div className="inline-meta" style={{ marginTop: 8 }}>
                        <span className={`status-pill ${toneClass(opportunity.status)}`}>
                          {statusLabel(opportunity.status)}
                        </span>
                        <span className="status-pill info">
                          Fit score {opportunity.inventoryFit?.score || 0}
                        </span>
                        <span className="status-pill pending">
                          {statusLabel(opportunity.urgency || "routine")}
                        </span>
                      </div>
                      {!!opportunity.inventoryFit?.matchingProducts?.length && (
                        <p className="muted-copy" style={{ marginTop: 8 }}>
                          Matching inventory:{" "}
                          {opportunity.inventoryFit.matchingProducts
                            .map((product) => product.name)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </article>
                ))}

                {!dashboard.opportunities.length && (
                  <div className="empty-state">
                    No high-fit opportunities right now. Keep inventory updated so
                    new buyer demand can match more easily.
                  </div>
                )}
              </div>
            </div>

            <div className="surface-card soft">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Response pipeline</span>
                  <h2>Proposals waiting on buyer action</h2>
                </div>
                <TrendingUp size={18} />
              </div>

              <div className="list">
                {dashboard.responsePipeline.map((item) => (
                  <article key={item._id} className="record-row stacked">
                    <div className="record-main">
                      <div className="record-title">{item.productName}</div>
                      <div className="record-subtitle">
                        Your quote: {item.myResponse?.proposedQuantity} {item.unit} at{" "}
                        {formatCurrency(item.myResponse?.unitPrice)} / {item.unit}
                      </div>
                      <div className="record-subtitle">
                        Buyer needs delivery by {formatDate(item.neededDate)}
                      </div>
                    </div>
                    <div className="button-row">
                      <span className={`status-pill ${toneClass(item.myResponse?.status)}`}>
                        {statusLabel(item.myResponse?.status)}
                      </span>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => navigate("/buyer-requests")}
                      >
                        Review
                      </button>
                    </div>
                  </article>
                ))}

                {!dashboard.responsePipeline.length && (
                  <div className="empty-state">
                    No active responses yet. Answer a buyer request to start building
                    your pipeline.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="two-column">
            <div className="surface-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Low stock watch</span>
                  <h2>Listings that may need replenishment soon</h2>
                </div>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => navigate("/inventory")}
                >
                  Inventory
                </button>
              </div>

              <div className="list">
                {dashboard.lowStockProducts.map((product) => (
                  <article key={product._id} className="record-row">
                    <div className="record-main">
                      <div className="record-title">{product.name}</div>
                      <div className="record-subtitle">
                        {product.quantity} {product.unit} remaining
                      </div>
                    </div>
                    <span className="status-pill pending">Low stock</span>
                  </article>
                ))}

                {!dashboard.lowStockProducts.length && (
                  <div className="empty-state">
                    No low-stock alerts right now. Your active catalog looks healthy.
                  </div>
                )}
              </div>
            </div>

            <div className="surface-card soft">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Recent orders</span>
                  <h2>Orders that still need movement</h2>
                </div>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => navigate("/farmer-orders")}
                >
                  <ShoppingBag size={16} />
                  Open orders
                </button>
              </div>

              <div className="list">
                {dashboard.recentOrders.map((order) => (
                  <article key={order._id} className="record-row">
                    <div className="record-main">
                      <div className="record-title">{order.productId?.name}</div>
                      <div className="record-subtitle">
                        {order.quantity} {order.productId?.unit} for {order.buyerId?.name}
                      </div>
                      <div className="record-subtitle">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div className="record-side">
                      <div className="price-tag">{formatCurrency(order.totalCost)}</div>
                      <span className={`status-pill ${toneClass(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                    </div>
                  </article>
                ))}

                {!dashboard.recentOrders.length && (
                  <div className="empty-state">
                    No active orders right now. Strong responses on the demand board can
                    turn into new order flow quickly.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="surface-card soft">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Growth signal</span>
                <h2>Where this dashboard helps most</h2>
              </div>
              <Sprout size={18} />
            </div>
            <p className="muted-copy">
              Opportunities are ranked with inventory-fit scoring so farmers can focus
              on the requests most likely to convert instead of scanning the whole board manually.
            </p>
          </section>
        </>
      )}
    </AppFrame>
  );
}
