import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { JwtErrors } from "@alien_org/auth-client";
import { createPost, getPosts } from "@/features/posts/queries";
import { CreatePostRequest } from "@/features/posts/dto";

export async function GET() {
  try {
    const posts = await getPosts();
    return NextResponse.json({ data: posts });
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
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
    const parsed = CreatePostRequest.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const isAnon = !!(body.isAnonymous);
    const post = await createPost({
      authorAlienId: sub,
      authorType: "human",
      isAnonymous: isAnon,
      content: parsed.data.content,
      postType: parsed.data.postType,
      metadata: parsed.data.metadata,
      parentId: parsed.data.parentId,
    });

    return NextResponse.json({ data: post });
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
