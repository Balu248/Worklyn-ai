import { useEffect, useMemo, useState } from "react"
import { Plus, RefreshCw, Users2 } from "lucide-react"
import { api } from "../lib/api"
import { useAuth } from "../context/AuthContext"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Separator } from "../components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import RoleBadge from "../components/RoleBadge"
import { useToast } from "../context/ToastContext"

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === "string" && detail.trim()) {
    return detail
  }
  return fallback
}

function normalizeUsers(data) {
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((user) => ({
    id: user?.id ?? user?.email,
    name: user?.name || user?.email || "-",
    email: user?.email ?? "-",
    role: user?.role ?? "employee",
    tenant_id: user?.tenant_id ?? "-",
  }))
}

function Users() {
  const { role: currentRole, tenantId } = useAuth()
  const canCreate = useMemo(() => currentRole === "admin", [currentRole])
  const { success: showSuccessToast, error: showErrorToast } = useToast()

  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("employee")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [success, setSuccess] = useState("")

  const fetchUsers = async () => {
    try {
      setLoadError("")
      setIsLoading(true)
      console.log("Token:", localStorage.getItem("token"))
      const res = await api.get("/users")
      console.log("Users response:", res.data)
      setUsers(normalizeUsers(res.data))
    } catch (error) {
      console.error("[Users] Failed to load users:", error)
      const message = getErrorMessage(error, "Failed to load users")
      setLoadError(message)
      showErrorToast("Unable to load users", message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const createUser = async () => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    try {
      if (!canCreate || isCreating) return
      if (!trimmedEmail || !password || !tenantId) return
      if (!trimmedName) {
        alert("Name is required")
        return
      }

      setCreateError("")
      setSuccess("")
      setIsCreating(true)

      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        password,
        tenant_id: tenantId,
        role,
      }

      console.log("[Users] Creating user:", payload)
      await api.post("/register", payload)

      setSuccess("User created successfully.")
      showSuccessToast("User created", `${trimmedName} has been added to the workspace.`)
      setName("")
      setEmail("")
      setPassword("")
      setRole("employee")

      await fetchUsers()
      setIsCreateOpen(false)
    } catch (error) {
      console.error("[Users] Failed to create user:", error)
      const message = getErrorMessage(error, "Failed to create user")
      setCreateError(message)
      showErrorToast("User creation failed", message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card className="rounded-3xl border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl shadow-slate-950/30">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-3xl">
              <span className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <Users2 className="h-5 w-5 text-cyan-300" />
              </span>
              User Management
            </CardTitle>
            <CardDescription className="mt-3 max-w-2xl">
              Review everyone in the workspace before creating a new account. Worklyn keeps the backend behavior and auth flow unchanged.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge className="border-slate-700 bg-slate-900 text-slate-200">Tenant: {tenantId || "Unavailable"}</Badge>
            <Button variant="outline" className="rounded-xl border-slate-700 bg-slate-900/80" onClick={fetchUsers} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
            {canCreate ? (
              <Button className="rounded-xl" onClick={() => {
                setCreateError("")
                setSuccess("")
                setIsCreateOpen(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      {loadError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{loadError}</div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>
      ) : null}

      <Card className="rounded-3xl border-slate-800 bg-slate-900/70 shadow-xl shadow-slate-950/20">
        <CardHeader>
          <CardTitle>Workspace Members</CardTitle>
          <CardDescription>{users.length} {users.length === 1 ? "user" : "users"} loaded</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="py-10 text-sm text-slate-300">Loading users...</div> : null}

          {!isLoading && users.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-10 text-sm text-slate-400">
              No users found
            </div>
          ) : null}

          {!isLoading && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-white">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={(open) => !isCreating && setIsCreateOpen(open)}>
        <DialogContent className="max-w-2xl rounded-3xl border-slate-800 bg-slate-900">
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>
              New accounts are created inside tenant <span className="text-slate-200">{tenantId || "-"}</span>.
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <div className="space-y-5 px-6 pb-2 pt-4">
            {createError ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{createError}</div>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Johnson" className="rounded-xl border-slate-700 bg-slate-950" />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="employee@company.com" className="rounded-xl border-slate-700 bg-slate-950" />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-all duration-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="employee">employee</option>
                  <option value="hr">hr</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter a temporary password"
                  className="rounded-xl border-slate-700 bg-slate-950"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      createUser()
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" className="rounded-xl border-slate-700 bg-slate-900" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={createUser} disabled={isCreating || !name.trim() || !email.trim() || !password || !tenantId}>
              {isCreating ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Users
