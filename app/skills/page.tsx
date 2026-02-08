"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlien } from "@alien_org/react";
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX, Plus, Play, Code,
  Download, ThumbsUp, ChevronDown, ChevronUp, Terminal, X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

type SkillItem = {
  id: string;
  authorAlienId: string;
  name: string;
  description: string;
  code: string;
  language: string;
  category: string;
  tags: string[];
  installCount: number;
  vouchCount: number;
  clawshieldScore: number | null;
  clawshieldBand: string | null;
  clawshieldFindings: number | null;
  createdAt: string;
};

type SandboxResult = {
  output: string | null;
  error: string | null;
  blocked: boolean;
  scan: { score: number; band: string; findings: { title: string; severity: string; category: string }[] };
  durationMs: number;
};

const CATEGORIES = ["all", "utility", "agent", "automation", "data", "security", "other"];
const LANGUAGES = ["typescript", "javascript", "python", "yaml", "markdown"];

const BAND_CONFIG: Record<string, { icon: typeof ShieldCheck; color: string; bg: string; label: string }> = {
  LOW: { icon: ShieldCheck, color: "text-success", bg: "bg-success/10", label: "Safe" },
  MEDIUM: { icon: ShieldAlert, color: "text-warning", bg: "bg-warning/10", label: "Caution" },
  HIGH: { icon: ShieldX, color: "text-orange-400", bg: "bg-orange-400/10", label: "Risky" },
  CRITICAL: { icon: ShieldX, color: "text-danger", bg: "bg-danger/10", label: "Dangerous" },
};

function SandboxPanel({ code, language, onClose }: { code: string; language: string; onClose: () => void }) {
  const [sandboxCode, setSandboxCode] = useState(code);
  const [result, setResult] = useState<SandboxResult | null>(null);

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sandboxCode, language }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as SandboxResult;
    },
    onSuccess: (data) => setResult(data),
    onError: (err) => toast.error(err.message),
  });

  const bandConfig = result?.scan ? BAND_CONFIG[result.scan.band] || BAND_CONFIG.LOW : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-slide-up rounded-t-2xl bg-surface border-t border-border-subtle p-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-accent-light" />
            <h3 className="text-sm font-bold">Sandbox</h3>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-medium text-accent-light">Isolated</span>
          </div>
          <button onClick={onClose} className="p-1">
            <X size={16} className="text-text-dim" />
          </button>
        </div>

        <p className="text-[10px] text-text-dim mb-2">
          Code is scanned by ClawShield before execution. Critical-risk code is blocked.
        </p>

        <textarea
          value={sandboxCode}
          onChange={(e) => setSandboxCode(e.target.value)}
          rows={8}
          spellCheck={false}
          className="w-full rounded-lg border border-border-subtle bg-surface-raised p-3 font-mono text-xs placeholder:text-text-dim focus:border-accent focus:outline-none"
        />

        <button
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending || !sandboxCode.trim()}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {runMutation.isPending ? (
            <>
              <Shield size={14} className="animate-pulse" />
              Scanning & Running...
            </>
          ) : (
            <>
              <Play size={14} />
              Run in Sandbox
            </>
          )}
        </button>

        {result ? (
          <div className="mt-3 space-y-2">
            {/* ClawShield pre-scan result */}
            {bandConfig ? (
              <div className={`flex items-center gap-2 rounded-lg p-2 ${bandConfig.bg}`}>
                <bandConfig.icon size={14} className={bandConfig.color} />
                <span className={`text-[10px] font-bold ${bandConfig.color}`}>{bandConfig.label}</span>
                <span className="text-[9px] text-text-dim">Score: {result.scan.score}/100</span>
                {result.blocked ? (
                  <span className="ml-auto rounded-full bg-danger/20 px-2 py-0.5 text-[8px] font-bold text-danger">BLOCKED</span>
                ) : (
                  <span className="ml-auto text-[9px] text-text-dim">{result.durationMs}ms</span>
                )}
              </div>
            ) : null}

            {/* Findings */}
            {result.scan.findings.length > 0 ? (
              <div className="rounded-lg bg-surface-raised p-2 space-y-1">
                <p className="text-[9px] font-semibold text-text-dim">ClawShield Findings:</p>
                {result.scan.findings.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-[9px]">
                    <span className={`font-bold uppercase ${
                      f.severity === "critical" ? "text-danger" :
                      f.severity === "high" ? "text-orange-400" :
                      f.severity === "medium" ? "text-warning" : "text-text-dim"
                    }`}>{f.severity}</span>
                    <span className="text-text-muted">{f.title}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Output */}
            {result.output ? (
              <div className="rounded-lg bg-surface-raised p-3">
                <p className="mb-1 text-[9px] font-semibold text-success">Output:</p>
                <pre className="whitespace-pre-wrap font-mono text-[11px] text-text-muted">{result.output}</pre>
              </div>
            ) : null}

            {/* Error */}
            {result.error ? (
              <div className="rounded-lg bg-danger/5 border border-danger/20 p-3">
                <p className="mb-1 text-[9px] font-semibold text-danger">
                  {result.blocked ? "Blocked:" : "Error:"}
                </p>
                <pre className="whitespace-pre-wrap font-mono text-[11px] text-danger/80">{result.error}</pre>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SkillsPage() {
  const { authToken } = useAlien();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [sandboxSkill, setSandboxSkill] = useState<SkillItem | null>(null);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  // Add form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [skillCategory, setSkillCategory] = useState("utility");
  const [tags, setTags] = useState("");

  const { data: skills, isLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const res = await fetch("/api/skills");
      const json = await res.json();
      return (json.data || []) as SkillItem[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          name, description, code, language,
          category: skillCategory,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`Skill shared! ClawShield: ${data.data.clawshieldBand} risk`);
        setName(""); setDescription(""); setCode(""); setTags("");
        setShowAdd(false);
        queryClient.invalidateQueries({ queryKey: ["skills"] });
      }
    },
  });

  const filtered = (skills || []).filter((s) =>
    category === "all" || s.category === category
  );

  return (
    <>
      <div className="animate-slide-up flex items-center justify-between pt-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Skills</h1>
          <p className="text-xs text-text-muted">Share and run code safely. Every skill is scanned.</p>
        </div>
        {authToken ? (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-light"
          >
            <Plus size={14} />
            Share
          </button>
        ) : null}
      </div>

      {/* Categories */}
      <div className="animate-slide-up -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide" style={{ animationDelay: "0.05s" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all ${
              category === cat ? "bg-accent text-white" : "bg-surface-raised text-text-muted"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Add skill form */}
      {showAdd ? (
        <div className="animate-slide-up rounded-xl border border-accent/20 bg-surface p-4 space-y-3">
          <h3 className="text-xs font-semibold text-text-dim">Share a Skill</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Skill name"
            className="w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this skill do?"
            className="w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                  language === l ? "bg-accent text-white" : "bg-surface-raised text-text-dim"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Paste your code here..."
            rows={6}
            spellCheck={false}
            className="w-full rounded-lg border border-border-subtle bg-surface-raised p-3 font-mono text-xs placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)"
            className="w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
          <button
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending || !name.trim() || !code.trim()}
            className="w-full rounded-lg bg-accent py-2.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {addMutation.isPending ? "Scanning & Sharing..." : "Share Skill (auto-scanned by ClawShield)"}
          </button>
        </div>
      ) : null}

      {/* Skills list */}
      <div className="animate-slide-up space-y-3" style={{ animationDelay: "0.1s" }}>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer-bg h-24 rounded-xl border border-border-subtle" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((skill) => {
            const band = BAND_CONFIG[skill.clawshieldBand || "LOW"] || BAND_CONFIG.LOW;
            const BandIcon = band.icon;
            const isExpanded = expandedSkill === skill.id;

            return (
              <div key={skill.id} className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Code size={14} className="text-accent-light" />
                        <h3 className="text-sm font-semibold">{skill.name}</h3>
                        <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[9px] text-text-dim">{skill.language}</span>
                        {skill.clawshieldBand ? (
                          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ${band.bg}`}>
                            <BandIcon size={9} className={band.color} />
                            <span className={`text-[8px] font-bold ${band.color}`}>{band.label}</span>
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-text-muted">{skill.description}</p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] text-text-dim">
                      <ShieldCheck size={10} className="text-success" />
                      {skill.authorAlienId.slice(0, 8)}...
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-text-dim">
                      <Download size={10} /> {skill.installCount}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-text-dim">
                      <ThumbsUp size={10} /> {skill.vouchCount}
                    </span>
                    <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[9px] text-text-dim">{skill.category}</span>
                  </div>

                  {skill.tags && skill.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {skill.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-surface-raised px-1.5 py-0.5 text-[9px] text-text-dim">{tag}</span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setExpandedSkill(isExpanded ? null : skill.id)}
                      className="flex items-center gap-1 rounded-md bg-surface-raised px-2.5 py-1.5 text-[10px] font-medium text-text-muted transition-colors hover:bg-surface-hover"
                    >
                      <Code size={10} />
                      {isExpanded ? "Hide" : "View"} Code
                      {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                    <button
                      onClick={() => setSandboxSkill(skill)}
                      className="flex items-center gap-1 rounded-md bg-accent/10 px-2.5 py-1.5 text-[10px] font-medium text-accent-light transition-colors hover:bg-accent/20"
                    >
                      <Play size={10} />
                      Run in Sandbox
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="border-t border-border-subtle bg-surface-raised p-3">
                    <pre className="whitespace-pre-wrap font-mono text-[11px] text-text-muted overflow-x-auto">{skill.code}</pre>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center">
            <Code size={32} className="mx-auto mb-3 text-text-dim" />
            <p className="text-sm font-medium text-text-muted">No skills shared yet</p>
            <p className="mt-1 text-xs text-text-dim">
              Share your first skill. Every submission is auto-scanned by ClawShield.
            </p>
          </div>
        )}
      </div>

      {/* Sandbox modal */}
      {sandboxSkill ? (
        <SandboxPanel
          code={sandboxSkill.code}
          language={sandboxSkill.language}
          onClose={() => setSandboxSkill(null)}
        />
      ) : null}
    </>
  );
}
