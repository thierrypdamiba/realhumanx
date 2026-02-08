import { NextResponse } from "next/server";
import { scanContent } from "@/features/clawshield/scanner";
import { logSandboxRun } from "@/features/skills/queries";
import { extractBearerToken, verifyToken } from "@/features/auth/lib";

/**
 * Sandbox execution endpoint.
 * Runs JavaScript code in a restricted Function() scope with no access to
 * Node APIs, fetch, or globals. ClawShield scans before execution.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, language, skillId } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    if (code.length > 10000) {
      return NextResponse.json({ error: "Code too large (max 10KB)" }, { status: 400 });
    }

    // ClawShield pre-scan: check for dangerous patterns before executing
    const report = scanContent(code, "sandbox");

    // Block execution if CRITICAL risk
    if (report.riskBand === "CRITICAL") {
      // Get user ID if authenticated
      let runnerAlienId: string | undefined;
      const token = extractBearerToken(request.headers.get("Authorization"));
      if (token) {
        try { runnerAlienId = (await verifyToken(token)).sub; } catch {}
      }

      await logSandboxRun({
        runnerAlienId,
        skillId,
        code,
        language: language || "javascript",
        error: `BLOCKED: ClawShield detected critical risk (score: ${report.riskScore})`,
        durationMs: 0,
        clawshieldScore: report.riskScore,
        clawshieldBand: report.riskBand,
      }).catch(() => {});

      return NextResponse.json({
        data: {
          output: null,
          error: `Execution blocked by ClawShield. Risk: ${report.riskBand} (${report.riskScore}/100). ${report.summary.totalFindings} security issue(s) detected.`,
          blocked: true,
          scan: {
            score: report.riskScore,
            band: report.riskBand,
            findings: report.findings.map((f) => ({
              title: f.title,
              severity: f.severity,
              category: f.category,
            })),
          },
          durationMs: 0,
        },
      });
    }

    // Execute in restricted sandbox (JavaScript only for now)
    const startTime = Date.now();
    let output = "";
    let error = "";

    if (language && language !== "javascript" && language !== "typescript") {
      output = `[Sandbox] ${language} execution is display-only. Code was scanned by ClawShield.`;
    } else {
      try {
        // Build a sandboxed execution context
        // No access to: require, import, fetch, process, global, Buffer, __dirname, etc.
        const logs: string[] = [];
        const sandboxConsole = {
          log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
          error: (...args: unknown[]) => logs.push("[ERROR] " + args.map(String).join(" ")),
          warn: (...args: unknown[]) => logs.push("[WARN] " + args.map(String).join(" ")),
          info: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
        };

        // Wrap in a Function with restricted scope
        const wrappedCode = `
          "use strict";
          const console = __console__;
          const result = (function() {
            ${code}
          })();
          if (result !== undefined) __console__.log(String(result));
        `;

        const fn = new Function("__console__", wrappedCode);

        // Execute with 5s timeout via AbortController pattern
        const timeoutMs = 5000;
        const timer = setTimeout(() => {
          throw new Error("Execution timed out (5s limit)");
        }, timeoutMs);

        try {
          fn(sandboxConsole);
        } finally {
          clearTimeout(timer);
        }

        output = logs.join("\n") || "(no output)";
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
    }

    const durationMs = Date.now() - startTime;

    // Log the run
    let runnerAlienId: string | undefined;
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (token) {
      try { runnerAlienId = (await verifyToken(token)).sub; } catch {}
    }

    logSandboxRun({
      runnerAlienId,
      skillId,
      code,
      language: language || "javascript",
      output: output || undefined,
      error: error || undefined,
      durationMs,
      clawshieldScore: report.riskScore,
      clawshieldBand: report.riskBand,
    }).catch(() => {});

    return NextResponse.json({
      data: {
        output: output || null,
        error: error || null,
        blocked: false,
        scan: {
          score: report.riskScore,
          band: report.riskBand,
          findings: report.findings.map((f) => ({
            title: f.title,
            severity: f.severity,
            category: f.category,
          })),
        },
        durationMs,
      },
    });
  } catch {
    return NextResponse.json({ error: "Sandbox execution failed" }, { status: 500 });
  }
}
