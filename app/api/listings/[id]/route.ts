import { NextResponse } from "next/server";
import { getListingById, incrementViewCount } from "@/features/listings/queries";
import { getReviewsByListing } from "@/features/reviews/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const listing = await getListingById(id);

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    await incrementViewCount(id);
    const reviews = await getReviewsByListing(id);

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

    return NextResponse.json({
      data: {
        ...listing,
        tags: listing.tags || [],
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
        reviews: reviews.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
        avgRating,
        reviewCount: reviews.length,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
