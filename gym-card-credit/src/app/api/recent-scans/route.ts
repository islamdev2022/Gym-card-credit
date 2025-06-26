import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for recent scans (in production, use Redis or database)
let recentScans: Array<{ uid: string; timestamp: number }> = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const since = parseInt(searchParams.get('since') || '0')
    
    // Return scans that occurred after the 'since' timestamp
    const filteredScans = recentScans.filter(scan => scan.timestamp > since)
    
    // IMPORTANT: Remove the scans that we're returning to prevent reprocessing
    if (filteredScans.length > 0) {
      const returnedTimestamps = filteredScans.map(scan => scan.timestamp)
      recentScans = recentScans.filter(scan => !returnedTimestamps.includes(scan.timestamp))
    }
    
    return NextResponse.json({
      scans: filteredScans.map(scan => ({
        uid: scan.uid,
        timestamp: scan.timestamp
      }))
    })
  } catch (error) {
    console.error("Recent scans error:", error)
    return NextResponse.json({ error: "Failed to fetch recent scans" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json()
    
    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 })
    }
    
    // Add scan to recent scans
    const scan = {
      uid: uid.trim(),
      timestamp: Date.now()
    }
    
    recentScans.push(scan)
    
    // Keep only last 50 scans to prevent memory issues
    if (recentScans.length > 50) {
      recentScans = recentScans.slice(-50)
    }
    
    console.log(`[RECENT SCAN] Added: ${scan.uid} at ${scan.timestamp}`)
    
    return NextResponse.json({ success: true, scan })
  } catch (error) {
    console.error("Add recent scan error:", error)
    return NextResponse.json({ error: "Failed to add recent scan" }, { status: 500 })
  }
}