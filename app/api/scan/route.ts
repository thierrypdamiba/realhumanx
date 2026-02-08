import { NextResponse } from "next/server";
import { scanContent } from "@/features/muzzle/scanner";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, source } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (content.length > 50000) {
      return NextResponse.json({ error: "Content too large (max 50KB)" }, { status: 400 });
    }

    const report = scanContent(content, source || "listing");

    return NextResponse.json({ data: report });
  } catch {
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
