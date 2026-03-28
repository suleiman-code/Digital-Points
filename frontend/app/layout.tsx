import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ServiceHub - Find & Book Services",
  description: "Discover trusted service providers and book services instantly",
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white">
        {children}
      </body>
    </html>
  )
}
