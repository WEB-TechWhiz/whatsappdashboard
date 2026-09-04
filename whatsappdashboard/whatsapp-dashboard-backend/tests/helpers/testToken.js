import express from "express";
import jwt from "jsonwebtoken";

const TEST_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";
const TEST_USER_ID = "00000000-0000-0000-0000-000000000002";

export function generateTestToken(payload = {}) {
  const defaultPayload = {
    workspaceId: TEST_WORKSPACE_ID,
    type: "access",
  };
  return jwt.sign({ ...defaultPayload, ...payload }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

export { TEST_WORKSPACE_ID, TEST_USER_ID };
