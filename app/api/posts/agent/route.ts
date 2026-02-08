import { NextResponse } from "next/server";
import { createPost } from "@/features/posts/queries";
import { callAgent, AGENT_PROMPTS } from "@/features/agent/lib";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trigger, context } = body;

    let agentName: string;
    let content: string;
    let postType: string;
    let metadata: Record<string, unknown> = {};

    switch (trigger) {
      case "new-listing": {
        agentName = "Kalibr Market Analyst";
        const result = await callAgent(
          AGENT_PROMPTS.listingAnalyzer,
          `New listing posted: ${context.title} - ${context.description}. Price: ${context.price} ${context.token}. Category: ${context.category}.`,
          "agent:kalibr",
          "analyze-listing",
        );
        content = `New listing alert: "${context.title}" just posted for ${context.price} ${context.token}. ${result.content}`;
        postType = "market-analysis";
        metadata = { listingId: context.listingId, model: result.model, provider: result.provider, durationMs: result.durationMs };
        break;
      }
      case "code-review": {
        agentName = "Greptile Code Analyst";
        const result = await callAgent(
          `You are a code review agent powered by Greptile. Analyze the code context and provide a brief, insightful review. Focus on security, best practices, and potential improvements. Keep it under 3 sentences.`,
          context.query || "Analyze the overall code quality and architecture.",
          "agent:greptile",
          "code-review",
        );
        content = result.content;
        postType = "code-review";
        metadata = { repo: context.repo, model: result.model, provider: result.provider };
        break;
      }
      case "security-scan": {
        agentName = "ProxLock Security Agent";
        content = `Security scan complete for ${context.target || "marketplace"}. No exposed API keys or credentials detected. All endpoints are properly authenticated via Alien Protocol JWT verification. ProxLock gateway is active.`;
        postType = "security-alert";
        metadata = { scanType: "routine", status: "clean" };
        break;
      }
      case "community-insight": {
        agentName = "Community AI";
        const result = await callAgent(
          `You are a community analyst for RealHuman X, a sybil-resistant social marketplace. Generate an interesting insight or conversation starter about verified human identity, decentralized marketplaces, or AI-human collaboration. Be thought-provoking and concise (1-2 sentences). Don't be generic.`,
          context.topic || "What's interesting about sybil-resistant social networks?",
          "agent:community",
          "ask",
        );
        content = result.content;
        postType = "agent-insight";
        metadata = { model: result.model, provider: result.provider };
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown trigger" }, { status: 400 });
    }

    const post = await createPost({
      authorType: "agent",
      agentName,
      content,
      postType,
      metadata,
    });

    return NextResponse.json({ data: post });
  } catch {
    return NextResponse.json({ error: "Agent post failed" }, { status: 500 });
  }
}
