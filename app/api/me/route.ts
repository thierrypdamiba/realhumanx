import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { findOrCreateUser } from "@/features/user/queries";
import { JwtErrors } from "@alien_org/auth-client";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get("Authorization"));

    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const { sub } = await verifyToken(token);
    const user = await findOrCreateUser(sub);

    // Compute reputation from credentials
    const credStats = await db
      .select({
        total: sql<number>`count(*)::int`,
        disputes: sql<number>`coalesce(sum(${schema.credentials.disputeCount}), 0)::int`,
      })
      .from(schema.credentials)
      .where(eq(schema.credentials.ownerAlienId, sub));

    const credentialCount = credStats[0]?.total ?? 0;
    const disputeCount = credStats[0]?.disputes ?? 0;

    return NextResponse.json({
      id: user.id,
      alienId: user.alienId,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      reputationScore: user.reputationScore,
      disputeCount,
      credentialCount,
    });
  } catch (error) {
    if (error instanceof JwtErrors.JWTExpired) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    if (error instanceof JwtErrors.JOSEError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.error("Error in /api/me:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
