import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { JwtErrors } from "@alien_org/auth-client";
import { createReview, hasUserReviewed } from "@/features/reviews/queries";
import { z } from "zod";

const CreateReviewRequest = z.object({
  listingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const { sub } = await verifyToken(token);
    const body = await request.json();
    const parsed = CreateReviewRequest.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const alreadyReviewed = await hasUserReviewed(parsed.data.listingId, sub);
    if (alreadyReviewed) {
      return NextResponse.json(
        { error: "You have already reviewed this listing. One review per verified human." },
        { status: 409 },
      );
    }

    const review = await createReview({
      ...parsed.data,
      reviewerAlienId: sub,
    });

    return NextResponse.json({
      data: { ...review, createdAt: review.createdAt.toISOString() },
    });
  } catch (error) {
    if (error instanceof JwtErrors.JWTExpired) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    if (error instanceof JwtErrors.JOSEError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
