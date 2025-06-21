"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, CreditCard, Clock, Wifi, WifiOff, AlertCircle, CheckCircle } from "lucide-react"

interface ScanResult {
  success: boolean
  user?: {
    _id: string
    name: string
    rfidUid: string
    credit: number
    lastScan: string
  }
  message: string
  deductedAmount?: number
  previousCredit?: number
}

export default function UserDisplayScreen() {
  const [lastScan, setLastScan] = useState<ScanResult | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const [lastScanTimestamp, setLastScanTimestamp] = useState(0)
  const [showScanResult, setShowScanResult] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Poll for new scans  every 1 second
  useEffect(() => {
    const pollForScans = async () => {
      try {
        const response = await fetch(`/api/recent-scans?since=${lastScanTimestamp}`)
        if (response.ok) {
          const data = await response.json()
          console.log("Polling data:", data)

          // Check if there are new scans
          if (data.scans && data.scans.length > 0) {
            // Get the most recent scan
            const latestScan = data.scans[data.scans.length - 1]
            console.log("Latest scan:", latestScan)

            // Update timestamp to avoid processing the same scan again
            setLastScanTimestamp(latestScan.timestamp)

            // Process the scan
            await processScan(latestScan.uid)
          }

          setIsConnected(true)
        } else {
          setIsConnected(false)
        }
      } catch (error) {
        console.error("Polling error:", error)
        setIsConnected(false)
      }
    }

    // Initial poll
    pollForScans()

    // Set up polling interval
    const interval = setInterval(pollForScans, 1000)
    return () => clearInterval(interval)
  }, [lastScanTimestamp])

  const processScan = async (uid: string) => {
    if (processing) return // Prevent duplicate processing

    setProcessing(true)
    console.log("Processing scan for UID:", uid)

    try {
      // First, verify access with POST
      const scanResponse = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      })

      const scanResult = await scanResponse.json()
      console.log("Scan result:", scanResult)

      if (scanResult.success) {
        // If access is granted, deduct credits with PATCH
        const patchResponse = await fetch("/api/scan", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: uid,
            amount: 5,
          }),
        })

        if (patchResponse.ok) {
          const patchResult = await patchResponse.json()
          console.log("Credit deducted:", patchResult)

          // Show success with updated credit info
          setLastScan({
            success: true,
            user: patchResult.user,
            message: "Access granted",
            deductedAmount: patchResult.deductedAmount,
            previousCredit: patchResult.previousCredit,
          })
        } else {
          // Patch failed, but still show the original scan result
          setLastScan(scanResult)
        }
      } else {
        // Access denied
        setLastScan(scanResult)
      }

      setShowScanResult(true)

      // Auto-hide scan result after 8 seconds
      setTimeout(() => {
        setShowScanResult(false)
        setLastScan(null)
      }, 8000)
    } catch (error) {
      console.error("Failed to process scan:", error)
      setLastScan({
        success: false,
        message: "System error. Please try again.",
      })
      setShowScanResult(true)

      setTimeout(() => {
        setShowScanResult(false)
        setLastScan(null)
      }, 8000)
    }

    setProcessing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Gym Access</h1>
              <p className="text-gray-600">Scan your RFID card to enter</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? <Wifi className="w-5 h-5 text-green-500" /> : <WifiOff className="w-5 h-5 text-red-500" />}
            <span className="text-sm text-gray-600">{isConnected ? "Connected" : "Disconnected"}</span>
            {processing && (
              <div className="flex items-center gap-1 text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-xs">Processing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Scan Result Display */}
        {showScanResult && lastScan ? (
          <Card className={`w-full ${lastScan.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {lastScan.success ? (
                  <>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl text-green-800">Welcome, {lastScan.user?.name}!</h2>
                      <p className="text-green-600">Access Granted - Entry Allowed</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl text-red-800">Access Denied</h2>
                      <p className="text-red-600">{lastScan.message}</p>
                    </div>
                  </>
                )}
              </CardTitle>
            </CardHeader>

            {lastScan.success && lastScan.user && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Remaining Credit</p>
                      <p className="text-xl font-semibold">
                        <Badge
                          variant={
                            lastScan.user.credit > 10
                              ? "default"
                              : lastScan.user.credit > 0
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {lastScan.user.credit} credits
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Entry Time</p>
                      <p className="text-lg font-medium">{new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Card ID</p>
                      <p className="text-lg font-mono">{lastScan.user.rfidUid}</p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="bg-green-100 rounded-lg p-3">
                    <p className="text-sm text-green-700 font-medium">
                      ✅ {lastScan.deductedAmount || 5} credits deducted for this visit
                    </p>
                    {lastScan.previousCredit && (
                      <p className="text-xs text-green-600 mt-1">
                        Previous: {lastScan.previousCredit} → Current: {lastScan.user.credit}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            )}

            {!lastScan.success && lastScan.user && (
              <CardContent>
                <div className="text-center">
                  <div className="bg-red-100 rounded-lg p-3">
                    <p className="text-sm text-red-700 font-medium">❌ Current credit: {lastScan.user.credit}</p>
                    <p className="text-xs text-red-600 mt-1">Need at least 5 credits to enter</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ) : (
          <Card className="w-full border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <CreditCard className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Ready to Scan</h2>
              <p className="text-gray-500 text-center mb-4">
                Please scan your RFID card on the reader to access the gym
              </p>
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Entry cost: 5 credits per visit</p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Waiting for card scan...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
