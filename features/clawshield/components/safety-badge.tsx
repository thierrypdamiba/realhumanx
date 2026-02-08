"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, ShieldAlert, ShieldX, Shield, ChevronDown, ChevronUp, Scan } from "lucide-react";
import type { ScanReport } from "../scanner";

const BAND_CONFIG = {
  LOW: { icon: ShieldCheck, color: "text-success", bg: "bg-success/10", label: "Safe" },
  MEDIUM: { icon: ShieldAlert, color: "text-warning", bg: "bg-warning/10", label: "Caution" },
  HIGH: { icon: ShieldX, color: "text-orange-400", bg: "bg-orange-400/10", label: "Risky" },
  CRITICAL: { icon: ShieldX, color: "text-danger", bg: "bg-danger/10", label: "Dangerous" },
} as const;

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-danger",
  high: "text-orange-400",
  medium: "text-warning",
  low: "text-text-dim",
};

export function SafetyBadge({ report }: { report: ScanReport }) {
  const [expanded, setExpanded] = useState(false);
  const config = BAND_CONFIG[report.riskBand];
  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-2.5"
      >
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${config.bg}`}>
            <Icon size={14} className={config.color} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold ${config.color}`}>
                {config.label}
              </span>
              <span className="text-[9px] text-text-dim">
                Score: {report.riskScore}/100
              </span>
            </div>
            <span className="text-[9px] text-text-dim">
              ClawShield: {report.summary.totalFindings} finding{report.summary.totalFindings !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${config.bg} ${config.color}`}>
            {report.riskBand}
          </span>
          {expanded ? <ChevronUp size={12} className="text-text-dim" /> : <ChevronDown size={12} className="text-text-dim" />}
        </div>
      </button>

      {expanded && report.findings.length > 0 ? (
        <div className="border-t border-border-subtle p-2.5 space-y-1.5">
          {report.findings.slice(0, 10).map((finding) => (
            <div key={finding.id} className="rounded-md bg-surface p-2">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold uppercase ${SEVERITY_COLORS[finding.severity]}`}>
                  {finding.severity}
                </span>
                <span className="text-[10px] font-medium">{finding.title}</span>
              </div>
              <p className="mt-0.5 text-[9px] text-text-dim">{finding.description}</p>
              {finding.evidence ? (
                <code className="mt-1 block rounded bg-surface-raised px-1.5 py-0.5 text-[8px] text-text-dim font-mono truncate">
                  {finding.evidence}
                </code>
              ) : null}
              <p className="mt-1 text-[9px] text-accent-light">{finding.remediation}</p>
            </div>
          ))}
          {report.findings.length > 10 ? (
            <p className="text-center text-[9px] text-text-dim">
              +{report.findings.length - 10} more findings
            </p>
          ) : null}
        </div>
      ) : expanded ? (
        <div className="border-t border-border-subtle p-3 text-center">
          <ShieldCheck size={16} className="mx-auto text-success mb-1" />
          <p className="text-[10px] text-success font-medium">No security issues detected</p>
        </div>
      ) : null}
    </div>
  );
}

export function ScanButton({ content, onScanComplete }: { content: string; onScanComplete: (report: ScanReport) => void }) {
  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as ScanReport;
    },
    onSuccess: (data) => onScanComplete(data),
  });

  return (
    <button
      onClick={() => scanMutation.mutate()}
      disabled={scanMutation.isPending || !content.trim()}
      className="flex items-center gap-1.5 rounded-md bg-accent/10 px-2.5 py-1.5 text-[10px] font-medium text-accent-light transition-colors hover:bg-accent/20 disabled:opacity-50"
    >
      {scanMutation.isPending ? (
        <>
          <Shield size={12} className="animate-pulse" />
          Scanning...
        </>
      ) : (
        <>
          <Scan size={12} />
          ClawShield Scan
        </>
      )}
    </button>
  );
}

export function InlineBadge({ riskBand, score }: { riskBand: keyof typeof BAND_CONFIG; score: number }) {
  const config = BAND_CONFIG[riskBand];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ${config.bg}`}>
      <Icon size={9} className={config.color} />
      <span className={`text-[8px] font-bold ${config.color}`}>{config.label}</span>
      <span className="text-[8px] text-text-dim">{score}</span>
    </span>
  );
}
