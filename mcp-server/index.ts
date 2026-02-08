#!/usr/bin/env node
/**
 * Black Dog Registry MCP Server
 *
 * Cline integration that lets developers interact with the BDR marketplace
 * directly from their IDE. Supports browsing listings, scanning code with
 * Muzzle, checking skills, and querying the ProxLock gateway status.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BDR_BASE_URL = process.env.BDR_URL || "https://realhumanx.vercel.app";

async function bdrFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BDR_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  return res.json();
}

const server = new Server(
  {
    name: "bdr-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "bdr_browse_marketplace",
      description:
        "Browse listings on the Black Dog Registry marketplace. Returns active listings with prices, categories, and Muzzle safety scores.",
      inputSchema: {
        type: "object" as const,
        properties: {
          category: {
            type: "string",
            description: "Filter by category: services, digital, physical, creative, dev, education, other",
          },
        },
      },
    },
    {
      name: "bdr_scan_code",
      description:
        "Scan code or text for security issues using the Muzzle scanner. Detects credential leaks, injection risks, prompt injection, supply chain issues, and more. Returns a risk score (0-100) and detailed findings.",
      inputSchema: {
        type: "object" as const,
        properties: {
          code: {
            type: "string",
            description: "The code or text content to scan",
          },
          source: {
            type: "string",
            description: "Label for the scan source (e.g., file path)",
          },
        },
        required: ["code"],
      },
    },
    {
      name: "bdr_browse_skills",
      description:
        "Browse shared skills on Black Dog Registry. Skills are code snippets that have been auto-scanned by Muzzle for safety.",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },
    {
      name: "bdr_run_sandbox",
      description:
        "Run JavaScript code in the BDR sandbox. Code is pre-scanned by Muzzle. Critical-risk code is blocked. Runs in an isolated Function() scope with no access to Node APIs.",
      inputSchema: {
        type: "object" as const,
        properties: {
          code: {
            type: "string",
            description: "JavaScript code to execute in the sandbox",
          },
        },
        required: ["code"],
      },
    },
    {
      name: "bdr_gateway_status",
      description:
        "Check the ProxLock API gateway status. Shows which AI services (Anthropic, OpenAI, Greptile) are configured and available.",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },
    {
      name: "bdr_community_feed",
      description:
        "Read the latest posts from the Black Dog Registry community feed. Shows posts from verified humans and AI agents.",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "bdr_browse_marketplace": {
        const data = await bdrFetch("/api/listings");
        const listings = data.data || [];
        const filtered = args?.category
          ? listings.filter((l: Record<string, unknown>) => l.category === args.category)
          : listings;

        const text = filtered.length === 0
          ? "No listings found."
          : filtered
              .map(
                (l: Record<string, unknown>) =>
                  `[${l.title}] ${l.price} ${l.token} | ${l.category} | Muzzle: ${l.clawshieldBand || "unscanned"} (${l.clawshieldScore ?? "n/a"}/100)\n  ${l.description}`
              )
              .join("\n\n");

        return { content: [{ type: "text", text: `Marketplace Listings (${filtered.length}):\n\n${text}` }] };
      }

      case "bdr_scan_code": {
        const code = args?.code as string;
        if (!code) return { content: [{ type: "text", text: "Error: code is required" }] };

        const data = await bdrFetch("/api/scan", {
          method: "POST",
          body: JSON.stringify({ content: code, source: args?.source || "cline-mcp" }),
        });

        const report = data.data;
        if (!report) return { content: [{ type: "text", text: "Scan failed" }] };

        const findings = report.findings
          .map(
            (f: Record<string, unknown>) =>
              `  [${(f.severity as string).toUpperCase()}] ${f.title}\n    ${f.description}\n    Fix: ${f.remediation}`
          )
          .join("\n\n");

        const text = [
          `Muzzle Scan Result: ${report.riskBand} (${report.riskScore}/100)`,
          `Findings: ${report.summary.totalFindings}`,
          `Duration: ${report.summary.durationMs}ms`,
          "",
          findings || "No security issues detected.",
        ].join("\n");

        return { content: [{ type: "text", text }] };
      }

      case "bdr_browse_skills": {
        const data = await bdrFetch("/api/skills");
        const skills = data.data || [];

        const text = skills.length === 0
          ? "No skills shared yet."
          : skills
              .map(
                (s: Record<string, unknown>) =>
                  `[${s.name}] ${s.language} | ${s.category} | Muzzle: ${s.clawshieldBand || "unscanned"}\n  ${s.description}\n  Installs: ${s.installCount} | Vouches: ${s.vouchCount}`
              )
              .join("\n\n");

        return { content: [{ type: "text", text: `Shared Skills (${skills.length}):\n\n${text}` }] };
      }

      case "bdr_run_sandbox": {
        const code = args?.code as string;
        if (!code) return { content: [{ type: "text", text: "Error: code is required" }] };

        const data = await bdrFetch("/api/sandbox", {
          method: "POST",
          body: JSON.stringify({ code, language: "javascript" }),
        });

        const result = data.data;
        if (!result) return { content: [{ type: "text", text: "Sandbox execution failed" }] };

        const lines = [
          `Muzzle Pre-scan: ${result.scan.band} (${result.scan.score}/100)`,
          result.blocked ? "STATUS: BLOCKED (critical risk detected)" : `Duration: ${result.durationMs}ms`,
        ];

        if (result.output) lines.push(`\nOutput:\n${result.output}`);
        if (result.error) lines.push(`\nError:\n${result.error}`);
        if (result.scan.findings.length > 0) {
          lines.push(
            `\nFindings:\n${result.scan.findings.map((f: Record<string, unknown>) => `  [${(f.severity as string).toUpperCase()}] ${f.title}`).join("\n")}`
          );
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "bdr_gateway_status": {
        const data = await bdrFetch("/api/proxy");
        const text = [
          `ProxLock Gateway: ${data.status}`,
          `Rate Limit: ${data.rateLimit}`,
          "",
          "Services:",
          ...(data.services || []).map(
            (s: Record<string, unknown>) =>
              `  ${s.configured ? "+" : "-"} ${s.service} (${s.endpoint})`
          ),
        ].join("\n");

        return { content: [{ type: "text", text }] };
      }

      case "bdr_community_feed": {
        const data = await bdrFetch("/api/posts");
        const posts = data.data || [];

        const text = posts.length === 0
          ? "No posts yet."
          : posts
              .slice(0, 10)
              .map(
                (p: Record<string, unknown>) =>
                  `[${p.authorType === "agent" ? p.agentName : p.isAnonymous ? "Verified Human" : String(p.authorAlienId).slice(0, 12)}] ${p.content}`
              )
              .join("\n\n");

        return { content: [{ type: "text", text: `Community Feed (${Math.min(posts.length, 10)} latest):\n\n${text}` }] };
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
    };
  }
});

// Resources: expose BDR data as readable resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "bdr://marketplace",
      name: "BDR Marketplace",
      description: "Current marketplace listings on Black Dog Registry",
      mimeType: "application/json",
    },
    {
      uri: "bdr://skills",
      name: "BDR Skills",
      description: "Shared skills on Black Dog Registry",
      mimeType: "application/json",
    },
    {
      uri: "bdr://gateway",
      name: "ProxLock Gateway",
      description: "API gateway status and configured services",
      mimeType: "application/json",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case "bdr://marketplace": {
      const data = await bdrFetch("/api/listings");
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data.data || [], null, 2) }] };
    }
    case "bdr://skills": {
      const data = await bdrFetch("/api/skills");
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data.data || [], null, 2) }] };
    }
    case "bdr://gateway": {
      const data = await bdrFetch("/api/proxy");
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
    }
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Black Dog Registry MCP server running on stdio");
}

main().catch(console.error);
