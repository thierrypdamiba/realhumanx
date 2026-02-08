import { db, schema } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";

export async function createSkill(data: {
  authorAlienId: string;
  name: string;
  description: string;
  code: string;
  language?: string;
  category?: string;
  tags?: string[];
  clawshieldScore?: number;
  clawshieldBand?: string;
  clawshieldFindings?: number;
  clawshieldReport?: unknown;
}) {
  const [skill] = await db.insert(schema.skills).values(data).returning();
  return skill;
}

export async function getSkills(limit = 50) {
  return db.query.skills.findMany({
    where: eq(schema.skills.status, "active"),
    orderBy: [desc(schema.skills.createdAt)],
    limit,
  });
}

export async function getSkillById(id: string) {
  return db.query.skills.findFirst({
    where: eq(schema.skills.id, id),
  });
}

export async function incrementInstallCount(id: string) {
  await db.update(schema.skills)
    .set({ installCount: sql`${schema.skills.installCount} + 1` })
    .where(eq(schema.skills.id, id));
}

export async function vouchSkill(id: string) {
  await db.update(schema.skills)
    .set({ vouchCount: sql`${schema.skills.vouchCount} + 1` })
    .where(eq(schema.skills.id, id));
}

export async function logSandboxRun(data: {
  runnerAlienId?: string;
  skillId?: string;
  code: string;
  language?: string;
  output?: string;
  error?: string;
  durationMs?: number;
  clawshieldScore?: number;
  clawshieldBand?: string;
}) {
  const [run] = await db.insert(schema.sandboxRuns).values(data).returning();
  return run;
}
