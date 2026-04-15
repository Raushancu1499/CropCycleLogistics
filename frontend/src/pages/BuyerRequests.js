import { LoaderCircle, MessageSquareShare, SendHorizonal, Target } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppFrame from "../components/layout/AppFrame";
import {
  apiFetch,
  deliveryModeLabel,
  formatCurrency,
  formatDate,
  getUser,
  statusLabel,
  statusPalette,
} from "../utils/api";

const toDateInput = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

const buildInventoryFit = (requirement, inventory) => {
  const targetName = String(requirement.productName || "").trim().toLowerCase();
  const matchingProducts = inventory.filter((product) => {
    const productName = String(product.name || "").trim().toLowerCase();
    return productName.includes(targetName) || targetName.includes(productName);
  });

  const availableQuantity = matchingProducts.reduce(
    (sum, product) => sum + Number(product.quantity || 0),
    0
  );

  return {
    availableQuantity,
    matchingProducts: matchingProducts.slice(0, 3),
    score: Math.min(
      100,
      Math.round(
        (requirement.quantity
          ? Math.min(availableQuantity / requirement.quantity, 1)
          : 0) * 60 +
          (matchingProducts.length ? 40 : 0)
      )
    ),
  };
};

const toneClass = (status) => {
  if (status === "matched" || status === "selected") return "success";
  if (status === "declined" || status === "rejected") return "error";
  if (status === "closed") return "info";
  return "pending";
};

export default function BuyerRequests() {
  const user = getUser();
  const [requirements, setRequirements] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("live");
  const [composerId, setComposerId] = useState("");
  const [savingId, setSavingId] = useState("");
  const [responseForm, setResponseForm] = useState({
    proposedQuantity: "",
    unitPrice: "",
    earliestFulfillmentDate: "",
    deliveryMode: "buyer_pickup",
    responseMessage: "",
  });

  const loadRequirements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [requirementData, inventoryData] = await Promise.all([
        apiFetch("/requirements/market"),
        apiFetch("/products/my"),
      ]);

      setRequirements(Array.isArray(requirementData) ? requirementData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (loadError) {
      setError(loadError.message);
      setRequirements([]);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  const enrichedRequirements = useMemo(
    () =>
      requirements.map((requirement) => ({
        ...requirement,
        inventoryFit: buildInventoryFit(requirement, inventory),
      })),
    [inventory, requirements]
  );

  const stats = useMemo(
    () => ({
      live: enrichedRequirements.filter(
        (requirement) =>
          ["open", "in_review"].includes(requirement.status) && !requirement.selectedResponse
      ).length,
      responses: enrichedRequirements.filter((requirement) => requirement.myResponse).length,
      matched: enrichedRequirements.filter(
        (requirement) => String(requirement.selectedResponse?.farmerId || "") === String(user?.id || "")
      ).length,
    }),
    [enrichedRequirements, user?.id]
  );

  const visibleRequirements = useMemo(() => {
    if (activeFilter === "responses") {
      return enrichedRequirements.filter((requirement) => requirement.myResponse);
    }

    if (activeFilter === "matched") {
      return enrichedRequirements.filter(
        (requirement) => String(requirement.selectedResponse?.farmerId || "") === String(user?.id || "")
      );
    }

    return enrichedRequirements.filter(
      (requirement) =>
        ["open", "in_review"].includes(requirement.status) && !requirement.selectedResponse
    );
  }, [activeFilter, enrichedRequirements, user?.id]);

  const startComposer = (requirement) => {
    setComposerId(requirement._id);
    setResponseForm({
      proposedQuantity: requirement.myResponse?.proposedQuantity || requirement.quantity || "",
      unitPrice: requirement.myResponse?.unitPrice ?? requirement.budgetPerUnit ?? "",
      earliestFulfillmentDate:
        toDateInput(requirement.myResponse?.earliestFulfillmentDate || requirement.neededDate) || "",
      deliveryMode:
        requirement.myResponse?.deliveryMode ||
        (requirement.preferredDeliveryMode === "either"
          ? "buyer_pickup"
          : requirement.preferredDeliveryMode || "buyer_pickup"),
      responseMessage: requirement.myResponse?.responseMessage || "",
    });
  };

  const submitResponse = async (requirementId) => {
    try {
      setSavingId(requirementId);
      setError("");
      await apiFetch(`/requirements/${requirementId}/respond`, {
        method: "POST",
        body: JSON.stringify({
          proposedQuantity: Number(responseForm.proposedQuantity),
          unitPrice: Number(responseForm.unitPrice),
          earliestFulfillmentDate: responseForm.earliestFulfillmentDate,
          deliveryMode: responseForm.deliveryMode,
          responseMessage: responseForm.responseMessage,
        }),
      });

      setComposerId("");
      setActiveFilter("responses");
      await loadRequirements();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSavingId("");
    }
  };

  return (
    <AppFrame>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">Buyer demand board</span>
          <h1>Answer open buying briefs with real quotes and timelines.</h1>
          <p>
            Compare demand against your current inventory and respond with a structured
            offer buyers can review beside other farmer responses.
          </p>
        </div>
      </section>

      <section className="card-grid">
        <article className="metric-card">
          <div className="metric-label">Live opportunities</div>
          <div className="metric-value">{stats.live}</div>
          <div className="metric-caption">Buyer briefs open for a farmer response.</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">My responses</div>
          <div className="metric-value">{stats.responses}</div>
          <div className="metric-caption">Quotes you have already sent to buyers.</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Matched briefs</div>
          <div className="metric-value">{stats.matched}</div>
          <div className="metric-caption">Requirements where your response was selected.</div>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Workflow filters</span>
            <h2>Choose what you want to work on</h2>
          </div>
          <div className="button-row">
            <button
              type="button"
              className={`button ${activeFilter === "live" ? "button-primary" : "button-secondary"}`}
              onClick={() => setActiveFilter("live")}
            >
              Live demand
            </button>
            <button
              type="button"
              className={`button ${activeFilter === "responses" ? "button-primary" : "button-secondary"}`}
              onClick={() => setActiveFilter("responses")}
            >
              My responses
            </button>
            <button
              type="button"
              className={`button ${activeFilter === "matched" ? "button-primary" : "button-secondary"}`}
              onClick={() => setActiveFilter("matched")}
            >
              Matched
            </button>
          </div>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <section className="surface-card">
          <div className="empty-state">
            <LoaderCircle size={18} className="spin" />
            Loading buyer demand...
          </div>
        </section>
      ) : visibleRequirements.length === 0 ? (
        <section className="surface-card">
          <div className="empty-state">
            {activeFilter === "live"
              ? "No buyer briefs are ready for a response right now."
              : "No requests match this stage yet."}
          </div>
        </section>
      ) : (
        <section className="list">
          {visibleRequirements.map((requirement) => {
            const matchedToMe =
              String(requirement.selectedResponse?.farmerId || "") === String(user?.id || "");
            const canRespond =
              ["open", "in_review"].includes(requirement.status) &&
              (!requirement.selectedResponse || matchedToMe || requirement.myResponse);

            return (
              <article key={requirement._id} className="surface-card">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Buyer brief</span>
                    <h2>{requirement.productName}</h2>
                  </div>
                  <div className="button-row">
                    <span className={`status-pill ${toneClass(requirement.status)}`}>
                      {statusLabel(requirement.status)}
                    </span>
                    <span
                      className="status-pill"
                      style={statusPalette[requirement.urgency] || statusPalette.priority}
                    >
                      {statusLabel(requirement.urgency)}
                    </span>
                  </div>
                </div>

                <div className="card-grid" style={{ marginTop: 0 }}>
                  <article className="metric-card">
                    <div className="metric-label">Need</div>
                    <div className="metric-value">
                      {requirement.quantity} {requirement.unit}
                    </div>
                    <div className="metric-caption">Needed by {formatDate(requirement.neededDate)}</div>
                  </article>
                  <article className="metric-card">
                    <div className="metric-label">Budget signal</div>
                    <div className="metric-value">
                      {requirement.budgetPerUnit
                        ? `${formatCurrency(requirement.budgetPerUnit)} / ${requirement.unit}`
                        : "Open quote"}
                    </div>
                    <div className="metric-caption">
                      {deliveryModeLabel(requirement.preferredDeliveryMode)}
                    </div>
                  </article>
                  <article className="metric-card">
                    <div className="metric-label">Inventory fit</div>
                    <div className="metric-value">{requirement.inventoryFit.score}%</div>
                    <div className="metric-caption">
                      {requirement.inventoryFit.availableQuantity} {requirement.unit} matched in your catalog.
                    </div>
                  </article>
                </div>

                <div className="two-column" style={{ marginTop: 20 }}>
                  <div className="surface-card soft">
                    <div className="section-heading compact">
                      <div>
                        <span className="eyebrow">Buyer details</span>
                        <h2>{requirement.buyerId?.name || "Buyer contact"}</h2>
                      </div>
                    </div>

                    <div className="list compact-list">
                      <div className="record-row stacked">
                        <div className="record-main">
                          <div className="record-title">{requirement.location}</div>
                          <div className="record-subtitle">
                            {requirement.contactName} | {requirement.contactPhone}
                          </div>
                          {requirement.contactEmail ? (
                            <div className="record-subtitle">{requirement.contactEmail}</div>
                          ) : null}
                        </div>
                        {requirement.qualityGrade ? (
                          <p className="muted-copy">Quality: {requirement.qualityGrade}</p>
                        ) : null}
                        {requirement.packagingPreference ? (
                          <p className="muted-copy">
                            Packaging: {requirement.packagingPreference}
                          </p>
                        ) : null}
                        {requirement.notes ? <p className="muted-copy">{requirement.notes}</p> : null}
                      </div>

                      <div className="record-row stacked">
                        <div className="record-main">
                          <div className="record-title">
                            <Target size={16} style={{ marginRight: 6 }} />
                            Best matching inventory
                          </div>
                          <div className="record-subtitle">
                            {requirement.inventoryFit.matchingProducts.length
                              ? requirement.inventoryFit.matchingProducts
                                  .map((product) => `${product.name} (${product.quantity} ${product.unit})`)
                                  .join(", ")
                              : "No close inventory match found yet."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="surface-card">
                    <div className="section-heading compact">
                      <div>
                        <span className="eyebrow">Farmer response</span>
                        <h2>
                          {matchedToMe
                            ? "Buyer selected your response"
                            : requirement.myResponse
                              ? "Update your quote"
                              : "Send a quote"}
                        </h2>
                      </div>
                    </div>

                    {matchedToMe ? (
                      <div className="empty-state">
                        You are the selected supplier. Coordinate next steps directly with the buyer.
                      </div>
                    ) : requirement.myResponse ? (
                      <div className="record-row stacked">
                        <div className="record-main">
                          <div className="record-title">
                            Response status: {statusLabel(requirement.myResponse.status)}
                          </div>
                          <div className="record-subtitle">
                            {requirement.myResponse.proposedQuantity} {requirement.unit} at{" "}
                            {formatCurrency(requirement.myResponse.unitPrice)} / {requirement.unit}
                          </div>
                          <div className="record-subtitle">
                            Fulfillment by {formatDate(requirement.myResponse.earliestFulfillmentDate)} |{" "}
                            {deliveryModeLabel(requirement.myResponse.deliveryMode)}
                          </div>
                        </div>
                        {requirement.myResponse.responseMessage ? (
                          <p className="muted-copy">{requirement.myResponse.responseMessage}</p>
                        ) : null}
                      </div>
                    ) : null}

                    {canRespond ? (
                      <>
                        <div className="button-row" style={{ marginTop: 14 }}>
                          <button
                            type="button"
                            className="button button-primary"
                            onClick={() => startComposer(requirement)}
                          >
                            <MessageSquareShare size={16} />
                            {requirement.myResponse ? "Update response" : "Compose response"}
                          </button>
                        </div>

                        {composerId === requirement._id ? (
                          <div className="surface-card soft" style={{ marginTop: 18 }}>
                            <div className="section-heading compact">
                              <div>
                                <span className="eyebrow">Quote builder</span>
                                <h2>Respond with numbers the buyer can compare</h2>
                              </div>
                              <SendHorizonal size={18} />
                            </div>

                            <div className="form-grid">
                              <label className="field">
                                <span className="field-label">Quantity</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={responseForm.proposedQuantity}
                                  onChange={(event) =>
                                    setResponseForm((current) => ({
                                      ...current,
                                      proposedQuantity: event.target.value,
                                    }))
                                  }
                                />
                              </label>

                              <label className="field">
                                <span className="field-label">Quote per {requirement.unit}</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={responseForm.unitPrice}
                                  onChange={(event) =>
                                    setResponseForm((current) => ({
                                      ...current,
                                      unitPrice: event.target.value,
                                    }))
                                  }
                                />
                              </label>

                              <label className="field">
                                <span className="field-label">Fulfillment date</span>
                                <input
                                  type="date"
                                  value={responseForm.earliestFulfillmentDate}
                                  onChange={(event) =>
                                    setResponseForm((current) => ({
                                      ...current,
                                      earliestFulfillmentDate: event.target.value,
                                    }))
                                  }
                                />
                              </label>

                              <label className="field">
                                <span className="field-label">Delivery mode</span>
                                <select
                                  value={responseForm.deliveryMode}
                                  onChange={(event) =>
                                    setResponseForm((current) => ({
                                      ...current,
                                      deliveryMode: event.target.value,
                                    }))
                                  }
                                >
                                  <option value="buyer_pickup">Buyer pickup</option>
                                  <option value="farmer_delivery">Farmer delivery</option>
                                </select>
                              </label>

                              <label className="field" style={{ gridColumn: "1 / -1" }}>
                                <span className="field-label">Message to buyer</span>
                                <textarea
                                  rows={4}
                                  value={responseForm.responseMessage}
                                  onChange={(event) =>
                                    setResponseForm((current) => ({
                                      ...current,
                                      responseMessage: event.target.value,
                                    }))
                                  }
                                  placeholder="Mention lot quality, dispatch plan, or loading notes."
                                />
                              </label>
                            </div>

                            <div className="button-row" style={{ marginTop: 18 }}>
                              <button
                                type="button"
                                className="button button-primary"
                                onClick={() => submitResponse(requirement._id)}
                                disabled={savingId === requirement._id}
                              >
                                {savingId === requirement._id ? "Saving response..." : "Submit response"}
                              </button>
                              <button
                                type="button"
                                className="button button-secondary"
                                onClick={() => setComposerId("")}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </AppFrame>
  );
}
