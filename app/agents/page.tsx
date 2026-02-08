"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlien, useLaunchParams, useIsMethodSupported } from "@alien_org/react";
import {
  Bot, TrendingUp, Code, Lock, Sparkles, ShieldCheck,
  Zap, Activity, Clock, ChevronRight, Play,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

type AgentLog = {
  id: string;
  userAlienId: string;
  action: string;
  input: string | null;
  output: string | null;
  model: string | null;
  provider: string | null;
  durationMs: number | null;
  createdAt: string;
};

const AGENTS = [
  {
    name: "Kalibr Market Analyst",
    description: "Multi-model AI routing for marketplace analysis. Evaluates listings, suggests fair prices, and detects anomalies.",
    icon: TrendingUp,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    trigger: "new-listing",
    partner: "Kalibr",
    capabilities: ["Price analysis", "Market trends", "Anomaly detection", "Multi-model routing"],
  },
  {
    name: "Greptile Code Analyst",
    description: "AI-powered codebase analysis via Greptile API. Reviews smart contracts, audits code, and finds vulnerabilities.",
    icon: Code,
    color: "text-green-400",
    bg: "bg-green-500/10",
    trigger: "code-review",
    partner: "Greptile",
    capabilities: ["Code review", "Security audit", "Architecture analysis", "Vulnerability scan"],
  },
  {
    name: "ProxLock Security Agent",
    description: "API security gateway powered by ProxLock. Monitors endpoints, validates credentials, and prevents key exposure.",
    icon: Lock,
    color: "text-red-400",
    bg: "bg-red-500/10",
    trigger: "security-scan",
    partner: "ProxLock",
    capabilities: ["API key rotation", "Endpoint monitoring", "Credential validation", "Rate limiting"],
  },
  {
    name: "Community AI",
    description: "Social intelligence agent. Generates insights, sparks discussions, and moderates the verified human feed.",
    icon: Sparkles,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    trigger: "community-insight",
    partner: "Alien Protocol",
    capabilities: ["Feed moderation", "Insight generation", "Trend analysis", "Community health"],
  },
];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function AgentsPage() {
  const { authToken, isBridgeAvailable } = useAlien();
  const launchParams = useLaunchParams();
  const paymentSupported = useIsMethodSupported("payment:request");
  const clipboardSupported = useIsMethodSupported("clipboard:write");
  const queryClient = useQueryClient();
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const { data: agentLogs } = useQuery({
    queryKey: ["agent-logs"],
    queryFn: async () => {
      const res = await fetch("/api/agent/logs");
      const json = await res.json();
      return (json.data || []) as AgentLog[];
    },
  });

  const triggerMutation = useMutation({
    mutationFn: async (trigger: string) => {
      const res = await fetch("/api/posts/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger,
          context: {
            topic: "Demonstrate agent capabilities for hackathon judges",
            repo: "alien-id/miniapp-boilerplate",
            target: "realhumanx",
          },
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Agent executed successfully!");
        queryClient.invalidateQueries({ queryKey: ["agent-logs"] });
      }
    },
  });

  return (
    <>
      {/* Header */}
      <div className="animate-slide-up pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
            <Bot size={22} className="text-accent-light" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Agents</h1>
            <p className="text-xs text-text-muted">Autonomous agents powered by partner integrations</p>
          </div>
        </div>
      </div>

      {/* SDK Status Bar */}
      <div className="animate-slide-up rounded-xl border border-border-subtle bg-surface p-3" style={{ animationDelay: "0.05s" }}>
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-dim">Alien SDK Status</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${isBridgeAvailable ? "bg-success" : "bg-warning"}`} />
            <span className="text-[10px] text-text-muted">Bridge: {isBridgeAvailable ? "Connected" : "Browser"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${paymentSupported.supported ? "bg-success" : "bg-text-dim"}`} />
            <span className="text-[10px] text-text-muted">Payments: {paymentSupported.supported ? "v" + paymentSupported.minVersion : "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${clipboardSupported.supported ? "bg-success" : "bg-text-dim"}`} />
            <span className="text-[10px] text-text-muted">Clipboard: {clipboardSupported.supported ? "Ready" : "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${launchParams ? "bg-success" : "bg-text-dim"}`} />
            <span className="text-[10px] text-text-muted">Platform: {launchParams?.platform || "web"}</span>
          </div>
        </div>
        {launchParams?.startParam ? (
          <div className="mt-2 rounded-md bg-accent/10 px-2 py-1">
            <span className="text-[10px] text-accent-light">Deep link param: {launchParams.startParam}</span>
          </div>
        ) : null}
      </div>

      {/* Agent Cards */}
      <div className="animate-slide-up space-y-3" style={{ animationDelay: "0.1s" }}>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-dim">Active Agents</h2>
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          const isExpanded = expandedAgent === agent.name;
          const logs = (agentLogs || []).filter(
            (log) => log.userAlienId === `agent:${agent.partner.toLowerCase().replace(" ", "")}`,
          );

          return (
            <div key={agent.name} className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
              <button
                onClick={() => setExpandedAgent(isExpanded ? null : agent.name)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface-raised"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${agent.bg}`}>
                  <Icon size={20} className={agent.color} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{agent.name}</span>
                    <span className="flex items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5">
                      <Activity size={8} className="text-success" />
                      <span className="text-[8px] font-semibold text-success">ONLINE</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-text-dim">Powered by {agent.partner}</p>
                </div>
                <ChevronRight size={16} className={`text-text-dim transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </button>

              {isExpanded ? (
                <div className="border-t border-border-subtle px-4 pb-4 pt-3 space-y-3">
                  <p className="text-xs text-text-muted">{agent.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {agent.capabilities.map((cap) => (
                      <span key={cap} className="rounded-md bg-surface-raised px-2 py-0.5 text-[9px] font-medium text-text-dim">
                        {cap}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => triggerMutation.mutate(agent.trigger)}
                    disabled={triggerMutation.isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent/10 py-2.5 text-xs font-semibold text-accent-light transition-colors hover:bg-accent/20 disabled:opacity-50"
                  >
                    {triggerMutation.isPending ? (
                      <><Zap size={12} className="animate-spin" /> Executing...</>
                    ) : (
                      <><Play size={12} /> Run Agent</>
                    )}
                  </button>

                  {logs.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-semibold uppercase tracking-widest text-text-dim">Recent Activity</h4>
                      {logs.slice(0, 3).map((log) => (
                        <div key={log.id} className="rounded-lg bg-surface-raised p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium">{log.action}</span>
                            <span className="flex items-center gap-1 text-[9px] text-text-dim">
                              <Clock size={9} />
                              {timeAgo(log.createdAt)}
                            </span>
                          </div>
                          {log.durationMs ? (
                            <span className="text-[9px] text-text-dim">
                              {log.model} via {log.provider} ({log.durationMs}ms)
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Integration Stack */}
      <div className="animate-slide-up rounded-xl border border-border-subtle bg-surface p-4" style={{ animationDelay: "0.15s" }}>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-dim">Integration Stack</h3>
        <div className="space-y-2">
          {[
            { name: "Alien Protocol", desc: "Identity verification, payments, JWT auth, clipboard, deep linking", hooks: "useAlien, usePayment, useClipboard, useLaunchParams, useEvent, useIsMethodSupported" },
            { name: "Kalibr", desc: "Multi-model AI agent routing with fallback chains", hooks: "callAgent() with model selection" },
            { name: "Greptile", desc: "Code search and repository analysis API", hooks: "callGreptileQuery()" },
            { name: "ProxLock", desc: "API key proxy and security gateway", hooks: "Endpoint protection layer" },
            { name: "GitHub", desc: "Developer identity and repository trust signals", hooks: "Profile linking (planned)" },
            { name: "Cline", desc: "AI coding assistant integration", hooks: "Code generation pipeline" },
          ].map((stack) => (
            <div key={stack.name} className="rounded-lg bg-surface-raised p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-success" />
                <span className="text-xs font-semibold">{stack.name}</span>
              </div>
              <p className="mt-1 text-[10px] text-text-muted">{stack.desc}</p>
              <p className="mt-0.5 font-mono text-[9px] text-text-dim">{stack.hooks}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
