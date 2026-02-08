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
        <div className="gradient-border rounded-xl bg-surface p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-2xl">
              👽
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">
                  {user ? `${user.alienId.slice(0, 6)}...${user.alienId.slice(-4)}` : "Not connected"}
                </h1>
                {user ? (
                  <button onClick={copyAlienId} className="p-1">
                    {copied ? <Check size={12} className="text-success" /> : <Copy size={12} className="text-text-dim" />}
                  </button>
                ) : null}
                {user ? (
                  <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5">
                    <ShieldCheck size={10} className="text-success" />
                    <span className="text-[9px] font-semibold text-success">Verified</span>
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-text-muted">
                {user ? `Member since ${new Date(user.createdAt).toLocaleDateString()}` : "Open in Alien app"}
              </p>
            </div>
          </div>

          {user ? (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-surface-raised p-2 text-center">
                <p className="text-sm font-bold">{myListings?.length || 0}</p>
                <p className="text-[9px] text-text-dim">Listings</p>
              </div>
              <div className="rounded-lg bg-surface-raised p-2 text-center">
                <p className="text-sm font-bold">100%</p>
                <p className="text-[9px] text-text-dim">Human</p>
              </div>
              <div className="rounded-lg bg-surface-raised p-2 text-center">
                <p className="text-sm font-bold">0</p>
                <p className="text-[9px] text-text-dim">Disputes</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Alien SDK Features */}
      <div className="animate-slide-up rounded-xl border border-border-subtle bg-surface p-4" style={{ animationDelay: "0.05s" }}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-dim">Alien SDK Integration</h2>
        <div className="space-y-2">
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
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={12} className={active ? "text-success" : "text-text-dim"} />
                <span className="text-xs text-text-muted">{label}</span>
              </div>
              <span className={`text-xs font-medium ${active ? "text-success" : "text-text-dim"}`}>
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
      <div className="animate-slide-up space-y-3" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-dim">My Listings</h2>
          <Link href="/create" className="text-xs text-accent">Create new</Link>
        </div>
        {myListings && myListings.length > 0 ? (
          myListings.map((listing: { id: string; title: string; price: string; token: string; viewCount: number }) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              className="card-hover flex items-center justify-between rounded-xl border border-border-subtle bg-surface p-3"
            >
              <div className="flex items-center gap-3">
                <Package size={16} className="text-accent-light" />
                <div>
                  <p className="text-sm font-medium">{listing.title}</p>
                  <p className="text-[10px] text-text-dim">{listing.viewCount} views</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-accent">{listing.price} {listing.token}</span>
            </Link>
          ))
        ) : (
          <div className="rounded-xl border border-border-subtle bg-surface p-6 text-center">
            <p className="text-xs text-text-muted">No listings yet</p>
          </div>
        )}
      </div>

      {/* Powered by */}
      <div className="animate-slide-up space-y-2" style={{ animationDelay: "0.15s" }}>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-dim">Powered By</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "Alien Protocol", desc: "Identity, Payments, Bridge" },
            { name: "Kalibr", desc: "Agent Routing" },
            { name: "Greptile", desc: "Code Analysis" },
            { name: "ProxLock", desc: "API Security" },
            { name: "GitHub", desc: "Developer Identity" },
            { name: "Cline", desc: "AI Coding" },
          ].map(({ name, desc }) => (
            <div key={name} className="rounded-lg border border-border-subtle bg-surface p-2.5">
              <div className="flex items-center gap-2">
                <Bot size={12} className="text-accent-light" />
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
