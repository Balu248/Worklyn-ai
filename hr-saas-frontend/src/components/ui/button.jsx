import React from "react"
import { cn } from "../../lib/utils"

export const Button = React.forwardRef(function Button(
  { className, variant = "default", size = "default", ...props },
  ref
) {
  const variants = {
    default: "bg-indigo-600 text-white hover:bg-indigo-500",
    secondary: "bg-slate-700 text-white hover:bg-slate-600",
    outline: "border border-slate-600 bg-transparent hover:bg-slate-800",
    ghost: "bg-transparent hover:bg-slate-800",
    destructive: "bg-red-500/90 text-white hover:bg-red-500",
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3",
    lg: "h-11 px-5",
  }

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed",
        "hover:scale-[1.02] active:scale-[0.99]",
        variants[variant] ?? variants.default,
        sizes[size] ?? sizes.default,
        className
      )}
      {...props}
    />
  )
})
