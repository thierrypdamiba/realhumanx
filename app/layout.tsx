import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { TabBar } from "@/features/navigation/components/tab-bar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Black Dog Registry",
  description: "Verified humans. Audited agents. Trust on-chain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Script
          id="alien-bridge-ready"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var sent = false;
                var log = [];
                var msg = JSON.stringify({ type: "method", name: "app:ready", payload: {} });

                function trySend() {
                  if (sent) return true;
                  try {
                    var b = window.__miniAppsBridge__;
                    if (b && typeof b.postMessage === "function") {
                      b.postMessage(msg);
                      sent = true;
                      log.push("SENT via __miniAppsBridge__");
                      return true;
                    }
                  } catch(e) { log.push("ERR bridge: " + e.message); }
                  try {
                    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.miniAppsBridge) {
                      window.webkit.messageHandlers.miniAppsBridge.postMessage(msg);
                      sent = true;
                      log.push("SENT via webkit messageHandler");
                      return true;
                    }
                  } catch(e) { log.push("ERR webkit: " + e.message); }
                  return false;
                }

                // Detect what globals exist
                function detect() {
                  var found = [];
                  if (window.__miniAppsBridge__) found.push("__miniAppsBridge__");
                  if (window.__ALIEN_AUTH_TOKEN__ !== undefined) found.push("__ALIEN_AUTH_TOKEN__");
                  if (window.__ALIEN_CONTRACT_VERSION__) found.push("__ALIEN_CONTRACT_VERSION__");
                  if (window.__ALIEN_PLATFORM__) found.push("__ALIEN_PLATFORM__");
                  if (window.webkit && window.webkit.messageHandlers) found.push("webkit.messageHandlers");
                  return found;
                }

                trySend();
                var attempts = 0;
                var iv = setInterval(function() {
                  trySend();
                  attempts++;
                  if (sent || attempts > 200) {
                    clearInterval(iv);
                    // Store debug info for the React debug panel
                    window.__ALIEN_BRIDGE_DEBUG__ = {
                      sent: sent,
                      attempts: attempts,
                      globals: detect(),
                      log: log
                    };
                  }
                }, 50);
              })();
            `,
          }}
        />
        <Providers>
          <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 pb-24 pt-safe-top">
            {children}
          </main>
          <TabBar />
        </Providers>
      </body>
    </html>
  );
}
