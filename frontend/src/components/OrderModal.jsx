import React, { useState } from "react";

function OrderModal({ product, token, onClose }) {
  const [qty, setQty] = useState("");

  const placeOrder = async () => {
    if (!qty) return alert("Enter quantity");

    const res = await fetch("http://localhost:5000/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ productId: product._id, quantity: Number(qty) })
    });

    if (res.status === 201) {
      alert("✅ Order placed successfully!");
      onClose();
    } else {
      const data = await res.json();
      alert(data.message || "Order failed");
    }
  };

  return (
    <div style={overlay}>
      <div style={box}>
        <h3>Order: {product.name}</h3>
        <p>Available: {product.quantity} {product.unit}</p>

        <input
          type="number"
          placeholder="Enter quantity"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          style={input}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={placeOrder} style={btnPrimary}>Place Order</button>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
  display: "flex", justifyContent: "center", alignItems: "center"
};

const box = {
  background: "white", padding: "22px", borderRadius: "12px", width: "350px"
};

const input = {
  width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", marginTop: "8px"
};

const btnPrimary = {
  flex: 1, background: "#2E4F2F", color: "white",
  border: "none", borderRadius: "8px", padding: "10px", cursor: "pointer"
};

const btnCancel = {
  flex: 1, background: "white", border: "1px solid #ccc",
  borderRadius: "8px", padding: "10px", cursor: "pointer"
};

export default OrderModal;
