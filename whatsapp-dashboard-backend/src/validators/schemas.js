const { z } = require("zod");

const login = z.object({
  email: z.string().email(),
  password: z.string().min(8),
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
  apiToken: z.string().trim().min(10).optional(),
  webhookUrl: z.string().url(),
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

module.exports = {
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
  updateRules,
  inboundWhatsappMessage,
};
