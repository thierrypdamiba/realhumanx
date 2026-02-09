import { eq, and, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function getEvents() {
  const rows = await db.select().from(schema.events).orderBy(schema.events.date);

  const rsvpCounts = await db
    .select({
      eventId: schema.eventRsvps.eventId,
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(schema.eventRsvps)
    .groupBy(schema.eventRsvps.eventId);

  const countMap = new Map(rsvpCounts.map((r) => [r.eventId, r.count]));

  return rows.map((event) => ({
    ...event,
    rsvpCount: countMap.get(event.id) ?? 0,
    createdAt: event.createdAt.toISOString(),
  }));
}

export async function createEvent(data: {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  host: string;
  hostColor?: string;
  hostBg?: string;
  capacity: number;
  tags: string[];
  requiresVerification?: boolean;
  creatorAlienId: string;
}) {
  const [event] = await db.insert(schema.events).values(data).returning();
  return event;
}

export async function toggleRsvp(eventId: string, userAlienId: string): Promise<{ action: "added" | "removed" }> {
  const existing = await db.query.eventRsvps.findFirst({
    where: and(
      eq(schema.eventRsvps.eventId, eventId),
      eq(schema.eventRsvps.userAlienId, userAlienId),
    ),
  });

  if (existing) {
    await db.delete(schema.eventRsvps).where(eq(schema.eventRsvps.id, existing.id));
    return { action: "removed" };
  }

  // Check capacity
  const event = await db.query.events.findFirst({
    where: eq(schema.events.id, eventId),
  });

  if (!event) {
    throw new Error("Event not found");
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.eventRsvps)
    .where(eq(schema.eventRsvps.eventId, eventId));

  if (count >= event.capacity) {
    throw new Error("Event is full");
  }

  await db.insert(schema.eventRsvps).values({ eventId, userAlienId });
  return { action: "added" };
}

export async function getUserRsvps(userAlienId: string): Promise<string[]> {
  const rows = await db.query.eventRsvps.findMany({
    where: eq(schema.eventRsvps.userAlienId, userAlienId),
  });
  return rows.map((r) => r.eventId);
}
