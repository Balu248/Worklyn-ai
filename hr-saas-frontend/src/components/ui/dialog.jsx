import React, { createContext, useContext, useMemo, useState } from "react"
import { cn } from "../../lib/utils"

const DialogContext = createContext(null)

export function Dialog({ open: controlledOpen, onOpenChange, children }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)

  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  const value = useMemo(() => ({ open, setOpen }), [open, setOpen])

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
}

export function DialogTrigger({ asChild = false, children }) {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error("DialogTrigger must be used within Dialog")

  const child = React.Children.only(children)

  const props = {
    onClick: (e) => {
      child.props?.onClick?.(e)
      ctx.setOpen(true)
    },
  }

  if (asChild) return React.cloneElement(child, props)

  return <button {...props}>{children}</button>
}

export function DialogContent({ className, children }) {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error("DialogContent must be used within Dialog")

  if (!ctx.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => ctx.setOpen(false)} />
      <div className={cn("relative w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-xl", className)}>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("p-6 pb-2", className)} {...props} />
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn("text-xl font-bold", className)} {...props} />
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn("text-sm text-slate-300", className)} {...props} />
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn("p-6 pt-0 flex justify-end gap-2", className)} {...props} />
}
