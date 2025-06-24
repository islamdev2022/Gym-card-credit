import { type NextRequest, NextResponse } from "next/server"
import { connectDB, User } from "@/lib/mongodb"

export async function GET() {
  try {
    await connectDB()
    const users = await User.find({}).sort({ createdAt: -1 })
    return NextResponse.json(users)
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, rfidUid, credit } = await request.json()

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: "Valid name is required" }, { status: 400 })
    }

    if (!rfidUid || typeof rfidUid !== 'string' || rfidUid.trim().length === 0) {
      return NextResponse.json({ error: "Valid RFID UID is required" }, { status: 400 })
    }

    const cleanName = name.trim()
    const cleanRfidUid = rfidUid.trim()
    const userCredit = typeof credit === 'number' && credit >= 0 ? credit : 0

    console.log(`[USER CREATE] Name: ${cleanName}, UID: ${cleanRfidUid}, Credit: ${userCredit}`)

    await connectDB()

    // Check if RFID UID already exists
    const existingUser = await User.findOne({ rfidUid: cleanRfidUid })
    if (existingUser) {
      return NextResponse.json({ 
        error: "This card is already registered",
        existingUser: {
          name: existingUser.name,
          rfidUid: existingUser.rfidUid
        }
      }, { status: 400 })
    }

    // Check if name already exists (optional - remove if you want to allow duplicate names)
    const existingName = await User.findOne({ name: cleanName })
    if (existingName) {
      return NextResponse.json({ 
        error: "This name is already registered",
        existingUser: {
          name: existingName.name,
          rfidUid: existingName.rfidUid
        }
      }, { status: 400 })
    }

    const user = new User({
      name: cleanName,
      rfidUid: cleanRfidUid,
      credit: userCredit,
      lastScan: new Date(),
      createdAt: new Date(),
    })

    await user.save()

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        rfidUid: user.rfidUid,
        credit: user.credit,
        lastScan: user.lastScan,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error("Failed to create user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { rfidUid } = await request.json()

    if (!rfidUid) {
      return NextResponse.json({ error: "RFID UID is required" }, { status: 400 })
    }

    await connectDB()

    const deletedUser = await User.findOneAndDelete({ rfidUid })

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
      deletedUser: {
        _id: deletedUser._id,
        name: deletedUser.name,
        rfidUid: deletedUser.rfidUid,
      },
    })
  } catch (error) {
    console.error("Failed to delete user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
