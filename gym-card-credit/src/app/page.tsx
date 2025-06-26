"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, CreditCard, Clock, Wifi, WifiOff, AlertCircle, CheckCircle, Eye, LogIn, X } from "lucide-react"

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

interface UserData {
  _id: string
  name: string
  rfidUid: string
  credit: number
  lastScan: string
}

export default function UserDisplayScreen() {
  const [lastScan, setLastScan] = useState<ScanResult | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const [lastScanTimestamp, setLastScanTimestamp] = useState(0)
  const [showScanResult, setShowScanResult] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processedScans, setProcessedScans] = useState<Set<string>>(new Set())
  
  // User lookup states
  const [lookupMode, setLookupMode] = useState(false)
  const [lookupUser, setLookupUser] = useState<UserData | null>(null)
  const [lookupError, setLookupError] = useState("")
  const [lookupScanning, setLookupScanning] = useState(false)

  // Initialize component and reset processed scans on mount
  useEffect(() => {
    // Clear any previous processed scans when component mounts
    setProcessedScans(new Set())
    setLastScanTimestamp(Date.now()) // Start from current time to avoid old scans
  }, [])

  // Poll for new scans every 1 second
  useEffect(() => {
    // Skip polling if we're in lookup mode
   

    const pollForScans = async () => {
      try {
        const response = await fetch(`/api/recent-scans?since=${lastScanTimestamp}`)
        if (response.ok) {
          const data = await response.json()
          // Check if there are new scans
          if (data.scans && data.scans.length > 0) {
            // Process each new scan
            for (const scan of data.scans) {
              const scanKey = `${scan.uid}-${scan.timestamp}`
              
              // Skip if we've already processed this scan
              if (!processedScans.has(scanKey)) {
                setProcessedScans(prev => new Set(prev).add(scanKey))
                
                // Update timestamp to the latest scan
                setLastScanTimestamp(scan.timestamp)
                
                // Process the scan
                if (lookupScanning) {
                  // If in lookup scanning mode, just lookup the user
                  await handleLookupScan(scan.uid)
                } else {
                   if (lookupMode) return
                  await processScan(scan.uid)
                }
                
                // Only process one scan at a time to avoid conflicts
                break
              }
            }
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
  }, [lastScanTimestamp, processedScans, lookupMode, lookupScanning])

  const handleLookupScan = async (uid: string) => {
    try {
      setLookupError("")
      const response = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfidUid: uid }),
      })

      const result = await response.json()

      if (response.ok) {
        setLookupUser(result.user)
        console.log("User found:", result.user)
        setLookupScanning(false)
      } else {
        setLookupError(result.error || "User not found")
        setLookupUser(null)
        // Auto-clear error after 5 seconds
        setTimeout(() => {
          setLookupError("")
        }, 5000)
      }
    } catch (error) {
      console.error("Lookup error:", error)
      setLookupError("Failed to lookup user")
      setLookupUser(null)
      setTimeout(() => {
        setLookupError("")
      }, 5000)
    }
  }

  const startLookupMode = () => {
    setLookupMode(true)
    setLookupScanning(true)
    setLookupUser(null)
    setLookupError("")
    // Hide any current scan results
    setShowScanResult(false)
    setLastScan(null)
  }

  const exitLookupMode = () => {
    setLookupMode(false)
    setLookupScanning(false)
    setLookupUser(null)
    setLookupError("")
  }

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
              <p className="text-gray-600">
                {lookupMode ? "Scan your card to view details" : "Scan your RFID card to enter"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
            
            {/* Mode Toggle Buttons */}
            {!lookupMode ? (
              <Button onClick={startLookupMode} variant="outline" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Check Balance
              </Button>
            ) : (
              <Button onClick={exitLookupMode} variant="outline" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Back to Entry
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        {lookupMode ? (
          /* User Lookup Mode */
          <>
            {lookupUser ? (
              /* User Details Display */
              <Card className="w-full border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl text-blue-800">{lookupUser.name}</h2>
                        <p className="text-blue-600">Account Details</p>
                      </div>
                    </div>
                    <Button onClick={exitLookupMode} variant="ghost" size="sm">
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Current Balance</p>
                        <p className="text-2xl font-bold">
                          <Badge
                            variant={
                              lookupUser.credit > 10
                                ? "default"
                                : lookupUser.credit > 0
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-lg px-3 py-1"
                          >
                            {lookupUser.credit} credits
                          </Badge>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Card ID</p>
                        <p className="text-lg font-mono">{lookupUser.rfidUid}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Last Visit</p>
                        <p className="text-lg font-medium">
                          {lookupUser.lastScan ? new Date(lookupUser.lastScan).toLocaleDateString() : "Never"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <div className="bg-blue-100 rounded-lg p-4">
                      <p className="text-sm text-blue-700 font-medium">
                        💡 Entry Cost: 5 credits per visit
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {lookupUser.credit >= 5 
                          ? `You can visit ${Math.floor(lookupUser.credit / 5)} more times`
                          : "Please top up your account to continue using the gym"
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : lookupError ? (
              /* Error Display */
              <Card className="w-full border-red-200 bg-red-50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-red-800 mb-2">Card Not Found</h2>
                  <p className="text-red-600 text-center mb-4">{lookupError}</p>
                  <div className="flex gap-2">
                    <Button onClick={() => setLookupScanning(true)} variant="outline" size="sm">
                      Try Again
                    </Button>
                    <Button onClick={exitLookupMode} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Waiting for Scan */
              <Card className="w-full border-blue-200">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <Eye className="w-12 h-12 text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-blue-700 mb-2">Ready to Check Balance</h2>
                  <p className="text-blue-600 text-center mb-4">
                    Scan your RFID card to view your account details and credit balance
                  </p>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-500">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>Waiting for card scan...</span>
                    </div>
                    <Button onClick={exitLookupMode} variant="ghost" size="sm" className="mt-4">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Normal Entry Mode */
          <div>
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
      </div> )}
  </div>
    </div>
       
          )}