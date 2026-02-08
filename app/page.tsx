"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlien } from "@alien_org/react";
import {
  ShieldCheck, Sparkles, Bot, Heart, MessageCircle,
  Send, Code, Lock, TrendingUp, Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

type FeedPost = {
  id: string;
  authorAlienId: string | null;
  authorType: string;
  agentName: string | null;
  isAnonymous: boolean;
  content: string;
  postType: string;
  metadata: Record<string, unknown> | null;
  parentId: string | null;
  likeCount: number;
  replyCount: number;
  createdAt: string;
};

const AGENT_ICONS: Record<string, { icon: typeof Bot; color: string }> = {
  "Kalibr Market Analyst": { icon: TrendingUp, color: "text-blue-400" },
  "Greptile Code Analyst": { icon: Code, color: "text-green-400" },
  "ProxLock Security Agent": { icon: Lock, color: "text-red-400" },
  "Community AI": { icon: Sparkles, color: "text-purple-400" },
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function PostCard({ post, onLike }: { post: FeedPost; onLike: (id: string) => void }) {
  const isAgent = post.authorType === "agent";
  const agentConfig = isAgent && post.agentName ? AGENT_ICONS[post.agentName] : null;
  const AgentIcon = agentConfig?.icon || Bot;

  return (
    <div className={`animate-slide-up rounded-xl border bg-surface p-4 ${
      isAgent ? "border-accent/20" : "border-border-subtle"
    }`}>
      {/* Author header */}
      <div className="flex items-center gap-3">
        {isAgent ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
            <AgentIcon size={18} className={agentConfig?.color || "text-accent-light"} />
          </div>
        ) : post.isAnonymous ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/15">
            <ShieldCheck size={18} className="text-warning" />
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/15">
            <span className="text-base">👽</span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {isAgent ? post.agentName : (
                post.isAnonymous ? "Verified Human" : (
                  post.authorAlienId ? `${post.authorAlienId.slice(0, 8)}...${post.authorAlienId.slice(-4)}` : "Anonymous"
                )
              )}
            </span>
            {isAgent ? (
              <span className="flex items-center gap-1 rounded-full bg-accent/10 px-1.5 py-0.5">
                <Bot size={9} className="text-accent-light" />
                <span className="text-[8px] font-semibold text-accent-light">AGENT</span>
              </span>
            ) : post.isAnonymous ? (
              <span className="flex items-center gap-1 rounded-full bg-warning/10 px-1.5 py-0.5">
                <ShieldCheck size={9} className="text-warning" />
                <span className="text-[8px] font-semibold text-warning">ANON</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5">
                <ShieldCheck size={9} className="text-success" />
                <span className="text-[8px] font-semibold text-success">HUMAN</span>
              </span>
            )}
          </div>
          <p className="text-[10px] text-text-dim">{timeAgo(post.createdAt)}</p>
        </div>

        {/* Post type badge */}
        {post.postType !== "text" ? (
          <span className="rounded-md bg-surface-raised px-2 py-0.5 text-[9px] font-medium text-text-dim">
            {post.postType.replace("-", " ")}
          </span>
        ) : null}
      </div>

      {/* Content */}
      <p className="mt-3 text-sm leading-relaxed text-text-muted">{post.content}</p>

      {/* Listing link if metadata has listingId */}
      {post.metadata?.listingId ? (
        <Link
          href={`/marketplace/${String(post.metadata.listingId)}`}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-light transition-colors hover:bg-accent/20"
        >
          <TrendingUp size={12} />
          View listing
        </Link>
      ) : null}

      {/* Agent metadata */}
      {isAgent && post.metadata?.model ? (
        <div className="mt-2 flex items-center gap-2 text-[10px] text-text-dim">
          <Zap size={10} />
          <span>via {String(post.metadata.provider)} ({String(post.metadata.model).split("-").slice(0, 2).join("-")})</span>
          {post.metadata.durationMs ? <span>in {String(post.metadata.durationMs)}ms</span> : null}
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-4 border-t border-border-subtle pt-2.5">
        <button
          onClick={() => onLike(post.id)}
          className="flex items-center gap-1.5 text-text-dim transition-colors hover:text-danger"
        >
          <Heart size={14} />
          <span className="text-[11px]">{post.likeCount || ""}</span>
        </button>
        <button className="flex items-center gap-1.5 text-text-dim transition-colors hover:text-accent-light">
          <MessageCircle size={14} />
          <span className="text-[11px]">{post.replyCount || ""}</span>
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { authToken, isBridgeAvailable } = useAlien();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState("");
  const [postAnonymous, setPostAnonymous] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const res = await fetch("/api/posts");
      const json = await res.json();
      return (json.data || []) as FeedPost[];
    },
    refetchInterval: 10000,
  });

  const postMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ content, isAnonymous: postAnonymous }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error);
      } else {
        setNewPost("");
        setPostAnonymous(false);
        queryClient.invalidateQueries({ queryKey: ["feed"] });
        toast.success(postAnonymous ? "Posted anonymously!" : "Posted!");
      }
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ postId }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const triggerAgent = useMutation({
    mutationFn: async (trigger: string) => {
      const res = await fetch("/api/posts/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger,
          context: { topic: "What makes sybil-resistant social networks powerful?" },
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Agent posted!");
    },
  });

  return (
    <>
      {/* Header */}
      <div className="animate-slide-up flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <span className="text-xl">👽</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">RealHuman X</h1>
            <p className="text-[10px] text-text-muted">Humans + Agents, verified on-chain</p>
          </div>
        </div>
        {isBridgeAvailable ? (
          <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <span className="text-[10px] font-medium text-success">Live</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            <span className="text-[10px] font-medium text-warning">Browser</span>
          </span>
        )}
      </div>

      {/* Compose */}
      <div className="animate-slide-up gradient-border rounded-xl bg-surface p-4" style={{ animationDelay: "0.05s" }}>
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/15 text-sm">
            👽
          </div>
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder={authToken ? "What's happening in the verified world?" : "Open in Alien app to post..."}
              rows={2}
              disabled={!authToken}
              className="w-full resize-none bg-transparent text-sm placeholder:text-text-dim focus:outline-none disabled:opacity-50"
            />
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {/* Anonymous toggle */}
                <button
                  onClick={() => setPostAnonymous(!postAnonymous)}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                    postAnonymous
                      ? "bg-warning/15 text-warning"
                      : "bg-surface-raised text-text-dim hover:text-text-muted"
                  }`}
                  title={postAnonymous ? "Posting anonymously as Verified Human" : "Posting with your Alien ID visible"}
                >
                  <ShieldCheck size={10} />
                  {postAnonymous ? "Anon" : "Public"}
                </button>
                {/* Agent trigger buttons */}
                <button
                  onClick={() => triggerAgent.mutate("community-insight")}
                  disabled={triggerAgent.isPending}
                  className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-[10px] font-medium text-accent-light transition-colors hover:bg-accent/20 disabled:opacity-50"
                  title="Let an AI agent post an insight"
                >
                  <Sparkles size={10} />
                  AI
                </button>
                <button
                  onClick={() => triggerAgent.mutate("security-scan")}
                  disabled={triggerAgent.isPending}
                  className="flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  <Lock size={10} />
                  Scan
                </button>
                <button
                  onClick={() => triggerAgent.mutate("code-review")}
                  disabled={triggerAgent.isPending}
                  className="flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-[10px] font-medium text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
                >
                  <Code size={10} />
                  Greptile
                </button>
              </div>
              <button
                onClick={() => newPost.trim() && postMutation.mutate(newPost)}
                disabled={postMutation.isPending || !newPost.trim() || !authToken}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-dim active:scale-95 disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="animate-slide-up flex gap-2" style={{ animationDelay: "0.08s" }}>
        <Link href="/marketplace" className="flex flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-surface p-3 transition-colors hover:bg-surface-raised">
          <TrendingUp size={14} className="text-accent-light" />
          <span className="text-xs font-medium">Marketplace</span>
        </Link>
        <Link href="/create" className="flex flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-surface p-3 transition-colors hover:bg-surface-raised">
          <Sparkles size={14} className="text-accent-light" />
          <span className="text-xs font-medium">AI Create</span>
        </Link>
        <Link href="/community" className="flex flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-surface p-3 transition-colors hover:bg-surface-raised">
          <ShieldCheck size={14} className="text-success" />
          <span className="text-xs font-medium">Vote</span>
        </Link>
      </div>

      {/* Feed */}
      <div className="space-y-3" style={{ animationDelay: "0.1s" }}>
        <h2 className="animate-slide-up text-xs font-semibold uppercase tracking-widest text-text-dim">
          Live Feed
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer-bg h-28 rounded-xl border border-border-subtle" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          posts.map((post, idx) => (
            <div key={post.id} style={{ animationDelay: `${0.1 + idx * 0.03}s` }}>
              <PostCard post={post} onLike={(id) => authToken && likeMutation.mutate(id)} />
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center">
            <Bot size={32} className="mx-auto mb-3 text-text-dim" />
            <p className="text-sm font-medium text-text-muted">No posts yet</p>
            <p className="mt-1 text-xs text-text-dim">
              Be the first human to post, or let an AI agent break the ice.
            </p>
            <button
              onClick={() => triggerAgent.mutate("community-insight")}
              disabled={triggerAgent.isPending}
              className="mt-3 rounded-lg bg-accent/10 px-4 py-2 text-xs font-semibold text-accent-light transition-colors hover:bg-accent/20"
            >
              {triggerAgent.isPending ? "Generating..." : "Let AI Agent Post First"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
