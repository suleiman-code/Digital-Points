import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const headingFont = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700", "800"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Digital Point | Find & Book Trusted Local Services",
    template: "%s | Digital Point",
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
      <body className={`${bodyFont.variable} ${headingFont.variable} bg-white`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
