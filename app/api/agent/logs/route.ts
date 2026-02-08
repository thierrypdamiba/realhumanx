import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const logs = await db.query.agentLogs.findMany({
      orderBy: [desc(schema.agentLogs.createdAt)],
      limit: 50,
    });
    return NextResponse.json({ data: logs });
  } catch {
    return NextResponse.json({ error: "Failed to fetch agent logs" }, { status: 500 });
  }
}
