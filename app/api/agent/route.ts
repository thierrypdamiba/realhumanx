import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { JwtErrors } from "@alien_org/auth-client";
import { callAgent, AGENT_PROMPTS } from "@/features/agent/lib";
import { z } from "zod";

const AgentRequest = z.object({
  action: z.enum(["generate-listing", "analyze-listing", "negotiate", "ask"]),
  input: z.string().min(1).max(2000),
  context: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const { sub } = await verifyToken(token);
    const body = await request.json();
    const parsed = AgentRequest.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    let systemPrompt: string;
    switch (parsed.data.action) {
      case "generate-listing":
        systemPrompt = AGENT_PROMPTS.listingGenerator;
        break;
      case "analyze-listing":
        systemPrompt = AGENT_PROMPTS.listingAnalyzer;
        break;
      case "negotiate":
        systemPrompt = AGENT_PROMPTS.negotiator;
        break;
      default:
        systemPrompt = "You are a helpful AI assistant for Black Dog Registry, a verified-human marketplace. Be concise and helpful.";
    }

    const userMessage = parsed.data.context
      ? `${parsed.data.input}\n\nContext: ${parsed.data.context}`
      : parsed.data.input;

    const result = await callAgent(systemPrompt, userMessage, sub, parsed.data.action);

    return NextResponse.json({ data: result });
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
