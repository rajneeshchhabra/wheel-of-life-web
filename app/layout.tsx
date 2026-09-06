import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Wheel of Life",
  description: "Your life, as a wheel. Balance it, and the ride gets smooth.",
};

export const viewport: Viewport = {
  themeColor: "#0e0f14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-text1 antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
