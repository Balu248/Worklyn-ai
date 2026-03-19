import React from "react"
import { cn } from "../../lib/utils"

export function Badge({ className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200 transition-all duration-300",
        className
      )}
      {...props}
    />
  )
}
