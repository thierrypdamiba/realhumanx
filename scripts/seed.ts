#!/usr/bin/env bun

import { db, schema } from "../lib/db";

async function seed() {
  console.log("Seeding Black Dog Registry demo data...");

  // Demo users
  const demoUsers = [
    { alienId: "alien_0x7a3f9b2c1d", displayName: "Alice", bio: "Graphic designer & creative director. 5 years experience.", reputationScore: 92 },
    { alienId: "alien_0x8b4e6d3a2f", displayName: "Bob", bio: "Full-stack developer. Building the future.", reputationScore: 87 },
    { alienId: "alien_0x9c5f7e4b3a", displayName: "Charlie", bio: "AI/ML researcher. Exploring the frontier.", reputationScore: 95 },
    { alienId: "alien_0x1d6a8f5c4b", displayName: "Diana", bio: "Product manager & startup advisor.", reputationScore: 88 },
    { alienId: "alien_0x2e7b9a6d5c", displayName: "Eve", bio: "Security researcher. Web3 native.", reputationScore: 91 },
  ];

  for (const user of demoUsers) {
    await db.insert(schema.users).values(user).onConflictDoNothing();
  }
  console.log("  Users seeded");

  // Demo listings
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

  // Demo polls
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

  // Seed some votes on the first poll
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

  console.log("Done! Black Dog Registry is populated.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
