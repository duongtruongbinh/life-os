// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { FramerMotionProvider } from "@/components/providers/framer-motion-provider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const APP_NAME = "Life OS";
const APP_DESCRIPTION = "Track sleep, habits, tasks, and push-ups";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),

  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: "%s | Life OS",
  },
  description: APP_DESCRIPTION,

  keywords: ["Life OS", "Habits", "Tasks", "Sleep", "Fitness", "Push-ups", "Productivity"],
  authors: [{ name: "Life OS" }],
  creator: "Life OS",
  publisher: "Life OS",

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },

  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Life OS" }],
  },

  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ["/og.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b1220",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-w-0 overflow-x-hidden antialiased`}>
        <FramerMotionProvider>
          {children}
          <Toaster richColors position="top-center" />
        </FramerMotionProvider>
      </body>
    </html>
  );
}
