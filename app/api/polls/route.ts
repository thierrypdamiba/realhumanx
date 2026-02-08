import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { JwtErrors } from "@alien_org/auth-client";
import { createPoll, getPolls } from "@/features/polls/queries";
import { CreatePollRequest } from "@/features/polls/dto";

export async function GET() {
  try {
    const polls = await getPolls();
    return NextResponse.json({
      data: polls.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        expiresAt: p.expiresAt?.toISOString() || null,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch polls" }, { status: 500 });
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
    const parsed = CreatePollRequest.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const expiresAt = parsed.data.expiresInHours
      ? new Date(Date.now() + parsed.data.expiresInHours * 60 * 60 * 1000)
      : undefined;

    const poll = await createPoll({
      creatorAlienId: sub,
      question: parsed.data.question,
      options: parsed.data.options,
      expiresAt,
    });

    return NextResponse.json({
      data: {
        ...poll,
        createdAt: poll.createdAt.toISOString(),
        expiresAt: poll.expiresAt?.toISOString() || null,
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
