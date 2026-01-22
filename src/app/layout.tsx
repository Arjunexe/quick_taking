import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QuickTaking",
  description: "A beautiful, modern note-taking app with glassmorphic design",
  manifest: "/manifest.json",
  icons: {
    icon: "/image.png",
    apple: "/image.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QuickTaking",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {/* Noise Overlay */}
        <div className="noise-overlay" aria-hidden="true" />

        {/* Background Gradient Orbs */}
        <div
          className="fixed inset-0 overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <div className="gradient-orb orb-purple w-[600px] h-[600px] -top-48 -left-48 animate-float" />
          <div className="gradient-orb orb-blue w-[500px] h-[500px] top-1/2 -right-32 animate-float delay-300" />
          <div className="gradient-orb orb-purple w-[400px] h-[400px] bottom-0 left-1/3 animate-float delay-500" />
        </div>

        {/* Main Content */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
