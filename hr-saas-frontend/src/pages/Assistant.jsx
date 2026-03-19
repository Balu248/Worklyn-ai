import AIChat from "../components/AIChat"
import { Badge } from "../components/ui/badge"

function Assistant(){

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-indigo-300/80">Worklyn Intelligence</p>
            <h1 className="mt-2 text-3xl font-extrabold text-white">AI Assistant</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              Instant answers for policies, onboarding, and everyday workforce questions.
            </p>
          </div>
          <Badge className="border-indigo-500/30 bg-indigo-500/15 text-indigo-100">AI Powered</Badge>
        </div>
      </div>
      <AIChat />
    </div>
  )

}

export default Assistant
