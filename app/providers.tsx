"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AlienProvider, useAlien, useLaunchParams } from "@alien_org/react";
import { Toaster } from "react-hot-toast";

declare global {
  interface Window {
    __ALIEN_BRIDGE_DEBUG__?: {
      sent: boolean;
      attempts: number;
      globals: string[];
      log: string[];
    };
  }
}

function BridgeDebugPanel() {
  const { isBridgeAvailable, authToken, contractVersion } = useAlien();
  const launchParams = useLaunchParams();
  const [mounted, setMounted] = useState(false);
  const [debug, setDebug] = useState<Window["__ALIEN_BRIDGE_DEBUG__"]>(undefined);

  useEffect(() => {
    setMounted(true);
    const check = () => setDebug(window.__ALIEN_BRIDGE_DEBUG__);
    check();
    const iv = setInterval(check, 500);
    return () => clearInterval(iv);
  }, []);

  // Don't render during SSR to avoid hydration mismatch
  if (!mounted) return null;
  // Hide when bridge is working (no need to debug)
  if (isBridgeAvailable) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 99999,
      background: "rgba(0,0,0,0.9)",
      color: "#0f0",
      fontSize: "10px",
      fontFamily: "monospace",
      padding: "8px",
      maxHeight: "40vh",
      overflow: "auto",
    }}>
      <div><strong>Bridge Debug</strong></div>
      <div>bridge: {isBridgeAvailable ? "YES" : "NO"}</div>
      <div>authToken: {authToken ? authToken.slice(0, 20) + "..." : "NONE"}</div>
      <div>contract: {contractVersion || "NONE"}</div>
      <div>platform: {launchParams?.platform || "NONE"}</div>
      <div>hostVer: {launchParams?.hostAppVersion || "NONE"}</div>
      {debug && (
        <>
          <div>---inline script---</div>
          <div>sent: {debug.sent ? "YES" : "NO"} (attempts: {debug.attempts})</div>
          <div>globals: {debug.globals.length > 0 ? debug.globals.join(", ") : "NONE FOUND"}</div>
          {debug.log.map((l, i) => <div key={i}>{l}</div>)}
        </>
      )}
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AlienProvider autoReady={true}>
        <BridgeDebugPanel />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid rgba(128,128,128,0.2)",
              fontSize: "14px",
              borderRadius: "12px",
              padding: "10px 16px",
            },
          }}
        />
      </AlienProvider>
    </QueryClientProvider>
  );
}
