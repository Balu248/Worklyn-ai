import React from "react"
import { cn } from "../../lib/utils"

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-700 bg-slate-800/60 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/30",
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("p-6 pb-2", className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-lg font-semibold", className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm text-slate-300", className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6 pt-2", className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}
