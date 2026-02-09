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
              (function ready() {
                try {
                  var b = window.__miniAppsBridge__;
                  if (b && typeof b.postMessage === "function") {
                    b.postMessage(JSON.stringify({ type: "method", name: "app:ready", payload: {} }));
                    return;
                  }
                  // Bridge not injected yet, retry until it appears
                  setTimeout(ready, 50);
                } catch(e) { setTimeout(ready, 50); }
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
