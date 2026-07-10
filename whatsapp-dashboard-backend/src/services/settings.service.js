import pool from "../config/db.js";

function toDTO(row) {
  return {
    workspaceId: row.workspace_id,
    businessName: row.business_name || "",
    industry: row.industry || "",
    teamSize: row.team_size || "1-5",
    features: row.features || {},
    onboardingCompleted: row.onboarding_completed,
    updatedAt: row.updated_at,
  };
}

export async function getSettings(workspaceId) {
  const { rows } = await pool.query(
    `INSERT INTO workspace_settings (workspace_id) VALUES ($1)
     ON CONFLICT (workspace_id) DO UPDATE SET updated_at = workspace_settings.updated_at
     RETURNING *`,
    [workspaceId],
  );
  return toDTO(rows[0]);
}

export async function upsertSettings(workspaceId, patch) {
  const current = await getSettings(workspaceId);
  const next = {
    business_name: patch.businessName ?? current.businessName,
    industry: patch.industry ?? current.industry,
    team_size: patch.teamSize ?? current.teamSize,
    features: { ...current.features, ...(patch.features || {}) },
    onboarding_completed:
      patch.onboardingCompleted ?? current.onboardingCompleted,
  };

  const { rows } = await pool.query(
    `UPDATE workspace_settings
     SET business_name = $2, industry = $3, team_size = $4,
         features = $5::jsonb, onboarding_completed = $6, updated_at = now()
     WHERE workspace_id = $1
     RETURNING *`,
    [
      workspaceId,
      next.business_name,
      next.industry,
      next.team_size,
      JSON.stringify(next.features),
      next.onboarding_completed,
    ],
  );
  return toDTO(rows[0]);
}