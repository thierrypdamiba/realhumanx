"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlien } from "@alien_org/react";
import { ShieldCheck, Plus, CheckCircle, AlertTriangle, HelpCircle, Bot, ThumbsUp, ThumbsDown } from "lucide-react";
import toast from "react-hot-toast";

type Credential = {
  id: string;
  ownerAlienId: string;
  credentialType: string;
  claim: string;
  evidence: string | null;
  status: string;
  verifyCount: number;
  disputeCount: number;
  aiConfidence: number | null;
  aiReasoning: string | null;
  createdAt: string;
};

const TYPES = ["education", "skill", "certification", "experience", "other"];

const STATUS_CONFIG: Record<string, { icon: typeof ShieldCheck; color: string; label: string }> = {
  "peer-verified": { icon: CheckCircle, color: "text-success", label: "Peer Verified" },
  "ai-verified": { icon: Bot, color: "text-accent-light", label: "AI Verified" },
  "disputed": { icon: AlertTriangle, color: "text-danger", label: "Disputed" },
  "unverified": { icon: HelpCircle, color: "text-warning", label: "Unverified" },
};

export function CredentialManager({ alienId, isOwner }: { alienId: string; isOwner: boolean }) {
  const { authToken } = useAlien();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [claim, setClaim] = useState("");
  const [credType, setCredType] = useState("skill");
  const [evidence, setEvidence] = useState("");

  const { data: credentials } = useQuery({
    queryKey: ["credentials", alienId],
    queryFn: async () => {
      const res = await fetch(`/api/credentials?alienId=${alienId}`);
      const json = await res.json();
      return (json.data || []) as Credential[];
    },
    enabled: !!alienId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ credentialType: credType, claim, evidence: evidence || undefined }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Credential added! Ask peers to verify it.");
        setClaim("");
        setEvidence("");
        setShowAdd(false);
        queryClient.invalidateQueries({ queryKey: ["credentials", alienId] });
      }
    },
  });

  const vouchMutation = useMutation({
    mutationFn: async ({ credentialId, vouchType }: { credentialId: string; vouchType: string }) => {
      const res = await fetch("/api/credentials/vouch", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ credentialId, vouchType }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Vouch recorded!");
        queryClient.invalidateQueries({ queryKey: ["credentials", alienId] });
      }
    },
  });

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-dim">Credentials</h3>
        {isOwner ? (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-[10px] font-medium text-accent-light"
          >
            <Plus size={10} />
            Add
          </button>
        ) : null}
      </div>

      <p className="mb-3 text-[10px] text-text-dim">
        Self-declared claims verified by peers and AI. Humans can vouch or dispute. After 3 vouches, AI auto-audits.
      </p>

      {/* Add form */}
      {showAdd ? (
        <div className="mb-3 space-y-2 rounded-lg bg-surface-raised p-3">
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setCredType(t)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-all ${
                  credType === t ? "bg-accent text-white" : "bg-surface text-text-dim"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="PhD in Mathematics, 10 years React, AWS Certified..."
            className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
          <input
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="Link to proof (GitHub, LinkedIn, portfolio...)"
            className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
          <button
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending || !claim.trim()}
            className="w-full rounded-lg bg-accent py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {addMutation.isPending ? "Adding..." : "Add Credential"}
          </button>
        </div>
      ) : null}

      {/* Credential list */}
      {credentials && credentials.length > 0 ? (
        <div className="space-y-2">
          {credentials.map((cred) => {
            const config = STATUS_CONFIG[cred.status] || STATUS_CONFIG.unverified;
            const StatusIcon = config.icon;

            return (
              <div key={cred.id} className="rounded-lg bg-surface-raised p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[9px] font-medium text-text-dim">{cred.credentialType}</span>
                      <StatusIcon size={12} className={config.color} />
                      <span className={`text-[9px] font-medium ${config.color}`}>{config.label}</span>
                    </div>
                    <p className="mt-1 text-xs font-medium">{cred.claim}</p>
                    {cred.evidence ? (
                      <a href={cred.evidence} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent-light hover:underline">
                        View evidence
                      </a>
                    ) : null}
                  </div>
                </div>

                {/* Vouch counts + AI */}
                <div className="mt-2 flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-success">
                    <ThumbsUp size={10} /> {cred.verifyCount}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-danger">
                    <ThumbsDown size={10} /> {cred.disputeCount}
                  </span>
                  {cred.aiConfidence !== null ? (
                    <span className="flex items-center gap-1 text-[10px] text-accent-light" title={cred.aiReasoning || ""}>
                      <Bot size={10} /> AI: {cred.aiConfidence}%
                    </span>
                  ) : null}
                </div>

                {cred.aiReasoning ? (
                  <p className="mt-1 text-[9px] text-text-dim italic">{cred.aiReasoning}</p>
                ) : null}

                {/* Vouch buttons (for non-owners) */}
                {!isOwner && authToken ? (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => vouchMutation.mutate({ credentialId: cred.id, vouchType: "verify" })}
                      disabled={vouchMutation.isPending}
                      className="flex items-center gap-1 rounded-md bg-success/10 px-2.5 py-1 text-[10px] font-medium text-success transition-colors hover:bg-success/20 disabled:opacity-50"
                    >
                      <ThumbsUp size={10} /> Verify
                    </button>
                    <button
                      onClick={() => vouchMutation.mutate({ credentialId: cred.id, vouchType: "dispute" })}
                      disabled={vouchMutation.isPending}
                      className="flex items-center gap-1 rounded-md bg-danger/10 px-2.5 py-1 text-[10px] font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
                    >
                      <ThumbsDown size={10} /> Dispute
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-[10px] text-text-dim py-3">
          {isOwner ? "No credentials yet. Add your skills and qualifications." : "No credentials added."}
        </p>
      )}
    </div>
  );
}
