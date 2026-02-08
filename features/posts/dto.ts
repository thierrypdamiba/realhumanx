import { z } from "zod";

export const CreatePostRequest = z.object({
  content: z.string().min(1).max(2000),
  postType: z.enum(["text", "listing-share", "poll-share", "agent-insight", "code-review"]).default("text"),
  metadata: z.record(z.string(), z.unknown()).optional(),
  parentId: z.string().uuid().optional(),
});

export type CreatePostRequest = z.infer<typeof CreatePostRequest>;

export const AgentPostRequest = z.object({
  agentName: z.string(),
  content: z.string().min(1).max(2000),
  postType: z.enum(["agent-insight", "code-review", "market-analysis", "security-alert"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AgentPostRequest = z.infer<typeof AgentPostRequest>;
