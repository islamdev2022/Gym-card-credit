import { type NextRequest, NextResponse } from "next/server"
import { connectDB, User } from "@/lib/mongodb"

export async function PATCH(request: NextRequest) {
  try {
    const { rfidUid, amount } = await request.json()

    if (!rfidUid || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Valid RFID UID and amount are required" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ rfidUid })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const previousCredit = user.credit

    // Update credit
    user.credit += amount

    user.topUps.push({ amount, date: new Date() })

    await user.save()

    return NextResponse.json({
      success: true,
      message: `Successfully added ${amount} credits`,
      user: {
        _id: user._id,
        name: user.name,
        rfidUid: user.rfidUid,
        credit: user.credit,
        previousCredit,
        topUps: user.topUps,
      },
    })
  } catch (error) {
    console.error("Top up error:", error)
    return NextResponse.json({ error: "Failed to top up credit" }, { status: 500 })
  }
}
