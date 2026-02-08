import { z } from "zod";

export const CreatePollRequest = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(6),
  expiresInHours: z.number().optional(),
});

export type CreatePollRequest = z.infer<typeof CreatePollRequest>;

export const CastVoteRequest = z.object({
  pollId: z.string().uuid(),
  optionIndex: z.number().int().min(0),
});

export type CastVoteRequest = z.infer<typeof CastVoteRequest>;
