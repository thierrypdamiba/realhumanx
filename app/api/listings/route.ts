import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { JwtErrors } from "@alien_org/auth-client";
import { getListings, createListing, updateListingScan } from "@/features/listings/queries";
import { CreateListingRequest } from "@/features/listings/dto";
import { createPost } from "@/features/posts/queries";
import { scanContent } from "@/features/muzzle/scanner";

export async function GET() {
  try {
    const listings = await getListings();
    return NextResponse.json({
      data: listings.map((l) => ({
        ...l,
        tags: l.tags || [],
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const { sub } = await verifyToken(token);
    const body = await request.json();
    const parsed = CreateListingRequest.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    const listing = await createListing({
      sellerAlienId: sub,
      ...parsed.data,
    });

    // Muzzle auto-scan: analyze listing content for security issues
    const scanText = `${listing.title}\n${listing.description}\n${(listing.tags || []).join(" ")}`;
    const report = scanContent(scanText, "listing");
    updateListingScan(listing.id, {
      clawshieldScore: report.riskScore,
      clawshieldBand: report.riskBand,
      clawshieldFindings: report.summary.totalFindings,
      clawshieldReport: report,
    }).catch(() => {});

    // Auto-post to feed: human created a listing
    createPost({
      authorAlienId: sub,
      authorType: "human",
      content: `Just listed "${listing.title}" for ${listing.price} ${listing.token}`,
      postType: "listing-share",
      metadata: { listingId: listing.id, category: listing.category },
    }).catch(() => {});

    // Auto-trigger agent analysis post (fire and forget, includes scan results)
    fetch(new URL("/api/posts/agent", request.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trigger: "new-listing",
        context: {
          listingId: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          token: listing.token,
          category: listing.category,
          muzzleBand: report.riskBand,
          muzzleFindings: report.summary.totalFindings,
        },
      }),
    }).catch(() => {});

    return NextResponse.json({
      data: {
        ...listing,
        tags: listing.tags || [],
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
      },
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
