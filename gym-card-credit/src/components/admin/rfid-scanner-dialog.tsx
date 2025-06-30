"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
            <Button variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200">
              <Search className="w-4 h-4 mr-2 text-blue-600" />
              <span className="font-medium text-blue-700">Scan Card</span>
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-5xl bg-gradient-to-br from-slate-50 via-white to-blue-50 border-0 shadow-2xl">
          <DialogHeader className="">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Scan className="w-6 h-6 text-white" />
              </div>
              RFID Card Scanner
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 shadow-sm">
                <XCircle className="h-5 w-5" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {!scannedUser ? (
              <div className="space-y-8">
                {/* Enhanced Scanner Section */}
                <div className="text-center px-6">
                  <div
                    className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 shadow-xl ${
                      isScanning 
                        ? "bg-gradient-to-br from-blue-400 to-indigo-500 animate-pulse shadow-blue-300/50" 
                        : "bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300"
                    }`}
                  >
                    <Scan className={`w-16 h-16 transition-all duration-300 ${
                      isScanning ? "text-white scale-110" : "text-gray-500"
                    }`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {isScanning ? "Scanning for RFID Card..." : "Ready to Scan"}
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto leading-relaxed">
                    {isScanning ? "Hold the RFID card close to the scanner and wait for detection" : "Click the button below to start scanning for RFID cards"}
                  </p>

                  {!isScanning ? (
                    <Button 
                      onClick={startScanning} 
                      className="mb-6 px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      <Scan className="w-5 h-5 mr-3" />
                      Start Scanning
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={stopScanning}
                      className="mb-6 px-8 py-3 text-lg font-semibold border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      Stop Scanning
                    </Button>
                  )}
                </div>

                {/* Enhanced Manual Input Section */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-blue-600" />
                      Manual User Lookup
                    </h4>
                    <div className="flex gap-3">
                      <Input
                        placeholder="Enter user name..."
                        value={manualUid}
                        onChange={(e) => setManualUid(e.target.value)}
                        className="flex-1 h-12 text-lg border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-gray-50 focus:bg-white transition-all duration-200"
                        autoFocus
                      />
                      <Button 
                        onClick={() => handleManualLookup(manualUid)}
                        className="h-12 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Search className="w-5 h-5 mr-2" />
                        Lookup
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Enhanced User Information Display */
              <div className="space-y-6">
                <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription className="font-medium text-green-800">User found successfully!</AlertDescription>
                </Alert>

                <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50 overflow-hidden py-0">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-1">
                    <CardTitle className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                        <UserIcon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-1">{scannedUser.name}</h3>
                        <div>
                          <p className="font-mono text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">{scannedUser._id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm text-blue-200 text-center">Member Since</p>
                          <p className="text-white font-semibold">{new Date(scannedUser.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 p-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                            <CreditCard className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 ">RFID Card ID</p>
                            <p className="font-mono text-xl font-bold text-gray-800">{scannedUser.rfidUid}</p>
                          </div>
                        </div>
                      </div>

                        <div className="flex items-center gap-4 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                            <CreditCard className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 ">Available Credit</p>
                            <p className="text-xl font-bold text-gray-800">
                              {scannedUser.credit >= 0 ? (
                                <span className="text-green-600">{scannedUser.credit} Credits</span>
                              ) : (
                                <span className="text-red-600">{Math.abs(scannedUser.credit)} (Overdrawn)</span>
                              )}
                            </p>
                          </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-1 border border-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Search className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-800">Recent Scans</h4>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {scannedUser.scans?.slice(-5).map((date, index) => (
                            <div key={index} className="text-sm bg-white rounded-lg px-3 py-2 shadow-sm border border-blue-100">
                              {new Date(date).toLocaleString()}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-1 border border-green-100">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-800">Recent Top-Ups</h4>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {scannedUser.topUps?.slice(-5).map((topUp, index) => (
                            <div key={index} className="text-sm bg-white rounded-lg px-3 py-2 shadow-sm border border-green-100">
                              <span className="font-semibold text-green-600">{topUp.amount} credits</span> on {new Date(topUp.date).toLocaleString()}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4 justify-between items-center pt-4">
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Trash2 className="w-5 h-5" />
                    {isDeleting ? "Deleting..." : "Delete User"}
                  </Button>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={resetDialog}
                      className="px-6 py-3 border-2 border-gray-300 hover:border-blue-400 bg-white hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      Scan Another Card
                    </Button>
                    <Button 
                      onClick={() => setIsOpen(false)}
                      className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Confirmation Dialog */}
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