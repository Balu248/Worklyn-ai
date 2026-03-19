import { useEffect, useMemo, useState } from "react"
import { ClipboardList, Plus, RefreshCw, Users } from "lucide-react"
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
import { ScrollArea } from "../components/ui/scroll-area"
import RoleBadge from "../components/RoleBadge"
import { useToast } from "../context/ToastContext"

const TASK_STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "DONE"]

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === "string" && detail.trim()) {
    return detail
  }
  return fallback
}

function formatStatus(status) {
  return String(status || "TODO")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (match) => match.toUpperCase())
}

function formatDueDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString()
}

function normalizeTasks(data) {
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((task) => ({
    ...task,
    status: task?.status ?? "TODO",
  }))
}

function Tasks() {
  const { role, payload } = useAuth()
  const isReadOnly = role === "employee"
  const canManageTasks = role === "admin" || role === "hr"
  const currentUserId = payload?.user_id ?? payload?.sub ?? null
  const { success: showSuccessToast, error: showErrorToast } = useToast()

  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [taskDraftMeta, setTaskDraftMeta] = useState({})
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deletingIds, setDeletingIds] = useState(() => new Set())
  const [updatingIds, setUpdatingIds] = useState(() => new Set())
  const [error, setError] = useState("")
  const [userError, setUserError] = useState("")
  const [success, setSuccess] = useState("")

  const isAnyDeleting = useMemo(() => deletingIds.size > 0, [deletingIds])

  const fetchTasks = async () => {
    try {
      setError("")
      setIsLoading(true)
      console.log("Token:", localStorage.getItem("token"))
      const res = await api.get("/tasks")
      const nextTasks = normalizeTasks(res.data)
      console.log("Tasks fetched:", nextTasks)
      setTasks(nextTasks)
    } catch (error) {
      console.error("[Tasks] Failed to load tasks:", error)
      const message = getErrorMessage(error, "Failed to load tasks")
      setError(message)
      showErrorToast("Unable to load tasks", message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setUserError("")
      setIsLoadingUsers(true)
      console.log("Token:", localStorage.getItem("token"))
      const res = await api.get("/users")
      console.log("[Tasks] Users fetched:", res.data)
      setUsers(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error("[Tasks] Failed to load users:", error)
      setUsers([])
      const message = getErrorMessage(error, "Failed to load users")
      setUserError(message)
      showErrorToast("Unable to load assignees", message)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchUsers()
  }, [])

  const resetTaskForm = () => {
    setTitle("")
    setDescription("")
    setDueDate("")
    setAssignedTo("")
  }

  const createTask = async () => {
    const trimmedTitle = title.trim()

    try {
      if (!canManageTasks || isCreating) return
      if (!trimmedTitle || !assignedTo) return

      setError("")
      setSuccess("")
      setIsCreating(true)

      const payload = {
        title: trimmedTitle,
        assigned_to: assignedTo,
      }

      console.log("Creating task:", payload)
      const res = await api.post("/tasks", payload)

      if (res?.data?.id) {
        setTaskDraftMeta((prev) => ({
          ...prev,
          [res.data.id]: {
            description: description.trim(),
            dueDate,
          },
        }))
      }

      resetTaskForm()
      setSuccess("Task created successfully.")
      showSuccessToast("Task created", `${trimmedTitle} is now on the board.`)
      await fetchTasks()
      setIsCreateOpen(false)
    } catch (error) {
      console.error("[Tasks] Failed to create task:", error)
      const message = getErrorMessage(error, "Failed to create task")
      setError(message)
      showErrorToast("Task creation failed", message)
    } finally {
      setIsCreating(false)
    }
  }

  const updateTaskStatus = async (task, nextStatus) => {
    const id = task?.id
    if (!id || updatingIds.has(id)) return
    if (isReadOnly && String(task.assigned_to) !== String(currentUserId)) return

    try {
      setError("")
      console.log("[Tasks] updating status:", { id, status: nextStatus })

      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.add(id)
        return next
      })

      const res = await api.put(`/tasks/${id}`, { status: nextStatus })
      console.log("[Tasks] update response:", res.data)
      showSuccessToast("Task updated", `${task.title} is now ${formatStatus(nextStatus)}.`)
      await fetchTasks()
    } catch (error) {
      console.error("[Tasks] Failed to update task:", error)
      const message = getErrorMessage(error, "Failed to update task")
      setError(message)
      showErrorToast("Task update failed", message)
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const deleteTask = async (id) => {
    if (!id || isReadOnly) return

    try {
      setError("")
      console.log("[Tasks] deleting task:", id)

      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.add(id)
        return next
      })

      await api.delete(`/tasks/${id}`)
      showSuccessToast("Task deleted", "The task was removed successfully.")
      await fetchTasks()
    } catch (error) {
      console.error("[Tasks] Failed to delete task:", error)
      const message = getErrorMessage(error, "Failed to delete task")
      setError(message)
      showErrorToast("Task deletion failed", message)
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const badgeClass = (status) => {
    if (status === "DONE") return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
    if (status === "IN_PROGRESS") return "border-amber-500/30 bg-amber-500/15 text-amber-100"
    return "border-sky-500/30 bg-sky-500/15 text-sky-200"
  }

  const userById = useMemo(() => {
    const map = new Map()
    for (const user of users) {
      if (user?.id != null) {
        map.set(String(user.id), user)
      }
    }
    return map
  }, [users])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card className="rounded-3xl border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl shadow-slate-950/30">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-3xl">
              <span className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <ClipboardList className="h-5 w-5 text-teal-300" />
              </span>
              Task Management
            </CardTitle>
            <CardDescription className="mt-3 max-w-2xl">
              Modern task coordination in Worklyn without touching your existing API payloads or refresh flow.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="rounded-xl border-slate-700 bg-slate-900/80" onClick={fetchTasks} disabled={isLoading || isCreating || isAnyDeleting}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Refreshing..." : "Refresh Tasks"}
            </Button>
            {!isReadOnly ? (
              <Button className="rounded-xl" onClick={() => {
                setError("")
                setSuccess("")
                resetTaskForm()
                setIsCreateOpen(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      {error ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="rounded-3xl border-slate-800 bg-slate-900/70 shadow-xl shadow-slate-950/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Assignees</CardTitle>
              <CardDescription>User options for task assignment</CardDescription>
            </div>
            <Button variant="ghost" className="rounded-xl text-slate-300" onClick={fetchUsers} disabled={isLoadingUsers}>
              <Users className="mr-2 h-4 w-4" />
              {isLoadingUsers ? "Loading..." : "Refresh"}
            </Button>
          </CardHeader>
          <CardContent>
            {userError ? <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{userError}</div> : null}
            <ScrollArea className="h-[28rem] pr-2">
              <div className="space-y-3">
                {users.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-5 text-sm text-slate-400">
                    {isLoadingUsers ? "Loading users..." : "No assignable users available."}
                  </div>
                ) : (
                  users.map((user) => (
                    <Card key={user.id ?? user.email} className="rounded-2xl border-slate-800 bg-slate-950/70 transition-all duration-300 hover:scale-[1.02]">
                      <CardContent className="p-4">
                        <p className="font-medium text-white">{user.name || user.email}</p>
                        <div className="mt-2">
                          <RoleBadge role={user.role} />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-800 bg-slate-900/70 shadow-xl shadow-slate-950/20">
          <CardHeader className="flex flex-col gap-2 border-b border-slate-800 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Task Board</CardTitle>
              <CardDescription>{tasks.length} {tasks.length === 1 ? "task" : "tasks"} loaded</CardDescription>
            </div>
            <Badge className="w-fit">{isReadOnly ? "Employee view" : "Admin / HR controls"}</Badge>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? <div className="py-8 text-sm text-slate-300">Loading tasks...</div> : null}

            {!isLoading && tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-10 text-sm text-slate-400">No tasks yet.</div>
            ) : null}

            {!isLoading ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {tasks.map((task) => {
                  const assignee = userById.get(String(task.assigned_to))
                  const draftMeta = taskDraftMeta[task.id] ?? {}
                  const resolvedDescription = task.description || draftMeta.description
                  const resolvedDueDate = task.due_date || draftMeta.dueDate
                  const canEmployeeUpdate = String(task.assigned_to) === String(currentUserId)
                  const assignedLabel = assignee?.name || assignee?.email || "Unknown"

                  return (
                    <Card key={task.id} className="rounded-3xl border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-950/20">
                      <CardContent className="space-y-5 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-semibold text-white">{task.title}</h2>
                            <p className="mt-2 text-sm text-slate-300">Assigned to: {assignedLabel}</p>
                          </div>
                          <Badge className={badgeClass(task.status)}>{formatStatus(task.status)}</Badge>
                        </div>

                        <Separator />

                        <div className="space-y-3 text-sm text-slate-300">
                          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Description</p>
                            <p className="mt-2">{resolvedDescription || "No description provided."}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Due date</p>
                            <p className="mt-2">{formatDueDate(resolvedDueDate) || "No due date set."}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <select
                            value={task.status || "TODO"}
                            disabled={updatingIds.has(task.id) || (isReadOnly && !canEmployeeUpdate)}
                            onChange={(event) => updateTaskStatus(task, event.target.value)}
                            className="flex h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition-all duration-300 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {TASK_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>

                          {!isReadOnly ? (
                            <Button variant="destructive" className="rounded-xl" onClick={() => deleteTask(task.id)} disabled={deletingIds.has(task.id)}>
                              {deletingIds.has(task.id) ? "Deleting..." : "Delete"}
                            </Button>
                          ) : (
                            <Badge className="border-slate-700 bg-slate-900 text-slate-300">
                              {canEmployeeUpdate ? "Status editable" : "Read-only"}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={(open) => !isCreating && setIsCreateOpen(open)}>
        <DialogContent className="max-w-3xl rounded-3xl border-slate-800 bg-slate-900">
          <DialogHeader>
            <DialogTitle>Create task</DialogTitle>
            <DialogDescription>
              Description and due date remain frontend-only. The backend request still sends only title and assigned user.
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <div className="grid gap-5 px-6 pb-2 pt-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Prepare onboarding checklist"
                disabled={isCreating}
                className="rounded-xl border-slate-700 bg-slate-950"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    createTask()
                  }
                }}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Frontend planning note shown on the task card."
                disabled={isCreating}
                rows={4}
                className="flex w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition-all duration-300 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={isCreating} className="rounded-xl border-slate-700 bg-slate-950" />
            </div>

            <div className="space-y-2">
              <Label>Assign user</Label>
              <select
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
                disabled={isCreating || users.length === 0}
                className="flex h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-all duration-300 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select user...</option>
                {users.map((user) => (
                  <option key={user.id ?? user.email} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" className="rounded-xl border-slate-700 bg-slate-900" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={createTask} disabled={isCreating || !title.trim() || !assignedTo}>
              {isCreating ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Tasks
