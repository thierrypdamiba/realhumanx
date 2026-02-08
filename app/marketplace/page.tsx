"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ShieldAlert, ShieldX, Eye, Search } from "lucide-react";
import { InlineBadge } from "@/features/muzzle/components/safety-badge";
import Link from "next/link";
import { useState } from "react";

const CATEGORIES = ["all", "services", "digital", "physical", "creative", "dev", "education", "other"];

export default function MarketplacePage() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings"],
    queryFn: async () => {
      const res = await fetch("/api/listings");
      const json = await res.json();
      return json.data || [];
    },
  });

  type ListingItem = {
    id: string;
    title: string;
    description: string;
    price: string;
    token: string;
    category: string;
    sellerAlienId: string;
    viewCount: number;
    aiGenerated: boolean;
    tags: string[] | null;
    clawshieldBand: string | null;
    clawshieldScore: number | null;
    createdAt: string;
  };

  const filtered = (listings || []).filter((l: ListingItem) => {
    const matchCategory = category === "all" || l.category === category;
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <>
      <div className="animate-slide-up pt-4">
        <h1 className="text-xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-xs text-text-muted">Every seller is a verified human</p>
      </div>

      {/* Search */}
      <div className="animate-slide-up relative" style={{ animationDelay: "0.05s" }}>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
        <input
          type="text"
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 pl-9 pr-4 text-sm placeholder:text-text-dim focus:border-accent focus:outline-none"
        />
      </div>

      {/* Categories */}
      <div className="animate-slide-up -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide" style={{ animationDelay: "0.1s" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all ${
              category === cat
                ? "bg-accent text-white"
                : "bg-surface-raised text-text-muted hover:text-foreground"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Listings */}
      <div className="animate-slide-up space-y-3" style={{ animationDelay: "0.15s" }}>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer-bg h-24 rounded-xl border border-border-subtle bg-surface" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((listing: ListingItem, idx: number) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              className="card-hover block rounded-xl border border-border-subtle bg-surface p-4 animate-slide-up"
              style={{ animationDelay: `${0.15 + idx * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{listing.title}</h3>
                    {listing.aiGenerated && (
                      <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium text-accent-light">AI</span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-text-muted">{listing.description}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-success" />
                      <span className="text-[10px] text-text-dim">{listing.sellerAlienId.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye size={12} className="text-text-dim" />
                      <span className="text-[10px] text-text-dim">{listing.viewCount}</span>
                    </div>
                    <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] text-text-dim">{listing.category}</span>
                    {listing.clawshieldBand ? (
                      <InlineBadge riskBand={listing.clawshieldBand as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"} score={listing.clawshieldScore || 0} />
                    ) : null}
                  </div>
                </div>
                <div className="ml-3 text-right">
                  <p className="text-sm font-bold text-accent">{listing.price}</p>
                  <p className="text-[10px] text-text-dim">{listing.token}</p>
                </div>
              </div>
              {listing.tags && listing.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {listing.tags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="rounded-md bg-surface-raised px-1.5 py-0.5 text-[9px] text-text-dim">{tag}</span>
                  ))}
                </div>
              )}
            </Link>
          ))
        ) : (
          <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center">
            <p className="text-sm text-text-muted">No listings found</p>
            <Link href="/create" className="mt-2 inline-block text-xs font-semibold text-accent">Create the first one</Link>
          </div>
        )}
      </div>
    </>
  );
}
