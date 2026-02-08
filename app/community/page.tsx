"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlien } from "@alien_org/react";
import { ShieldCheck, Vote, Plus, Users } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

type PollData = {
  id: string;
  question: string;
  options: string[];
  creatorAlienId: string;
  createdAt: string;
  expiresAt: string | null;
};

type VoteResult = {
  option: string;
  count: number;
};

export default function CommunityPage() {
  const { authToken } = useAlien();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [votedPolls, setVotedPolls] = useState<Record<string, VoteResult[]>>({});

  const { data: polls, isLoading } = useQuery({
    queryKey: ["polls"],
    queryFn: async () => {
      const res = await fetch("/api/polls");
      const json = await res.json();
      return (json.data || []) as PollData[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          question,
          options: options.filter((o) => o.trim()),
          expiresInHours: 24,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Poll created!");
        setShowCreate(false);
        setQuestion("");
        setOptions(["", ""]);
        queryClient.invalidateQueries({ queryKey: ["polls"] });
      }
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ pollId, optionIndex }: { pollId: string; optionIndex: number }) => {
      const res = await fetch("/api/polls/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ pollId, optionIndex }),
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Vote cast! One human, one vote.");
        setVotedPolls((prev) => ({ ...prev, [variables.pollId]: data.data.results }));
      }
    },
  });

  return (
    <>
      <div className="animate-slide-up flex items-center justify-between pt-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Community</h1>
          <p className="text-xs text-text-muted">Sybil-resistant governance. 1 human = 1 vote.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/20"
        >
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {/* Info Banner */}
      <div className="animate-slide-up flex items-start gap-3 rounded-xl border border-border bg-surface p-3" style={{ animationDelay: "0.05s" }}>
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-success" />
        <p className="text-xs text-text-muted">
          Every vote is tied to a verified Alien ID. No bots, no duplicate accounts, no manipulation. True democratic consensus.
        </p>
      </div>

      {/* Create Poll */}
      {showCreate && (
        <div className="animate-slide-up gradient-border rounded-xl bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">New Poll</h3>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What should we build next?"
            className="mb-3 w-full rounded-lg border border-border-subtle bg-surface-raised p-2.5 text-sm placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
          {options.map((opt, i) => (
            <input
              key={i}
              value={opt}
              onChange={(e) => {
                const updated = [...options];
                updated[i] = e.target.value;
                setOptions(updated);
              }}
              placeholder={`Option ${i + 1}`}
              className="mb-2 w-full rounded-lg border border-border-subtle bg-surface-raised p-2 text-xs placeholder:text-text-dim focus:border-accent focus:outline-none"
            />
          ))}
          <div className="flex gap-2">
            {options.length < 6 && (
              <button
                onClick={() => setOptions([...options, ""])}
                className="rounded-lg bg-surface-raised px-3 py-1.5 text-xs text-text-muted hover:text-foreground"
              >
                + Add option
              </button>
            )}
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !question.trim() || options.filter((o) => o.trim()).length < 2}
              className="ml-auto rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create Poll"}
            </button>
          </div>
        </div>
      )}

      {/* Polls List */}
      <div className="animate-slide-up space-y-3" style={{ animationDelay: "0.1s" }}>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="shimmer-bg h-32 rounded-xl border border-border-subtle" />
            ))}
          </div>
        ) : polls && polls.length > 0 ? (
          polls.map((poll, idx) => {
            const results = votedPolls[poll.id];
            const totalVotes = results?.reduce((s, r) => s + r.count, 0) || 0;

            return (
              <div
                key={poll.id}
                className="animate-slide-up rounded-xl border border-border-subtle bg-surface p-4"
                style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold">{poll.question}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <ShieldCheck size={11} className="text-success" />
                      <span className="text-[10px] text-text-dim">{poll.creatorAlienId.slice(0, 10)}...</span>
                    </div>
                  </div>
                  {results && (
                    <div className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5">
                      <Users size={10} className="text-accent-light" />
                      <span className="text-[10px] font-medium text-accent-light">{totalVotes}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  {(poll.options as string[]).map((option, i) => {
                    const result = results?.find((r) => r.option === option);
                    const percentage = result && totalVotes > 0 ? (result.count / totalVotes) * 100 : 0;

                    return (
                      <button
                        key={i}
                        onClick={() => !results && authToken && voteMutation.mutate({ pollId: poll.id, optionIndex: i })}
                        disabled={!!results || voteMutation.isPending || !authToken}
                        className={`relative w-full overflow-hidden rounded-lg p-2.5 text-left text-xs transition-all ${
                          results
                            ? "bg-surface-raised"
                            : "bg-surface-raised hover:bg-surface-hover active:scale-[0.98]"
                        }`}
                      >
                        {results && (
                          <div
                            className="absolute inset-y-0 left-0 bg-accent/10 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        )}
                        <span className="relative flex items-center justify-between">
                          <span className="font-medium">{option}</span>
                          {results && (
                            <span className="text-[10px] font-semibold text-accent-light">
                              {percentage.toFixed(0)}%
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center">
            <Vote size={24} className="mx-auto mb-2 text-text-dim" />
            <p className="text-sm text-text-muted">No active polls</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 text-xs font-semibold text-accent"
            >
              Create the first one
            </button>
          </div>
        )}
      </div>
    </>
  );
}
