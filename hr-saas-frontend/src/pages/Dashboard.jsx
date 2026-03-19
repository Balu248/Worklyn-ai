import { useEffect, useState } from "react"
import { Activity, Bot, CheckCircle2, ListTodo, Users2 } from "lucide-react"
import { api } from "../lib/api"
import { useAuth } from "../context/AuthContext"
import { Badge } from "../components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import RoleBadge from "../components/RoleBadge"

function Dashboard() {
  const { role, tenantId, payload } = useAuth()
  const [tasksCount, setTasksCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const welcomeName = payload?.name ?? "there"

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const res = await api.get("/tasks")
        const items = Array.isArray(res.data) ? res.data : []
        setTasksCount(items.length)
      } catch (err) {
        console.error("[Dashboard] failed to load tasks:", err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const stats = [
    { title: "Total Tasks", value: isLoading ? "..." : tasksCount, sub: "Live from /tasks", icon: ListTodo, tone: "text-cyan-300" },
    { title: "Active Team", value: role === "admin" ? "Admin" : role === "hr" ? "HR" : "Employee", sub: "Current workspace role", icon: Users2, tone: "text-emerald-300" },
    { title: "AI Assistant", value: "Ready", sub: "Ask Worklyn for policy guidance anytime", icon: Bot, tone: "text-violet-300" },
    { title: "Platform", value: "Healthy", sub: "Backend: localhost:8000", icon: Activity, tone: "text-amber-300" },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-indigo-300/80">Overview</p>
            <h1 className="mt-2 text-3xl font-extrabold text-white">Worklyn Dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              A premium command center for workforce operations, task coordination, policy visibility, and AI support.
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Welcome back, <span className="font-semibold text-white">{welcomeName}</span>. Your workspace is ready for{" "}
              {role === "admin" ? "admin-level control" : role === "hr" ? "people operations" : "daily execution"}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-100">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Workspace Live
            </Badge>
            <RoleBadge role={role} />
            <Badge className="border-slate-700 bg-slate-900 text-slate-200">Tenant: {tenantId || "unknown"}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.title} className="rounded-3xl border-slate-800 bg-slate-900/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-950/20">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardDescription>{stat.title}</CardDescription>
                  <CardTitle className="mt-3 text-3xl">{stat.value}</CardTitle>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                  <Icon className={`h-5 w-5 ${stat.tone}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">{stat.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default Dashboard
