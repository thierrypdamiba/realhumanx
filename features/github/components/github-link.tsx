"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Github, ExternalLink, Star, GitFork, Users, Calendar } from "lucide-react";
import toast from "react-hot-toast";

type GitHubData = {
  profile: {
    login: string;
    name: string | null;
    bio: string | null;
    avatarUrl: string;
    publicRepos: number;
    followers: number;
    following: number;
    createdAt: string;
    htmlUrl: string;
  };
  trust: {
    totalCommits: number;
    totalRepos: number;
    accountAge: string;
    trustScore: number;
  };
};

export function GitHubLink() {
  const [username, setUsername] = useState("");
  const [linkedUser, setLinkedUser] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["github-profile", linkedUser],
    queryFn: async () => {
      const res = await fetch(`/api/github/${linkedUser}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as GitHubData;
    },
    enabled: !!linkedUser,
  });

  const handleLink = () => {
    if (!username.trim()) return;
    setLinkedUser(username.trim());
    refetch();
    toast.success("Looking up GitHub profile...");
  };

  if (!linkedUser || !data) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <Github size={14} className="text-text-muted" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-dim">GitHub Identity</h3>
        </div>
        <p className="mb-3 text-[10px] text-text-muted">
          Link your GitHub to add developer trust signals to your Alien ID.
        </p>
        <div className="flex gap-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLink()}
            placeholder="GitHub username"
            className="flex-1 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
          <button
            onClick={handleLink}
            disabled={isLoading || !username.trim()}
            className="rounded-lg bg-accent/10 px-4 py-2 text-xs font-semibold text-accent-light transition-colors hover:bg-accent/20 disabled:opacity-50"
          >
            {isLoading ? "..." : "Link"}
          </button>
        </div>
      </div>
    );
  }

  const { profile, trust } = data;
  const scoreColor = trust.trustScore >= 70 ? "text-success" : trust.trustScore >= 40 ? "text-warning" : "text-danger";

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <Github size={14} className="text-text-muted" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-dim">GitHub Identity</h3>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5">
          <ShieldCheck size={9} className="text-success" />
          <span className="text-[8px] font-semibold text-success">LINKED</span>
        </span>
      </div>

      {/* Profile */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={profile.avatarUrl}
          alt={profile.login}
          className="h-10 w-10 rounded-full border border-border-subtle"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{profile.name || profile.login}</span>
            <a href={profile.htmlUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={10} className="text-text-dim" />
            </a>
          </div>
          <span className="text-[10px] text-text-dim">@{profile.login}</span>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${scoreColor}`}>{trust.trustScore}</p>
          <p className="text-[9px] text-text-dim">Trust Score</p>
        </div>
      </div>

      {profile.bio ? (
        <p className="mb-3 text-[10px] text-text-muted">{profile.bio}</p>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-lg bg-surface-raised p-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <GitFork size={10} className="text-text-dim" />
            <span className="text-xs font-bold">{profile.publicRepos}</span>
          </div>
          <p className="text-[8px] text-text-dim">Repos</p>
        </div>
        <div className="rounded-lg bg-surface-raised p-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <Users size={10} className="text-text-dim" />
            <span className="text-xs font-bold">{profile.followers}</span>
          </div>
          <p className="text-[8px] text-text-dim">Followers</p>
        </div>
        <div className="rounded-lg bg-surface-raised p-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <Star size={10} className="text-text-dim" />
            <span className="text-xs font-bold">{trust.totalCommits}</span>
          </div>
          <p className="text-[8px] text-text-dim">Commits</p>
        </div>
        <div className="rounded-lg bg-surface-raised p-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <Calendar size={10} className="text-text-dim" />
            <span className="text-xs font-bold">{trust.accountAge}</span>
          </div>
          <p className="text-[8px] text-text-dim">Age</p>
        </div>
      </div>

      <button
        onClick={() => { setLinkedUser(null); setUsername(""); }}
        className="mt-3 w-full text-center text-[10px] text-text-dim hover:text-text-muted"
      >
        Unlink
      </button>
    </div>
  );
}
