import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { JwtErrors } from "@alien_org/auth-client";
import { castVote, getVotesByPoll, getPollById } from "@/features/polls/queries";
import { CastVoteRequest } from "@/features/polls/dto";

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const { sub } = await verifyToken(token);
    const body = await request.json();
    const parsed = CastVoteRequest.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const poll = await getPollById(parsed.data.pollId);
    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (parsed.data.optionIndex >= (poll.options as string[]).length) {
      return NextResponse.json({ error: "Invalid option index" }, { status: 400 });
    }

    const vote = await castVote({
      pollId: parsed.data.pollId,
      voterAlienId: sub,
      optionIndex: parsed.data.optionIndex,
    });

    if (!vote) {
      return NextResponse.json(
        { error: "You have already voted on this poll. One human, one vote." },
        { status: 409 },
      );
    }

    const allVotes = await getVotesByPoll(parsed.data.pollId);
    const results = (poll.options as string[]).map((option, index) => ({
      option,
      count: allVotes.filter((v) => v.optionIndex === index).length,
    }));

    return NextResponse.json({
      data: {
        vote: { ...vote, createdAt: vote.createdAt.toISOString() },
        results,
        totalVotes: allVotes.length,
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
