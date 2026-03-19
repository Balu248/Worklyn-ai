import { Link, useLocation } from "react-router-dom"
import { BarChart3, Bot, FileText, LayoutDashboard, ShieldCheck, Users2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"
import { cn } from "../lib/utils"
import Logo from "./Logo"
import RoleBadge from "./RoleBadge"

function Sidebar() {
  const location = useLocation()
  const { role, tenantId } = useAuth()

  const isAdmin = role === "admin"
  const isHR = role === "hr"

  const navItems = [
    { to: "/app", label: "Worklyn Dashboard", icon: LayoutDashboard, show: true },
    { to: "/app/assistant", label: "AI Assistant", icon: Bot, show: true },
    { to: "/app/tasks", label: "Task Management", icon: ShieldCheck, show: true },
    { to: "/app/policies", label: "Policy Center", icon: FileText, show: isAdmin || isHR },
    { to: "/app/users", label: "User Management", icon: Users2, show: isAdmin },
    { to: "/app/analytics", label: "Analytics", icon: BarChart3, show: isAdmin },
  ]

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-800 bg-slate-950/80 backdrop-blur xl:block">
      <div className="flex h-full flex-col p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Logo className="h-10 w-10" labelClassName="text-lg" />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-indigo-300/90">Workspace</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">Worklyn</span>
                </h1>
                <p className="mt-1 text-sm text-slate-400">Smart Workforce Platform</p>
              </div>
            </div>
            <RoleBadge role={role} />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Tenant</p>
            <p className="mt-2 truncate text-sm font-medium text-slate-100">{tenantId || "No tenant loaded"}</p>
          </div>
        </div>

        <Separator className="my-6" />

        <ScrollArea className="flex-1 pr-2">
          <nav className="space-y-2">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-lg p-3 text-sm font-medium text-slate-300 transition-all duration-300 hover:scale-[1.02] hover:bg-slate-800 hover:text-white",
                      isActive && "bg-slate-700 text-white shadow-lg shadow-slate-950/20"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  )
}

export default Sidebar
