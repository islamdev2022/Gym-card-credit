import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
// import { seedDemoData } from "@/lib/mongodb"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Smart Gym Access System",
  description: "RFID-based gym membership management system",
}

// Seed demo data on app start
// seedDemoData().catch(console.error)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
