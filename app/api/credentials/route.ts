import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { JwtErrors } from "@alien_org/auth-client";
import { addCredential, getCredentialsByUser } from "@/features/credentials/queries";
import { z } from "zod";

const CreateCredentialRequest = z.object({
  credentialType: z.enum(["education", "skill", "certification", "experience", "other"]),
  claim: z.string().min(1).max(500),
  evidence: z.string().max(2000).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const alienId = url.searchParams.get("alienId");

  if (!alienId) {
    return NextResponse.json({ error: "alienId required" }, { status: 400 });
  }

  try {
    const creds = await getCredentialsByUser(alienId);
    return NextResponse.json({ data: creds });
  } catch {
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
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
    const parsed = CreateCredentialRequest.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const cred = await addCredential({
      ownerAlienId: sub,
      ...parsed.data,
    });

    return NextResponse.json({ data: cred });
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
