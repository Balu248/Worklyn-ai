import React from "react"
import { cn } from "../../lib/utils"

export function Table({ className, ...props }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("[&_tr]:border-b [&_tr]:border-slate-800", className)} {...props} />
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn("border-b border-slate-800 transition-all duration-300 hover:bg-slate-800/45", className)}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.18em] text-slate-400",
        className
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }) {
  return <td className={cn("p-4 align-middle text-slate-200", className)} {...props} />
}
