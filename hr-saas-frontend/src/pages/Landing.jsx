import { ArrowRight, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Logo from "../components/Logo"
import { Button } from "../components/ui/button"

const highlights = [
  { value: "AI-first", label: "Policy answers and workforce guidance" },
  { value: "Multi-tenant", label: "Structured for modern teams" },
  { value: "Fast setup", label: "Go from signup to workspace in minutes" },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 px-6 text-center text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.92),rgba(30,41,59,0.72),rgba(15,23,42,0.92))]" />
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="pointer-events-none absolute inset-x-0 top-[5%] flex justify-center px-6 opacity-45">
        <div className="relative h-[23rem] w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/20 shadow-[0_30px_120px_rgba(15,23,42,0.65)] backdrop-blur-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_32%)]" />
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-3">
              <Logo className="h-9 w-9" labelClassName="text-sm" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Worklyn</p>
                <p className="text-xs text-slate-400">Premium workforce operating system</p>
              </div>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
              Platform online
            </div>
          </div>

          <div className="absolute left-[7%] top-[20%] h-28 w-56 rounded-3xl border border-white/10 bg-slate-900/55 p-5 shadow-2xl">
            <div className="h-3 w-20 rounded-full bg-indigo-400/80" />
            <div className="mt-4 h-2 w-36 rounded-full bg-slate-500/60" />
            <div className="mt-3 h-2 w-28 rounded-full bg-slate-600/50" />
            <div className="mt-5 flex gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/25" />
              <div className="h-8 w-8 rounded-xl bg-purple-500/20" />
              <div className="h-8 w-20 rounded-xl bg-slate-700/60" />
            </div>
          </div>

          <div className="absolute right-[9%] top-[24%] h-36 w-72 rounded-[2rem] border border-white/10 bg-slate-900/55 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded-full bg-slate-300/70" />
              <div className="h-8 w-8 rounded-full bg-emerald-400/20" />
            </div>
            <div className="mt-6 flex h-20 items-end gap-3">
              <div className="w-10 rounded-t-2xl bg-indigo-500/55" style={{ height: "56%" }} />
              <div className="w-10 rounded-t-2xl bg-violet-500/60" style={{ height: "80%" }} />
              <div className="w-10 rounded-t-2xl bg-fuchsia-500/55" style={{ height: "68%" }} />
              <div className="w-10 rounded-t-2xl bg-cyan-400/55" style={{ height: "92%" }} />
            </div>
          </div>

          <div className="absolute bottom-[12%] left-[18%] h-32 w-80 rounded-[2rem] border border-white/10 bg-slate-900/60 p-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500/70 to-purple-600/70" />
              <div className="space-y-2">
                <div className="h-3 w-24 rounded-full bg-slate-200/75" />
                <div className="h-2 w-32 rounded-full bg-slate-500/60" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="h-12 rounded-2xl bg-slate-800/80" />
              <div className="h-12 rounded-2xl bg-slate-800/80" />
              <div className="h-12 rounded-2xl bg-slate-800/80" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-24 flex w-full max-w-4xl flex-col items-center justify-center space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/55 px-6 py-10 backdrop-blur-xl md:px-10">
        <div className="inline-flex items-center gap-3 rounded-full border border-slate-700/60 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 backdrop-blur">
          <Sparkles className="h-4 w-4 text-indigo-300" />
          <span>AI-Powered Workforce Intelligence Platform</span>
        </div>

        <h1 className="text-6xl font-extrabold tracking-tight md:text-7xl">
          <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            Worklyn
          </span>
        </h1>

        <p className="text-xl text-slate-300">
          AI-Powered Workforce Intelligence Platform
        </p>

        <p className="max-w-2xl text-slate-400">
          Manage employees, tasks, and HR operations with intelligent AI assistance in a workspace designed to feel fast, premium, and operationally clear.
        </p>

        <div className="flex flex-col gap-4 pt-2 sm:flex-row">
          <Button
            size="lg"
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.02] hover:opacity-90"
            onClick={() => navigate("/register")}
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="rounded-xl border border-slate-600 px-8 transition-all duration-300 hover:scale-[1.02] hover:bg-slate-800"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
        </div>

        <div className="grid w-full max-w-4xl gap-3 pt-4 md:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.value}
              className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-4 text-left backdrop-blur transition-all duration-300 hover:scale-[1.02] hover:border-indigo-400/20"
            >
              <p className="text-sm font-semibold text-white">{item.value}</p>
              <p className="mt-1 text-sm text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
          <span>Workflows</span>
          <span>Automation</span>
          <span>Tasks</span>
          <span>Policies</span>
          <span>AI Guidance</span>
        </div>

        <p className="mt-16 text-sm text-slate-500">© 2026 Worklyn</p>
      </div>
    </div>
  )
}
