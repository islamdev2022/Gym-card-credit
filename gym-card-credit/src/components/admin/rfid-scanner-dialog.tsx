"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Scan, UserIcon, CreditCard, Clock, CheckCircle, XCircle, Search, Trash2 } from "lucide-react"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { User } from "@/types"

interface RfidScannerDialogProps {
  trigger?: React.ReactNode
  onUserDeleted?: () => void
  onShowToast?: (type: "success" | "error", title: string, description?: string) => void
}

export function RfidScannerDialog({ trigger, onUserDeleted, onShowToast }: RfidScannerDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedUser, setScannedUser] = useState<User | null>(null)
  const [error, setError] = useState("")
  const [lastScanTimestamp, setLastScanTimestamp] = useState(0)
  const [manualUid, setManualUid] = useState("")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Poll for new scans when scanning is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isScanning && isOpen) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/recent-scans?since=${lastScanTimestamp}`)
          if (response.ok) {
            const data = await response.json()

            if (data.scans && data.scans.length > 0) {
              const latestScan = data.scans[data.scans.length - 1]
              setLastScanTimestamp(latestScan.timestamp)
              await lookupUser(latestScan.uid)
            }
          }
        } catch (error) {
          console.error("Polling error:", error)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isScanning, isOpen, lastScanTimestamp])

  const lookupUser = async (uid: string) => {
    try {
      setError("")
      const response = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfidUid: uid }),
      })

      const result = await response.json()

      if (response.ok) {
        setScannedUser(result.user)
        setIsScanning(false)
      } else {
        setError(result.error || "User not found")
        setScannedUser(null)
      }
    } catch (error) {
      console.error("Lookup error:", error)
      setError("Failed to lookup user")
      setScannedUser(null)
    }
  }

  const startScanning = () => {
    setIsScanning(true)
    setScannedUser(null)
    setError("")
    setLastScanTimestamp(Date.now())
  }

  const stopScanning = () => {
    setIsScanning(false)
  }

  const handleManualLookup = async (manualUid: string) => {
    try {
      setError("")
      const response = await fetch(`/api/user?name=${manualUid}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      const result = await response.json()

      if (response.ok) {
        setScannedUser(result.user)
        setIsScanning(false)
      } else {
        setError(result.error || "User not found")
        setScannedUser(null)
      }
    } catch (error) {
      console.error("Lookup error:", error)
      setError("Failed to lookup user")
      setScannedUser(null)
    }
  }

  const deleteUser = async () => {
    if (!scannedUser) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rfidUid: scannedUser.rfidUid,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (onShowToast) {
          onShowToast("success", "User Deleted", `${scannedUser.name} has been successfully removed from the system`)
        }
        if (onUserDeleted) {
          onUserDeleted()
        }
        // Reset the dialog after successful deletion
        resetDialog()
      } else {
        if (onShowToast) {
          onShowToast("error", "Delete Failed", data.error || "Failed to delete user")
        }
      }
    } catch (error) {
      console.error("Network error:", error)
      if (onShowToast) {
        onShowToast("error", "Network Error", "Failed to connect to server")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true)
  }

  const resetDialog = () => {
    setIsScanning(false)
    setScannedUser(null)
    setError("")
    setManualUid("")
    setLastScanTimestamp(0)
    setDeleteConfirmOpen(false)
    setIsDeleting(false)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      resetDialog()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Scan Card
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5" />
              RFID Card Scanner
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!scannedUser ? (
              <div className="space-y-6">
                {/* Scanner Section */}
                <div className="text-center py-8">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      isScanning ? "bg-blue-100 animate-pulse" : "bg-gray-100"
                    }`}
                  >
                    <Scan className={`w-10 h-10 ${isScanning ? "text-blue-600" : "text-gray-400"}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isScanning ? "Scanning for RFID Card..." : "Ready to Scan"}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {isScanning ? "Place the RFID card near the scanner" : "Click to start scanning for RFID cards"}
                  </p>

                  {!isScanning ? (
                    <Button onClick={startScanning} className="mb-4">
                      <Scan className="w-4 h-4 mr-2" />
                      Start Scanning
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={stopScanning}>
                      Stop Scanning
                    </Button>
                  )}
                </div>

                {/* Manual Input Section */}
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Or enter the USER name</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter Name"
                      value={manualUid}
                      onChange={(e) => setManualUid(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button onClick={() => handleManualLookup(manualUid)}>
                      <Search className="w-4 h-4 mr-2" />
                      Lookup
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* User Information Display */
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>User found successfully!</AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{scannedUser.name}</h3>
                        <p className="text-sm text-gray-600">Member Information</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Member Since</p>
                          <p className="text-sm">{new Date(scannedUser.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-600">RFID Card ID</p>
                            <p className="font-mono text-lg">{scannedUser.rfidUid}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <UserIcon className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-600">Member ID</p>
                            <p className="font-mono text-sm">{scannedUser._id}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-600">Available Credit</p>
                            <Badge
                              variant={
                                scannedUser.credit > 10 ? "default" : scannedUser.credit > 0 ? "secondary" : "destructive"
                              }
                              className="text-lg px-3 py-1"
                            >
                              {scannedUser.credit} credits
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-600">Last Scan</p>
                            <p className="text-sm">{new Date(scannedUser.lastScan).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3 mt-2">
                        <Search className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Recent Scans</p>
                          <ul className="list-disc pl-5">
                            {scannedUser.scans?.slice(-5).map((date, index) => (
                              <li key={index} className="text-sm">
                                l{new Date(date).toLocaleString()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Search className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Recent Top-Ups</p>
                          <ul className="list-disc pl-5">
                            {scannedUser.topUps?.slice(-5).map((topUp, index) => (
                              <li key={index} className="text-sm">
                                {topUp.amount} credits on {new Date(topUp.date).toLocaleString()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 justify-between">
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? "Deleting..." : "Delete User"}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetDialog}>
                      Scan Another Card
                    </Button>
                    <Button onClick={() => setIsOpen(false)}>Close</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete User"
        description={
          scannedUser
            ? `Are you sure you want to delete ${scannedUser.name}? This action cannot be undone and will permanently remove the user from the system.`
            : "Are you sure you want to delete this user?"
        }
        confirmText="Delete User"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={deleteUser}
      />
    </>
  )
}