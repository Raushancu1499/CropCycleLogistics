import { ArrowRight, Lock, Phone, Sprout } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getHomeRoute, saveSession } from "../utils/api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      saveSession(data);
      navigate(getHomeRoute(data.user));
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="auth-copy">
          <span className="brand-mark">CropCycle Logistics</span>
          <h1>Move farm supply with better visibility, matching, and less waste.</h1>
          <p>
            Track marketplace listings, demand requests, orders, insurance claims,
            logistics updates, and admin reporting from one place.
          </p>
        </div>

        <div className="auth-list">
          <div className="auth-list-item">Buyer demand board for faster crop matching.</div>
          <div className="auth-list-item">Farmer inventory, order flow, and low-stock signals.</div>
          <div className="auth-list-item">Admin visibility across users, policies, revenue, and ads.</div>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Welcome back</span>
              <h2>Sign in to your workspace</h2>
            </div>
            <Sprout size={30} />
          </div>

          {error && <div className="alert error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="field">
              <span className="field-label">Phone number</span>
              <div className="detail-stack" style={{ alignItems: "center" }}>
                <Phone size={16} />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: event.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="Enter your mobile number"
                  required
                />
              </div>
            </label>

            <label className="field">
              <span className="field-label">Password</span>
              <div className="detail-stack" style={{ alignItems: "center" }}>
                <Lock size={16} />
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                  placeholder="Enter your password"
                  required
                />
              </div>
            </label>

            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="inline-action-row">
            New to CropCycle Logistics?
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/register")}
            >
              Create account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
