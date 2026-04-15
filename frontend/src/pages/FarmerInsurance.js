import React, { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import { useNavigate } from "react-router-dom";
import { FileText, Download, AlertCircle, CheckCircle, Clock, Leaf } from "lucide-react";

function FarmerInsurance() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  
  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState({
    cropName: "",
    areaSize: "",
    disasterType: "",
    claimAmount: ""
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ error: "", success: "" });

  const menu = [
    { label: "Dashboard", onClick: () => navigate("/dashboard") },
    { label: "My Inventory", onClick: () => navigate("/inventory") },
    { label: "Orders", onClick: () => navigate("/farmer-orders") },
    { label: "Insurance", onClick: () => navigate("/insurance"), active: true },
    { label: "Marketplace", onClick: () => navigate("/marketplace") }
  ];

  const loadPolicies = async () => {
    const res = await fetch("http://localhost:5000/api/insurance", {
      headers: { Authorization: "Bearer " + token }
    });
    setPolicies(await res.json());
  };

  useEffect(() => { loadPolicies(); }, []);

  const submit = async () => {
    if (!form.cropName || !form.areaSize || !form.disasterType || !form.claimAmount) {
      return setMsg({ error: "Fill all fields", success: "" });
    }
    setMsg({ error: "", success: "" });

    await fetch("http://localhost:5000/api/insurance/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(form)
    });

    setForm({ cropName: "", areaSize: "", disasterType: "", claimAmount: "" });
    setMsg({ success: "Application submitted!", error: "" });
    loadPolicies();
  };

  return (
    <div style={{ display: "flex", background: "#F3F7F2", minHeight: "100vh" }}>
      <Sidebar menu={menu} onLogout={() => { localStorage.clear(); navigate("/login"); }} />
      
      <div style={{ flex: 1 }}>
        <Topbar user={user} onLogout={() => { localStorage.clear(); navigate("/login"); }} />

        <div style={{ padding: 30 }}>

          {/* Page Header */}
          <div style={headerBox}>
            <Leaf size={38} color="#2E4F2F" />
            <div>
              <h2 style={{ margin: 0 }}>Crop Insurance</h2>
              <p style={{ marginTop: 4, color: "#6b7280" }}>Submit claims and view policy status</p>
            </div>
          </div>

          {/* Alerts */}
          {msg.error && <p style={alertError}><AlertCircle size={18}/> {msg.error}</p>}
          {msg.success && <p style={alertSuccess}><CheckCircle size={18}/> {msg.success}</p>}

          {/* Apply Form */}
          <div style={card}>
            <h3>Apply for Insurance</h3>

            <div style={formGrid}>
              <input placeholder="Crop Name" value={form.cropName}
                onChange={(e) => setForm({ ...form, cropName: e.target.value })}/>

              <input placeholder="Land Size (acres)" value={form.areaSize}
                onChange={(e) => setForm({ ...form, areaSize: e.target.value })}/>

              <select value={form.disasterType}
                onChange={(e) => setForm({ ...form, disasterType: e.target.value })}>
                <option value="">Select Disaster</option>
                <option>Flood</option><option>Drought</option><option>Pest</option>
                <option>Fire</option><option>Storm</option>
              </select>

              <input placeholder="Claim Amount (₹)" value={form.claimAmount}
                onChange={(e) => setForm({ ...form, claimAmount: e.target.value })}/>
            </div>

            <button onClick={submit} style={buttonPrimary}>Submit</button>
          </div>

          {/* Policy List */}
          <div style={card}>
            <h3>My Policies</h3>

            {policies.length === 0 ? (
              <p style={{ color: "#6b7280", textAlign: "center" }}>No policies yet.</p>
            ) : (
              policies.map((p) => (
                <div key={p._id} style={policyRow}>
                  <span>{p.cropName}</span>
                  <span>{p.areaSize} acres</span>
                  <span>{p.disasterType}</span>
                  <span>₹{p.claimAmount}</span>
                  <span style={statusBadge(p.status)}>{p.status}</span>
                  <button onClick={() => window.open(`http://localhost:5000/api/insurance/download/${p._id}`)} style={pdfButton}>
                    <Download size={16}/>
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* Styles */
const headerBox = { display: "flex", gap: 14, alignItems: "center", marginBottom: 20 };
const card = { background: "white", padding: 22, borderRadius: 12, marginTop: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.07)" };
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 14 };
const buttonPrimary = { marginTop: 12, background: "#2E4F2F", color: "white", padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer" };
const policyRow = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto auto", padding: "10px 0", borderBottom: "1px solid #eee", alignItems: "center" };
const pdfButton = { padding: 6, background: "#2E4F2F", borderRadius: 6, border: "none", color: "white", cursor: "pointer" };
const statusBadge = (s) => ({
  padding: "6px 10px",
  borderRadius: 6,
  background: s === "approved" ? "#d1fae5" : s === "rejected" ? "#fee2e2" : "#fef9c3",
  color: "#111"
});
const alertError = { color: "#b91c1c", background: "#fee2e2", padding: 10, borderRadius: 8, display: "flex", gap: 8, alignItems: "center" };
const alertSuccess = { color: "#166534", background: "#dcfce7", padding: 10, borderRadius: 8, display: "flex", gap: 8, alignItems: "center" };

export default FarmerInsurance;
