import { type NextRequest, NextResponse } from "next/server"
import { connectDB, User } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid } = body

    // Validate UID
    if (!uid || typeof uid !== "string" || uid.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid UID is required",
        },
        { status: 400 },
      )
    }

    const cleanUid = uid.trim()
    console.log(`[SCAN] Received UID: ${cleanUid}`)

    await connectDB()

    // Find user by RFID UID
    const user = await User.findOne({ rfidUid: cleanUid })

    if (!user) {
      console.log(`[SCAN] Card not found: ${cleanUid}`)
      return NextResponse.json(
        {
          success: false,
          message: "Card not registered. Please contact admin.",
        },
        { status: 200 },
      )
    }

    if (user.credit < 5) {
      console.log(`[SCAN] Insufficient credit for user: ${user.name}`)
      return NextResponse.json(
        {
          success: false,
          message: "Insufficient credit. Please top up your account.",
          user: {
            _id: user._id,
            name: user.name,
            rfidUid: user.rfidUid,
            credit: user.credit,
            lastScan: user.lastScan,
          },
        },
        { status: 200 },
      )
    }

    // Access granted - return user info without deducting credits yet
    console.log(`[SCAN] Access verification for: ${user.name}, available credit: ${user.credit}`)

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        rfidUid: user.rfidUid,
        credit: user.credit,
        scans: user.scans,
        lastScan: user.lastScan,
      },
      message: "Access granted",
    })
  } catch (error) {
    console.error("Scan error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "System error. Please try again.",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid, amount = 5 } = body

    // Validate UID
    if (!uid || typeof uid !== "string" || uid.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid UID is required",
        },
        { status: 400 },
      )
    }

    const cleanUid = uid.trim()
    console.log(`[PATCH SCAN] Received UID: ${cleanUid}, Amount to deduct: ${amount}`)

    await connectDB()

    // Find user by RFID UID
    const user = await User.findOne({ rfidUid: cleanUid })

    if (!user) {
      console.log(`[PATCH SCAN] Card not found: ${cleanUid}`)
      return NextResponse.json(
        {
          success: false,
          message: "Card not registered. Please contact admin.",
        },
        { status: 404 },
      )
    }

    if (user.credit < amount) {
      console.log(
        `[PATCH SCAN] Insufficient credit for user: ${user.name}. Required: ${amount}, Available: ${user.credit}`,
      )
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient credit. Need ${amount} credits, but only have ${user.credit}.`,
          user: {
            _id: user._id,
            name: user.name,
            rfidUid: user.rfidUid,
            credit: user.credit,
            lastScan: user.lastScan,
          },
        },
        { status: 200 },
      )
    }

    const previousCredit = user.credit
    const now = new Date()

    // Deduct credit, update last scan, and push to scans history
    user.credit -= amount
    user.lastScan = now
    user.scans.push(now)

    await user.save()

    console.log(`[PATCH SCAN] Credit deducted for: ${user.name}, Previous: ${previousCredit}, Current: ${user.credit}`)

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
      },
      message: "Credit deducted successfully",
      deductedAmount: amount,
      previousCredit,
    })
  } catch (error) {
    console.error("PATCH Scan error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "System error. Please try again.",
      },
      { status: 500 },
    )
  }
}
