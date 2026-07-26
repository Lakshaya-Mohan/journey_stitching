import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JourneyIQ | Customer Intelligence Platform",
  description: "AI-Powered Cross-Channel Customer Journey Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} antialiased`}
      >
        <div className="flex min-h-screen w-full flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
