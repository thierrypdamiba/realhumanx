import { pgTable, text, timestamp, uuid, jsonb, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  alienId: text("alien_id").notNull().unique(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  reputationScore: integer("reputation_score").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const listings = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerAlienId: text("seller_alien_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("general"),
  price: text("price").notNull(),
  token: text("token").notNull().default("USDC"),
  network: text("network").notNull().default("solana"),
  imageUrl: text("image_url"),
  tags: jsonb("tags").$type<string[]>().default([]),
  status: text("status").notNull().default("active"),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  aiSummary: text("ai_summary"),
  isAnonymous: boolean("is_anonymous").notNull().default(false), // seller identity hidden publicly
  postedByAgent: boolean("posted_by_agent").notNull().default(false), // agent posted on behalf of human
  requiredCredentials: jsonb("required_credentials").$type<string[]>().default([]), // credentials needed to respond/buy
  clawshieldScore: integer("clawshield_score"), // 0-100 risk score from ClawShield scan
  clawshieldBand: text("clawshield_band"), // "LOW", "MEDIUM", "HIGH", "CRITICAL"
  clawshieldFindings: integer("clawshield_findings"), // total findings count
  clawshieldReport: jsonb("clawshield_report"), // full scan report JSON
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Listing = typeof listings.$inferSelect;

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull(),
  reviewerAlienId: text("reviewer_alien_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Review = typeof reviews.$inferSelect;

export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: uuid("poll_id").notNull(),
  voterAlienId: text("voter_alien_id").notNull(),
  optionIndex: integer("option_index").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Vote = typeof votes.$inferSelect;

export const polls = pgTable("polls", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorAlienId: text("creator_alien_id").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export type Poll = typeof polls.$inferSelect;

export const agentLogs = pgTable("agent_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userAlienId: text("user_alien_id").notNull(),
  action: text("action").notNull(),
  input: text("input"),
  output: text("output"),
  model: text("model"),
  provider: text("provider"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;

// Credentials: self-declared claims that can be verified by peers + AI
export const credentials = pgTable("credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerAlienId: text("owner_alien_id").notNull(),
  credentialType: text("credential_type").notNull(), // "education", "skill", "certification", "experience", "other"
  claim: text("claim").notNull(), // "PhD in Mathematics", "10 years React experience"
  evidence: text("evidence"), // URL to proof (GitHub, LinkedIn, portfolio, etc.)
  status: text("status").notNull().default("unverified"), // "unverified", "peer-verified", "disputed", "ai-verified"
  verifyCount: integer("verify_count").notNull().default(0),
  disputeCount: integer("dispute_count").notNull().default(0),
  aiConfidence: integer("ai_confidence"), // 0-100, null if not yet audited
  aiReasoning: text("ai_reasoning"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Credential = typeof credentials.$inferSelect;

// Peer verifications: humans vouch for other humans' credentials
export const credentialVouches = pgTable("credential_vouches", {
  id: uuid("id").primaryKey().defaultRandom(),
  credentialId: uuid("credential_id").notNull(),
  voucherAlienId: text("voucher_alien_id").notNull(),
  vouchType: text("vouch_type").notNull().default("verify"), // "verify" or "dispute"
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CredentialVouch = typeof credentialVouches.$inferSelect;

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorAlienId: text("author_alien_id"),
  authorType: text("author_type").notNull().default("human"), // "human", "agent", "agent-delegated"
  agentName: text("agent_name"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  content: text("content").notNull(),
  postType: text("post_type").notNull().default("text"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  parentId: uuid("parent_id"),
  likeCount: integer("like_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Post = typeof posts.$inferSelect;

// Shared skills: OpenClaw-compatible skill definitions with ClawShield scanning
export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorAlienId: text("author_alien_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  code: text("code").notNull(), // skill definition / code content
  language: text("language").notNull().default("typescript"), // typescript, python, markdown, yaml
  category: text("category").notNull().default("utility"), // utility, agent, automation, data, security, other
  tags: jsonb("tags").$type<string[]>().default([]),
  installCount: integer("install_count").notNull().default(0),
  vouchCount: integer("vouch_count").notNull().default(0),
  clawshieldScore: integer("clawshield_score"),
  clawshieldBand: text("clawshield_band"),
  clawshieldFindings: integer("clawshield_findings"),
  clawshieldReport: jsonb("clawshield_report"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Skill = typeof skills.$inferSelect;

// Sandbox executions: logged runs of code in isolated environment
export const sandboxRuns = pgTable("sandbox_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  runnerAlienId: text("runner_alien_id"),
  skillId: uuid("skill_id"),
  code: text("code").notNull(),
  language: text("language").notNull().default("javascript"),
  output: text("output"),
  error: text("error"),
  durationMs: integer("duration_ms"),
  clawshieldScore: integer("clawshield_score"),
  clawshieldBand: text("clawshield_band"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SandboxRun = typeof sandboxRuns.$inferSelect;

export const paymentIntents = pgTable("payment_intents", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoice: text("invoice").notNull().unique(),
  senderAlienId: text("sender_alien_id").notNull(),
  recipientAddress: text("recipient_address").notNull(),
  amount: text("amount").notNull(),
  token: text("token").notNull(),
  network: text("network").notNull(),
  productId: text("product_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PaymentIntent = typeof paymentIntents.$inferSelect;

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderAlienId: text("sender_alien_id"),
  recipientAddress: text("recipient_address").notNull(),
  txHash: text("tx_hash"),
  status: text("status").notNull(),
  amount: text("amount"),
  token: text("token"),
  network: text("network"),
  invoice: text("invoice"),
  test: text("test"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Transaction = typeof transactions.$inferSelect;
