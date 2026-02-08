import { eq, and, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Poll, Vote } from "@/lib/db/schema";

export async function createPoll(data: {
  creatorAlienId: string;
  question: string;
  options: string[];
  expiresAt?: Date;
}): Promise<Poll> {
  const [poll] = await db
    .insert(schema.polls)
    .values(data)
    .returning();
  return poll;
}

export async function getPolls(limit = 20): Promise<Poll[]> {
  return db.query.polls.findMany({
    where: eq(schema.polls.status, "active"),
    orderBy: [desc(schema.polls.createdAt)],
    limit,
  });
}

export async function getPollById(id: string): Promise<Poll | undefined> {
  return db.query.polls.findFirst({
    where: eq(schema.polls.id, id),
  });
}

export async function castVote(data: {
  pollId: string;
  voterAlienId: string;
  optionIndex: number;
}): Promise<Vote | null> {
  const existing = await db.query.votes.findFirst({
    where: and(
      eq(schema.votes.pollId, data.pollId),
      eq(schema.votes.voterAlienId, data.voterAlienId),
    ),
  });
  if (existing) return null;

  const [vote] = await db
    .insert(schema.votes)
    .values(data)
    .returning();
  return vote;
}

export async function getVotesByPoll(pollId: string): Promise<Vote[]> {
  return db.query.votes.findMany({
    where: eq(schema.votes.pollId, pollId),
  });
}

export async function hasUserVoted(pollId: string, alienId: string): Promise<boolean> {
  const existing = await db.query.votes.findFirst({
    where: and(
      eq(schema.votes.pollId, pollId),
      eq(schema.votes.voterAlienId, alienId),
    ),
  });
  return !!existing;
}
