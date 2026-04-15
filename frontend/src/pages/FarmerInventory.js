import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import AddProductModal from "../components/AddProductModal";
import { useNavigate } from "react-router-dom";

function FarmerInventory() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const menu = [
    { label: "Dashboard", onClick: () => navigate("/dashboard") },
    { label: "My Inventory", onClick: () => navigate("/inventory"), active: true },
    { label: "Orders", onClick: () => navigate("/farmer-orders") },
    { label: "Insurance", onClick: () => navigate("/insurance") },
    { label: "Marketplace", onClick: () => navigate("/marketplace") }
  ];

  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const fetchProducts = useCallback(async () => {
    const res = await fetch("http://localhost:5000/api/products/my-inventory", {
      headers: { Authorization: "Bearer " + token }
    });
    setProducts(await res.json());
  }, [token]);

  useEffect(() => { 
    fetchProducts(); 
  }, [fetchProducts]);

  const removeProduct = async (id) => {
    if (!window.confirm("Are you sure you want to remove this product?")) return;
    
    await fetch(`http://localhost:5000/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token }
    });
    fetchProducts();
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F3F7F2" }}>
      
      <Sidebar menu={menu} onLogout={() => { localStorage.clear(); navigate("/login"); }} />

      <div style={{ flex: 1 }}>
        <Topbar user={user} onLogout={() => { localStorage.clear(); navigate("/login"); }} />

        <div style={{ padding: "32px 40px" }}>

          <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "32px", fontWeight: "700", color: "#1a2f1a" }}>
                My Inventory
              </h2>
              <p style={{ marginTop: "8px", color: "#6b7280" }}>Manage your farm products</p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "12px 22px",
                background: "linear-gradient(135deg, #2E4F2F 0%, #3d6540 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              ➕ Add Product
            </button>
          </div>

          {showModal && (
            <AddProductModal 
              onClose={() => setShowModal(false)}
              onAdded={fetchProducts}
            />
          )}

          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "32px",
            border: "1px solid #e5e7eb"
          }}>
            <h3 style={{ margin: 0, marginBottom: "24px", fontSize: "20px", fontWeight: "600" }}>
              Your Listed Crops
            </h3>

            {products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
                <p>No products listed yet. Click "Add Product" to start.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {products.map((p) => (
                  <div key={p._id} style={{
                    display: "flex", gap: "18px", alignItems: "center",
                    padding: "18px", border: "1px solid #e5e7eb",
                    borderRadius: "14px", background: "white"
                  }}>
                    <img 
                      src={p.image ? `http://localhost:5000${p.image}` : "https://via.placeholder.com/120?text=No+Image"}
                      alt={p.name}
                      style={{ width: "110px", height: "110px", borderRadius: "12px", objectFit: "cover" }}
                    />

                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, marginBottom: "6px", fontSize: "18px", fontWeight: "600" }}>
                        {p.name}
                      </h4>
                      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", color: "#4b5563", fontSize: "14px" }}>
                        <span><strong>Qty:</strong> {p.quantity} {p.unit}</span>
                        <span><strong>Price:</strong> ₹{p.pricePerUnit}/{p.unit}</span>
                        {p.location && <span><strong>Location:</strong> {p.location}</span>}
                        {p.description && <span><strong>Note:</strong> {p.description}</span>}
                      </div>
                    </div>

                    <button 
                      onClick={() => removeProduct(p._id)}
                      style={{
                        padding: "10px 18px", background: "#fff",
                        color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px",
                        fontWeight: "600", cursor: "pointer"
                      }}
                    >
                      🗑 Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default FarmerInventory;
