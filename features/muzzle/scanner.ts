/**
 * Muzzle Scanner - Black Dog Registry
 *
 * Static security analysis for marketplace listings, skills, and agent code.
 * Runs on text content directly (no filesystem dependency).
 */

import { createHash, randomUUID } from "crypto";

// Types
export type Severity = "critical" | "high" | "medium" | "low";
export type Confidence = "high" | "medium" | "low";
export type RiskBand = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FindingCategory =
  | "credential-handling"
  | "hardcoded-secret"
  | "shell-execution"
  | "download-and-run"
  | "execution-risk"
  | "network-exfiltration"
  | "data-exfiltration"
  | "prompt-injection"
  | "overbroad-scope"
  | "supply-chain";

export type Finding = {
  id: string;
  category: FindingCategory;
  severity: Severity;
  confidence: Confidence;
  title: string;
  description: string;
  evidence: string;
  remediation: string;
  line: number;
};

export type ScanReport = {
  scanId: string;
  timestamp: string;
  fingerprint: string;
  riskScore: number;
  riskBand: RiskBand;
  findings: Finding[];
  summary: {
    totalFindings: number;
    durationMs: number;
    bySeverity: Record<Severity, number>;
    byCategory: Partial<Record<FindingCategory, number>>;
  };
};

// Scoring constants
const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 40,
  high: 25,
  medium: 12,
  low: 5,
};

const CONFIDENCE_MULTIPLIERS: Record<Confidence, number> = {
  high: 1.0,
  medium: 0.7,
  low: 0.4,
};

const EXPLOITABILITY_MULTIPLIERS: Record<FindingCategory, number> = {
  "credential-handling": 1.4,
  "hardcoded-secret": 1.4,
  "shell-execution": 1.3,
  "download-and-run": 1.3,
  "execution-risk": 1.3,
  "network-exfiltration": 1.2,
  "data-exfiltration": 1.2,
  "prompt-injection": 1.1,
  "overbroad-scope": 1.0,
  "supply-chain": 1.1,
};

// Detection patterns
const DETECTION_PATTERNS: Array<{
  category: FindingCategory;
  severity: Severity;
  confidence: Confidence;
  title: string;
  description: string;
  pattern: RegExp;
  remediation: string;
}> = [
  // Credential handling
  {
    category: "credential-handling",
    severity: "critical",
    confidence: "high",
    title: "Hardcoded API key detected",
    description: "Found what appears to be a hardcoded API key or token",
    pattern: /(?:api[_-]?key|api[_-]?token|secret[_-]?key|access[_-]?token)\s*[:=]\s*["']?[a-zA-Z0-9_-]{20,}["']?/gi,
    remediation: "Store credentials in environment variables, not in code",
  },
  {
    category: "credential-handling",
    severity: "high",
    confidence: "medium",
    title: "Credential input requested",
    description: "Instructions ask users to paste tokens or credentials",
    pattern: /(?:paste|enter|input|provide)\s+(?:your\s+)?(?:api[_-]?key|token|password|credential|secret)/gi,
    remediation: "Use secure credential storage mechanisms instead of chat input",
  },
  {
    category: "credential-handling",
    severity: "medium",
    confidence: "medium",
    title: "Environment variable with sensitive data",
    description: "References to .env editing with potentially sensitive data",
    pattern: /\.env\b.*(?:API|KEY|SECRET|TOKEN|PASSWORD)/gi,
    remediation: "Ensure .env files are in .gitignore and document required variables",
  },
  {
    category: "credential-handling",
    severity: "high",
    confidence: "medium",
    title: "Credential logging detected",
    description: "Logging or printing credentials, tokens, or secrets",
    pattern: /(?:print|console\.log|logging\.(?:debug|info|warning|error)|logger\.(?:debug|info|warn|error))\s*\(.*(?:api[_-]?key|token|password|secret|credential|auth)/gi,
    remediation: "Never log credentials, even in debug mode",
  },

  // Hardcoded secrets
  {
    category: "hardcoded-secret",
    severity: "critical",
    confidence: "high",
    title: "AWS access key detected",
    description: "Found hardcoded AWS access key (AKIA format)",
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
    remediation: "Use IAM roles or environment variables for AWS credentials",
  },
  {
    category: "hardcoded-secret",
    severity: "critical",
    confidence: "high",
    title: "AWS secret key in environment export",
    description: "Found AWS secret access key being exported or assigned",
    pattern: /(?:AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID)\s*[:=]\s*["']?[a-zA-Z0-9/+=]{16,}["']?/gi,
    remediation: "Use IAM roles or credential managers instead of hardcoded keys",
  },

  // Execution risk
  {
    category: "execution-risk",
    severity: "critical",
    confidence: "high",
    title: "Download and execute pattern",
    description: "Detected curl/wget piped to shell execution",
    pattern: /(?:curl|wget)\s+[^\n|]*\|\s*(?:bash|sh|zsh|fish|sudo\s+(?:bash|sh))/gi,
    remediation: "Download files first, inspect them, then execute separately",
  },
  {
    category: "execution-risk",
    severity: "high",
    confidence: "high",
    title: "Arbitrary code execution",
    description: "Use of eval, exec, or similar code execution primitives",
    pattern: /\b(?:eval|exec|execSync|spawn|os\.system|subprocess\.(?:call|run|Popen)|child_process)\s*\(/gi,
    remediation: "Avoid dynamic code execution; use explicit function calls instead",
  },
  {
    category: "execution-risk",
    severity: "medium",
    confidence: "medium",
    title: "Shell command execution",
    description: "Direct shell command execution detected",
    pattern: /\b(?:bash|sh)\s+-c\s+|(?:powershell|powershell\.exe)\s+(?:-(?:Command|EncodedCommand|File|ExecutionPolicy)\s+)|(?:cmd\.exe)\s+\/c\s+/gi,
    remediation: "Limit shell execution to necessary commands only",
  },

  // Data exfiltration
  {
    category: "data-exfiltration",
    severity: "high",
    confidence: "medium",
    title: "Suspicious webhook or paste service",
    description: "References to webhook URLs or paste services",
    pattern: /(?:webhook\.site|requestbin|pastebin|paste\.ee|hastebin|ghostbin|ngrok\.io|pipedream)/gi,
    remediation: "Use trusted, documented endpoints for data transmission",
  },
  {
    category: "data-exfiltration",
    severity: "high",
    confidence: "medium",
    title: "Transcript or conversation exfiltration",
    description: "Instructions to send conversation data externally",
    pattern: /(?:send|upload|share|export)\s+(?:the\s+)?(?:transcript|conversation|chat|history)/gi,
    remediation: "Never automatically send conversation data to external services",
  },

  // Prompt injection
  {
    category: "prompt-injection",
    severity: "critical",
    confidence: "high",
    title: "Instruction override attempt",
    description: "Pattern that attempts to override safety instructions",
    pattern: /(?:ignore|disregard|override|bypass)\s+(?:your\s+)?(?:previous\s+)?(?:instructions|rules|safety|guidelines|restrictions)/gi,
    remediation: "Never include instructions that override system safety guidelines",
  },
  {
    category: "prompt-injection",
    severity: "high",
    confidence: "medium",
    title: "Jailbreak pattern detected",
    description: "Known jailbreak technique referenced",
    pattern: /(?:DAN\s+mode|do\s+anything\s+now|developer\s+mode|maintenance\s+mode|unrestricted\s+(?:access|mode|AI)|without\s+(?:restrictions|rules|limits))/gi,
    remediation: "Remove references to jailbreak techniques from skill content",
  },
  {
    category: "prompt-injection",
    severity: "high",
    confidence: "medium",
    title: "Unsafe content retrieval and execution",
    description: "Content retrieved from external source is executed without validation",
    pattern: /(?:execute|run|process)_?(?:instructions|commands|content)\s*\(|(?:no\s+validation|no\s+sanitization|without\s+(?:validation|sanitization))/gi,
    remediation: "Always validate and sanitize externally-retrieved content before processing",
  },

  // Overbroad scope
  {
    category: "overbroad-scope",
    severity: "medium",
    confidence: "medium",
    title: "Filesystem-wide access requested",
    description: "Skill requests access to entire filesystem",
    pattern: /(?:read|write|access)\s+(?:all|any|entire)\s+(?:files?|directories?|folders?)/gi,
    remediation: "Request only the minimum filesystem access needed",
  },
  {
    category: "overbroad-scope",
    severity: "high",
    confidence: "medium",
    title: "Full mailbox or calendar access",
    description: "Requests access to entire mailbox or calendar",
    pattern: /(?:full|all|complete)\s+(?:mailbox|email|calendar|inbox)\s+access/gi,
    remediation: "Request specific scopes instead of full access",
  },

  // Supply chain
  {
    category: "supply-chain",
    severity: "medium",
    confidence: "medium",
    title: "Unpinned dependency",
    description: "Package dependency without version pinning",
    pattern: /(?:npm\s+install|pip\s+install|yarn\s+add)\s+[\w@/-]+(?!\s*@[\d.]+)(?=\s|$)/gm,
    remediation: "Pin all dependencies to specific versions",
  },
  {
    category: "supply-chain",
    severity: "high",
    confidence: "medium",
    title: "Floating git reference",
    description: "Git clone without specific commit or tag",
    pattern: /git\s+clone\s+(?!.*(?:--branch|--tag|-b)\s+[\w.]+\s)/gi,
    remediation: "Use specific tags or commit hashes when cloning repositories",
  },
  {
    category: "supply-chain",
    severity: "high",
    confidence: "high",
    title: "Binary download from untrusted source",
    description: "Downloading executable from non-standard source",
    pattern: /(?:curl|wget)\s+[^\n]*\.(?:exe|sh|bash|bin|dmg|pkg|msi|AppImage)\b/gi,
    remediation: "Download binaries only from official sources with checksum verification",
  },
];

// Secret patterns for redaction
const SECRET_PATTERNS = [
  /(?:api[_-]?key|api[_-]?token|secret[_-]?key|access[_-]?token|password|auth[_-]?token)\s*[:=]\s*["']?([a-zA-Z0-9_\-./+=]{8,})["']?/gi,
  /(?:sk|pk|rk)[_-][a-zA-Z0-9]{20,}/g,
  /ghp_[a-zA-Z0-9]{36}/g,
  /gho_[a-zA-Z0-9]{36}/g,
  /xox[baprs]-[a-zA-Z0-9-]+/g,
];

function redactSecrets(content: string): string {
  let redacted = content;
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, (match) => {
      const prefix = match.slice(0, Math.min(4, match.length));
      return prefix + "[REDACTED]";
    });
  }
  return redacted;
}

function calculateScore(findings: Finding[]): number {
  let rawScore = 0;
  for (const finding of findings) {
    const severityWeight = SEVERITY_WEIGHTS[finding.severity];
    const confidenceMultiplier = CONFIDENCE_MULTIPLIERS[finding.confidence];
    const exploitabilityMultiplier = EXPLOITABILITY_MULTIPLIERS[finding.category];
    rawScore += severityWeight * confidenceMultiplier * exploitabilityMultiplier;
  }
  return Math.min(Math.round(rawScore), 100);
}

function scoreToRiskBand(score: number): RiskBand {
  if (score < 20) return "LOW";
  if (score < 45) return "MEDIUM";
  if (score < 75) return "HIGH";
  return "CRITICAL";
}

/**
 * Scan text content for security issues.
 * Works with listing descriptions, skill definitions, code snippets, etc.
 */
export function scanContent(content: string, source = "listing"): ScanReport {
  const startTime = Date.now();
  const scanId = randomUUID();
  const fingerprint = createHash("sha256").update(content).digest("hex");

  const findings: Finding[] = [];

  for (const detector of DETECTION_PATTERNS) {
    const regex = new RegExp(detector.pattern.source, detector.pattern.flags);
    let match;

    while ((match = regex.exec(content)) !== null) {
      const lineNumber = content.slice(0, match.index).split("\n").length;
      const evidence = redactSecrets(match[0]).slice(0, 200);

      findings.push({
        id: `${detector.category}-${randomUUID().slice(0, 8)}`,
        category: detector.category,
        severity: detector.severity,
        confidence: detector.confidence,
        title: detector.title,
        description: detector.description,
        evidence,
        remediation: detector.remediation,
        line: lineNumber,
      });
    }
  }

  const score = calculateScore(findings);
  const riskBand = scoreToRiskBand(score);
  const duration = Date.now() - startTime;

  const bySeverity: Record<Severity, number> = {
    critical: findings.filter((f) => f.severity === "critical").length,
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    low: findings.filter((f) => f.severity === "low").length,
  };

  const byCategory: Partial<Record<FindingCategory, number>> = {};
  for (const finding of findings) {
    byCategory[finding.category] = (byCategory[finding.category] || 0) + 1;
  }

  return {
    scanId,
    timestamp: new Date().toISOString(),
    fingerprint,
    riskScore: score,
    riskBand,
    findings,
    summary: {
      totalFindings: findings.length,
      durationMs: duration,
      bySeverity,
      byCategory,
    },
  };
}
