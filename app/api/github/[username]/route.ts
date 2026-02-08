import { NextResponse } from "next/server";
import { fetchGitHubProfile, computeTrustScore } from "@/features/github/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  const profile = await fetchGitHubProfile(username);
  if (!profile) {
    return NextResponse.json({ error: "GitHub user not found" }, { status: 404 });
  }

  const contributions = computeTrustScore(profile);

  return NextResponse.json({
    data: {
      profile: {
        login: profile.login,
        name: profile.name,
        bio: profile.bio,
        avatarUrl: profile.avatar_url,
        publicRepos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
        createdAt: profile.created_at,
        htmlUrl: profile.html_url,
      },
      trust: contributions,
    },
  });
}
