import React from "react"
import { cn } from "../../lib/utils"

export const Input = React.forwardRef(function Input(
  { className, type = "text", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white",
        "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
})
