export type GitHubProfile = {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
};

export type GitHubContributions = {
  totalCommits: number;
  totalRepos: number;
  accountAge: string;
  trustScore: number;
};

export async function fetchGitHubProfile(username: string): Promise<GitHubProfile | null> {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function computeTrustScore(profile: GitHubProfile): GitHubContributions {
  const createdAt = new Date(profile.created_at);
  const ageInDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const ageInYears = (ageInDays / 365).toFixed(1);

  // Trust score: weighted combination of account age, repos, followers
  let score = 0;
  score += Math.min(ageInDays / 365 * 10, 30); // Up to 30 points for age (3+ years)
  score += Math.min(profile.public_repos * 2, 30); // Up to 30 points for repos (15+)
  score += Math.min(profile.followers * 0.5, 20); // Up to 20 points for followers (40+)
  score += profile.bio ? 10 : 0; // 10 points for having a bio
  score += profile.name ? 10 : 0; // 10 points for having a name
  score = Math.min(Math.round(score), 100);

  return {
    totalCommits: profile.public_repos * 15, // estimate
    totalRepos: profile.public_repos,
    accountAge: `${ageInYears} years`,
    trustScore: score,
  };
}
