import {
  ArrowRight,
  ClipboardList,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppFrame from "../components/layout/AppFrame";
import { apiFetch, getUser } from "../utils/api";

export default function RequestProduce() {
  const navigate = useNavigate();
  const user = getUser();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    productName: "",
    quantity: "",
    unit: "kg",
    neededDate: "",
    neededTime: "",
    location: user?.location || "",
    qualityGrade: "",
    budgetPerUnit: "",
    preferredDeliveryMode: "either",
    urgency: "priority",
    packagingPreference: "",
    contactName: user?.name || "",
    contactPhone: user?.phone || "",
    contactEmail: user?.email || "",
    notes: "",
  });

  const submitRequest = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiFetch("/requirements", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          budgetPerUnit:
            form.budgetPerUnit === "" ? "" : Number(form.budgetPerUnit),
        }),
      });
      navigate("/my-requests");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppFrame>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">Custom produce request</span>
          <h1>Post a structured sourcing brief and collect comparable farmer offers.</h1>
          <p>
            Capture timing, quality, budget, and logistics in one place so farmers
            can respond with accurate pricing and a realistic fulfillment plan.
          </p>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="card-grid">
        <article className="metric-card">
          <div className="metric-label">Clear brief</div>
          <div className="metric-value">Detailed</div>
          <div className="metric-caption">
            Add quality, packaging, and urgency so farmers know exactly what to quote.
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Response ready</div>
          <div className="metric-value">Flexible</div>
          <div className="metric-caption">
            Farmers can answer with their own quantity, unit price, and earliest date.
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Logistics match</div>
          <div className="metric-value">Aligned</div>
          <div className="metric-caption">
            Pickup or delivery preference is shared upfront before you select a supplier.
          </div>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Requirement form</span>
            <h2>Tell farmers what you need</h2>
          </div>
          <ClipboardList size={20} />
        </div>

        <form className="auth-list" onSubmit={submitRequest}>
          <div className="form-grid">
            <label className="field">
              <span className="field-label">Product name</span>
              <input
                value={form.productName}
                onChange={(event) =>
                  setForm({ ...form, productName: event.target.value })
                }
                placeholder="Tomatoes"
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Quantity</span>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(event) =>
                  setForm({ ...form, quantity: event.target.value })
                }
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Unit</span>
              <select
                value={form.unit}
                onChange={(event) => setForm({ ...form, unit: event.target.value })}
              >
                <option value="kg">Kilogram</option>
                <option value="quintal">Quintal</option>
                <option value="ton">Ton</option>
                <option value="crate">Crate</option>
                <option value="crates">Crates</option>
                <option value="bag">Bag</option>
                <option value="bags">Bags</option>
                <option value="liter">Liter</option>
                <option value="liters">Liters</option>
              </select>
            </label>

            <label className="field">
              <span className="field-label">Needed date</span>
              <input
                type="date"
                value={form.neededDate}
                onChange={(event) =>
                  setForm({ ...form, neededDate: event.target.value })
                }
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Needed time</span>
              <input
                type="time"
                value={form.neededTime}
                onChange={(event) =>
                  setForm({ ...form, neededTime: event.target.value })
                }
              />
            </label>

            <label className="field">
              <span className="field-label">Location</span>
              <input
                value={form.location}
                onChange={(event) =>
                  setForm({ ...form, location: event.target.value })
                }
                placeholder="Town or city"
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Quality grade</span>
              <input
                value={form.qualityGrade}
                onChange={(event) =>
                  setForm({ ...form, qualityGrade: event.target.value })
                }
                placeholder="A grade, export, premium, or flexible"
              />
            </label>

            <label className="field">
              <span className="field-label">Budget per unit</span>
              <input
                type="number"
                min="0"
                value={form.budgetPerUnit}
                onChange={(event) =>
                  setForm({ ...form, budgetPerUnit: event.target.value })
                }
                placeholder="Optional"
              />
            </label>

            <label className="field">
              <span className="field-label">Delivery preference</span>
              <select
                value={form.preferredDeliveryMode}
                onChange={(event) =>
                  setForm({
                    ...form,
                    preferredDeliveryMode: event.target.value,
                  })
                }
              >
                <option value="either">Either pickup or delivery</option>
                <option value="buyer_pickup">Buyer pickup</option>
                <option value="farmer_delivery">Farmer delivery</option>
              </select>
            </label>

            <label className="field">
              <span className="field-label">Urgency</span>
              <select
                value={form.urgency}
                onChange={(event) =>
                  setForm({ ...form, urgency: event.target.value })
                }
              >
                <option value="routine">Routine</option>
                <option value="priority">Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>

            <label className="field">
              <span className="field-label">Packaging preference</span>
              <input
                value={form.packagingPreference}
                onChange={(event) =>
                  setForm({ ...form, packagingPreference: event.target.value })
                }
                placeholder="Crates, bags, pallets, or loose loading"
              />
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              <span className="field-label">Contact name</span>
              <input
                value={form.contactName}
                onChange={(event) =>
                  setForm({ ...form, contactName: event.target.value })
                }
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Contact phone</span>
              <input
                value={form.contactPhone}
                onChange={(event) =>
                  setForm({
                    ...form,
                    contactPhone: event.target.value.replace(/\D/g, ""),
                  })
                }
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Contact email</span>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(event) =>
                  setForm({ ...form, contactEmail: event.target.value })
                }
              />
            </label>
          </div>

          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Quality, packaging, pickup instructions, or delivery notes."
            />
          </label>

          <div className="card-grid">
            <article className="surface-card soft">
              <div className="section-heading compact">
                <div>
                  <span className="eyebrow">Response quality</span>
                  <h2>Sharper pricing and fewer calls</h2>
                </div>
                <ShieldCheck size={18} />
              </div>
              <p className="muted-copy">
                Detailed briefs help farmers respond with practical pricing instead of
                vague follow-up questions.
              </p>
            </article>

            <article className="surface-card soft">
              <div className="section-heading compact">
                <div>
                  <span className="eyebrow">Fulfillment planning</span>
                  <h2>Better delivery coordination</h2>
                </div>
                <Truck size={18} />
              </div>
              <p className="muted-copy">
                Preferred delivery mode and packaging expectations reduce last-minute
                coordination issues once a farmer is selected.
              </p>
            </article>
          </div>

          <div className="button-row">
            <button type="submit" className="button button-primary" disabled={saving}>
              {saving ? "Posting request..." : "Post requirement"}
              {!saving && <ArrowRight size={16} />}
            </button>
          </div>
        </form>
      </section>
    </AppFrame>
  );
}
