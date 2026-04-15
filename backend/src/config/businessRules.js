export const MARKETPLACE_COMMISSION_RATE = Math.min(
  Math.max(Number(process.env.MARKETPLACE_COMMISSION_RATE || 0.05), 0),
  1
);

export const ADMIN_ACCESS_KEY =
  process.env.ADMIN_ACCESS_KEY ||
  (process.env.NODE_ENV === "production" ? "" : "cropcycle-admin");

export const INSURANCE_PLANS = [
  { name: "Kharif Crop Protection", premiumAmount: 499 },
  { name: "Rabi Crop Safety", premiumAmount: 399 },
  { name: "Premium Full Coverage", premiumAmount: 899 },
];

export const DEFAULT_INSURANCE_PLAN = INSURANCE_PLANS[0];

export const getInsurancePlan = (planName) =>
  INSURANCE_PLANS.find((plan) => plan.name === planName) || DEFAULT_INSURANCE_PLAN;
