import {
  ArrowRight,
  Clock3,
  LoaderCircle,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppFrame from "../components/layout/AppFrame";
import {
  apiFetch,
  deliveryModeLabel,
  formatCurrency,
  formatDate,
  statusLabel,
} from "../utils/api";

const toneClass = (status) => {
  if (["matched", "selected"].includes(status)) return "success";
  if (["closed", "declined"].includes(status)) return "info";
  return "pending";
};

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/requirements/mine");
      setRequests(Array.isArray(data) ? data : []);
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

  const stats = useMemo(
    () => ({
      live: requests.filter((request) => request.status !== "closed").length,
      matched: requests.filter((request) => request.status === "matched").length,
      awaitingResponse: requests.filter((request) => !request.responseCount).length,
      totalResponses: requests.reduce(
        (sum, request) => sum + Number(request.responseCount || 0),
        0
      ),
    }),
    [requests]
  );

  const updateStatus = async (id, status) => {
    try {
      setBusyKey(`status-${id}`);
      setError("");
      await apiFetch(`/requirements/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await loadRequests();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusyKey("");
    }
  };

  const selectResponse = async (requirementId, responseId) => {
    try {
      setBusyKey(`select-${responseId}`);
      setError("");
      await apiFetch(`/requirements/${requirementId}/responses/${responseId}/select`, {
        method: "PUT",
      });
      await loadRequests();
    } catch (selectError) {
      setError(selectError.message);
    } finally {
      setBusyKey("");
    }
  };

  return (
    <AppFrame>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">My requests</span>
          <h1>Compare farmer responses and choose the right sourcing partner.</h1>
          <p>
            Each request now works like a real sourcing board: farmers can respond
            with price, quantity, delivery mode, and earliest fulfillment date.
          </p>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="card-grid">
        <article className="metric-card">
          <div className="metric-label">Live requests</div>
          <div className="metric-value">{stats.live}</div>
          <div className="metric-caption">Requests still open, in review, or matched.</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Matched suppliers</div>
          <div className="metric-value">{stats.matched}</div>
          <div className="metric-caption">Requests where you have already selected a farmer.</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Waiting for first response</div>
          <div className="metric-value">{stats.awaitingResponse}</div>
          <div className="metric-caption">Requests that still need farmer interest.</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Total responses</div>
          <div className="metric-value">{stats.totalResponses}</div>
          <div className="metric-caption">Farmer proposals received across your request board.</div>
        </article>
      </section>

      {loading ? (
        <section className="surface-card">
          <div className="empty-state">
            <LoaderCircle size={18} className="spin" />
            Loading your requests...
          </div>
        </section>
      ) : (
        <section className="list">
          {requests.map((request) => {
            const selectedResponse = request.selectedResponse || null;

            return (
              <article key={request._id} className="surface-card">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Requirement</span>
                    <h2>{request.productName}</h2>
                    <div className="inline-meta" style={{ marginTop: 10 }}>
                      <span className={`status-pill ${toneClass(request.status)}`}>
                        {statusLabel(request.status)}
                      </span>
                      <span className="status-pill pending">
                        {request.responseCount || 0} response
                        {request.responseCount === 1 ? "" : "s"}
                      </span>
                      <span className="status-pill info">
                        {statusLabel(request.urgency || "routine")}
                      </span>
                    </div>
                  </div>

                  <div className="button-row">
                    {request.status !== "closed" ? (
                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={busyKey === `status-${request._id}`}
                        onClick={() => updateStatus(request._id, "closed")}
                      >
                        Close request
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={busyKey === `status-${request._id}`}
                        onClick={() => updateStatus(request._id, "open")}
                      >
                        <RefreshCcw size={16} />
                        Reopen request
                      </button>
                    )}
                  </div>
                </div>

                <div className="card-grid" style={{ marginTop: 0 }}>
                  <article className="metric-card">
                    <div className="metric-label">Quantity</div>
                    <div className="metric-value">
                      {request.quantity} {request.unit}
                    </div>
                    <div className="metric-caption">Requested supply volume.</div>
                  </article>
                  <article className="metric-card">
                    <div className="metric-label">Needed by</div>
                    <div className="metric-value">{formatDate(request.neededDate)}</div>
                    <div className="metric-caption">
                      {request.neededTime
                        ? `Preferred time ${request.neededTime}`
                        : "No specific time provided."}
                    </div>
                  </article>
                  <article className="metric-card">
                    <div className="metric-label">Delivery mode</div>
                    <div className="metric-value">
                      {deliveryModeLabel(request.preferredDeliveryMode)}
                    </div>
                    <div className="metric-caption">Requested logistics preference.</div>
                  </article>
                  <article className="metric-card">
                    <div className="metric-label">Target budget</div>
                    <div className="metric-value">
                      {request.budgetPerUnit
                        ? formatCurrency(request.budgetPerUnit)
                        : "Open"}
                    </div>
                    <div className="metric-caption">
                      {request.budgetPerUnit
                        ? `Per ${request.unit} budget guidance for farmers.`
                        : "Farmers can price freely when responding."}
                    </div>
                  </article>
                </div>

                <div className="two-column" style={{ marginTop: 20 }}>
                  <div className="surface-card soft">
                    <div className="section-heading compact">
                      <div>
                        <span className="eyebrow">Requirement brief</span>
                        <h2>{request.location}</h2>
                      </div>
                    </div>

                    <div className="list compact-list">
                      <div className="record-row">
                        <div className="record-main">
                          <div className="record-title">{request.contactName}</div>
                          <div className="record-subtitle">
                            {request.contactPhone}
                            {request.contactEmail ? ` | ${request.contactEmail}` : ""}
                          </div>
                        </div>
                      </div>

                      {request.qualityGrade && (
                        <div className="record-subtitle">
                          Quality grade: {request.qualityGrade}
                        </div>
                      )}
                      {request.packagingPreference && (
                        <div className="record-subtitle">
                          Packaging: {request.packagingPreference}
                        </div>
                      )}
                      {request.notes && <p className="muted-copy">{request.notes}</p>}
                    </div>
                  </div>

                  <div className="surface-card">
                    <div className="section-heading compact">
                      <div>
                        <span className="eyebrow">Selection summary</span>
                        <h2>
                          {selectedResponse
                            ? `Matched with ${selectedResponse.farmerName}`
                            : request.responseCount
                              ? "Responses waiting for your decision"
                              : "Waiting for farmer responses"}
                        </h2>
                      </div>
                    </div>

                    {selectedResponse ? (
                      <div className="list compact-list">
                        <div className="record-row">
                          <div className="record-main">
                            <div className="record-title">{selectedResponse.farmerName}</div>
                            <div className="record-subtitle">
                              {selectedResponse.farmerPhone || "Phone not shared yet"}
                              {selectedResponse.farmerLocation
                                ? ` | ${selectedResponse.farmerLocation}`
                                : ""}
                            </div>
                            <div className="inline-meta" style={{ marginTop: 10 }}>
                              <span>{selectedResponse.proposedQuantity} units offered</span>
                              <span>
                                {formatCurrency(selectedResponse.unitPrice)} / {request.unit}
                              </span>
                            </div>
                            <div className="detail-stack" style={{ marginTop: 10 }}>
                              <Clock3 size={16} />
                              Ready by {formatDate(selectedResponse.earliestFulfillmentDate)}
                            </div>
                            <div className="record-subtitle" style={{ marginTop: 10 }}>
                              Mode: {deliveryModeLabel(selectedResponse.deliveryMode)}
                            </div>
                          </div>
                        </div>

                        {selectedResponse.responseMessage && (
                          <div className="surface-card soft">
                            <div className="metric-label">Farmer note</div>
                            <p className="muted-copy">{selectedResponse.responseMessage}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="empty-state">
                        {request.responseCount
                          ? "Review the proposals below and select the best farmer."
                          : "No farmer has replied yet. Keep the request open so nearby suppliers can respond."}
                      </div>
                    )}
                  </div>
                </div>

                <div className="surface-card soft" style={{ marginTop: 20 }}>
                  <div className="section-heading compact">
                    <div>
                      <span className="eyebrow">Farmer responses</span>
                      <h2>Compare proposals side by side</h2>
                    </div>
                    <ShieldCheck size={18} />
                  </div>

                  {(request.responses || []).length ? (
                    <div className="list">
                      {request.responses.map((response) => {
                        const isSelected = response.status === "selected";

                        return (
                          <article
                            key={response._id}
                            className={`surface-card ${isSelected ? "" : "soft"}`}
                          >
                            <div className="section-heading compact">
                              <div>
                                <h2>{response.farmerName}</h2>
                                <div className="record-subtitle">
                                  {response.farmerPhone || "Phone not shared yet"}
                                  {response.farmerLocation
                                    ? ` | ${response.farmerLocation}`
                                    : ""}
                                </div>
                              </div>

                              <div className="button-row">
                                <span className={`status-pill ${toneClass(response.status)}`}>
                                  {statusLabel(response.status)}
                                </span>
                                {!selectedResponse &&
                                  request.status !== "closed" &&
                                  response.status === "submitted" && (
                                    <button
                                      type="button"
                                      className="button button-primary"
                                      disabled={busyKey === `select-${response._id}`}
                                      onClick={() =>
                                        selectResponse(request._id, response._id)
                                      }
                                    >
                                      {busyKey === `select-${response._id}`
                                        ? "Selecting..."
                                        : "Select farmer"}
                                      {busyKey !== `select-${response._id}` && (
                                        <ArrowRight size={16} />
                                      )}
                                    </button>
                                  )}
                              </div>
                            </div>

                            <div className="inline-meta" style={{ marginBottom: 12 }}>
                              <span>
                                Quantity: {response.proposedQuantity} {request.unit}
                              </span>
                              <span>
                                Price: {formatCurrency(response.unitPrice)} / {request.unit}
                              </span>
                            </div>
                            <div className="inline-meta" style={{ marginBottom: 12 }}>
                              <span>
                                Ready by {formatDate(response.earliestFulfillmentDate)}
                              </span>
                              <span>
                                {deliveryModeLabel(response.deliveryMode)}
                              </span>
                            </div>

                            {response.responseMessage && (
                              <p className="muted-copy">{response.responseMessage}</p>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state">
                      No responses yet. Farmers will appear here as soon as they submit
                      pricing and fulfillment details.
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {!requests.length && (
            <div className="surface-card">
              <div className="empty-state">
                No requests yet. Post one when you need crops that are not already listed.
              </div>
            </div>
          )}
        </section>
      )}
    </AppFrame>
  );
}
