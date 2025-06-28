import { type NextRequest, NextResponse } from "next/server"
import { connectDB, User } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { rfidUid } = await request.json()

    if (!rfidUid) {
      return NextResponse.json({ error: "RFID UID is required" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ rfidUid: rfidUid.trim() })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        rfidUid: user.rfidUid,
        credit: user.credit,
        scans: user.scans,
        topUps: user.topUps,
        lastScan: user.lastScan,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error("Failed to lookup user:", error)
    return NextResponse.json({ error: "Failed to lookup user" }, { status: 500 })
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url)
        const name = searchParams.get('name')

        if (!name) {
            return NextResponse.json({ error: "Name parameter is required" }, { status: 400 })
        }

        await connectDB()

        const user = await User.findOne({ name: name.trim() })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                rfidUid: user.rfidUid,
                credit: user.credit,
                scans: user.scans,
                topUps: user.topUps,
                lastScan: user.lastScan,
                createdAt: user.createdAt,
            },
        })
    } catch (error) {
        console.error("Failed to lookup user:", error)
        return NextResponse.json({ error: "Failed to lookup user" }, { status: 500 })
    }
}
