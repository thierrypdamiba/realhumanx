import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { JwtErrors } from "@alien_org/auth-client";
import { toggleRsvp, getUserRsvps } from "@/features/events/queries";

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const { sub } = await verifyToken(token);
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const result = await toggleRsvp(eventId, sub);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof JwtErrors.JWTExpired) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    if (error instanceof JwtErrors.JOSEError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Event is full") {
      return NextResponse.json({ error: "Event is at capacity" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const { sub } = await verifyToken(token);
    const rsvps = await getUserRsvps(sub);
    return NextResponse.json({ data: rsvps });
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
