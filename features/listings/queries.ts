import { eq, desc, and, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Listing } from "@/lib/db/schema";

export async function createListing(data: {
  sellerAlienId: string;
  title: string;
  description: string;
  category: string;
  price: string;
  token: string;
  network: string;
  imageUrl?: string;
  tags?: string[];
  aiGenerated?: boolean;
  aiSummary?: string;
}): Promise<Listing> {
  const [listing] = await db
    .insert(schema.listings)
    .values(data)
    .returning();
  return listing;
}

export async function getListings(limit = 50): Promise<Listing[]> {
  return db.query.listings.findMany({
    where: eq(schema.listings.status, "active"),
    orderBy: [desc(schema.listings.createdAt)],
    limit,
  });
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  return db.query.listings.findFirst({
    where: eq(schema.listings.id, id),
  });
}

export async function getListingsByUser(alienId: string): Promise<Listing[]> {
  return db.query.listings.findMany({
    where: and(
      eq(schema.listings.sellerAlienId, alienId),
      eq(schema.listings.status, "active"),
    ),
    orderBy: [desc(schema.listings.createdAt)],
  });
}

export async function incrementViewCount(id: string): Promise<void> {
  await db
    .update(schema.listings)
    .set({ viewCount: sql`${schema.listings.viewCount} + 1` })
    .where(eq(schema.listings.id, id));
}

export async function updateListingScan(id: string, scanData: {
  clawshieldScore: number;
  clawshieldBand: string;
  clawshieldFindings: number;
  clawshieldReport: unknown;
}): Promise<void> {
  await db
    .update(schema.listings)
    .set(scanData)
    .where(eq(schema.listings.id, id));
}

export async function deleteListing(id: string, alienId: string): Promise<boolean> {
  const result = await db
    .update(schema.listings)
    .set({ status: "deleted" })
    .where(and(eq(schema.listings.id, id), eq(schema.listings.sellerAlienId, alienId)))
    .returning();
  return result.length > 0;
}
