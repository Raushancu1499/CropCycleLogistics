import React, { useState } from "react";

export default function AddProductModal({ onClose, onAdded }) {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    quantity: "",
    unit: "kg",
    pricePerUnit: "",
    description: "",
    location: "",
    image: null,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.quantity || !form.pricePerUnit || !form.location) {
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("quantity", form.quantity);
    fd.append("unit", form.unit);
    fd.append("pricePerUnit", form.pricePerUnit);
    fd.append("description", form.description);
    fd.append("location", form.location);
    if (form.image) fd.append("image", form.image);

    try {
      // ✅ Corrected API endpoint
      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: fd,
      });

      const data = await res.json();
      setLoading(false);

      if (res.status === 201 || data.success) {
        alert("✅ Product added successfully!");
        onAdded();
        onClose();
      } else {
        console.error("Add product error:", data);
        alert("⚠️ Error: " + (data.message || "Something went wrong."));
      }
    } catch (err) {
      console.error("Add product request failed:", err);
      setLoading(false);
      alert("⚠️ Network or server error while adding product.");
    }
  };

  return (
    <div style={backdrop}>
      <div style={modal}>
        <h2 style={title}>Add New Product</h2>

        <form onSubmit={handleSubmit} style={{ marginTop: 10 }}>
          <div style={grid}>
            <input
              style={input}
              placeholder="Crop Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              style={input}
              type="number"
              placeholder="Quantity *"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />

            <select
              style={input}
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            >
              <option value="kg">Kilogram (kg)</option>
              <option value="quintal">Quintal</option>
              <option value="ton">Ton</option>
              <option value="crate">Crate</option>
              <option value="bag">Bag</option>
              <option value="liter">Liter</option>
            </select>

            <input
              style={input}
              type="number"
              placeholder="Price per Unit (₹) *"
              value={form.pricePerUnit}
              onChange={(e) =>
                setForm({ ...form, pricePerUnit: e.target.value })
              }
            />

            <input
              style={input}
              placeholder="Location *"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

            <input
              style={input}
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm({ ...form, image: e.target.files[0] })
              }
            />
          </div>

          <div style={buttonRow}>
            <button type="button" onClick={onClose} style={cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={submitBtn}>
              {loading ? "Adding..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Styles */
const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const modal = {
  width: "450px",
  background: "white",
  padding: "26px",
  borderRadius: "14px",
  boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
};

const title = {
  margin: 0,
  fontWeight: 700,
  fontSize: "22px",
  color: "#1a2f1a",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
  marginTop: "18px",
};

const input = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
};

const buttonRow = {
  marginTop: "22px",
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
};

const cancelBtn = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
};

const submitBtn = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "none",
  background: "#2E4F2F",
  color: "white",
  cursor: "pointer",
  fontWeight: 600,
};
