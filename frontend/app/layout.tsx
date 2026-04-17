import type { Metadata } from "next";
import { Manrope, Sora, Outfit, Orbitron } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import IgnoreExtensionErrors from "@/components/IgnoreExtensionErrors";

const logoFont = Orbitron({
  subsets: ["latin"],
  variable: "--font-logo",
  weight: ["800", "900"],
});

const headingFont = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700", "800"],
});

const outfitFont = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["800", "900"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DIGITALPOINT",
    template: "%s | DIGITALPOINT",
  },
  description: "Discover trusted local service providers and book services instantly across major US cities.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      maxSnippet: -1,
      maxImagePreview: "large",
      maxVideoPreview: -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable} ${outfitFont.variable} ${logoFont.variable} bg-white`}>
        <IgnoreExtensionErrors />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
