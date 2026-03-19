import { CheckCircle2, Info, X, XCircle } from "lucide-react"
import { useToast } from "../../context/ToastContext"
import { cn } from "../../lib/utils"

const VARIANT_STYLES = {
  default: {
    icon: Info,
    iconClassName: "text-cyan-300",
    containerClassName: "border-slate-700 bg-slate-900/95",
  },
  success: {
    icon: CheckCircle2,
    iconClassName: "text-emerald-300",
    containerClassName: "border-emerald-500/30 bg-emerald-500/10",
  },
  destructive: {
    icon: XCircle,
    iconClassName: "text-rose-300",
    containerClassName: "border-rose-500/30 bg-rose-500/10",
  },
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const style = VARIANT_STYLES[toast.variant] ?? VARIANT_STYLES.default
        const Icon = style.icon

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-2xl border px-4 py-4 shadow-2xl backdrop-blur transition-all duration-300",
              style.containerClassName
            )}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2">
                <Icon className={cn("h-4 w-4", style.iconClassName)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm text-slate-300">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
