import {
  Boxes,
  ClipboardList,
  Megaphone,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppFrame from "../components/layout/AppFrame";
import {
  apiFetch,
  deliveryModeLabel,
  formatCurrency,
  formatDate,
  statusLabel,
} from "../utils/api";

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const headerCell = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #d9e3d3",
  fontSize: 13,
  color: "#49604f",
};

const bodyCell = {
  padding: "12px",
  borderBottom: "1px solid #edf2e8",
  verticalAlign: "top",
};

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [adForm, setAdForm] = useState({
    advertiserName: "",
    campaignName: "",
    placement: "homepage_banner",
    amount: "",
    paymentStatus: "received",
    notes: "",
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/admin/dashboard");
      setDashboard(data);
    } catch (loadError) {
      setError(loadError.message);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    if (!dashboard) return [];

    return [
      {
        label: "Platform users",
        value: dashboard.overview.totalUsers,
        caption: "Admins, farmers, and buyers across the platform.",
      },
      {
        label: "Farmers onboarded",
        value: dashboard.overview.totalFarmers,
        caption: "Supply-side accounts currently registered.",
      },
      {
        label: "Buyers onboarded",
        value: dashboard.overview.totalBuyers,
        caption: "Demand-side accounts currently registered.",
      },
      {
        label: "Active listings",
        value: dashboard.overview.activeListings,
        caption: "Farmer products with stock available right now.",
      },
      {
        label: "Marketplace sales",
        value: formatCurrency(dashboard.revenue.marketplaceSalesValue),
        caption: "Delivered produce value moving through CropCycle.",
      },
      {
        label: "Platform revenue",
        value: formatCurrency(dashboard.revenue.totalPlatformRevenue),
        caption: "Commission, insurance, and ad revenue combined.",
      },
    ];
  }, [dashboard]);

  const submitAdRevenue = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      await apiFetch("/admin/ad-revenue", {
        method: "POST",
        body: JSON.stringify(adForm),
      });
      setAdForm({
        advertiserName: "",
        campaignName: "",
        placement: "homepage_banner",
        amount: "",
        paymentStatus: "received",
        notes: "",
      });
      await loadDashboard();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  const updatePolicyStatus = async (policyId, status) => {
    try {
      await apiFetch(`/admin/insurance/${policyId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await loadDashboard();
    } catch (statusError) {
      setError(statusError.message);
    }
  };

  return (
    <AppFrame>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">Admin control room</span>
          <h1>See buyers, farmers, revenue, insurance, and ad income from one place.</h1>
          <p>
            This dashboard gives the operations team a live view of marketplace
            activity, platform earnings, and the accounts using CropCycle every day.
          </p>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <section className="surface-card">
          <div className="empty-state">Loading admin analytics...</div>
        </section>
      ) : (
        <>
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
                  <span className="eyebrow">Revenue breakdown</span>
                  <h2>Where the money is coming from</h2>
                </div>
              </div>

              <div className="list">
                <article className="record-row">
                  <div className="record-main">
                    <div className="record-title">Marketplace sales value</div>
                    <div className="record-subtitle">
                      Produce sold through completed orders.
                    </div>
                  </div>
                  <div className="price-tag">
                    {formatCurrency(dashboard.revenue.marketplaceSalesValue)}
                  </div>
                </article>

                <article className="record-row">
                  <div className="record-main">
                    <div className="record-title">Marketplace commission</div>
                    <div className="record-subtitle">
                      {(dashboard.revenue.marketplaceCommissionRate * 100).toFixed(0)}% of
                      completed sales.
                    </div>
                  </div>
                  <div className="price-tag">
                    {formatCurrency(dashboard.revenue.marketplaceCommissionRevenue)}
                  </div>
                </article>

                <article className="record-row">
                  <div className="record-main">
                    <div className="record-title">Insurance revenue</div>
                    <div className="record-subtitle">
                      Premiums collected from farmer policy purchases.
                    </div>
                  </div>
                  <div className="price-tag">
                    {formatCurrency(dashboard.revenue.insuranceRevenue)}
                  </div>
                </article>

                <article className="record-row">
                  <div className="record-main">
                    <div className="record-title">Ad revenue</div>
                    <div className="record-subtitle">
                      Paid advertiser campaigns on the website.
                    </div>
                  </div>
                  <div className="price-tag">
                    {formatCurrency(dashboard.revenue.adRevenue)}
                  </div>
                </article>

                <article className="record-row">
                  <div className="record-main">
                    <div className="record-title">Total platform revenue</div>
                    <div className="record-subtitle">
                      Combined operational income across the platform.
                    </div>
                  </div>
                  <div className="price-tag">
                    {formatCurrency(dashboard.revenue.totalPlatformRevenue)}
                  </div>
                </article>
              </div>
            </div>

            <div className="surface-card soft">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Add ad revenue</span>
                  <h2>Record a new website ad campaign</h2>
                </div>
              </div>

              <form className="auth-list" onSubmit={submitAdRevenue}>
                <label className="field">
                  <span className="field-label">Advertiser</span>
                  <input
                    value={adForm.advertiserName}
                    onChange={(event) =>
                      setAdForm({ ...adForm, advertiserName: event.target.value })
                    }
                    placeholder="Advertiser or company name"
                    required
                  />
                </label>

                <label className="field">
                  <span className="field-label">Campaign</span>
                  <input
                    value={adForm.campaignName}
                    onChange={(event) =>
                      setAdForm({ ...adForm, campaignName: event.target.value })
                    }
                    placeholder="Campaign title"
                    required
                  />
                </label>

                <label className="field">
                  <span className="field-label">Placement</span>
                  <select
                    value={adForm.placement}
                    onChange={(event) =>
                      setAdForm({ ...adForm, placement: event.target.value })
                    }
                  >
                    <option value="homepage_banner">Homepage banner</option>
                    <option value="marketplace_spotlight">Marketplace spotlight</option>
                    <option value="dashboard_banner">Dashboard banner</option>
                    <option value="newsletter">Newsletter</option>
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">Amount</span>
                  <input
                    type="number"
                    min="0"
                    value={adForm.amount}
                    onChange={(event) =>
                      setAdForm({ ...adForm, amount: event.target.value })
                    }
                    placeholder="Revenue amount"
                    required
                  />
                </label>

                <label className="field">
                  <span className="field-label">Payment status</span>
                  <select
                    value={adForm.paymentStatus}
                    onChange={(event) =>
                      setAdForm({ ...adForm, paymentStatus: event.target.value })
                    }
                  >
                    <option value="received">Received</option>
                    <option value="pending">Pending</option>
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">Notes</span>
                  <textarea
                    rows={4}
                    value={adForm.notes}
                    onChange={(event) =>
                      setAdForm({ ...adForm, notes: event.target.value })
                    }
                    placeholder="Optional campaign notes"
                  />
                </label>

                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? "Saving revenue..." : "Save ad revenue"}
                </button>
              </form>
            </div>
          </section>

          <section className="two-column">
            <div className="surface-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">People</span>
                  <h2>Farmers and buyers on the platform</h2>
                </div>
              </div>

              <div className="list">
                <article className="record-row">
                  <div className="record-main">
                    <div className="record-title">
                      <Users size={16} /> Farmers
                    </div>
                    <div className="record-subtitle">
                      {dashboard.farmers.length} registered supply accounts
                    </div>
                  </div>
                </article>

                <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={headerCell}>Name</th>
                        <th style={headerCell}>Phone</th>
                        <th style={headerCell}>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.farmers.map((farmer) => (
                        <tr key={farmer.id}>
                          <td style={bodyCell}>{farmer.name}</td>
                          <td style={bodyCell}>{farmer.phone}</td>
                          <td style={bodyCell}>{farmer.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <article className="record-row" style={{ marginTop: 12 }}>
                  <div className="record-main">
                    <div className="record-title">
                      <Users size={16} /> Buyers
                    </div>
                    <div className="record-subtitle">
                      {dashboard.buyers.length} registered demand accounts
                    </div>
                  </div>
                </article>

                <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={headerCell}>Name</th>
                        <th style={headerCell}>Phone</th>
                        <th style={headerCell}>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.buyers.map((buyer) => (
                        <tr key={buyer.id}>
                          <td style={bodyCell}>{buyer.name}</td>
                          <td style={bodyCell}>{buyer.phone}</td>
                          <td style={bodyCell}>{buyer.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="surface-card soft">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Recent orders</span>
                  <h2>Marketplace transactions</h2>
                </div>
              </div>

              <div className="list">
                {dashboard.orders.map((order) => (
                  <article key={order._id} className="record-row stacked">
                    <div className="record-main">
                      <div className="record-title">
                        <ShoppingBag size={16} /> {order.productId?.name}
                      </div>
                      <div className="record-subtitle">
                        Buyer: {order.buyerId?.name} | Farmer: {order.farmerId?.name}
                      </div>
                      <div className="record-subtitle">
                        {order.quantity} {order.productId?.unit} |{" "}
                        {deliveryModeLabel(order.deliveryMode)}
                      </div>
                    </div>
                    <div className="button-row">
                      <span className="price-tag">{formatCurrency(order.totalCost)}</span>
                      <span className="status-pill info">{statusLabel(order.status)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="two-column">
            <div className="surface-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Demand board</span>
                  <h2>Buyer custom order requests</h2>
                </div>
              </div>

              <div className="list">
                {dashboard.requirements.map((request) => (
                  <article key={request._id} className="record-row stacked">
                    <div className="record-main">
                      <div className="record-title">
                        <ClipboardList size={16} /> {request.productName}
                      </div>
                      <div className="record-subtitle">
                        {request.quantity} {request.unit} needed by{" "}
                        {formatDate(request.neededDate)}
                      </div>
                      <div className="record-subtitle">
                        Preference: {deliveryModeLabel(request.preferredDeliveryMode)}
                      </div>
                      {request.responseCount ? (
                        <div className="record-subtitle">
                          {request.responseCount} farmer response
                          {request.responseCount === 1 ? "" : "s"} received
                        </div>
                      ) : null}
                      {request.selectedResponse?.earliestFulfillmentDate && (
                        <div className="record-subtitle">
                          Selected timeline: {formatDate(request.selectedResponse.earliestFulfillmentDate)}
                        </div>
                      )}
                    </div>
                    <div className="button-row">
                      <span className="status-pill info">{statusLabel(request.status)}</span>
                      {request.selectedResponse?.farmerName && (
                        <span className="record-subtitle">
                          Matched with {request.selectedResponse.farmerName}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="surface-card soft">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Insurance desk</span>
                  <h2>Approve or reject farmer policies</h2>
                </div>
              </div>

              <div className="list">
                {dashboard.policies.map((policy) => (
                  <article key={policy._id} className="record-row stacked">
                    <div className="record-main">
                      <div className="record-title">
                        <ShieldCheck size={16} /> {policy.planName}
                      </div>
                      <div className="record-subtitle">
                        {policy.farmerId?.name} | {policy.cropName} |{" "}
                        {formatCurrency(policy.premiumAmount)}
                      </div>
                      <div className="record-subtitle">
                        Applied on {formatDate(policy.createdAt)}
                      </div>
                    </div>
                    <div className="button-row">
                      <span className="status-pill pending">{statusLabel(policy.status)}</span>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => updatePolicyStatus(policy._id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => updatePolicyStatus(policy._id, "rejected")}
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="surface-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Catalog and ads</span>
                <h2>Listings and paid promotion activity</h2>
              </div>
            </div>

            <div className="two-column">
              <div className="list">
                {dashboard.products.map((product) => (
                  <article key={product._id} className="record-row">
                    <div className="record-main">
                      <div className="record-title">
                        <Boxes size={16} /> {product.name}
                      </div>
                      <div className="record-subtitle">
                        {product.farmerId?.name} | {product.location || product.farmerId?.location}
                      </div>
                    </div>
                    <div className="record-side">
                      <div className="price-tag">
                        {formatCurrency(product.pricePerUnit)} / {product.unit}
                      </div>
                      <div className="record-subtitle">{product.quantity} in stock</div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="list">
                {dashboard.adRevenueEntries.map((entry) => (
                  <article key={entry._id} className="record-row">
                    <div className="record-main">
                      <div className="record-title">
                        <Megaphone size={16} /> {entry.campaignName}
                      </div>
                      <div className="record-subtitle">
                        {entry.advertiserName} | {statusLabel(entry.placement)}
                      </div>
                    </div>
                    <div className="record-side">
                      <div className="price-tag">{formatCurrency(entry.amount)}</div>
                      <div className="record-subtitle">
                        {statusLabel(entry.paymentStatus)}
                      </div>
                    </div>
                  </article>
                ))}

                {!dashboard.adRevenueEntries.length && (
                  <div className="empty-state">
                    No ad revenue entries yet. Add the first advertiser campaign above.
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </AppFrame>
  );
}
