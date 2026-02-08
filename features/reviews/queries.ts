import { eq, and, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Review } from "@/lib/db/schema";

export async function createReview(data: {
  listingId: string;
  reviewerAlienId: string;
  rating: number;
  comment?: string;
}): Promise<Review> {
  const [review] = await db
    .insert(schema.reviews)
    .values(data)
    .returning();
  return review;
}

export async function getReviewsByListing(listingId: string): Promise<Review[]> {
  return db.query.reviews.findMany({
    where: eq(schema.reviews.listingId, listingId),
    orderBy: [desc(schema.reviews.createdAt)],
  });
}

export async function hasUserReviewed(listingId: string, alienId: string): Promise<boolean> {
  const existing = await db.query.reviews.findFirst({
    where: and(
      eq(schema.reviews.listingId, listingId),
      eq(schema.reviews.reviewerAlienId, alienId),
    ),
  });
  return !!existing;
}
