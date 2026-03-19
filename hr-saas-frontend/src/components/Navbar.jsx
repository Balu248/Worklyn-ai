import { LogOut, PanelLeftDashed } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"
import Logo from "./Logo"
import RoleBadge from "./RoleBadge"

function Navbar() {
  const { logout, payload, role, tenantId } = useAuth()
  const displayName = payload?.name ?? role ?? "Workspace User"

  return (
    <header className="sticky top-0 z-30 border-b border-slate-700/70 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 xl:hidden">
            <PanelLeftDashed className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">AI-Powered Workforce Intelligence Platform</p>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">Worklyn</span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 md:flex">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-slate-400">{tenantId || "No tenant"}</p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <RoleBadge role={role} />
          </div>

          <Button
            variant="outline"
            className="rounded-xl border-slate-700 bg-slate-900/80 px-4 text-slate-100 transition-all duration-300 hover:scale-[1.02] hover:bg-slate-800 hover:shadow-lg hover:shadow-indigo-950/30"
            onClick={() => {
              logout()
              window.location.assign("/login")
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
