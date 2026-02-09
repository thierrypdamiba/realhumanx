"use client";

import { useAlien } from "@alien_org/react";
import {
  Calendar, MapPin, Users, ShieldCheck, Check, Zap,
  Building2, Code2, Rocket, Coffee, Brain, Trophy,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

type EventData = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  host: string;
  hostColor: string;
  hostBg: string;
  capacity: number;
  rsvpCount: number;
  tags: string[];
  requiresVerification: boolean;
};

const HOST_ICONS: Record<string, typeof Building2> = {
  "Frontier Tower": Building2,
  "Dabl Club": Code2,
  "ESI": Rocket,
  "ACCELR8": Coffee,
  "AI Camp": Brain,
  "Red Bull": Trophy,
};

const PARTNER_NAMES = ["All", "Frontier Tower", "Dabl Club", "ESI", "ACCELR8", "AI Camp", "Red Bull"];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function EventsPage() {
  const { authToken } = useAlien();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("All");

  const { data: events = [], isLoading } = useQuery<EventData[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      const json = await res.json();
      return json.data || [];
    },
  });

  const { data: myRsvps = [] } = useQuery<string[]>({
    queryKey: ["my-rsvps"],
    queryFn: async () => {
      const res = await fetch("/api/events/rsvp", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!authToken,
  });

  const rsvpMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "RSVP failed");
      }
      return res.json();
    },
    onSuccess: (data, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["my-rsvps"] });
      const action = data.data?.action;
      if (action === "added") {
        const event = events.find((e) => e.id === eventId);
        toast.success(`RSVP confirmed for "${event?.title}"`);
      } else {
        toast.success("RSVP cancelled");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleRsvp = (event: EventData) => {
    if (!authToken) {
      toast.error("Open in Alien app to RSVP");
      return;
    }
    rsvpMutation.mutate(event.id);
  };

  const filteredEvents = activeFilter === "All"
    ? events
    : events.filter((e) => e.host === activeFilter);

  return (
    <>
      <div className="animate-slide-up relative overflow-hidden rounded-2xl border border-border-subtle bg-surface/80 backdrop-blur-sm p-5 pt-8">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.05] via-transparent to-blue-500/[0.03] pointer-events-none" />
        <div className="absolute top-0 right-0 w-28 h-28 bg-accent/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20">
            <Calendar size={20} className="text-accent-light" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Events</h1>
            <p className="mt-0.5 text-[11px] text-text-muted">
              Sybil-resistant RSVPs. One human, one spot.
            </p>
          </div>
        </div>
      </div>

      {/* Partner badges */}
      <div className="animate-slide-up -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-hide" style={{ animationDelay: "0.05s" }}>
        {PARTNER_NAMES.map((name) => (
          <button
            key={name}
            onClick={() => setActiveFilter(name)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
              activeFilter === name
                ? "bg-accent text-white ring-1 ring-accent/30 shadow-glow-accent"
                : "bg-surface-raised text-text-muted ring-1 ring-white/[0.04] hover:bg-surface-hover hover:text-text-muted"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Events list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-accent" />
        </div>
      ) : (
        <div className="animate-slide-up space-y-3" style={{ animationDelay: "0.1s" }}>
          {filteredEvents.map((event, idx) => {
            const HostIcon = HOST_ICONS[event.host] || Building2;
            const isRsvpd = myRsvps.includes(event.id);
            const spotsLeft = event.capacity - event.rsvpCount;

            return (
              <div
                key={event.id}
                className="group animate-slide-up relative rounded-2xl border border-border-subtle bg-surface/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-white/[0.08]"
                style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
              >
                <div className="p-4">
                  {/* Host badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${event.hostBg} ring-1 ring-white/[0.04]`}>
                      <HostIcon size={10} className={event.hostColor} />
                      <span className={`text-[9px] font-bold ${event.hostColor}`}>{event.host}</span>
                    </div>
                    {event.requiresVerification ? (
                      <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 ring-1 ring-success/15">
                        <ShieldCheck size={9} className="text-success" />
                        <span className="text-[8px] font-bold text-success tracking-wide">VERIFIED ONLY</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Title and description */}
                  <h3 className="text-[15px] font-bold leading-snug">{event.title}</h3>
                  <p className="mt-1.5 text-xs text-text-muted leading-relaxed">{event.description}</p>

                  {/* Details */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-3 text-[10px] text-text-dim">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={10} className="text-accent-light/60" />
                      <span>{formatDate(event.date)} at {event.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={10} className="text-accent-light/60" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={10} className="text-accent-light/60" />
                      <span className="tabular-nums">{event.rsvpCount}/{event.capacity}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {event.tags.map((tag) => (
                      <span key={tag} className="rounded-lg bg-white/[0.03] px-2 py-0.5 text-[9px] font-medium text-text-dim ring-1 ring-white/[0.04]">{tag}</span>
                    ))}
                  </div>

                  {/* RSVP */}
                  <div className="mt-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold tabular-nums ${spotsLeft < 10 ? "text-warning" : "text-text-dim"}`}>
                        {spotsLeft} spots left
                      </span>
                    </div>
                    <button
                      onClick={() => handleRsvp(event)}
                      disabled={rsvpMutation.isPending}
                      className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold transition-all duration-200 ${
                        isRsvpd
                          ? "bg-success/10 text-success ring-1 ring-success/20"
                          : "bg-gradient-to-r from-accent to-accent-dim text-white shadow-glow-accent ring-1 ring-accent/30 hover:shadow-lg active:scale-95"
                      } disabled:cursor-default disabled:opacity-60`}
                    >
                      {rsvpMutation.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isRsvpd ? (
                        <>
                          <Check size={14} />
                          RSVP'd
                        </>
                      ) : (
                        <>
                          <Zap size={14} />
                          RSVP
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Capacity bar */}
                <div className="h-1 bg-white/[0.03]">
                  <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{
                      width: `${(event.rsvpCount / event.capacity) * 100}%`,
                      background: spotsLeft < 5
                        ? "linear-gradient(90deg, #ef4444, #f87171)"
                        : spotsLeft < 15
                          ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                          : "linear-gradient(90deg, #8b5cf6, #a78bfa)",
                      boxShadow: `0 0 8px ${spotsLeft < 5 ? "#ef444440" : spotsLeft < 15 ? "#f59e0b40" : "#8b5cf640"}`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom note */}
      <div className="animate-slide-up relative rounded-2xl border border-border-subtle bg-surface/80 backdrop-blur-sm p-5 text-center overflow-hidden" style={{ animationDelay: "0.5s" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-success/[0.03] to-transparent pointer-events-none" />
        <div className="relative">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-success/10 ring-1 ring-success/15 mb-2.5">
            <ShieldCheck size={20} className="text-success" />
          </div>
          <p className="text-xs font-semibold text-text-muted">Every RSVP requires Alien verification</p>
          <p className="mt-1 text-[10px] text-text-dim">
            No bots. No duplicate sign-ups. One human, one spot.
          </p>
        </div>
      </div>
    </>
  );
}
