import { ArrowRight, MapPin, Phone, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getHomeRoute, saveSession } from "../utils/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: "farmer",
    name: "",
    phone: "",
    email: "",
    location: "",
    adminAccessKey: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.role === "admin" && !form.adminAccessKey.trim()) {
      setError("Admin access key is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          role: form.role,
          name: form.name,
          phone: form.phone,
          email: form.email,
          location: form.location,
          adminAccessKey: form.adminAccessKey,
          password: form.password,
        }),
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
          <h1>Create a supply network that feels organized from day one.</h1>
          <p>
            Whether you grow, source, or buy produce, CropCycle brings listings,
            demand requests, order flow, and operational alerts together.
          </p>
        </div>

        <div className="auth-list">
          <div className="auth-list-item">Farmers get cleaner inventory and revenue tracking.</div>
          <div className="auth-list-item">Buyers can post demand and follow up faster.</div>
          <div className="auth-list-item">Admins unlock full operational and revenue visibility.</div>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Get started</span>
              <h2>Create your account</h2>
            </div>
            <UserPlus size={30} />
          </div>

          {error && <div className="alert error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="split-actions">
              <button
                type="button"
                className={`button ${
                  form.role === "farmer" ? "button-primary" : "button-secondary"
                }`}
                onClick={() => setForm({ ...form, role: "farmer" })}
              >
                Farmer
              </button>
              <button
                type="button"
                className={`button ${
                  form.role === "buyer" ? "button-primary" : "button-secondary"
                }`}
                onClick={() => setForm({ ...form, role: "buyer" })}
              >
                Buyer
              </button>
              <button
                type="button"
                className={`button ${
                  form.role === "admin" ? "button-primary" : "button-secondary"
                }`}
                onClick={() => setForm({ ...form, role: "admin" })}
              >
                Admin
              </button>
            </div>

            <label className="field">
              <span className="field-label">Full name</span>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Enter your full name"
                required
              />
            </label>

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
              <span className="field-label">Location</span>
              <div className="detail-stack" style={{ alignItems: "center" }}>
                <MapPin size={16} />
                <input
                  value={form.location}
                  onChange={(event) =>
                    setForm({ ...form, location: event.target.value })
                  }
                  placeholder="Village, town, or city"
                  required
                />
              </div>
            </label>

            <label className="field">
              <span className="field-label">Email (optional)</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="name@example.com"
              />
            </label>

            {form.role === "admin" && (
              <label className="field">
                <span className="field-label">Admin access key</span>
                <input
                  value={form.adminAccessKey}
                  onChange={(event) =>
                    setForm({ ...form, adminAccessKey: event.target.value })
                  }
                  placeholder="Enter the platform admin access key"
                  required
                />
              </label>
            )}

            <label className="field">
              <span className="field-label">Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                placeholder="Minimum 6 characters"
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Confirm password</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm({ ...form, confirmPassword: event.target.value })
                }
                placeholder="Re-enter password"
                required
              />
            </label>

            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="inline-action-row">
            <ShieldCheck size={14} />
            Already registered?
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
