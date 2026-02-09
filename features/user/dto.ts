import { z } from "zod";

export const UserDTO = z.object({
  id: z.string(),
  alienId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  reputationScore: z.number().default(0),
  disputeCount: z.number().default(0),
  credentialCount: z.number().default(0),
});

export type UserDTO = z.infer<typeof UserDTO>;
