import pool from "../config/db.js";
import { executeLedgerTransaction } from "./whatsapp-wallet.service.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

/**
 * Create topup billing transaction order.
 */
async function createTopupOrder(workspaceId, { amount, provider = "RAZORPAY", currency = "USD" }) {
  const parsedAmount = Number.parseFloat(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new BadRequestError("Top-up amount must be a positive number", "INVALID_TOPUP_AMOUNT");
  }

  const providerOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const { rows } = await pool.query(
    `INSERT INTO whatsapp_billing_transactions (
       workspace_id, provider, provider_order_id, amount, currency, status
     )
     VALUES ($1, $2, $3, $4, $5, 'PENDING')
     RETURNING *`,
    [workspaceId, provider.toUpperCase(), providerOrderId, parsedAmount, currency.toUpperCase()],
  );

  const tx = rows[0];
  return {
    transactionId: tx.id,
    workspaceId: tx.workspace_id,
    provider: tx.provider,
    providerOrderId: tx.provider_order_id,
    amount: Number.parseFloat(tx.amount),
    currency: tx.currency,
    status: tx.status,
    createdAt: tx.created_at,
  };
}

/**
 * Handle payment gateway callback idempotently.
 * Receiving 10 duplicate callbacks results in exactly 1 wallet credit.
 */
async function processPaymentCallback({ providerPaymentId, providerOrderId, status = "COMPLETED", rawPayload = {} }) {
  if (!providerPaymentId) {
    throw new BadRequestError("Provider payment ID is required", "MISSING_PAYMENT_ID");
  }

  // 1. Check for existing payment transaction
  const existingRes = await pool.query(
    `SELECT * FROM whatsapp_billing_transactions WHERE provider_payment_id = $1`,
    [providerPaymentId],
  );

  if (existingRes.rows[0]) {
    const existingTx = existingRes.rows[0];
    return {
      transactionId: existingTx.id,
      alreadyProcessed: true,
      status: existingTx.status,
      message: "Payment callback previously processed (idempotent duplicate skipped)",
    };
  }

  // 2. Find matching order if providerOrderId supplied
  let workspaceId = null;
  let amount = 0;
  let currency = "USD";

  if (providerOrderId) {
    const orderRes = await pool.query(
      `SELECT * FROM whatsapp_billing_transactions WHERE provider_order_id = $1 AND status = 'PENDING'`,
      [providerOrderId],
    );
    if (orderRes.rows[0]) {
      const orderTx = orderRes.rows[0];
      workspaceId = orderTx.workspace_id;
      amount = Number.parseFloat(orderTx.amount);
      currency = orderTx.currency;
    }
  }

  if (!workspaceId && rawPayload.workspaceId) {
    workspaceId = rawPayload.workspaceId;
    amount = Number.parseFloat(rawPayload.amount || 0);
  }

  if (!workspaceId || amount <= 0) {
    throw new BadRequestError("Unable to match payment to workspace or amount", "INVALID_PAYMENT_MATCH");
  }

  // 3. Record transaction
  const { rows } = await pool.query(
    `INSERT INTO whatsapp_billing_transactions (
       workspace_id, provider, provider_payment_id, provider_order_id, amount, currency, status, raw_payload
     )
     VALUES ($1, 'RAZORPAY', $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [workspaceId, providerPaymentId, providerOrderId || null, amount, currency, status, JSON.stringify(rawPayload)],
  );
  const tx = rows[0];

  if (status === "COMPLETED") {
    // 4. Credit wallet transactionally
    await executeLedgerTransaction({
      workspaceId,
      amount,
      entryType: "TOPUP",
      referenceId: tx.id,
      referenceType: "PAYMENT_TRANSACTION",
      description: `Wallet top-up via payment ${providerPaymentId}`,
    });
  }

  return {
    transactionId: tx.id,
    alreadyProcessed: false,
    status: tx.status,
    amount,
    currency,
  };
}

export {
  createTopupOrder,
  processPaymentCallback,
};
