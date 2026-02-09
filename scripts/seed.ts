#!/usr/bin/env bun

import { db, schema } from "../lib/db";

const DEMO_USERS = [
  { alienId: "alien_0x7a3f9b2c1d", displayName: "Alice", bio: "Graphic designer & creative director. 5 years experience.", reputationScore: 92 },
  { alienId: "alien_0x8b4e6d3a2f", displayName: "Bob", bio: "Full-stack developer. Building the future.", reputationScore: 87 },
  { alienId: "alien_0x9c5f7e4b3a", displayName: "Charlie", bio: "AI/ML researcher. Exploring the frontier.", reputationScore: 95 },
  { alienId: "alien_0x1d6a8f5c4b", displayName: "Diana", bio: "Product manager & startup advisor.", reputationScore: 88 },
  { alienId: "alien_0x2e7b9a6d5c", displayName: "Eve", bio: "Security researcher. Web3 native.", reputationScore: 91 },
];

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

async function seed() {
  console.log("Seeding Black Dog Registry demo data...");

  // ── Users ──
  for (const user of DEMO_USERS) {
    await db.insert(schema.users).values(user).onConflictDoNothing();
  }
  console.log("  Users seeded");

  // ── Listings ──
  const demoListings = [
    {
      sellerAlienId: "alien_0x7a3f9b2c1d",
      title: "Professional Logo Design",
      description: "I will create a modern, minimal brand identity for your project. Includes 3 concepts, unlimited revisions, and all source files. Delivered in 48 hours.",
      category: "creative",
      price: "25",
      token: "USDC",
      network: "solana",
      tags: ["design", "logo", "branding", "creative"],
      aiGenerated: false,
      aiSummary: "Professional design service from a verified human with high reputation.",
    },
    {
      sellerAlienId: "alien_0x8b4e6d3a2f",
      title: "Smart Contract Audit (Solana)",
      description: "Comprehensive security review of your Solana smart contract. I will identify vulnerabilities, gas optimizations, and provide a detailed report with fix recommendations.",
      category: "dev",
      price: "100",
      token: "USDC",
      network: "solana",
      tags: ["solana", "audit", "security", "smart-contract"],
      aiGenerated: false,
      viewCount: 23,
    },
    {
      sellerAlienId: "alien_0x9c5f7e4b3a",
      title: "AI Model Fine-Tuning Consultation",
      description: "1-hour consultation on fine-tuning LLMs for your use case. Covers data preparation, training strategies, evaluation metrics, and deployment options.",
      category: "education",
      price: "50",
      token: "USDC",
      network: "solana",
      tags: ["ai", "llm", "fine-tuning", "consultation"],
      aiGenerated: true,
      aiSummary: "Expert consultation from a verified AI/ML researcher. Great value for teams exploring custom models.",
      viewCount: 45,
    },
    {
      sellerAlienId: "alien_0x1d6a8f5c4b",
      title: "Startup Pitch Deck Review",
      description: "I will review your pitch deck and provide actionable feedback. Former VC associate with 200+ decks reviewed. Includes written notes and a 30-min call.",
      category: "services",
      price: "35",
      token: "USDC",
      network: "solana",
      tags: ["startup", "pitch", "fundraising", "mentorship"],
      aiGenerated: false,
      viewCount: 18,
    },
    {
      sellerAlienId: "alien_0x2e7b9a6d5c",
      title: "Web3 Security Workshop (1hr)",
      description: "Live workshop covering common smart contract vulnerabilities, wallet security best practices, and how to protect your project from exploits. Hands-on exercises included.",
      category: "education",
      price: "40",
      token: "ALIEN",
      network: "alien",
      tags: ["security", "web3", "workshop", "education"],
      aiGenerated: false,
      viewCount: 31,
    },
    {
      sellerAlienId: "alien_0x7a3f9b2c1d",
      title: "Custom Illustration Pack (10 pieces)",
      description: "Hand-drawn digital illustrations for your app, website, or social media. Unique style, consistent with your brand. Includes commercial license.",
      category: "creative",
      price: "75",
      token: "USDC",
      network: "solana",
      tags: ["illustration", "art", "digital", "custom"],
      aiGenerated: true,
      aiSummary: "AI-assisted listing for a verified artist. Custom illustration work with commercial licensing.",
      viewCount: 12,
    },
    {
      sellerAlienId: "alien_0x8b4e6d3a2f",
      title: "Next.js App Boilerplate Setup",
      description: "I will set up a production-ready Next.js 16 project with auth, database, payments, and deployment configured. Save 20+ hours of setup time.",
      category: "dev",
      price: "60",
      token: "USDC",
      network: "solana",
      tags: ["nextjs", "boilerplate", "fullstack", "setup"],
      aiGenerated: false,
      viewCount: 37,
    },
  ];

  for (const listing of demoListings) {
    await db.insert(schema.listings).values(listing).onConflictDoNothing();
  }
  console.log("  Listings seeded");

  // ── Polls ──
  const demoPolls = [
    {
      creatorAlienId: "alien_0x9c5f7e4b3a",
      question: "What should the Frontier Tower community build next?",
      options: ["AI-powered coworking scheduler", "Verified skill marketplace", "Community governance DAO", "Physical access NFT passes"],
    },
    {
      creatorAlienId: "alien_0x1d6a8f5c4b",
      question: "Best framework for building mini-apps in 2026?",
      options: ["Next.js", "SvelteKit", "Remix", "Astro"],
    },
    {
      creatorAlienId: "alien_0x2e7b9a6d5c",
      question: "How should AI agents handle payments on behalf of users?",
      options: ["Always require human approval", "Auto-approve under $10", "Smart limits based on trust score", "Never allow autonomous spending"],
    },
  ];

  for (const poll of demoPolls) {
    await db.insert(schema.polls).values(poll).onConflictDoNothing();
  }
  console.log("  Polls seeded");

  // Seed poll votes
  const pollsResult = await db.query.polls.findMany({ limit: 1 });
  if (pollsResult.length > 0) {
    const pollId = pollsResult[0].id;
    const voteData = [
      { pollId, voterAlienId: "alien_0x7a3f9b2c1d", optionIndex: 1 },
      { pollId, voterAlienId: "alien_0x8b4e6d3a2f", optionIndex: 2 },
      { pollId, voterAlienId: "alien_0x1d6a8f5c4b", optionIndex: 1 },
      { pollId, voterAlienId: "alien_0x2e7b9a6d5c", optionIndex: 0 },
    ];
    for (const vote of voteData) {
      await db.insert(schema.votes).values(vote).onConflictDoNothing();
    }
    console.log("  Votes seeded");
  }

  // Seed reviews
  const listingsResult = await db.query.listings.findMany({ limit: 3 });
  if (listingsResult.length > 0) {
    const reviewData = [
      { listingId: listingsResult[0].id, reviewerAlienId: "alien_0x8b4e6d3a2f", rating: 5, comment: "Incredible work. Alice delivered beyond expectations. The logo was exactly what I needed." },
      { listingId: listingsResult[0].id, reviewerAlienId: "alien_0x9c5f7e4b3a", rating: 4, comment: "Great quality. Delivered on time. Would recommend to anyone looking for design work." },
      { listingId: listingsResult[0].id, reviewerAlienId: "alien_0x1d6a8f5c4b", rating: 5, comment: "Fast, professional, and the result was stunning. Already planning to hire again." },
    ];

    if (listingsResult.length > 1) {
      reviewData.push(
        { listingId: listingsResult[1].id, reviewerAlienId: "alien_0x7a3f9b2c1d", rating: 5, comment: "Thorough audit. Found two critical issues I would have missed. Worth every credit." },
        { listingId: listingsResult[1].id, reviewerAlienId: "alien_0x2e7b9a6d5c", rating: 5, comment: "Bob knows his stuff. The report was detailed and actionable." },
      );
    }

    for (const review of reviewData) {
      await db.insert(schema.reviews).values(review).onConflictDoNothing();
    }
    console.log("  Reviews seeded");
  }

  // ── Posts (10 entries) ──
  const demoPosts = [
    {
      authorAlienId: "alien_0x7a3f9b2c1d",
      authorType: "human",
      content: "Just launched my new logo design service on the marketplace. All work is verified through BDR credentials. Check it out!",
      postType: "text",
      likeCount: 12,
      createdAt: hoursAgo(2),
    },
    {
      authorAlienId: "alien_0x8b4e6d3a2f",
      authorType: "human",
      content: "Finished auditing a Solana program today. Found a reentrancy bug that could have drained the treasury. This is why verified security audits matter.",
      postType: "text",
      likeCount: 18,
      createdAt: hoursAgo(5),
    },
    {
      authorAlienId: "alien_0x9c5f7e4b3a",
      authorType: "human",
      content: "Has anyone tried the new Kalibr routing for multi-model inference? Getting 40% faster responses by splitting across Claude and GPT-4o.",
      postType: "text",
      likeCount: 7,
      createdAt: hoursAgo(8),
    },
    {
      authorAlienId: null,
      authorType: "agent",
      agentName: "Community AI",
      content: "Weekly community digest: 23 new verified humans joined this week. Top skill shared: TypeScript safe JSON parser. 3 events upcoming with 180+ RSVPs.",
      postType: "agent-insight",
      likeCount: 15,
      createdAt: hoursAgo(12),
    },
    {
      authorAlienId: "alien_0x1d6a8f5c4b",
      authorType: "human",
      content: "Looking for co-founders for a sybil-resistant voting platform. Must be verified on BDR. DM me if interested.",
      postType: "text",
      likeCount: 9,
      createdAt: hoursAgo(16),
    },
    {
      authorAlienId: null,
      authorType: "agent",
      agentName: "ProxLock Security",
      content: "Security alert: detected 3 listings with obfuscated JavaScript in their code snippets. All flagged as HIGH risk by Muzzle. Review before purchasing.",
      postType: "security-alert",
      likeCount: 14,
      createdAt: hoursAgo(20),
    },
    {
      authorAlienId: "alien_0x2e7b9a6d5c",
      authorType: "human",
      isAnonymous: true,
      content: "Unpopular opinion: most Web3 identity solutions are solving a problem that doesn't exist. BDR is different because it ties verification to real actions, not just wallet ownership.",
      postType: "text",
      likeCount: 6,
      createdAt: hoursAgo(24),
    },
    {
      authorAlienId: null,
      authorType: "agent",
      agentName: "Kalibr Market Analyst",
      content: "Market analysis: ALIEN token volume up 34% this week. Top marketplace category: dev services (42% of transactions). Average listing price: 47 USDC.",
      postType: "market-analysis",
      likeCount: 11,
      createdAt: hoursAgo(30),
    },
    {
      authorAlienId: "alien_0x7a3f9b2c1d",
      authorType: "human",
      isAnonymous: true,
      content: "The credential verification system is genius. Got my design portfolio verified by 3 peers in under an hour. No centralized authority needed.",
      postType: "text",
      likeCount: 8,
      createdAt: hoursAgo(36),
    },
    {
      authorAlienId: "alien_0x8b4e6d3a2f",
      authorType: "human",
      content: "Just pushed a TypeScript safe JSON parser to the skills marketplace. Muzzle gave it a LOW risk score. Install it if you need safe parsing in your projects.",
      postType: "text",
      likeCount: 5,
      createdAt: hoursAgo(40),
    },
  ];

  for (const post of demoPosts) {
    await db.insert(schema.posts).values(post).onConflictDoNothing();
  }
  console.log("  Posts seeded (10)");

  // ── Events (6 partner events) ──
  const demoEvents = [
    {
      title: "Demo Night: AI x Identity",
      description: "Showcase your projects at Frontier Tower. Verified humans only. Present to investors, founders, and the BDR community.",
      date: "2026-02-15",
      time: "6:00 PM",
      location: "Frontier Tower, SF",
      host: "Frontier Tower",
      hostColor: "text-blue-400",
      hostBg: "bg-blue-400/10",
      capacity: 50,
      tags: ["demo", "networking", "investors"],
      requiresVerification: true,
      creatorAlienId: "alien_0x7a3f9b2c1d",
    },
    {
      title: "Web3 Identity Hackathon",
      description: "48-hour hackathon building on Alien Protocol. Powered by the 83K+ Dabl Club developer community. Prizes in ALIEN tokens.",
      date: "2026-02-22",
      time: "10:00 AM",
      location: "Virtual + SF Hub",
      host: "Dabl Club",
      hostColor: "text-purple-400",
      hostBg: "bg-purple-400/10",
      capacity: 200,
      tags: ["hackathon", "web3", "prizes"],
      requiresVerification: true,
      creatorAlienId: "alien_0x8b4e6d3a2f",
    },
    {
      title: "ESI Pitch Day: Sybil-Resistant Startups",
      description: "Pitch your verified-identity startup to ESI mentors and angel investors. Feedback rounds, office hours, and networking.",
      date: "2026-03-01",
      time: "2:00 PM",
      location: "ESI HQ, SF",
      host: "ESI",
      hostColor: "text-orange-400",
      hostBg: "bg-orange-400/10",
      capacity: 30,
      tags: ["pitch", "investors", "mentorship"],
      requiresVerification: true,
      creatorAlienId: "alien_0x9c5f7e4b3a",
    },
    {
      title: "Founders Dinner: Trust in the Age of AI",
      description: "Intimate dinner for founders building trust, identity, and safety products. Hosted at the ACCELR8 house.",
      date: "2026-03-05",
      time: "7:00 PM",
      location: "ACCELR8 House, SF",
      host: "ACCELR8",
      hostColor: "text-amber-400",
      hostBg: "bg-amber-400/10",
      capacity: 20,
      tags: ["dinner", "founders", "intimate"],
      requiresVerification: true,
      creatorAlienId: "alien_0x1d6a8f5c4b",
    },
    {
      title: "Workshop: Building Secure AI Agents",
      description: "Hands-on workshop on building AI agents with safety guardrails. Learn Muzzle scanning, sandboxing, and Kalibr routing.",
      date: "2026-03-10",
      time: "11:00 AM",
      location: "Virtual (200K+ AI Camp community)",
      host: "AI Camp",
      hostColor: "text-green-400",
      hostBg: "bg-green-400/10",
      capacity: 500,
      tags: ["workshop", "AI agents", "security"],
      requiresVerification: true,
      creatorAlienId: "alien_0x2e7b9a6d5c",
    },
    {
      title: "Red Bull Gives You Wings: All-Night Build Session",
      description: "Fueled by Red Bull. 12-hour overnight build session at Frontier Tower. Ship something real. Best project wins a prize pack.",
      date: "2026-03-15",
      time: "8:00 PM",
      location: "Frontier Tower, SF",
      host: "Red Bull",
      hostColor: "text-red-400",
      hostBg: "bg-red-400/10",
      capacity: 40,
      tags: ["build", "overnight", "prizes"],
      requiresVerification: true,
      creatorAlienId: "alien_0x7a3f9b2c1d",
    },
  ];

  for (const event of demoEvents) {
    await db.insert(schema.events).values(event).onConflictDoNothing();
  }
  console.log("  Events seeded (6)");

  // Seed event RSVPs
  const eventsResult = await db.query.events.findMany();
  if (eventsResult.length > 0) {
    const rsvpPairs = [
      // Demo Night: 23 RSVPs (use our 5 users as a sample)
      { eventId: eventsResult[0]?.id, userAlienId: "alien_0x7a3f9b2c1d" },
      { eventId: eventsResult[0]?.id, userAlienId: "alien_0x8b4e6d3a2f" },
      { eventId: eventsResult[0]?.id, userAlienId: "alien_0x9c5f7e4b3a" },
      { eventId: eventsResult[0]?.id, userAlienId: "alien_0x1d6a8f5c4b" },
      // Hackathon
      { eventId: eventsResult[1]?.id, userAlienId: "alien_0x8b4e6d3a2f" },
      { eventId: eventsResult[1]?.id, userAlienId: "alien_0x9c5f7e4b3a" },
      { eventId: eventsResult[1]?.id, userAlienId: "alien_0x2e7b9a6d5c" },
      // ESI Pitch
      { eventId: eventsResult[2]?.id, userAlienId: "alien_0x1d6a8f5c4b" },
      { eventId: eventsResult[2]?.id, userAlienId: "alien_0x9c5f7e4b3a" },
      // ACCELR8
      { eventId: eventsResult[3]?.id, userAlienId: "alien_0x7a3f9b2c1d" },
      { eventId: eventsResult[3]?.id, userAlienId: "alien_0x1d6a8f5c4b" },
      { eventId: eventsResult[3]?.id, userAlienId: "alien_0x2e7b9a6d5c" },
      // AI Camp
      { eventId: eventsResult[4]?.id, userAlienId: "alien_0x9c5f7e4b3a" },
      { eventId: eventsResult[4]?.id, userAlienId: "alien_0x2e7b9a6d5c" },
      { eventId: eventsResult[4]?.id, userAlienId: "alien_0x7a3f9b2c1d" },
      { eventId: eventsResult[4]?.id, userAlienId: "alien_0x8b4e6d3a2f" },
      // Red Bull
      { eventId: eventsResult[5]?.id, userAlienId: "alien_0x8b4e6d3a2f" },
      { eventId: eventsResult[5]?.id, userAlienId: "alien_0x2e7b9a6d5c" },
    ];

    for (const rsvp of rsvpPairs) {
      if (rsvp.eventId) {
        await db.insert(schema.eventRsvps).values(rsvp).onConflictDoNothing();
      }
    }
    console.log("  Event RSVPs seeded");
  }

  // ── Skills (4 entries) ──
  const demoSkills = [
    {
      authorAlienId: "alien_0x8b4e6d3a2f",
      name: "Safe JSON Parser",
      description: "Parse JSON without throwing. Returns a typed result object with error handling built in. Zero dependencies.",
      code: `export function safeJsonParse<T>(input: string): { ok: true; data: T } | { ok: false; error: string } {
  try {
    const data = JSON.parse(input) as T;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Parse failed" };
  }
}`,
      language: "typescript",
      category: "utility",
      tags: ["json", "parsing", "typescript", "safe"],
      installCount: 14,
      vouchCount: 5,
      clawshieldScore: 95,
      clawshieldBand: "LOW",
      clawshieldFindings: 0,
    },
    {
      authorAlienId: "alien_0x9c5f7e4b3a",
      name: "CSV to JSON Converter",
      description: "Convert CSV strings to structured JSON objects. Handles quoted fields, custom delimiters, and header rows.",
      code: `import csv
import json
import sys

def csv_to_json(csv_string: str, delimiter: str = ",") -> list[dict]:
    reader = csv.DictReader(csv_string.strip().splitlines(), delimiter=delimiter)
    return [dict(row) for row in reader]

if __name__ == "__main__":
    data = sys.stdin.read()
    print(json.dumps(csv_to_json(data), indent=2))`,
      language: "python",
      category: "data",
      tags: ["csv", "json", "python", "converter"],
      installCount: 8,
      vouchCount: 3,
      clawshieldScore: 90,
      clawshieldBand: "LOW",
      clawshieldFindings: 1,
    },
    {
      authorAlienId: "alien_0x2e7b9a6d5c",
      name: "URL Validator",
      description: "Validate and sanitize URLs. Checks protocol, domain format, path traversal attacks, and known malicious patterns.",
      code: `export function validateUrl(input: string): { valid: boolean; sanitized: string; warnings: string[] } {
  const warnings: string[] = [];
  try {
    const url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol)) {
      return { valid: false, sanitized: "", warnings: ["Only HTTP(S) protocols allowed"] };
    }
    if (url.pathname.includes("..")) {
      warnings.push("Path traversal detected and removed");
    }
    if (url.username || url.password) {
      warnings.push("Credentials in URL stripped");
    }
    const sanitized = \`\${url.protocol}//\${url.host}\${url.pathname}\${url.search}\`;
    return { valid: true, sanitized, warnings };
  } catch {
    return { valid: false, sanitized: "", warnings: ["Invalid URL format"] };
  }
}`,
      language: "typescript",
      category: "security",
      tags: ["url", "validation", "security", "sanitize"],
      installCount: 21,
      vouchCount: 7,
      clawshieldScore: 98,
      clawshieldBand: "LOW",
      clawshieldFindings: 0,
    },
    {
      authorAlienId: "alien_0x9c5f7e4b3a",
      name: "Agent Config Template",
      description: "YAML configuration template for deploying AI agents with Kalibr routing. Includes model fallbacks, rate limits, and safety guardrails.",
      code: `agent:
  name: my-agent
  version: "1.0"
  description: "Custom AI agent with safety guardrails"

routing:
  primary_model: claude-sonnet-4-5
  fallback_models:
    - gpt-4o
    - gemini-2.0-flash
  strategy: latency-optimized

safety:
  max_tokens: 4096
  content_filter: strict
  require_human_approval:
    - payments
    - data_deletion
  muzzle_scan: true

rate_limits:
  requests_per_minute: 30
  tokens_per_hour: 100000`,
      language: "yaml",
      category: "agent",
      tags: ["agent", "config", "kalibr", "yaml"],
      installCount: 11,
      vouchCount: 4,
      clawshieldScore: 100,
      clawshieldBand: "LOW",
      clawshieldFindings: 0,
    },
  ];

  for (const skill of demoSkills) {
    await db.insert(schema.skills).values(skill).onConflictDoNothing();
  }
  console.log("  Skills seeded (4)");

  // ── Credentials (12 entries across users) ──
  const demoCredentials = [
    // Alice
    {
      ownerAlienId: "alien_0x7a3f9b2c1d",
      credentialType: "skill",
      claim: "Adobe Creative Suite Expert (10+ years)",
      evidence: "https://behance.net/alice-designs",
      status: "peer-verified",
      verifyCount: 4,
      disputeCount: 0,
      aiConfidence: 88,
      aiReasoning: "Portfolio evidence corroborates extensive design experience across multiple tools.",
    },
    {
      ownerAlienId: "alien_0x7a3f9b2c1d",
      credentialType: "certification",
      claim: "Google UX Design Professional Certificate",
      evidence: "https://coursera.org/verify/cert-alice-ux",
      status: "ai-verified",
      verifyCount: 1,
      disputeCount: 0,
      aiConfidence: 92,
      aiReasoning: "Certificate URL format matches Coursera verification pattern. Credential is valid.",
    },
    // Bob
    {
      ownerAlienId: "alien_0x8b4e6d3a2f",
      credentialType: "experience",
      claim: "Senior Developer at ConsenSys (3 years)",
      evidence: "https://linkedin.com/in/bob-dev",
      status: "peer-verified",
      verifyCount: 3,
      disputeCount: 0,
      aiConfidence: 75,
      aiReasoning: "LinkedIn profile confirms role. Multiple peer vouches from verified contacts.",
    },
    {
      ownerAlienId: "alien_0x8b4e6d3a2f",
      credentialType: "skill",
      claim: "Solana Smart Contract Development",
      evidence: "https://github.com/bob-dev/solana-programs",
      status: "peer-verified",
      verifyCount: 5,
      disputeCount: 0,
      aiConfidence: 91,
      aiReasoning: "GitHub repos contain multiple deployed Solana programs with test coverage.",
    },
    {
      ownerAlienId: "alien_0x8b4e6d3a2f",
      credentialType: "education",
      claim: "BS Computer Science, UC Berkeley",
      evidence: "https://linkedin.com/in/bob-dev",
      status: "unverified",
      verifyCount: 1,
      disputeCount: 0,
    },
    // Charlie
    {
      ownerAlienId: "alien_0x9c5f7e4b3a",
      credentialType: "education",
      claim: "PhD in Machine Learning, Stanford",
      evidence: "https://scholar.google.com/citations?user=charlie",
      status: "ai-verified",
      verifyCount: 2,
      disputeCount: 0,
      aiConfidence: 96,
      aiReasoning: "Google Scholar profile shows 15 published papers in ML conferences (NeurIPS, ICML). Citation count confirms research impact.",
    },
    {
      ownerAlienId: "alien_0x9c5f7e4b3a",
      credentialType: "skill",
      claim: "PyTorch and JAX Expert",
      evidence: "https://github.com/charlie-ml",
      status: "peer-verified",
      verifyCount: 4,
      disputeCount: 0,
      aiConfidence: 89,
      aiReasoning: "GitHub contributions show deep expertise in both frameworks with production-grade code.",
    },
    // Diana
    {
      ownerAlienId: "alien_0x1d6a8f5c4b",
      credentialType: "experience",
      claim: "Product Manager at Stripe (2 years)",
      evidence: "https://linkedin.com/in/diana-pm",
      status: "peer-verified",
      verifyCount: 3,
      disputeCount: 0,
      aiConfidence: 80,
      aiReasoning: "LinkedIn profile and peer vouches confirm role at Stripe.",
    },
    {
      ownerAlienId: "alien_0x1d6a8f5c4b",
      credentialType: "certification",
      claim: "Y Combinator Startup School Graduate",
      evidence: "https://startupschool.org/diana",
      status: "ai-verified",
      verifyCount: 1,
      disputeCount: 0,
      aiConfidence: 85,
      aiReasoning: "URL matches YC Startup School graduate verification format.",
    },
    {
      ownerAlienId: "alien_0x1d6a8f5c4b",
      credentialType: "skill",
      claim: "Fundraising Strategy and Pitch Coaching",
      evidence: "https://diana-advisory.com/testimonials",
      status: "unverified",
      verifyCount: 0,
      disputeCount: 0,
    },
    // Eve
    {
      ownerAlienId: "alien_0x2e7b9a6d5c",
      credentialType: "certification",
      claim: "OSCP (Offensive Security Certified Professional)",
      evidence: "https://credential.net/eve-oscp",
      status: "peer-verified",
      verifyCount: 4,
      disputeCount: 0,
      aiConfidence: 94,
      aiReasoning: "Credential verification URL is valid. Multiple security professionals vouched.",
    },
    {
      ownerAlienId: "alien_0x2e7b9a6d5c",
      credentialType: "experience",
      claim: "Bug Bounty Hunter (50+ reports, $120K+ earned)",
      evidence: "https://hackerone.com/eve-security",
      status: "ai-verified",
      verifyCount: 2,
      disputeCount: 0,
      aiConfidence: 97,
      aiReasoning: "HackerOne profile is public and shows extensive bug bounty history with verified payouts.",
    },
  ];

  for (const cred of demoCredentials) {
    await db.insert(schema.credentials).values(cred).onConflictDoNothing();
  }
  console.log("  Credentials seeded (12)");

  // Seed credential vouches for peer-verified credentials
  const credsResult = await db.query.credentials.findMany();
  const peerVerified = credsResult.filter((c) => c.status === "peer-verified");
  const vouchData: { credentialId: string; voucherAlienId: string; vouchType: string; comment: string }[] = [];

  for (const cred of peerVerified) {
    // Get 2-3 other users to vouch
    const otherUsers = DEMO_USERS.filter((u) => u.alienId !== cred.ownerAlienId).slice(0, 3);
    for (const user of otherUsers) {
      vouchData.push({
        credentialId: cred.id,
        voucherAlienId: user.alienId,
        vouchType: "verify",
        comment: "Confirmed. I can vouch for this.",
      });
    }
  }

  for (const vouch of vouchData) {
    await db.insert(schema.credentialVouches).values(vouch).onConflictDoNothing();
  }
  console.log(`  Credential vouches seeded (${vouchData.length})`);

  // ── Agent Logs (8 entries) ──
  const demoAgentLogs = [
    {
      userAlienId: "alien_0x7a3f9b2c1d",
      action: "Community AI: Weekly Digest",
      input: "Generate weekly community activity summary",
      output: "23 new verified humans joined. Top skill: Safe JSON Parser. 3 upcoming events.",
      model: "claude-sonnet-4-5",
      provider: "anthropic",
      durationMs: 342,
      createdAt: hoursAgo(1),
    },
    {
      userAlienId: "alien_0x8b4e6d3a2f",
      action: "Greptile: Code Review",
      input: "Review Solana program for reentrancy vulnerabilities",
      output: "Found 1 critical issue: unchecked CPI call in withdraw function. Recommended fix: add signer verification.",
      model: "gpt-4o",
      provider: "openai",
      durationMs: 567,
      createdAt: hoursAgo(4),
    },
    {
      userAlienId: "alien_0x2e7b9a6d5c",
      action: "ProxLock: Security Scan",
      input: "Scan listing #3 for malicious content",
      output: "LOW risk. No obfuscated code. No external network calls. Safe to interact with.",
      model: "claude-sonnet-4-5",
      provider: "anthropic",
      durationMs: 210,
      createdAt: hoursAgo(8),
    },
    {
      userAlienId: "alien_0x9c5f7e4b3a",
      action: "Kalibr: Market Analysis",
      input: "Analyze ALIEN token market trends this week",
      output: "Volume up 34%. Dev services dominate (42%). Average listing price: 47 USDC. Bullish trend.",
      model: "gpt-4o",
      provider: "openai",
      durationMs: 489,
      createdAt: hoursAgo(12),
    },
    {
      userAlienId: "alien_0x1d6a8f5c4b",
      action: "Community AI: Event Recommendation",
      input: "Suggest relevant events for a startup founder",
      output: "Recommended: ESI Pitch Day (high match for founder profile) and ACCELR8 Founders Dinner.",
      model: "claude-sonnet-4-5",
      provider: "anthropic",
      durationMs: 278,
      createdAt: hoursAgo(18),
    },
    {
      userAlienId: "alien_0x8b4e6d3a2f",
      action: "Greptile: Dependency Audit",
      input: "Audit npm dependencies for known vulnerabilities",
      output: "All 47 dependencies clean. No known CVEs. Last audit: 2 hours ago.",
      model: "claude-sonnet-4-5",
      provider: "anthropic",
      durationMs: 445,
      createdAt: hoursAgo(24),
    },
    {
      userAlienId: "alien_0x2e7b9a6d5c",
      action: "ProxLock: API Endpoint Test",
      input: "Test /api/listings for injection vulnerabilities",
      output: "No SQL injection vectors found. Input validation via Zod is effective. Rate limiting recommended.",
      model: "gpt-4o",
      provider: "openai",
      durationMs: 632,
      createdAt: hoursAgo(30),
    },
    {
      userAlienId: "alien_0x9c5f7e4b3a",
      action: "Kalibr: Skill Quality Analysis",
      input: "Evaluate code quality of recently shared skills",
      output: "4 skills analyzed. Average Muzzle score: 96/100. All LOW risk. TypeScript skills have best coverage.",
      model: "claude-sonnet-4-5",
      provider: "anthropic",
      durationMs: 380,
      createdAt: hoursAgo(36),
    },
  ];

  for (const log of demoAgentLogs) {
    await db.insert(schema.agentLogs).values(log).onConflictDoNothing();
  }
  console.log("  Agent logs seeded (8)");

  console.log("\nDone! Black Dog Registry is fully populated.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
