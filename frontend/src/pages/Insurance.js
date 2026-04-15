import { Download, FileBadge2, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppFrame from "../components/layout/AppFrame";
import {
  API_BASE_URL,
  apiFetch,
  formatCurrency,
  formatDate,
  getToken,
  statusLabel,
} from "../utils/api";

const insurancePlans = [
  {
    name: "Kharif Crop Protection",
    premiumAmount: 499,
    coverage: "Floods, storms, and pest attacks for rainy-season crops.",
  },
  {
    name: "Rabi Crop Safety",
    premiumAmount: 399,
    coverage: "Drought, frost, and winter crop damage protection.",
  },
  {
    name: "Premium Full Coverage",
    premiumAmount: 899,
    coverage: "Broader disaster coverage for high-value crop cycles.",
  },
];

const toneClass = (status) => {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "pending";
};

export default function Insurance() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    planName: insurancePlans[0].name,
    cropName: "",
    areaSize: "",
    disasterType: "",
    claimAmount: "",
  });

  const selectedPlan = useMemo(
    () => insurancePlans.find((plan) => plan.name === form.planName) || insurancePlans[0],
    [form.planName]
  );

  const loadPolicies = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/insurance");
      setPolicies(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const summary = useMemo(
    () => ({
      total: policies.length,
      pending: policies.filter((item) => item.status === "pending").length,
      approved: policies.filter((item) => item.status === "approved").length,
      premiumPaid: policies.reduce(
        (sum, item) => sum + Number(item.premiumAmount || 0),
        0
      ),
    }),
    [policies]
  );

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiFetch("/insurance/apply", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          claimAmount: Number(form.claimAmount),
        }),
      });
      setForm({
        planName: insurancePlans[0].name,
        cropName: "",
        areaSize: "",
        disasterType: "",
        claimAmount: "",
      });
      await loadPolicies();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  const downloadPolicy = async (policyId, policyNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/insurance/download/${policyId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!response.ok) {
        throw new Error("Unable to download policy right now");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${policyNumber || "policy"}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message);
    }
  };

  return (
    <AppFrame>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">Insurance center</span>
          <h1>Buy crop protection plans and track policy decisions from one place.</h1>
          <p>
            Choose a plan, submit crop details, and keep policy certificates available
            next to your daily operations.
          </p>
        </div>
      </section>

      <section className="card-grid">
        <article className="metric-card">
          <div className="metric-label">Policies filed</div>
          <div className="metric-value">{summary.total}</div>
          <div className="metric-caption">Applications logged in the system.</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Pending review</div>
          <div className="metric-value">{summary.pending}</div>
          <div className="metric-caption">Policies still under admin review.</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Approved</div>
          <div className="metric-value">{summary.approved}</div>
          <div className="metric-caption">Policies cleared for certificate download.</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Premium paid</div>
          <div className="metric-value">{formatCurrency(summary.premiumPaid)}</div>
          <div className="metric-caption">Total insurance premium value submitted.</div>
        </article>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="two-column">
        <form className="surface-card" onSubmit={submit}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">New policy</span>
              <h2>Apply for insurance coverage</h2>
            </div>
            <ShieldCheck size={24} />
          </div>

          <div className="form-grid">
            <label className="field">
              <span className="field-label">Plan</span>
              <select
                value={form.planName}
                onChange={(event) =>
                  setForm({ ...form, planName: event.target.value })
                }
              >
                {insurancePlans.map((plan) => (
                  <option key={plan.name} value={plan.name}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field-label">Crop name</span>
              <input
                value={form.cropName}
                onChange={(event) =>
                  setForm({ ...form, cropName: event.target.value })
                }
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Area size</span>
              <input
                value={form.areaSize}
                onChange={(event) =>
                  setForm({ ...form, areaSize: event.target.value })
                }
                placeholder="e.g. 4 acres"
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Disaster type</span>
              <select
                value={form.disasterType}
                onChange={(event) =>
                  setForm({ ...form, disasterType: event.target.value })
                }
                required
              >
                <option value="">Select cause</option>
                <option value="Flood">Flood</option>
                <option value="Drought">Drought</option>
                <option value="Storm">Storm</option>
                <option value="Pest">Pest attack</option>
                <option value="Fire">Fire</option>
              </select>
            </label>

            <label className="field">
              <span className="field-label">Claim amount</span>
              <input
                type="number"
                value={form.claimAmount}
                onChange={(event) =>
                  setForm({ ...form, claimAmount: event.target.value })
                }
                required
              />
            </label>
          </div>

          <div className="surface-card soft">
            <div className="metric-label">Selected plan</div>
            <div className="record-title">{selectedPlan.name}</div>
            <div className="price-tag">{formatCurrency(selectedPlan.premiumAmount)}</div>
            <p className="muted-copy">{selectedPlan.coverage}</p>
          </div>

          <div className="button-row" style={{ marginTop: 18 }}>
            <button type="submit" className="button button-primary" disabled={saving}>
              {saving ? "Submitting..." : "Submit application"}
            </button>
          </div>
        </form>

        <section className="surface-card soft">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Policy records</span>
              <h2>Existing applications</h2>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <LoaderCircle size={18} className="spin" />
              Loading policy records...
            </div>
          ) : (
            <div className="list">
              {policies.map((policy) => (
                <article key={policy._id} className="record-row stacked">
                  <div className="record-main">
                    <div className="record-title">{policy.cropName}</div>
                    <div className="record-subtitle">
                      {policy.policyNumber} · {policy.planName}
                    </div>
                    <div className="record-subtitle">
                      {policy.areaSize} · {policy.disasterType} · {formatDate(policy.createdAt)}
                    </div>
                    <div className="record-subtitle">
                      Claim {formatCurrency(policy.claimAmount)} · Premium{" "}
                      {formatCurrency(policy.premiumAmount)}
                    </div>
                  </div>
                  <div className="button-row">
                    <span className={`status-pill ${toneClass(policy.status)}`}>
                      {statusLabel(policy.status)}
                    </span>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() =>
                        downloadPolicy(policy._id, policy.policyNumber)
                      }
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </article>
              ))}

              {!policies.length && (
                <div className="empty-state">
                  <FileBadge2 size={18} />
                  No insurance records yet. Submit a policy application to start tracking it.
                </div>
              )}
            </div>
          )}
        </section>
      </section>
    </AppFrame>
  );
}
