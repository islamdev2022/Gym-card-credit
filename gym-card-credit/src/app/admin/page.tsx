"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { Overview } from "@/components/admin/overview"
import { AddNewUser } from "@/components/admin/add-new-user"
import { TopUp } from "@/components/admin/top-up"
import { ToastNotifications } from "@/components/toast-notifications"
import { useToastNotifications } from "@/hooks/use-toast-notifications"
import Link from "next/link"
interface User {
  _id: string
  name: string
  rfidUid: string
  credit: number
  lastScan: string
  createdAt: string
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const { toasts, removeToast, showSuccess, showError } = useToastNotifications()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Failed to fetch users:", error)
      showError("Failed to Load Users", "Please check your connection and try again")
    }
  }

  const handleUserAdded = () => {
    fetchUsers()
  }

  const handleUserUpdated = () => {
    fetchUsers()
  }
  
  const handleUserDeleted = () => {
    fetchUsers()
  }

  // Create a unified toast handler that can handle both success and error types
  const handleShowToast = (type: "success" | "error", title: string, description?: string) => {
    if (type === "success") {
      showSuccess(title, description)
    } else {
      showError(title, description)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 ">
          <div className="flex flex-wrap-reverse items-center gap-3 justify-center md:justify-between w-full">
            <Button variant="outline" size="sm" asChild> 
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2 " />
                Back to Scanner
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage gym members and credits</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="add-user">Add User</TabsTrigger>
            <TabsTrigger value="topup">Top Up Credit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Overview users={users} onShowToast={handleShowToast} onUserDeleted={handleUserDeleted} />
          </TabsContent>

          <TabsContent value="add-user">
            <AddNewUser onUserAdded={handleUserAdded} onShowToast={handleShowToast} />
          </TabsContent>

          <TabsContent value="topup">
            <TopUp users={users} onUserUpdated={handleUserUpdated} onShowToast={handleShowToast} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Toast Notifications */}
      <ToastNotifications toasts={toasts} onRemove={removeToast} />
    </div>
  )
}