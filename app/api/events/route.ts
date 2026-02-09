import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { JwtErrors } from "@alien_org/auth-client";
import { getEvents, createEvent } from "@/features/events/queries";

export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json({ data: events });
  } catch {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
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

    const event = await createEvent({
      title: body.title,
      description: body.description,
      date: body.date,
      time: body.time,
      location: body.location,
      host: body.host || "Community",
      hostColor: body.hostColor,
      hostBg: body.hostBg,
      capacity: body.capacity || 50,
      tags: body.tags || [],
      requiresVerification: body.requiresVerification ?? true,
      creatorAlienId: sub,
    });

    return NextResponse.json({ data: event });
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
