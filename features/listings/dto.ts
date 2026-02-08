import { z } from "zod";

export const CreateListingRequest = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().min(1).max(50),
  price: z.string().min(1),
  token: z.enum(["USDC", "ALIEN", "SOL"]).default("USDC"),
  network: z.enum(["solana", "alien"]).default("solana"),
  imageUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateListingRequest = z.infer<typeof CreateListingRequest>;

export const ListingDTO = z.object({
  id: z.string(),
  sellerAlienId: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  price: z.string(),
  token: z.string(),
  network: z.string(),
  imageUrl: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  status: z.string(),
  aiGenerated: z.boolean(),
  aiSummary: z.string().nullable(),
  viewCount: z.number(),
  createdAt: z.string(),
});

export type ListingDTO = z.infer<typeof ListingDTO>;

export const AiGenerateRequest = z.object({
  prompt: z.string().min(1).max(1000),
  category: z.string().optional(),
});

export type AiGenerateRequest = z.infer<typeof AiGenerateRequest>;
