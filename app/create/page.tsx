"use client";

import { useAlien } from "@alien_org/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, PenLine, ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const CATEGORIES = ["services", "digital", "physical", "creative", "dev", "education", "other"];

export default function CreatePage() {
  const { authToken, isBridgeAvailable } = useAlien();
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "manual" | "ai">("choose");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("services");
  const [price, setPrice] = useState("");
  const [token, setToken] = useState("USDC");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [requiredCreds, setRequiredCreds] = useState("");

  const generateWithAI = async () => {
    if (!authToken || !aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ action: "generate-listing", input: aiPrompt }),
      });
      const json = await res.json();
      const content = json.data?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          setTitle(parsed.title || "");
          setDescription(parsed.description || "");
          setCategory(parsed.category || "services");
          setPrice(parsed.price || "");
          setTags((parsed.tags || []).join(", "));
          setMode("manual");
          toast.success("AI generated your listing!");
        } catch {
          setDescription(content);
          setMode("manual");
          toast.success("AI response ready. Edit as needed.");
        }
      }
    } catch {
      toast.error("AI agent unavailable");
    }
    setAiLoading(false);
  };

  const submitListing = async () => {
    if (!authToken) {
      toast.error("Please open in Alien app");
      return;
    }
    if (!title.trim() || !description.trim() || !price.trim()) {
      toast.error("Fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          price: price.trim(),
          token,
          network: token === "ALIEN" ? "alien" : "solana",
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          isAnonymous,
          requiredCredentials: requiredCreds.split(",").map((c) => c.trim()).filter(Boolean),
        }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
      } else {
        toast.success("Listing created!");
        router.push("/marketplace");
      }
    } catch {
      toast.error("Failed to create listing");
    }
    setSubmitting(false);
  };

  if (mode === "choose") {
    return (
      <>
        <div className="animate-slide-up pt-4">
          <h1 className="text-xl font-bold tracking-tight">Create Listing</h1>
          <p className="text-xs text-text-muted">Choose how to create your listing</p>
        </div>

        <div className="animate-slide-up space-y-3" style={{ animationDelay: "0.1s" }}>
          <button
            onClick={() => setMode("ai")}
            className="card-hover gradient-border w-full rounded-xl bg-surface p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
                <Sparkles size={22} className="text-accent-light" />
              </div>
              <div>
                <p className="font-semibold">AI-Powered</p>
                <p className="text-xs text-text-muted">Describe what you offer and let AI craft the listing</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode("manual")}
            className="card-hover w-full rounded-xl border border-border-subtle bg-surface p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-raised">
                <PenLine size={22} className="text-text-muted" />
              </div>
              <div>
                <p className="font-semibold">Manual</p>
                <p className="text-xs text-text-muted">Write your listing from scratch</p>
              </div>
            </div>
          </button>
        </div>
      </>
    );
  }

  if (mode === "ai") {
    return (
      <>
        <div className="animate-slide-up flex items-center gap-3 pt-4">
          <button onClick={() => setMode("choose")} className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Create</h1>
            <p className="text-xs text-text-muted">Describe what you want to sell or offer</p>
          </div>
        </div>

        <div className="animate-slide-up space-y-4" style={{ animationDelay: "0.1s" }}>
          <div className="gradient-border rounded-xl bg-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-accent glow-pulse" />
              <span className="text-xs font-medium text-accent-light">AI Agent</span>
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="I'm a freelance logo designer with 5 years experience. I create modern, minimal brand identities..."
              rows={4}
              className="w-full rounded-lg border border-border-subtle bg-surface-raised p-3 text-sm placeholder:text-text-dim focus:border-accent focus:outline-none"
            />
            <button
              onClick={generateWithAI}
              disabled={aiLoading || !aiPrompt.trim() || !authToken}
              className="mt-3 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-dim active:scale-95 disabled:opacity-50"
            >
              {aiLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={14} className="animate-spin" />
                  Generating...
                </span>
              ) : (
                "Generate Listing with AI"
              )}
            </button>
          </div>

          {!isBridgeAvailable && (
            <p className="text-center text-xs text-text-dim">
              Open in Alien app to enable AI features
            </p>
          )}
        </div>
      </>
    );
  }

  // Manual mode (also used after AI generation)
  return (
    <>
      <div className="animate-slide-up flex items-center gap-3 pt-4">
        <button onClick={() => setMode("choose")} className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Create Listing</h1>
          <p className="text-xs text-text-muted">Fill in the details</p>
        </div>
      </div>

      <div className="animate-slide-up space-y-4" style={{ animationDelay: "0.1s" }}>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-dim">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Professional Logo Design"
            className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 px-3 text-sm placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-dim">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you're offering..."
            rows={3}
            className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 px-3 text-sm placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-dim">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  category === cat ? "bg-accent text-white" : "bg-surface-raised text-text-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-dim">Price *</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="10.00"
              type="number"
              step="0.01"
              className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 px-3 text-sm placeholder:text-text-dim focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-dim">Token</label>
            <div className="flex gap-2">
              {["USDC", "ALIEN", "SOL"].map((t) => (
                <button
                  key={t}
                  onClick={() => setToken(t)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-medium transition-all ${
                    token === t ? "bg-accent text-white" : "bg-surface-raised text-text-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-dim">Tags (comma separated)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="design, logo, branding"
            className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 px-3 text-sm placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
        </div>

        {/* Required credentials for responders */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-dim">Required Credentials (comma separated, optional)</label>
          <input
            value={requiredCreds}
            onChange={(e) => setRequiredCreds(e.target.value)}
            placeholder="PhD Mathematics, 5+ years experience, Solana certified"
            className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 px-3 text-sm placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
          <p className="mt-1 text-[10px] text-text-dim">
            Only verified humans with matching credentials can respond to this listing.
          </p>
        </div>

        {/* Identity options */}
        <div className="rounded-xl border border-border-subtle bg-surface p-4 space-y-3">
          <h3 className="text-xs font-semibold text-text-dim">Identity Options</h3>
          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex w-full items-center justify-between rounded-lg p-3 transition-all ${
              isAnonymous ? "bg-accent/10 border border-accent/30" : "bg-surface-raised"
            }`}
          >
            <div>
              <p className="text-xs font-medium">{isAnonymous ? "Anonymous Mode" : "Public Identity"}</p>
              <p className="text-[10px] text-text-dim">
                {isAnonymous
                  ? "Listed as 'Verified Human'. Your Alien ID is hidden publicly but tracked for accountability."
                  : "Your Alien ID is visible to buyers. Builds trust through transparency."}
              </p>
            </div>
            <div className={`h-5 w-9 rounded-full transition-colors ${isAnonymous ? "bg-accent" : "bg-surface-hover"}`}>
              <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${isAnonymous ? "translate-x-4" : ""}`} />
            </div>
          </button>
        </div>

        <button
          onClick={submitListing}
          disabled={submitting || !title.trim() || !price.trim()}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-dim active:scale-95 disabled:opacity-50"
        >
          {submitting ? "Publishing..." : "Publish Listing"}
        </button>
      </div>
    </>
  );
}
