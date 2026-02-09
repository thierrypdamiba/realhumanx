import type { Metadata } from "next";
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var sent = false;
                var msg = JSON.stringify({ type: "method", name: "app:ready", payload: {} });
                function trySend() {
                  if (sent) return;
                  try {
                    var b = window.__miniAppsBridge__;
                    if (b && typeof b.postMessage === "function") {
                      b.postMessage(msg);
                      sent = true;
                      return;
                    }
                  } catch(e) {}
                  try {
                    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.miniAppsBridge) {
                      window.webkit.messageHandlers.miniAppsBridge.postMessage(msg);
                      sent = true;
                      return;
                    }
                  } catch(e) {}
                  try {
                    if (window.MiniAppsBridge && typeof window.MiniAppsBridge.postMessage === "function") {
                      window.MiniAppsBridge.postMessage(msg);
                      sent = true;
                      return;
                    }
                  } catch(e) {}
                }
                // Try immediately, then poll for 5 seconds
                trySend();
                var attempts = 0;
                var iv = setInterval(function() {
                  trySend();
                  if (sent || ++attempts > 100) clearInterval(iv);
                }, 50);
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
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
