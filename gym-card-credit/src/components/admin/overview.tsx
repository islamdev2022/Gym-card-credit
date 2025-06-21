import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CreditCard } from "lucide-react"

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
}

export function Overview({ users }: OverviewProps) {
  const activeMembers = users.filter((u) => u.credit > 0).length

  return (
    <div className="space-y-6">
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
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={user.credit > 5 ? "default" : user.credit > 0 ? "secondary" : "destructive"}>
                    {user.credit} credits
                  </Badge>
                  <div className="text-sm text-gray-500">Last: {new Date(user.lastScan).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">No members found. Add your first member!</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
