import express from "express";
import requireAuth from "../middleware/auth.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as walletService from "../services/whatsapp-wallet.service.js";
import * as billingGateway from "../services/billing-gateway.service.js";
import * as pricingService from "../services/whatsapp-pricing.service.js";

const router = express.Router();

// Public webhook endpoint for payment gateway callbacks
router.post(
  "/billing/topup/webhook",
  asyncHandler(async (req, res) => {
    const { providerPaymentId, providerOrderId, status, rawPayload } = req.body || {};
    const result = await billingGateway.processPaymentCallback({
      providerPaymentId: providerPaymentId || req.body.payment_id || req.body.id,
      providerOrderId: providerOrderId || req.body.order_id,
      status: status || "COMPLETED",
      rawPayload: rawPayload || req.body,
    });
    res.json(result);
  }),
);

// Protected endpoints below
router.use(requireAuth);

router.get(
  "/billing/wallet",
  asyncHandler(async (req, res) => {
    const wallet = await walletService.getWallet(req.workspaceId);
    res.json(wallet);
  }),
);

router.get(
  "/billing/ledger",
  asyncHandler(async (req, res) => {
    const ledger = await walletService.listLedger(req.workspaceId, {
      limit: req.query.limit,
    });
    res.json(ledger);
  }),
);

router.post(
  "/billing/topup/initiate",
  asyncHandler(async (req, res) => {
    const { amount, provider, currency } = req.body;
    const order = await billingGateway.createTopupOrder(req.workspaceId, {
      amount,
      provider,
      currency,
    });
    res.status(201).json(order);
  }),
);

router.get(
  "/billing/pricing/rates",
  asyncHandler(async (req, res) => {
    const rates = await pricingService.listRates({
      countryCode: req.query.countryCode,
      category: req.query.category,
    });
    res.json(rates);
  }),
);

export default router;
