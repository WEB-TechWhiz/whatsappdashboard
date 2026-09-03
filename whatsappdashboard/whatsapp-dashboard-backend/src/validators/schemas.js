// const { z } = require("zod");
import z from "zod";

const login = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const signup = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const refreshToken = z.object({
  refreshToken: z.string().min(32),
});

const logout = z.object({
  refreshToken: z.string().min(32).optional(),
});

const sendMessage = z.object({
  text: z.string().trim().min(1).max(4096),
  mediaUrl: z.string().url().optional(),
});

const typing = z.object({
  isTyping: z.boolean(),
});

const createLead = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(6).max(20),
  source: z.enum(["Instagram", "Website", "Facebook", "Referral"]),
  status: z.enum(["Hot", "Warm", "Cold", "Booked"]).default("Warm"),
  value: z.number().nonnegative().default(0),
});

const updateLead = z
  .object({
    status: z.enum(["Hot", "Warm", "Cold", "Booked"]).optional(),
    value: z.number().nonnegative().optional(),
  })
  .refine((data) => data.status !== undefined || data.value !== undefined, {
    message: "At least one of status or value must be provided",
  });

const updateProfile = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().email(),
});

const updateWhatsappSettings = z.object({
  phone: z.string().trim().min(6).max(20),
  apiToken: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(10).optional(),
  ),
  webhookUrl: z.string().url(),
});

const completeEmbeddedSignup = z.object({
  code: z.string().trim().min(8),
  wabaId: z.string().trim().min(1).optional(),
  phoneNumberId: z.string().trim().min(1).optional(),
  businessId: z.string().trim().min(1).optional(),
  displayPhoneNumber: z.string().trim().min(6).max(32).optional(),
  businessName: z.string().trim().max(200).optional(),
  event: z.string().trim().max(80).optional(),
  version: z.union([z.string(), z.number()]).optional(),
});

const updateComplianceSettings = z.object({
  messagingPaused: z.boolean().optional(),
  pauseReason: z.string().trim().max(500).nullable().optional(),
  dailyOutboundLimit: z.number().int().positive().max(100000).optional(),
  perMinuteOutboundLimit: z.number().int().positive().max(10000).optional(),
});

const updateContactPreference = z.object({
  optedOut: z.boolean(),
  reason: z.string().trim().max(500).optional(),
});

const updateRules = z.object({
  autoReply: z.boolean().optional(),
  notifyNewLeads: z.boolean().optional(),
  flagLeaks: z.boolean().optional(),
});

const inboundWhatsappMessage = z.object({
  workspaceId: z.string().uuid(),
  phone: z.string().trim().min(6).max(20),
  name: z.string().trim().min(1).max(200).optional(),
  text: z.string().trim().min(1).max(4096),
  mediaUrl: z.string().url().optional(),
  source: z.enum(["Instagram", "Website", "Facebook", "Referral"]).default("Website"),
});

const updateWorkspaceSettings = z.object({
  businessName: z.string().trim().max(200).optional(),
  industry: z.string().trim().max(120).optional(),
  teamSize: z.string().trim().max(40).optional(),
  features: z.record(z.string(), z.boolean()).optional(),
  onboardingCompleted: z.boolean().optional(),
});

export {
  login,
  signup,
  refreshToken,
  logout,
  sendMessage,
  typing,
  createLead,
  updateLead,
  updateProfile,
  updateWhatsappSettings,
  completeEmbeddedSignup,
  updateComplianceSettings,
  updateContactPreference,
  updateRules,
  inboundWhatsappMessage,
  updateWorkspaceSettings,
};
