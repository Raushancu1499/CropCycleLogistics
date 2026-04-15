import { LoaderCircle, PackagePlus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppFrame from "../components/layout/AppFrame";
import {
  apiFetch,
  formatCurrency,
  getUser,
  mediaUrl,
} from "../utils/api";

const createInitialForm = (location = "") => ({
  name: "",
  quantity: "",
  unit: "kg",
  pricePerUnit: "",
  description: "",
  location,
  image: null,
});

export default function Inventory() {
  const user = getUser();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState(createInitialForm(user?.location || ""));
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/products/my");
      setProducts(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setFeedback({ type: "error", message: loadError.message });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const metrics = useMemo(() => {
    const lowStock = products.filter((item) => Number(item.quantity) <= 10).length;
    const catalogValue = products.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0) * Number(item.pricePerUnit || 0),
      0
    );

    return [
      {
        label: "Active listings",
        value: products.length,
        caption: "Crop listings currently visible in the marketplace.",
      },
      {
        label: "Low-stock items",
        value: lowStock,
        caption: "Listings at 10 units or below that may need a refresh.",
      },
      {
        label: "Catalog value",
        value: formatCurrency(catalogValue),
        caption: "Estimated gross listing value across current inventory.",
      },
    ];
  }, [products]);

  const resetForm = () => {
    setForm(createInitialForm(user?.location || ""));
  };

  const addProduct = async () => {
    if (!form.name || !form.quantity || !form.pricePerUnit) {
      setFeedback({ type: "error", message: "Fill in the required product fields first." });
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("quantity", form.quantity);
    formData.append("unit", form.unit);
    formData.append("pricePerUnit", form.pricePerUnit);
    formData.append("description", form.description);
    formData.append("location", form.location);
    if (form.image) {
      formData.append("image", form.image);
    }

    try {
      setSaving(true);
      setFeedback({ type: "", message: "" });
      await apiFetch("/products", { method: "POST", body: formData });
      setFeedback({ type: "success", message: "Product added to your inventory." });
      setFormVisible(false);
      resetForm();
      await loadInventory();
    } catch (saveError) {
      setFeedback({ type: "error", message: saveError.message });
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product from your inventory?")) {
      return;
    }

    try {
      await apiFetch(`/products/${id}`, { method: "DELETE" });
      setFeedback({ type: "success", message: "Product removed from inventory." });
      await loadInventory();
    } catch (deleteError) {
      setFeedback({ type: "error", message: deleteError.message });
    }
  };

  return (
    <AppFrame>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">Inventory</span>
          <h1>Keep your crop listings fresh, priced clearly, and ready for buyers.</h1>
          <p>
            Review current stock, watch for low quantity items, and publish new
            listings without leaving your operations workspace.
          </p>
          <div className="button-row">
            <button
              type="button"
              className="button button-primary"
              onClick={() => setFormVisible(true)}
            >
              Add product
              <PackagePlus size={16} />
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

      {feedback.message ? <div className={`alert ${feedback.type}`}>{feedback.message}</div> : null}

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Current listings</span>
            <h2>Products available for buyers</h2>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <LoaderCircle size={18} className="spin" />
            Loading inventory...
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <article key={product._id} className="product-card">
                {product.image ? (
                  <img
                    className="product-image"
                    src={mediaUrl(product.image)}
                    alt={product.name}
                  />
                ) : (
                  <div className="product-image product-placeholder">No image available</div>
                )}

                <div className="product-body">
                  <div className="button-row">
                    <span className="chip">{product.unit}</span>
                    {Number(product.quantity) <= 10 ? (
                      <span className="chip low-stock">Low stock</span>
                    ) : null}
                  </div>

                  <div>
                    <h3>{product.name}</h3>
                    <p className="muted-copy">{product.location || user?.location}</p>
                  </div>

                  {product.description ? <p className="muted-copy">{product.description}</p> : null}

                  <div className="button-row inventory-card-footer">
                    <div>
                      <div className="price-tag">
                        {formatCurrency(product.pricePerUnit)} / {product.unit}
                      </div>
                      <div className="record-subtitle">
                        {product.quantity} {product.unit} available
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button button-danger"
                      onClick={() => deleteProduct(product._id)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {!products.length ? (
              <div className="empty-state">
                No products listed yet. Add a crop to make it visible in the
                marketplace.
              </div>
            ) : null}
          </div>
        )}
      </section>

      {formVisible ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="section-heading compact">
              <div>
                <span className="eyebrow">New listing</span>
                <h2>Add product</h2>
              </div>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setFormVisible(false);
                  resetForm();
                }}
              >
                Close
              </button>
            </div>

            <div className="form-grid">
              <label className="field">
                <span className="field-label">Product name</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Product name"
                />
              </label>

              <label className="field">
                <span className="field-label">Quantity</span>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, quantity: event.target.value }))
                  }
                  placeholder="Available quantity"
                />
              </label>

              <label className="field">
                <span className="field-label">Unit</span>
                <select
                  value={form.unit}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, unit: event.target.value }))
                  }
                >
                  <option value="kg">Kilogram</option>
                  <option value="quintal">Quintal</option>
                  <option value="ton">Ton</option>
                </select>
              </label>

              <label className="field">
                <span className="field-label">Price per unit</span>
                <input
                  type="number"
                  min="0"
                  value={form.pricePerUnit}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      pricePerUnit: event.target.value,
                    }))
                  }
                  placeholder="Price"
                />
              </label>

              <label className="field">
                <span className="field-label">Location</span>
                <input
                  value={form.location}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, location: event.target.value }))
                  }
                  placeholder="Marketplace location"
                />
              </label>

              <label className="field">
                <span className="field-label">Image</span>
                <input
                  type="file"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      image: event.target.files?.[0] || null,
                    }))
                  }
                />
              </label>
            </div>

            <label className="field">
              <span className="field-label">Description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Quality, variety, storage notes, or packaging details."
              />
            </label>

            <div className="button-row" style={{ marginTop: 18 }}>
              <button
                type="button"
                className="button button-primary"
                onClick={addProduct}
                disabled={saving}
              >
                {saving ? "Saving product..." : "Add product"}
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setFormVisible(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppFrame>
  );
}
