import { NextResponse } from "next/server";
import { extractBearerToken, verifyToken } from "@/features/auth/lib";
import { getServerEnv } from "@/lib/env";

/**
 * ProxLock-style API Proxy Gateway
 *
 * All external API calls (LLMs, Greptile, etc.) route through this endpoint.
 * Keys never touch the frontend. Every call is authenticated, logged, and rate-aware.
 *
 * Supported services: anthropic, openai, greptile
 */

type ProxyRequest = {
  service: "anthropic" | "openai" | "greptile";
  endpoint?: string;
  body: Record<string, unknown>;
};

// In-memory rate limiting (per alienId, per minute)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 20;

function checkRateLimit(alienId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(alienId);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(alienId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_MINUTE) return false;
  entry.count++;
  return true;
}

// Service configurations: URL, headers, key mapping
const SERVICE_CONFIG: Record<string, {
  baseUrl: string;
  keyEnv: string;
  buildHeaders: (key: string) => Record<string, string>;
}> = {
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1",
    keyEnv: "ANTHROPIC_API_KEY",
    buildHeaders: (key) => ({
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    }),
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    keyEnv: "OPENAI_API_KEY",
    buildHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
  },
  greptile: {
    baseUrl: "https://api.greptile.com/v2",
    keyEnv: "GREPTILE_API_KEY",
    buildHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
  },
};

export async function POST(request: Request) {
  try {
    // Auth: must be a verified human
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sub: alienId } = await verifyToken(token);

    // Rate limit
    if (!checkRateLimit(alienId)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 20 requests/minute." },
        { status: 429 },
      );
    }

    const body: ProxyRequest = await request.json();
    const { service, endpoint, body: serviceBody } = body;

    if (!service || !SERVICE_CONFIG[service]) {
      return NextResponse.json(
        { error: `Unknown service. Supported: ${Object.keys(SERVICE_CONFIG).join(", ")}` },
        { status: 400 },
      );
    }

    const config = SERVICE_CONFIG[service];
    const env = getServerEnv();
    const apiKey = (env as Record<string, string>)[config.keyEnv];

    if (!apiKey) {
      return NextResponse.json(
        { error: `Service "${service}" not configured (missing key)` },
        { status: 503 },
      );
    }

    // Build the proxied request
    const targetUrl = endpoint
      ? `${config.baseUrl}/${endpoint.replace(/^\//, "")}`
      : config.baseUrl;

    const startMs = Date.now();
    const proxyRes = await fetch(targetUrl, {
      method: "POST",
      headers: config.buildHeaders(apiKey),
      body: JSON.stringify(serviceBody),
    });

    const proxyData = await proxyRes.json();
    const durationMs = Date.now() - startMs;

    return NextResponse.json({
      data: proxyData,
      _proxy: {
        service,
        endpoint: targetUrl,
        status: proxyRes.status,
        durationMs,
        proxiedBy: "proxlock-gateway",
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "message" in error) {
      const msg = (error as { message: string }).message;
      if (msg.includes("JWTExpired") || msg.includes("JOSEError")) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
      }
    }
    return NextResponse.json({ error: "Proxy gateway error" }, { status: 500 });
  }
}

// Health check: shows which services are configured (no key values exposed)
export async function GET() {
  const env = getServerEnv();
  const services = Object.entries(SERVICE_CONFIG).map(([name, config]) => ({
    service: name,
    configured: !!(env as Record<string, string>)[config.keyEnv],
    endpoint: config.baseUrl,
  }));

  return NextResponse.json({
    gateway: "proxlock",
    status: "operational",
    services,
    rateLimit: `${MAX_REQUESTS_PER_MINUTE}/min per user`,
  });
}
