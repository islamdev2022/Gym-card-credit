"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, Scan, CheckCircle, XCircle, RefreshCw, Plus } from "lucide-react"

interface User {
  _id: string
  name: string
  rfidUid: string
  credit: number
  lastScan: string
  createdAt: string
}

interface TopUpProps {
  users: User[]
  onUserUpdated: () => void
  onShowToast: (type: "success" | "error", title: string, description?: string) => void
}

export function TopUp({ users, onUserUpdated, onShowToast }: TopUpProps) {
  const [loading, setLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [scanError, setScanError] = useState("")
  const [lastScanTime, setLastScanTime] = useState(0)
  const [topupAmount, setTopupAmount] = useState(10)

  // Polling for RFID scans when scanning
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isScanning) {
      interval = setInterval(() => {
        checkForRfidScan()
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isScanning, lastScanTime])

  const checkForRfidScan = async () => {
    try {
      const response = await fetch(`/api/recent-scans?since=${lastScanTime}`)

      if (response.ok) {
        const data = await response.json()
        if (data.scans && data.scans.length > 0) {
          const latestScan = data.scans[0]
          handleRfidScan(latestScan.uid)
          setLastScanTime(Date.now())
        }
      }
    } catch (error) {
      console.error("Error checking for RFID scans:", error)
    }
  }

  const handleRfidScan = (uid: string) => {
    setScanError("")

    // Find user by RFID UID
    const user = users.find((u) => u.rfidUid === uid)
    if (user) {
      setSelectedUser(user)
      setIsScanning(false)
      onShowToast("success", "Member Found", `${user.name} - Current credit: ${user.credit}`)
    } else {
      setScanError("Card not found! This card is not registered.")
      onShowToast("error", "Card Not Found", "This RFID card is not registered in the system")
    }
  }

  const startScanning = () => {
    setIsScanning(true)
    setScanError("")
    setSelectedUser(null)
    setLastScanTime(Date.now())
  }

  const stopScanning = () => {
    setIsScanning(false)
    setScanError("")
    setSelectedUser(null)
    setTopupAmount(10)
  }

  const handleManualUidInput = (uid: string) => {
    if (uid.trim()) {
      handleRfidScan(uid.trim())
    }
  }

  const topupCredit = async () => {
    if (!selectedUser || topupAmount <= 0) return

    setLoading(true)
    try {
      const response = await fetch("/api/topup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfidUid: selectedUser.rfidUid,
          amount: topupAmount,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        onShowToast(
          "success",
          "Credit Added Successfully",
          `Added ${topupAmount} credits to ${selectedUser.name}. New total: ${result.user.credit} credits`,
        )
        onUserUpdated()
        setSelectedUser(null)
        setTopupAmount(10)
      } else {
        onShowToast("error", "Top-up Failed", result.error || "Please try again")
        setScanError(result.error || "Failed to top up credit")
      }
    } catch (error) {
      console.error("Failed to top up credit:", error)
      onShowToast("error", "Network Error", "Failed to top up credit. Please check your connection.")
      setScanError("Failed to top up credit. Please try again.")
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Top Up Credit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {scanError && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{scanError}</AlertDescription>
          </Alert>
        )}

        {!selectedUser ? (
          <div className="text-center py-8">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isScanning ? "bg-green-100 animate-pulse" : "bg-gray-100"
              }`}
            >
              <Scan className={`w-12 h-12 ${isScanning ? "text-green-600" : "text-gray-400"}`} />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {isScanning ? "Scanning for Member Card..." : "Scan Member Card"}
            </h3>
            <p className="text-gray-600 mb-6">
              {isScanning
                ? "Place the member's card near the scanner"
                : "Scan the member's card to top up their credit"}
            </p>

            {!isScanning ? (
              <div className="space-y-4">
                <Button onClick={startScanning} className="mb-4">
                  <Scan className="w-4 h-4 mr-2" />
                  Start Scanning
                </Button>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Or enter UID manually:</p>
                  <div className="flex gap-2 max-w-md mx-auto">
                    <Input
                      placeholder="Enter member's RFID UID"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleManualUidInput((e.target as HTMLInputElement).value)
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = document.querySelector(
                          'input[placeholder="Enter member\'s RFID UID"]',
                        ) as HTMLInputElement
                        if (input) handleManualUidInput(input.value)
                      }}
                    >
                      Find
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={stopScanning}>
                Cancel Scanning
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Member found: {selectedUser.name}</AlertDescription>
            </Alert>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">{selectedUser.name}</h3>
                  <p className="text-blue-700">Current Credit: {selectedUser.credit} Credits</p>
                </div>
                <Badge variant="outline">{selectedUser.rfidUid}</Badge>
              </div>
            </div>

            <div className="max-w-xs">
              <Label htmlFor="topup-amount">Credit to Add</Label>
              <Input
                id="topup-amount"
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(Number.parseInt(e.target.value) || 0)}
                min="1"
                className="mt-1"
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                New total:{" "}
                <span className="font-semibold text-green-600">{selectedUser.credit + topupAmount} visits</span>
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={topupCredit} disabled={loading || topupAmount <= 0} className="min-w-[140px]">
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {loading ? "Adding..." : `Add ${topupAmount} Credits`}
              </Button>
              <Button variant="outline" onClick={stopScanning}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
