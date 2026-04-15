import { LoaderCircle, MapPin, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch, formatCurrency, mediaUrl } from "../utils/api";

export default function FarmerProfileModal({ farmerId, onClose }) {
  const [farmer, setFarmer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadFarmerProfile = async () => {
      try {
        const data = await apiFetch(`/farmers/${farmerId}`);
        if (active) {
          setFarmer(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      }
    };

    loadFarmerProfile();

    return () => {
      active = false;
    };
  }, [farmerId]);

  const placeOrder = async () => {
    try {
      setPlacingOrder(true);
      setError("");
      await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          productId: selectedProduct._id,
          quantity: Number(quantity),
          deliveryMode: "buyer_pickup",
        }),
      });
      setSelectedProduct(null);
      setQuantity("");
    } catch (placeError) {
      setError(placeError.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Farmer profile</span>
            <h2>{farmer?.name || "Loading farmer details"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!farmer && !error && (
          <div className="empty-state">
            <LoaderCircle size={18} className="spin" />
            Loading farmer details...
          </div>
        )}

        {error && <div className="alert error">{error}</div>}

        {farmer && (
          <>
            <div className="detail-stack">
              <div className="inline-meta">
                <MapPin size={14} />
                {farmer.location}
              </div>
              <div className="inline-meta">
                <Phone size={14} />
                {farmer.phone}
              </div>
            </div>

            {!selectedProduct ? (
              <div className="list" style={{ marginTop: 18 }}>
                {farmer.products?.length ? (
                  farmer.products.map((product) => (
                    <article key={product._id} className="record-row stacked">
                      <div className="record-main">
                        <div className="record-title">{product.name}</div>
                        <div className="record-subtitle">
                          {product.quantity} {product.unit} available
                        </div>
                        {product.description && (
                          <p className="muted-copy">{product.description}</p>
                        )}
                      </div>
                      <div className="record-side">
                        <img
                          className="tiny-product"
                          src={
                            product.image
                              ? mediaUrl(product.image)
                              : "https://via.placeholder.com/120x90?text=Crop"
                          }
                          alt={product.name}
                        />
                        <div className="price-tag">
                          {formatCurrency(product.pricePerUnit)} / {product.unit}
                        </div>
                      </div>
                      <div className="button-row">
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => setSelectedProduct(product)}
                        >
                          Order this crop
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">No active listings from this farmer.</div>
                )}
              </div>
            ) : (
              <div className="surface-card soft" style={{ marginTop: 18 }}>
                <div className="record-title">{selectedProduct.name}</div>
                <div className="record-subtitle">
                  {formatCurrency(selectedProduct.pricePerUnit)} / {selectedProduct.unit}
                </div>

                <label className="field" style={{ marginTop: 14 }}>
                  <span className="field-label">Quantity</span>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    min="1"
                    max={selectedProduct.quantity}
                    placeholder={`Up to ${selectedProduct.quantity}`}
                  />
                </label>

                <div className="button-row" style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={placeOrder}
                    disabled={placingOrder || !quantity}
                  >
                    {placingOrder ? "Placing..." : "Confirm order"}
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => {
                      setSelectedProduct(null);
                      setQuantity("");
                      setError("");
                    }}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
