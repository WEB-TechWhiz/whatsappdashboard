import pool from "../config/db.js";
import db from "../database.js";
import { calculateCost } from "./whatsapp-pricing.service.js";
import { BadRequestError, PaymentRequiredError } from "../utils/errors.js";

/**
 * Get or create wallet for workspace.
 */
async function getWallet(workspaceId) {
  const { rows } = await pool.query(
    `INSERT INTO whatsapp_wallets (workspace_id)
     VALUES ($1)
     ON CONFLICT (workspace_id) DO UPDATE SET updated_at = now()
     RETURNING *`,
    [workspaceId],
  );
  const w = rows[0];
  return {
    workspaceId: w.workspace_id,
    balance: Number.parseFloat(w.balance),
    currency: w.currency,
    lowBalanceThreshold: Number.parseFloat(w.low_balance_threshold),
    autoRechargeEnabled: w.auto_recharge_enabled,
    autoRechargeAmount: Number.parseFloat(w.auto_recharge_amount),
    updatedAt: w.updated_at,
  };
}

/**
 * Execute an immutable ledger transaction with database transaction and row locking.
 */
async function executeLedgerTransaction({
  workspaceId,
  amount,
  entryType,
  referenceId = null,
  referenceType = null,
  description,
}) {
  const parsedAmount = Number.parseFloat(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount === 0) {
    throw new BadRequestError("Transaction amount must be non-zero", "INVALID_LEDGER_AMOUNT");
  }

  return db.transaction(async (client) => {
    // 1. Lock wallet row for update
    const walletRes = await client.query(
      `INSERT INTO whatsapp_wallets (workspace_id)
       VALUES ($1)
       ON CONFLICT (workspace_id) DO UPDATE SET updated_at = now()
       RETURNING *`,
      [workspaceId],
    );

    const lockRes = await client.query(
      `SELECT * FROM whatsapp_wallets WHERE workspace_id = $1 FOR UPDATE`,
      [workspaceId],
    );
    const currentWallet = lockRes.rows[0];
    const currentBalance = Number.parseFloat(currentWallet.balance);

    const newBalance = Number.parseFloat((currentBalance + parsedAmount).toFixed(4));
    if (newBalance < 0) {
      throw new PaymentRequiredError("Insufficient wallet balance for operation", "INSUFFICIENT_FUNDS");
    }

    // 2. Update wallet balance
    await client.query(
      `UPDATE whatsapp_wallets
       SET balance = $1, updated_at = now()
       WHERE workspace_id = $2`,
      [newBalance, workspaceId],
    );

    // 3. Write immutable ledger record
    const ledgerRes = await client.query(
      `INSERT INTO whatsapp_ledger (
         workspace_id, amount, balance_after, entry_type, reference_id, reference_type, description
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [workspaceId, parsedAmount, newBalance, entryType, referenceId, referenceType, description],
    );

    return {
      ledgerEntry: ledgerRes.rows[0],
      newBalance,
    };
  });
}

/**
 * Rate unrated message usage record and debit wallet.
 */
async function rateAndDebitUsage(usageRecord) {
  if (!usageRecord || usageRecord.billing_status === "BILLED" || usageRecord.billing_status === "IGNORED") {
    return null;
  }

  const { totalCost, category } = await calculateCost({
    countryCode: usageRecord.recipient_country || "DEFAULT",
    category: usageRecord.category,
    quantity: usageRecord.quantity || 1,
    timestamp: usageRecord.timestamp,
  });

  if (totalCost <= 0) {
    await pool.query(
      `UPDATE whatsapp_message_usage
       SET billing_status = 'IGNORED'
       WHERE id = $1`,
      [usageRecord.id],
    );
    return null;
  }

  try {
    const result = await executeLedgerTransaction({
      workspaceId: usageRecord.workspace_id,
      amount: -totalCost, // negative for debit
      entryType: "DEBIT",
      referenceId: usageRecord.id,
      referenceType: "MESSAGE_USAGE",
      description: `WhatsApp ${category} message debit`,
    });

    await pool.query(
      `UPDATE whatsapp_message_usage
       SET billing_status = 'BILLED'
       WHERE id = $1`,
      [usageRecord.id],
    );

    return result;
  } catch (error) {
    if (error.code === "INSUFFICIENT_FUNDS") {
      await pool.query(
        `UPDATE whatsapp_message_usage
         SET billing_status = 'ERROR'
         WHERE id = $1`,
        [usageRecord.id],
      );
    }
    throw error;
  }
}

/**
 * List ledger transaction history for workspace.
 */
async function listLedger(workspaceId, { limit = 100 } = {}) {
  const cap = Math.min(Number(limit) || 100, 500);
  const { rows } = await pool.query(
    `SELECT *
     FROM whatsapp_ledger
     WHERE workspace_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [workspaceId, cap],
  );

  return rows.map((r) => ({
    id: r.id,
    workspaceId: r.workspace_id,
    amount: Number.parseFloat(r.amount),
    balanceAfter: Number.parseFloat(r.balance_after),
    entryType: r.entry_type,
    referenceId: r.reference_id,
    referenceType: r.reference_type,
    description: r.description,
    createdAt: r.created_at,
  }));
}

export {
  executeLedgerTransaction,
  getWallet,
  listLedger,
  rateAndDebitUsage,
};
