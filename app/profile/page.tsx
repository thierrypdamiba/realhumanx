"use client";

import { useAlien, useLaunchParams, useIsMethodSupported, useClipboard } from "@alien_org/react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Package, Bot, Copy, Check, Smartphone, Wallet, Clipboard, ArrowLeft as BackBtn } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { GitHubLink } from "@/features/github/components/github-link";
import { CredentialManager } from "@/features/credentials/components/credential-manager";

export default function ProfilePage() {
  const { authToken, isBridgeAvailable, contractVersion } = useAlien();
  const { user, loading } = useCurrentUser();
  const launchParams = useLaunchParams();
  const clipboard = useClipboard();
  const paymentSupport = useIsMethodSupported("payment:request");
  const clipboardSupport = useIsMethodSupported("clipboard:write");
  const linkSupport = useIsMethodSupported("link:open");
  const backBtnSupport = useIsMethodSupported("host.back.button:toggle");
  const [copied, setCopied] = useState(false);

  const { data: myListings } = useQuery({
    queryKey: ["my-listings"],
    queryFn: async () => {
      const res = await fetch("/api/listings");
      const json = await res.json();
      return (json.data || []).filter((l: { sellerAlienId: string }) =>
        user?.alienId && l.sellerAlienId === user.alienId,
      );
    },
    enabled: !!user?.alienId,
  });

  const copyAlienId = () => {
    if (!user?.alienId) return;
    if (clipboardSupport.supported && clipboard.supported) {
      clipboard.writeText(user.alienId);
    } else {
      navigator.clipboard?.writeText(user.alienId);
    }
    setCopied(true);
    toast.success("Alien ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-4 pt-4">
        <div className="shimmer-bg h-32 rounded-xl" />
        <div className="shimmer-bg h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* Profile Card */}
      <div className="animate-slide-up pt-4">
        <div className="relative rounded-2xl border border-border-subtle bg-surface/80 backdrop-blur-sm p-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.06] via-transparent to-success/[0.03] pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/[0.04] rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20 text-2xl">
              👽
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold truncate">
                  {user ? `${user.alienId.slice(0, 6)}...${user.alienId.slice(-4)}` : "Not connected"}
                </h1>
                {user ? (
                  <button onClick={copyAlienId} className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/[0.06] transition-all duration-200 hover:bg-white/[0.08] active:scale-90">
                    {copied ? <Check size={11} className="text-success" /> : <Copy size={11} className="text-text-dim" />}
                  </button>
                ) : null}
                {user ? (
                  <span className="shrink-0 flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 ring-1 ring-success/15">
                    <ShieldCheck size={10} className="text-success" />
                    <span className="text-[9px] font-bold text-success">Verified</span>
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                {user ? `Member since ${new Date(user.createdAt).toLocaleDateString()}` : "Open in Alien app"}
              </p>
            </div>
          </div>

          {user ? (
            <div className="relative mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/[0.03] p-3 text-center ring-1 ring-white/[0.04] transition-all duration-200 hover:bg-white/[0.05]">
                <p className="text-sm font-bold tabular-nums">{myListings?.length || 0}</p>
                <p className="text-[9px] text-text-dim font-medium mt-0.5">Listings</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3 text-center ring-1 ring-white/[0.04] transition-all duration-200 hover:bg-white/[0.05]">
                <p className={`text-sm font-bold ${user.reputationScore >= 80 ? "text-success" : "text-warning"}`}>
                  {user.reputationScore}%
                </p>
                <p className="text-[9px] text-text-dim font-medium mt-0.5">Human</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3 text-center ring-1 ring-white/[0.04] transition-all duration-200 hover:bg-white/[0.05]">
                <p className={`text-sm font-bold tabular-nums ${user.disputeCount > 0 ? "text-danger" : ""}`}>
                  {user.disputeCount}
                </p>
                <p className="text-[9px] text-text-dim font-medium mt-0.5">Disputes</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Alien SDK Features */}
      <div className="animate-slide-up rounded-2xl border border-border-subtle bg-surface/80 backdrop-blur-sm p-4" style={{ animationDelay: "0.05s" }}>
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-text-dim">Alien SDK Integration</h2>
        <div className="space-y-1.5">
          {[
            { label: "Bridge", value: isBridgeAvailable ? "Connected" : "Browser mode", active: isBridgeAvailable, icon: Smartphone },
            { label: "Contract", value: contractVersion || "N/A", active: !!contractVersion, icon: ShieldCheck },
            { label: "Auth Token", value: authToken ? "Active (JWT)" : "None", active: !!authToken, icon: ShieldCheck },
            { label: "Payments", value: paymentSupport.supported ? `v${paymentSupport.minVersion}+` : "Unavailable", active: paymentSupport.supported, icon: Wallet },
            { label: "Clipboard", value: clipboardSupport.supported ? "Ready" : "Unavailable", active: clipboardSupport.supported, icon: Clipboard },
            { label: "Link Open", value: linkSupport.supported ? "Ready" : "Unavailable", active: linkSupport.supported, icon: ShieldCheck },
            { label: "Back Button", value: backBtnSupport.supported ? "Ready" : "Unavailable", active: backBtnSupport.supported, icon: BackBtn },
            { label: "Platform", value: launchParams?.platform || "web", active: !!launchParams?.platform, icon: Smartphone },
            { label: "Deep Link", value: launchParams?.startParam || "none", active: !!launchParams?.startParam, icon: ShieldCheck },
          ].map(({ label, value, active, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between rounded-lg px-2.5 py-2 transition-all duration-200 hover:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-5 w-5 items-center justify-center rounded-md ${active ? "bg-success/10" : "bg-white/[0.03]"}`}>
                  <Icon size={11} className={active ? "text-success" : "text-text-dim"} />
                </div>
                <span className="text-xs text-text-muted">{label}</span>
              </div>
              <span className={`text-[11px] font-medium ${active ? "text-success" : "text-text-dim"}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* GitHub Identity */}
      <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <GitHubLink />
      </div>

      {/* Credentials */}
      {user ? (
        <div className="animate-slide-up" style={{ animationDelay: "0.12s" }}>
          <CredentialManager alienId={user.alienId} isOwner={true} />
        </div>
      ) : null}

      {/* My Listings */}
      <div className="animate-slide-up space-y-2.5" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-text-dim">My Listings</h2>
          <Link href="/create" className="text-[11px] font-semibold text-accent-light transition-all duration-200 hover:text-accent active:scale-95">Create new</Link>
        </div>
        {myListings && myListings.length > 0 ? (
          myListings.map((listing: { id: string; title: string; price: string; token: string; viewCount: number }) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              className="group flex items-center justify-between rounded-2xl border border-border-subtle bg-surface/80 backdrop-blur-sm p-3.5 transition-all duration-300 hover:bg-surface-hover hover:border-white/[0.08]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/15">
                  <Package size={14} className="text-accent-light" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold">{listing.title}</p>
                  <p className="text-[10px] text-text-dim tabular-nums">{listing.viewCount} views</p>
                </div>
              </div>
              <span className="text-xs font-bold text-accent tabular-nums">{listing.price} {listing.token}</span>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-border-subtle bg-surface/80 backdrop-blur-sm p-6 text-center">
            <p className="text-xs text-text-muted">No listings yet</p>
          </div>
        )}
      </div>

      {/* Powered by */}
      <div className="animate-slide-up space-y-2.5" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-text-dim">Powered By</h2>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { name: "Alien Protocol", desc: "Identity, Payments, Bridge" },
            { name: "Kalibr", desc: "Agent Routing" },
            { name: "Greptile", desc: "Code Analysis" },
            { name: "ProxLock", desc: "API Security" },
            { name: "GitHub", desc: "Developer Identity" },
            { name: "Cline", desc: "AI Coding" },
          ].map(({ name, desc }) => (
            <div key={name} className="rounded-xl border border-border-subtle bg-surface/80 p-3 transition-all duration-200 hover:bg-surface-hover">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/10">
                  <Bot size={11} className="text-accent-light" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold">{name}</p>
                  <p className="text-[9px] text-text-dim">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
