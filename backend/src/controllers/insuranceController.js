import PDFDocument from "pdfkit";
import Insurance from "../models/Insurance.js";
import { getInsurancePlan } from "../config/businessRules.js";

export const applyInsurance = async (req, res) => {
  try {
    const { cropName, areaSize, disasterType, claimAmount, planName } = req.body;

    if (req.user?.role !== "farmer") {
      return res.status(403).json({ error: "Only farmers can apply for insurance" });
    }
    if (!cropName || !areaSize || !disasterType || !claimAmount) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const selectedPlan = getInsurancePlan(planName);

    const insurance = await Insurance.create({
      farmerId: req.user.id,
      planName: selectedPlan.name,
      cropName: cropName.trim(),
      areaSize: areaSize.trim(),
      disasterType: disasterType.trim(),
      claimAmount: Number(claimAmount),
      premiumAmount: selectedPlan.premiumAmount,
      status: "pending",
    });

    res.status(201).json(insurance);
  } catch (error) {
    res.status(500).json({ error: "Failed to apply for insurance" });
  }
};

export const getInsuranceApplications = async (req, res) => {
  try {
    if (req.user?.role !== "farmer") {
      return res.status(403).json({ error: "Only farmers can view insurance policies" });
    }

    const list = await Insurance.find({ farmerId: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch insurance applications" });
  }
};

export const downloadPolicy = async (req, res) => {
  try {
    const policy = await Insurance.findById(req.params.id).populate(
      "farmerId",
      "name phone"
    );

    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }
    if (String(policy.farmerId._id) !== req.user.id) {
      return res.status(403).json({ message: "You can only download your own policies" });
    }

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=policy_${policy.policyNumber}.pdf`
    );

    doc.pipe(res);
    doc.fontSize(22).fillColor("#163622").text("CropCycle Insurance Certificate", {
      align: "center",
    });
    doc.moveDown();

    doc.fontSize(14).fillColor("#222");
    doc.text(`Policy Number: ${policy.policyNumber}`);
    doc.text(`Plan: ${policy.planName}`);
    doc.text(`Policy ID: ${policy._id}`);
    doc.text(`Farmer Name: ${policy.farmerId.name}`);
    doc.text(`Phone: ${policy.farmerId.phone}`);
    doc.text(`Crop: ${policy.cropName}`);
    doc.text(`Land Area: ${policy.areaSize}`);
    doc.text(`Disaster Coverage: ${policy.disasterType}`);
    doc.text(`Claim Amount: Rs ${policy.claimAmount}`);
    doc.text(`Premium Paid: Rs ${policy.premiumAmount}`);
    doc.text(`Status: ${policy.status}`);
    doc.text(`Issued On: ${policy.createdAt.toDateString()}`);

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
