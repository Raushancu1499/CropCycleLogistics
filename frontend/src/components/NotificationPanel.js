import React, { useEffect, useState } from "react";

function NotificationPanel({ onClose }) {
  const token = localStorage.getItem("token");
  const [notes, setNotes] = useState([]);

  const loadNotes = async () => {
    const res = await fetch("http://localhost:5000/api/notifications", {
      headers: { Authorization: "Bearer " + token }
    });
    setNotes(await res.json());
  };

  useEffect(() => { loadNotes(); }, []);

  const markRead = async (id) => {
    await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
      method: "PUT",
      headers: { Authorization: "Bearer " + token }
    });
    loadNotes();
  };

  return (
    <div style={{
      position: "absolute",
      top: "50px",
      right: "20px",
      width: "300px",
      background: "white",
      borderRadius: "8px",
      boxShadow: "rgba(0,0,0,0.15) 0px 4px 12px",
      padding: "10px",
      zIndex: 10
    }}>
      <h4 style={{ marginBottom: "10px" }}>Notifications</h4>

      {notes.length === 0 && <p style={{ color: "#555" }}>No notifications</p>}

      {notes.map((n) => (
        <div key={n._id} style={{
          padding: "8px",
          background: n.read ? "#f2f4f2" : "#e9f6e4",
          borderRadius: "6px",
          marginBottom: "6px"
        }}>
          <p style={{ margin: 0 }}>{n.message}</p>
          {!n.read && (
            <button
              onClick={() => markRead(n._id)}
              style={{
                marginTop: "5px",
                padding: "4px 8px",
                background: "#2E4F2F",
                color: "white",
                fontSize: "12px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Mark as Read
            </button>
          )}
        </div>
      ))}

      <button
        onClick={onClose}
        style={{
          width: "100%",
          marginTop: "8px",
          padding: "6px",
          background: "#ddd",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Close
      </button>
    </div>
  );
}

export default NotificationPanel;
