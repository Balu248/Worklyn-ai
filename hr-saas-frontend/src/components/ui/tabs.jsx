import React, { createContext, useContext, useMemo, useState } from "react"
import { cn } from "../../lib/utils"

const TabsContext = createContext(null)

export function Tabs({ value: controlledValue, defaultValue, onValueChange, children, className }) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const value = controlledValue ?? uncontrolledValue
  const setValue = onValueChange ?? setUncontrolledValue

  const ctx = useMemo(() => ({ value, setValue }), [value, setValue])

  return (
    <TabsContext.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-slate-800/70 border border-slate-700 p-1 text-slate-300",
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ value, className, ...props }) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs")

  const active = ctx.value === value

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold transition",
        active ? "bg-slate-900 text-white" : "hover:bg-slate-700/60",
        className
      )}
      onClick={() => ctx.setValue(value)}
      {...props}
    />
  )
}

export function TabsContent({ value, className, children }) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error("TabsContent must be used within Tabs")
  if (ctx.value !== value) return null

  return <div className={cn("mt-4", className)}>{children}</div>
}
