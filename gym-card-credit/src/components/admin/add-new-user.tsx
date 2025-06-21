"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Scan, CheckCircle, XCircle, RefreshCw, Plus } from "lucide-react"

interface AddNewUserProps {
  onUserAdded: () => void
  onShowToast: (type: "success" | "error", title: string, description?: string) => void
}

export function AddNewUser({ onUserAdded, onShowToast }: AddNewUserProps) {
  const [loading, setLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedUid, setScannedUid] = useState("")
  const [scanError, setScanError] = useState("")
  const [lastScanTime, setLastScanTime] = useState(0)
  const [newUserForm, setNewUserForm] = useState({ name: "", credit: 10 })

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
    setScannedUid(uid)
    setIsScanning(false)
  }

  const startScanning = () => {
    setIsScanning(true)
    setScanError("")
    setScannedUid("")
    setLastScanTime(Date.now())
  }

  const stopScanning = () => {
    setIsScanning(false)
    setScanError("")
    setScannedUid("")
    setNewUserForm({ name: "", credit: 10 })
  }

  const handleManualUidInput = (uid: string) => {
    if (uid.trim()) {
      handleRfidScan(uid.trim())
    }
  }

  const addNewUser = async () => {
    if (!scannedUid || !newUserForm.name.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserForm.name,
          rfidUid: scannedUid,
          credit: newUserForm.credit,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        onShowToast(
          "success",
          "Member Added Successfully",
          `${newUserForm.name} has been added with ${newUserForm.credit} credits`,
        )
        onUserAdded()
        setNewUserForm({ name: "", credit: 10 })
        setScannedUid("")
      } else {
        onShowToast("error", "Failed to Add Member", result.error || "Please try again")
        setScanError(result.error || "Failed to add user")
      }
    } catch (error) {
      console.error("Failed to add user:", error)
      onShowToast("error", "Network Error", "Failed to add user. Please check your connection.")
      setScanError("Failed to add user. Please try again.")
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Add New Member
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {scanError && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{scanError}</AlertDescription>
          </Alert>
        )}

        {!scannedUid ? (
          <div className="text-center py-8">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isScanning ? "bg-blue-100 animate-pulse" : "bg-gray-100"
              }`}
            >
              <Scan className={`w-12 h-12 ${isScanning ? "text-blue-600" : "text-gray-400"}`} />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {isScanning ? "Scanning for RFID Card..." : "Scan RFID Card"}
            </h3>
            <p className="text-gray-600 mb-6">
              {isScanning
                ? "Place the new member's RFID card near the scanner"
                : "Click to start scanning for a new member's RFID card"}
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
                      placeholder="Enter RFID UID"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleManualUidInput((e.target as HTMLInputElement).value)
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Enter RFID UID"]') as HTMLInputElement
                        if (input) handleManualUidInput(input.value)
                      }}
                    >
                      Add
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
              <AlertDescription>
                Card scanned successfully: <code className="font-mono bg-gray-100 px-1 rounded">{scannedUid}</code>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Member Name *</Label>
                <Input
                  id="name"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter member name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="credit">Initial Credit</Label>
                <Input
                  id="credit"
                  type="number"
                  value={newUserForm.credit}
                  onChange={(e) =>
                    setNewUserForm((prev) => ({ ...prev, credit: Number.parseInt(e.target.value) || 0 }))
                  }
                  min="0"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={addNewUser} disabled={loading || !newUserForm.name.trim()} className="min-w-[120px]">
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {loading ? "Adding..." : "Add Member"}
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
