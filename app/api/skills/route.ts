import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { JwtErrors } from "@alien_org/auth-client";
import { createSkill, getSkills } from "@/features/skills/queries";
import { scanContent } from "@/features/clawshield/scanner";
import { createPost } from "@/features/posts/queries";

export async function GET() {
  try {
    const skills = await getSkills();
    return NextResponse.json({
      data: skills.map((s) => ({
        ...s,
        tags: s.tags || [],
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
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

    const { name, description, code, language, category, tags } = body;
    if (!name || !description || !code) {
      return NextResponse.json({ error: "name, description, and code are required" }, { status: 400 });
    }

    // ClawShield auto-scan the skill code
    const report = scanContent(`${name}\n${description}\n${code}`, "skill");

    const skill = await createSkill({
      authorAlienId: sub,
      name,
      description,
      code,
      language: language || "typescript",
      category: category || "utility",
      tags: tags || [],
      clawshieldScore: report.riskScore,
      clawshieldBand: report.riskBand,
      clawshieldFindings: report.summary.totalFindings,
      clawshieldReport: report,
    });

    // Auto-post to feed
    createPost({
      authorAlienId: sub,
      authorType: "human",
      content: `Shared a new skill: "${name}" [${report.riskBand} risk]`,
      postType: "listing-share",
      metadata: { skillId: skill.id, clawshieldBand: report.riskBand },
    }).catch(() => {});

    return NextResponse.json({
      data: {
        ...skill,
        tags: skill.tags || [],
        createdAt: skill.createdAt.toISOString(),
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
