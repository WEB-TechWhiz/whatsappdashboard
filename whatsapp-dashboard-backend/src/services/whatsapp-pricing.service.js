import pool from "../config/db.js";

/**
 * Find effective rate for country and category at a specific timestamp.
 * Fallback chain: specific country -> 'DEFAULT' -> 0.0000 fallback
 */
async function getEffectiveRate({ countryCode = "DEFAULT", category = "SERVICE", timestamp = new Date() }) {
  const normCountry = (countryCode || "DEFAULT").toUpperCase();
  const normCategory = (category || "SERVICE").toUpperCase();

  const { rows } = await pool.query(
    `SELECT rate, currency, country_code, message_category
     FROM whatsapp_pricing_rates
     WHERE (country_code = $1 OR country_code = 'DEFAULT')
       AND message_category = $2
       AND effective_from <= $3
       AND (effective_until IS NULL OR effective_until > $3)
     ORDER BY
       CASE WHEN country_code = $1 THEN 1 ELSE 2 END,
       effective_from DESC
     LIMIT 1`,
    [normCountry, normCategory, timestamp],
  );

  if (rows[0]) {
    return {
      rate: Number.parseFloat(rows[0].rate),
      currency: rows[0].currency,
      matchedCountry: rows[0].country_code,
      category: rows[0].message_category,
    };
  }

  return {
    rate: 0.0100,
    currency: "USD",
    matchedCountry: "DEFAULT_FALLBACK",
    category: normCategory,
  };
}

/**
 * Calculate monetary cost for a usage quantity.
 */
async function calculateCost({ countryCode, category, quantity = 1, timestamp = new Date() }) {
  const rateInfo = await getEffectiveRate({ countryCode, category, timestamp });
  const totalCost = Number.parseFloat((rateInfo.rate * quantity).toFixed(4));
  return {
    ...rateInfo,
    quantity,
    totalCost,
  };
}

/**
 * List all configured pricing rates.
 */
async function listRates({ countryCode, category } = {}) {
  let query = `SELECT * FROM whatsapp_pricing_rates WHERE 1=1`;
  const params = [];

  if (countryCode) {
    params.push(countryCode.toUpperCase());
    query += ` AND country_code = $${params.length}`;
  }

  if (category) {
    params.push(category.toUpperCase());
    query += ` AND message_category = $${params.length}`;
  }

  query += ` ORDER BY country_code ASC, message_category ASC, effective_from DESC`;
  const { rows } = await pool.query(query, params);
  return rows;
}

/**
 * Upsert a pricing rate record.
 */
async function upsertRate({ countryCode = "DEFAULT", category, rate, currency = "USD", provider = "META", effectiveFrom = new Date() }) {
  const { rows } = await pool.query(
    `INSERT INTO whatsapp_pricing_rates (country_code, currency, message_category, rate, provider, effective_from)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [countryCode.toUpperCase(), currency.toUpperCase(), category.toUpperCase(), rate, provider, effectiveFrom],
  );
  return rows[0];
}

export {
  calculateCost,
  getEffectiveRate,
  listRates,
  upsertRate,
};
