import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppFrame from "../components/layout/AppFrame";
import {
  apiFetch,
  deliveryModeLabel,
  formatCurrency,
  formatDate,
  getUser,
  statusLabel,
} from "../utils/api";

const getMyOffer = (request, currentUserId) =>
  (request.responses || []).find(
    (response) => String(response.farmerId) === String(currentUserId)
  );

export default function DemandBoardPage() {
  const user = getUser();
  const [requests, setRequests] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState("");
  const [error, setError] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/requirements");
      const nextRequests = Array.isArray(data) ? data : [];
      setRequests(nextRequests);
      setDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };

        nextRequests.forEach((request) => {
          const existingOffer = getMyOffer(request, user?.id);

          nextDrafts[request._id] = nextDrafts[request._id] || {
            proposedQuantity: existingOffer?.proposedQuantity || request.quantity,
            unitPrice: existingOffer?.unitPrice || "",
            earliestFulfillmentDate:
              existingOffer?.earliestFulfillmentDate?.slice?.(0, 10) ||
              String(request.neededDate || "").slice(0, 10),
            deliveryMode:
              existingOffer?.deliveryMode ||
              (request.preferredDeliveryMode === "farmer_delivery"
                ? "farmer_delivery"
                : "buyer_pickup"),
            responseMessage: existingOffer?.responseMessage || "",
          };
        });

        return nextDrafts;
      });
    } catch (loadError) {
      setError(loadError.message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const boardStats = useMemo(
    () => ({
      open: requests.filter((request) => request.status === "open").length,
      inReview: requests.filter((request) => request.status === "in_review").length,
      accepted: requests.filter(
        (request) => String(request.acceptedBy?._id || request.acceptedBy || "") === String(user?.id)
      ).length,
    }),
    [requests, user?.id]
  );

  const submitOffer = async (requestId) => {
    try {
      setSubmittingId(requestId);
      setError("");
      await apiFetch(`/requirements/${requestId}/offers`, {
        method: "POST",
        body: JSON.stringify(drafts[requestId]),
      });
      await loadRequests();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmittingId("");
    }
  };

  return (
    <AppFrame>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">Demand board</span>
          <h1>Review buyer requests and answer with your own fulfillment offer.</h1>
          <p>
            Farmers can respond with quantity, price, pickup or delivery mode, and
            the exact time they can fulfill a custom order.
          </p>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="card-grid">
        <article className="metric-card">
          <div className="metric-label">Open requests</div>
          <div className="metric-value">{boardStats.open}</div>
          <div className="metric-caption">Buyer requests waiting for farmer offers.</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">In review</div>
          <div className="metric-value">{boardStats.inReview}</div>
          <div className="metric-caption">Requests that already have one or more offers.</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Accepted by me</div>
          <div className="metric-value">{boardStats.accepted}</div>
          <div className="metric-caption">Requests where your offer was selected.</div>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Available demand</span>
            <h2>Post a structured farmer response</h2>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading buyer requests...</div>
        ) : (
          <div className="list">
            {requests.map((request) => {
              const draft = drafts[request._id] || {};
              const myOffer = getMyOffer(request, user?.id);
              const selected =
                (request.responses || []).find((response) => response.status === "selected") ||
                null;

              return (
                <article key={request._id} className="record-row stacked">
                  <div className="record-main">
                    <div className="record-title">{request.productName}</div>
                    <div className="record-subtitle">
                      {request.quantity} {request.unit} needed by {formatDate(request.neededDate)}
                    </div>
                    <div className="record-subtitle">
                      Buyer prefers: {deliveryModeLabel(request.preferredDeliveryMode)}
                    </div>
                    {request.budgetPerUnit ? (
                      <div className="record-subtitle">
                        Budget: {formatCurrency(request.budgetPerUnit)} / {request.unit}
                      </div>
                    ) : null}
                    <div className="record-subtitle">
                      {request.buyerId?.name} | {request.contactPhone} | {request.location}
                    </div>
                    {request.notes && <p className="muted-copy">{request.notes}</p>}
                  </div>

                  <div className="button-row">
                    <span className="status-pill info">{statusLabel(request.status)}</span>
                    <span className="record-subtitle">
                      {request.responses?.length || 0} offer
                      {request.responses?.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {selected && (
                    <div className="alert success">
                      Selected offer: {selected.farmerName} |{" "}
                      {formatCurrency(selected.unitPrice)} / {request.unit} |{" "}
                      {deliveryModeLabel(selected.deliveryMode)} | Ready by{" "}
                      {formatDate(selected.earliestFulfillmentDate)}
                    </div>
                  )}

                  <div className="form-grid">
                    <label className="field">
                      <span className="field-label">Quantity you can fulfill</span>
                      <input
                        type="number"
                        min="1"
                        value={draft.proposedQuantity || ""}
                        onChange={(event) =>
                          setDrafts({
                            ...drafts,
                            [request._id]: {
                              ...draft,
                              proposedQuantity: event.target.value,
                            },
                          })
                        }
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">Price per unit</span>
                      <input
                        type="number"
                        min="0"
                        value={draft.unitPrice || ""}
                        onChange={(event) =>
                          setDrafts({
                            ...drafts,
                            [request._id]: {
                              ...draft,
                              unitPrice: event.target.value,
                            },
                          })
                        }
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">Fulfillment date</span>
                      <input
                        type="date"
                        value={draft.earliestFulfillmentDate || ""}
                        onChange={(event) =>
                          setDrafts({
                            ...drafts,
                            [request._id]: {
                              ...draft,
                              earliestFulfillmentDate: event.target.value,
                            },
                          })
                        }
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">Pickup or delivery</span>
                      <select
                        value={draft.deliveryMode || "buyer_pickup"}
                        onChange={(event) =>
                          setDrafts({
                            ...drafts,
                            [request._id]: {
                              ...draft,
                              deliveryMode: event.target.value,
                            },
                          })
                        }
                      >
                        <option value="buyer_pickup">Buyer pickup</option>
                        <option value="farmer_delivery">Farmer delivery</option>
                      </select>
                    </label>
                  </div>

                  <label className="field">
                    <span className="field-label">Message for the buyer</span>
                    <textarea
                      rows={3}
                      value={draft.responseMessage || ""}
                      onChange={(event) =>
                        setDrafts({
                          ...drafts,
                          [request._id]: {
                            ...draft,
                            responseMessage: event.target.value,
                          },
                        })
                      }
                      placeholder="Add any timing, loading, or quality details for this offer."
                    />
                  </label>

                  {myOffer && (
                    <div className="alert success">
                      Your current offer: {formatCurrency(myOffer.unitPrice)} / {request.unit} |{" "}
                      {deliveryModeLabel(myOffer.deliveryMode)} | Ready by{" "}
                      {formatDate(myOffer.earliestFulfillmentDate)} |{" "}
                      {statusLabel(myOffer.status)}
                    </div>
                  )}

                  <div className="button-row">
                    <button
                      type="button"
                      className="button button-primary"
                      disabled={submittingId === request._id}
                      onClick={() => submitOffer(request._id)}
                    >
                      {submittingId === request._id ? "Sending offer..." : "Send offer"}
                      {submittingId !== request._id && <ArrowRight size={16} />}
                    </button>
                    <span className="record-subtitle">
                      Farmers can revise their offer until a buyer selects one.
                    </span>
                  </div>
                </article>
              );
            })}

            {!requests.length && (
              <div className="empty-state">
                No buyer requests are open right now. Check back soon for more demand.
              </div>
            )}
          </div>
        )}
      </section>
    </AppFrame>
  );
}
