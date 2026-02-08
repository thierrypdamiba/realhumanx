"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlien, usePayment, useClipboard, useEvent, useIsMethodSupported } from "@alien_org/react";
import { ShieldCheck, Star, Bot, ArrowLeft, Eye, Clock, Copy, Check, Share2, Shield } from "lucide-react";
import { SafetyBadge, ScanButton } from "@/features/clawshield/components/safety-badge";
import type { ScanReport } from "@/features/clawshield/scanner";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { authToken } = useAlien();
  const router = useRouter();
  const queryClient = useQueryClient();
  const clipboard = useClipboard();
  const clipboardSupported = useIsMethodSupported("clipboard:write");
  const payment = usePayment({
    onPaid: (txHash) => toast.success(`Payment confirmed! TX: ${txHash.slice(0, 8)}...`),
    onCancelled: () => toast("Payment cancelled"),
    onFailed: (errorCode) => toast.error(`Payment failed: ${errorCode}`),
  });

  // Handle native back button in Alien app
  useEvent("host.back.button:clicked", () => {
    router.push("/marketplace");
  });

  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [agentRouting, setAgentRouting] = useState<{ provider: string; model: string; status: string; latencyMs?: number; reason?: string }[]>([]);
  const [agentLoading, setAgentLoading] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [copied, setCopied] = useState(false);
  const [scanReport, setScanReport] = useState<ScanReport | null>(null);

  const shareListing = () => {
    const shareUrl = `${window.location.origin}/marketplace/${id}`;
    if (clipboardSupported.supported && clipboard.supported) {
      clipboard.writeText(shareUrl);
    } else {
      navigator.clipboard?.writeText(shareUrl);
    }
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const res = await fetch(`/api/listings/${id}`);
      const json = await res.json();
      return json.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ listingId: id, rating: reviewRating, comment: reviewComment }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Review submitted!");
        setReviewComment("");
        queryClient.invalidateQueries({ queryKey: ["listing", id] });
      }
    },
  });

  const askAgent = async () => {
    if (!authToken) return;
    setAgentLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          action: "analyze-listing",
          input: `Analyze this listing: "${listing.title}" - ${listing.description}. Price: ${listing.price} ${listing.token}. Category: ${listing.category}.`,
        }),
      });
      const json = await res.json();
      setAgentResponse(json.data?.content || "Could not analyze.");
      setAgentRouting(json.data?.routingChain || []);
    } catch {
      setAgentResponse("Agent unavailable.");
    }
    setAgentLoading(false);
  };

  const handleBuy = async () => {
    if (!authToken || !listing) return;

    try {
      const invoiceRes = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ productId: `listing-${listing.id}` }),
      });
      const invoiceData = await invoiceRes.json();

      if (invoiceData.error) {
        toast.error("Could not create invoice");
        return;
      }

      await payment.pay({
        recipient: invoiceData.data?.recipient || process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || "",
        amount: listing.price,
        token: listing.token,
        network: listing.network,
        invoice: invoiceData.data?.invoice || `listing-${listing.id}`,
        item: {
          title: listing.title,
          iconUrl: "https://avatars.githubusercontent.com/u/40111175?s=40&v=4",
          quantity: 1,
        },
        test: "paid" as const,
      });
    } catch {
      toast.error("Payment error");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <div className="shimmer-bg h-8 w-48 rounded-lg" />
        <div className="shimmer-bg h-32 rounded-xl" />
        <div className="shimmer-bg h-20 rounded-xl" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="pt-4 text-center">
        <p className="text-sm text-text-muted">Listing not found</p>
        <Link href="/marketplace" className="mt-2 inline-block text-xs text-accent">Back to marketplace</Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="animate-slide-up flex items-center gap-3 pt-4">
        <Link href="/marketplace" className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="flex-1 text-lg font-bold tracking-tight">Listing Details</h1>
        <button
          onClick={shareListing}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface transition-colors hover:bg-surface-raised"
          title="Copy share link (via Alien clipboard bridge)"
        >
          {copied ? <Check size={16} className="text-success" /> : <Share2 size={16} className="text-text-muted" />}
        </button>
      </div>

      {/* Main Card */}
      <div className="animate-slide-up rounded-xl border border-border-subtle bg-surface p-5" style={{ animationDelay: "0.05s" }}>
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold">{listing.title}</h2>
          {listing.aiGenerated && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent-light">AI Generated</span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">{listing.description}</p>

        <div className="mt-4 flex items-center gap-4 text-[11px] text-text-dim">
          <div className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-success" />
            <span>{listing.sellerAlienId.slice(0, 12)}...</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye size={13} />
            <span>{listing.viewCount} views</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={13} />
            <span>{new Date(listing.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {listing.tags && listing.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {listing.tags.map((tag: string) => (
              <span key={tag} className="rounded-md bg-surface-raised px-2 py-0.5 text-[10px] text-text-dim">{tag}</span>
            ))}
          </div>
        )}

        {/* Price & Buy */}
        <div className="mt-5 flex items-center justify-between rounded-xl bg-surface-raised p-4">
          <div>
            <p className="text-2xl font-bold text-accent">{listing.price}</p>
            <p className="text-xs text-text-dim">{listing.token} on {listing.network}</p>
          </div>
          <button
            onClick={handleBuy}
            disabled={payment.isLoading}
            className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-dim active:scale-95 disabled:opacity-50"
          >
            {payment.isLoading ? "Processing..." : "Buy Now"}
          </button>
        </div>
      </div>

      {/* ClawShield Safety Scan */}
      <div className="animate-slide-up rounded-xl border border-border-subtle bg-surface p-4" style={{ animationDelay: "0.07s" }}>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-accent-light" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-dim">ClawShield Safety</h3>
          <span className="ml-auto rounded-md bg-purple-500/10 px-2 py-0.5 text-[9px] font-medium text-purple-400">OpenClaw</span>
        </div>

        {listing.clawshieldReport ? (
          <SafetyBadge report={listing.clawshieldReport as ScanReport} />
        ) : scanReport ? (
          <SafetyBadge report={scanReport} />
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] text-text-dim">
              Scan this listing for security risks: credential exposure, code injection, prompt attacks, and more.
            </p>
            <ScanButton
              content={`${listing.title}\n${listing.description}`}
              onScanComplete={setScanReport}
            />
          </div>
        )}
      </div>

      {/* AI Agent Analysis with Kalibr Routing */}
      <div className="animate-slide-up rounded-xl border border-border-subtle bg-surface p-4" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center gap-2 mb-3">
          <Bot size={16} className="text-accent-light" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-dim">AI Agent Analysis</h3>
          <span className="ml-auto rounded-md bg-blue-500/10 px-2 py-0.5 text-[9px] font-medium text-blue-400">Kalibr Routed</span>
        </div>
        {agentResponse ? (
          <div className="animate-fade-in space-y-3">
            <p className="text-sm leading-relaxed text-text-muted">{agentResponse}</p>

            {/* Kalibr Routing Chain Visualization */}
            {agentRouting.length > 0 ? (
              <div className="rounded-lg bg-surface-raised p-3">
                <p className="mb-2 text-[10px] font-semibold text-text-dim">Kalibr Routing Chain</p>
                <div className="flex items-center gap-1">
                  {agentRouting.map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                      {i > 0 ? <span className="text-[10px] text-text-dim">&rarr;</span> : null}
                      <span className={`rounded-md px-2 py-0.5 text-[9px] font-medium ${
                        step.status === "success" ? "bg-success/10 text-success" :
                        step.status === "failed" ? "bg-danger/10 text-danger" :
                        "bg-surface-hover text-text-dim"
                      }`}>
                        {step.provider}
                        {step.latencyMs ? ` (${step.latencyMs}ms)` : ""}
                        {step.status === "skipped" ? " [skip]" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <button
            onClick={askAgent}
            disabled={agentLoading || !authToken}
            className="w-full rounded-lg bg-accent/10 py-2.5 text-xs font-medium text-accent-light transition-all hover:bg-accent/20 disabled:opacity-50"
          >
            {agentLoading ? "Analyzing via Kalibr routing..." : "Ask AI Agent about this listing"}
          </button>
        )}
      </div>

      {/* Reviews */}
      <div className="animate-slide-up space-y-3" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-dim">
            Verified Reviews ({listing.reviewCount || 0})
          </h3>
          {listing.avgRating && (
            <div className="flex items-center gap-1">
              <Star size={12} className="fill-warning text-warning" />
              <span className="text-xs font-semibold">{listing.avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {listing.reviews?.map((review: { id: string; reviewerAlienId: string; rating: number; comment: string; createdAt: string }) => (
          <div key={review.id} className="rounded-xl border border-border-subtle bg-surface p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-success" />
                <span className="text-[10px] text-text-dim">{review.reviewerAlienId.slice(0, 10)}...</span>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} size={10} className="fill-warning text-warning" />
                ))}
              </div>
            </div>
            {review.comment && <p className="mt-2 text-xs text-text-muted">{review.comment}</p>}
          </div>
        ))}

        {/* Write Review */}
        {authToken && (
          <div className="rounded-xl border border-border-subtle bg-surface p-4">
            <p className="text-xs font-medium mb-2">Leave a review (one per verified human)</p>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setReviewRating(star)}>
                  <Star size={16} className={star <= reviewRating ? "fill-warning text-warning" : "text-text-dim"} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Your review..."
              rows={2}
              className="w-full rounded-lg border border-border-subtle bg-surface-raised p-2 text-xs placeholder:text-text-dim focus:border-accent focus:outline-none"
            />
            <button
              onClick={() => reviewMutation.mutate()}
              disabled={reviewMutation.isPending}
              className="mt-2 w-full rounded-lg bg-accent/10 py-2 text-xs font-medium text-accent-light hover:bg-accent/20 disabled:opacity-50"
            >
              {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
