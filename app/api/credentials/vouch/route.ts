import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { JwtErrors } from "@alien_org/auth-client";
import { vouchCredential, getCredentialById } from "@/features/credentials/queries";
import { callAgent } from "@/features/agent/lib";
import { setAiVerification } from "@/features/credentials/queries";
import { z } from "zod";

const VouchRequest = z.object({
  credentialId: z.string().uuid(),
  vouchType: z.enum(["verify", "dispute"]),
  comment: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const { sub } = await verifyToken(token);
    const body = await request.json();
    const parsed = VouchRequest.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Can't vouch for your own credential
    const cred = await getCredentialById(parsed.data.credentialId);
    if (!cred) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }
    if (cred.ownerAlienId === sub) {
      return NextResponse.json({ error: "Cannot vouch for your own credential" }, { status: 400 });
    }

    const vouch = await vouchCredential({
      credentialId: parsed.data.credentialId,
      voucherAlienId: sub,
      vouchType: parsed.data.vouchType,
      comment: parsed.data.comment,
    });

    if (!vouch) {
      return NextResponse.json({ error: "Already vouched for this credential" }, { status: 409 });
    }

    // After 3+ total vouches, trigger AI verification (fire and forget)
    const totalVouches = (cred.verifyCount || 0) + (cred.disputeCount || 0) + 1;
    if (totalVouches >= 3 && !cred.aiConfidence) {
      triggerAiVerification(cred.id, cred.claim, cred.evidence, cred.credentialType).catch(() => {});
    }

    return NextResponse.json({ data: vouch });
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

async function triggerAiVerification(credId: string, claim: string, evidence: string | null, credType: string) {
  const prompt = `You are a credential verification AI for RealHuman X. Analyze this claim and assign a confidence score (0-100).

Credential type: ${credType}
Claim: "${claim}"
Evidence provided: ${evidence || "None"}

Consider:
- Is this claim verifiable?
- Does the evidence (if any) support it?
- How common is this type of credential fraud?
- What would a reasonable person conclude?

Respond with ONLY a JSON object: {"confidence": <0-100>, "reasoning": "<1-2 sentences>"}`;

  const result = await callAgent(prompt, claim, "agent:verifier", "verify-credential");
  try {
    const parsed = JSON.parse(result.content);
    await setAiVerification(credId, parsed.confidence, parsed.reasoning);
  } catch {
    await setAiVerification(credId, 50, "AI could not parse evidence. Manual review recommended.");
  }
}
