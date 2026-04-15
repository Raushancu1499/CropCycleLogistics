import {
  ArrowRight,
  LoaderCircle,
  Package,
  Search,
  Store,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppFrame from "../components/layout/AppFrame";
import {
  apiFetch,
  formatCurrency,
  getUser,
  mediaUrl,
} from "../utils/api";

export default function Marketplace() {
  const navigate = useNavigate();
  const user = getUser();
  const isBuyer = user?.role === "buyer";
  const isFarmer = user?.role === "farmer";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    unit: "all",
    sort: "latest",
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderForm, setOrderForm] = useState({
    quantity: "",
    deliveryMode: "buyer_pickup",
    distanceKm: "",
  });
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/products");
        setProducts(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const next = [...products].filter((product) => {
      const matchesSearch =
        !search ||
        product.name?.toLowerCase().includes(search) ||
        product.location?.toLowerCase().includes(search) ||
        product.farmerId?.name?.toLowerCase().includes(search);
      const matchesUnit = filters.unit === "all" || product.unit === filters.unit;
      return matchesSearch && matchesUnit;
    });

    if (filters.sort === "price-low") {
      next.sort((a, b) => Number(a.pricePerUnit) - Number(b.pricePerUnit));
    } else if (filters.sort === "price-high") {
      next.sort((a, b) => Number(b.pricePerUnit) - Number(a.pricePerUnit));
    } else {
      next.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return next;
  }, [filters, products]);

  const marketplaceStats = useMemo(
    () => [
      {
        label: "Active listings",
        value: products.length,
        caption: "Products currently visible to buyers.",
      },
      {
        label: "Farmer network",
        value: new Set(products.map((item) => item.farmerId?._id)).size,
        caption: "Distinct farmers listed in the marketplace.",
      },
      {
        label: "Locations covered",
        value: new Set(products.map((item) => item.location || item.farmerId?.location)).size,
        caption: "Trading areas represented in the current catalog.",
      },
    ],
    [products]
  );

  const placeOrder = async () => {
    try {
      setOrderLoading(true);
      await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          productId: selectedProduct._id,
          quantity: Number(orderForm.quantity),
          deliveryMode: orderForm.deliveryMode,
          distanceKm:
            orderForm.deliveryMode === "farmer_delivery"
              ? Number(orderForm.distanceKm || 0)
              : 0,
        }),
      });
      setSelectedProduct(null);
      setOrderForm({ quantity: "", deliveryMode: "buyer_pickup", distanceKm: "" });
      navigate("/buyer-orders");
    } catch (placeError) {
      setError(placeError.message);
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <AppFrame>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">Marketplace</span>
          <h1>Discover fresh crop listings with cleaner filters and clearer pricing.</h1>
          <p>
            Browse farmer inventory by location, compare price per unit, and place
            orders with pickup or delivery planning.
          </p>
          <div className="button-row">
            {isBuyer ? (
              <button
                type="button"
                className="button button-primary"
                onClick={() => navigate("/request-produce")}
              >
                Post demand request
                <ArrowRight size={16} />
              </button>
            ) : isFarmer ? (
              <button
                type="button"
                className="button button-primary"
                onClick={() => navigate("/inventory")}
              >
                Manage my listings
                <Package size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="button button-primary"
                onClick={() => navigate("/admin-dashboard")}
              >
                Review platform data
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="card-grid">
        {marketplaceStats.map((metric) => (
          <article key={metric.label} className="metric-card">
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-caption">{metric.caption}</div>
          </article>
        ))}
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Browse catalog</span>
            <h2>Find crops that match your sourcing plan</h2>
          </div>
        </div>

        <div className="form-grid">
          <label className="field">
            <span className="field-label">Search</span>
            <div className="detail-stack" style={{ alignItems: "center" }}>
              <Search size={16} />
              <input
                value={filters.search}
                onChange={(event) =>
                  setFilters({ ...filters, search: event.target.value })
                }
                placeholder="Product, farmer, or location"
              />
            </div>
          </label>

          <label className="field">
            <span className="field-label">Unit</span>
            <select
              value={filters.unit}
              onChange={(event) =>
                setFilters({ ...filters, unit: event.target.value })
              }
            >
              <option value="all">All units</option>
              <option value="kg">Kilogram</option>
              <option value="quintal">Quintal</option>
              <option value="ton">Ton</option>
              <option value="crate">Crate</option>
              <option value="bag">Bag</option>
              <option value="liter">Liter</option>
            </select>
          </label>

          <label className="field">
            <span className="field-label">Sort by</span>
            <select
              value={filters.sort}
              onChange={(event) =>
                setFilters({ ...filters, sort: event.target.value })
              }
            >
              <option value="latest">Latest listings</option>
              <option value="price-low">Lowest price</option>
              <option value="price-high">Highest price</option>
            </select>
          </label>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="product-grid">
        {loading ? (
          <div className="empty-state">
            <LoaderCircle size={18} className="spin" />
            Loading marketplace inventory...
          </div>
        ) : (
          filteredProducts.map((product) => (
            <article key={product._id} className="product-card">
              {product.image ? (
                <img
                  className="product-image"
                  src={mediaUrl(product.image)}
                  alt={product.name}
                />
              ) : (
                <div className="product-image product-placeholder">
                  {product.name}
                </div>
              )}
              <div className="product-body">
                <div className="button-row">
                  <span className="chip">{product.unit}</span>
                  {Number(product.quantity) <= 10 && (
                    <span className="chip low-stock">Low stock</span>
                  )}
                </div>

                <div>
                  <h3>{product.name}</h3>
                  <p className="muted-copy">
                    {product.farmerId?.name} in {product.location || product.farmerId?.location}
                  </p>
                </div>

                {product.description && <p className="muted-copy">{product.description}</p>}

                <div className="button-row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div className="price-tag">
                      {formatCurrency(product.pricePerUnit)} / {product.unit}
                    </div>
                    <div className="record-subtitle">
                      {product.quantity} {product.unit} available
                    </div>
                  </div>
                  {isBuyer ? (
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => setSelectedProduct(product)}
                    >
                      Order now
                      <Store size={16} />
                    </button>
                  ) : isFarmer ? (
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => navigate("/inventory")}
                    >
                      Manage listing
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => navigate("/admin-dashboard")}
                    >
                      Open admin view
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}

        {!loading && !filteredProducts.length && (
          <div className="empty-state">
            No products match your current filters. Try a different search or post a
            new demand request.
          </div>
        )}
      </section>

      {selectedProduct && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="section-heading compact">
              <div>
                <span className="eyebrow">Place order</span>
                <h2>{selectedProduct.name}</h2>
              </div>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setSelectedProduct(null)}
              >
                Close
              </button>
            </div>

            <div className="form-grid">
              <label className="field">
                <span className="field-label">Quantity</span>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.quantity}
                  value={orderForm.quantity}
                  onChange={(event) =>
                    setOrderForm({ ...orderForm, quantity: event.target.value })
                  }
                />
              </label>

              <label className="field">
                <span className="field-label">Delivery mode</span>
                <select
                  value={orderForm.deliveryMode}
                  onChange={(event) =>
                    setOrderForm({
                      ...orderForm,
                      deliveryMode: event.target.value,
                    })
                  }
                >
                  <option value="buyer_pickup">Buyer pickup</option>
                  <option value="farmer_delivery">Farmer delivery</option>
                </select>
              </label>

              {orderForm.deliveryMode === "farmer_delivery" && (
                <label className="field">
                  <span className="field-label">Distance in km</span>
                  <input
                    type="number"
                    min="0"
                    value={orderForm.distanceKm}
                    onChange={(event) =>
                      setOrderForm({ ...orderForm, distanceKm: event.target.value })
                    }
                  />
                </label>
              )}
            </div>

            <div className="surface-card soft" style={{ marginTop: 18 }}>
              <div className="button-row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div className="metric-label">Price</div>
                  <div className="price-tag">
                    {formatCurrency(selectedProduct.pricePerUnit)} / {selectedProduct.unit}
                  </div>
                </div>
                <div>
                  <div className="metric-label">Logistics mode</div>
                  <div className="detail-stack">
                    <Truck size={16} />
                    {orderForm.deliveryMode === "farmer_delivery"
                      ? "Farmer delivery"
                      : "Buyer pickup"}
                  </div>
                </div>
              </div>
            </div>

            <div className="button-row" style={{ marginTop: 18 }}>
              <button
                type="button"
                className="button button-primary"
                onClick={placeOrder}
                disabled={orderLoading || !orderForm.quantity}
              >
                {orderLoading ? "Placing order..." : "Confirm order"}
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setSelectedProduct(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AppFrame>
  );
}
