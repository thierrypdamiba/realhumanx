import { db, schema } from "@/lib/db";
import { desc, eq, and, sql } from "drizzle-orm";

export async function addCredential(data: {
  ownerAlienId: string;
  credentialType: string;
  claim: string;
  evidence?: string;
}) {
  const [cred] = await db.insert(schema.credentials).values(data).returning();
  return cred;
}

export async function getCredentialsByUser(alienId: string) {
  return db.query.credentials.findMany({
    where: eq(schema.credentials.ownerAlienId, alienId),
    orderBy: [desc(schema.credentials.createdAt)],
  });
}

export async function getCredentialById(id: string) {
  return db.query.credentials.findFirst({
    where: eq(schema.credentials.id, id),
  });
}

export async function vouchCredential(data: {
  credentialId: string;
  voucherAlienId: string;
  vouchType: string;
  comment?: string;
}) {
  // Check if already vouched (sybil-resistant: one vouch per human per credential)
  const existing = await db.query.credentialVouches.findFirst({
    where: and(
      eq(schema.credentialVouches.credentialId, data.credentialId),
      eq(schema.credentialVouches.voucherAlienId, data.voucherAlienId),
    ),
  });
  if (existing) return null;

  const [vouch] = await db.insert(schema.credentialVouches).values(data).returning();

  // Update counts on the credential
  if (data.vouchType === "verify") {
    await db.update(schema.credentials)
      .set({ verifyCount: sql`${schema.credentials.verifyCount} + 1` })
      .where(eq(schema.credentials.id, data.credentialId));
  } else {
    await db.update(schema.credentials)
      .set({ disputeCount: sql`${schema.credentials.disputeCount} + 1` })
      .where(eq(schema.credentials.id, data.credentialId));
  }

  // Auto-update status based on counts
  const cred = await getCredentialById(data.credentialId);
  if (cred) {
    let newStatus = cred.status;
    if (cred.verifyCount >= 3 && cred.disputeCount === 0) {
      newStatus = "peer-verified";
    } else if (cred.disputeCount >= 2) {
      newStatus = "disputed";
    }
    if (newStatus !== cred.status) {
      await db.update(schema.credentials)
        .set({ status: newStatus })
        .where(eq(schema.credentials.id, data.credentialId));
    }
  }

  return vouch;
}

export async function getVouchesForCredential(credentialId: string) {
  return db.query.credentialVouches.findMany({
    where: eq(schema.credentialVouches.credentialId, credentialId),
    orderBy: [desc(schema.credentialVouches.createdAt)],
  });
}

export async function setAiVerification(credentialId: string, confidence: number, reasoning: string) {
  const newStatus = confidence >= 70 ? "ai-verified" : confidence <= 30 ? "disputed" : "unverified";
  await db.update(schema.credentials)
    .set({ aiConfidence: confidence, aiReasoning: reasoning, status: newStatus })
    .where(eq(schema.credentials.id, credentialId));
}
