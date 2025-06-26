"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, CreditCard, Search } from "lucide-react"
import { RfidScannerDialog } from "./rfid-scanner-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"

interface User {
  _id: string
  name: string
  rfidUid: string
  credit: number
  lastScan: string
  createdAt: string
}

interface OverviewProps {
  users: User[]
  onUserDeleted: () => void
  onShowToast: (type: "success" | "error", title: string, description?: string) => void
}

export function Overview({ users, onUserDeleted, onShowToast }: OverviewProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const activeMembers = users.filter((u) => u.credit > 0).length

  const deleteUser = async (userId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rfidUid: userId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onShowToast("success", "User Deleted", `User has been successfully removed from the system`)
        onUserDeleted()
        return { success: true, data }
      } else {
        onShowToast("error", "Delete Failed", data.error || "Failed to delete user")
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error("Network error:", error)
      onShowToast("error", "Network Error", "Failed to connect to server")
      return { success: false, error: "Network error" }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.rfidUid)
      setUserToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Scanner Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Overview</h2>
          <p className="text-gray-600">Manage your gym members and view statistics</p>
        </div>
        <RfidScannerDialog
          trigger={
            <Button variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Scan Card to View User
            </Button>
          }
          onUserDeleted={onUserDeleted}
          onShowToast={onShowToast}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>All Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-600">Card: {user.rfidUid}</p>
                    <p className="text-sm text-gray-600">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Badge variant={user.credit > 5 ? "default" : user.credit > 0 ? "secondary" : "destructive"}>
                      {user.credit} credits
                    </Badge>
                    <div className="text-sm text-gray-500">Last: {new Date(user.lastScan).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(user)}
                      disabled={isDeleting}
                    >
                      {isDeleting && userToDelete?._id === user._id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">No members found. Add your first member!</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete User"
        description={
          userToDelete
            ? `Are you sure you want to delete ${userToDelete.name}? This action cannot be undone and will permanently remove the user from the system.`
            : "Are you sure you want to delete this user?"
        }
        confirmText="Delete User"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}