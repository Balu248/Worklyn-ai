import { createContext, useCallback, useContext, useMemo, useState } from "react"

const ToastContext = createContext(null)

let toastCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, description = "", variant = "default", duration = 3200 }) => {
      const id = ++toastCounter
      const nextToast = { id, title, description, variant }

      setToasts((current) => [...current, nextToast])

      window.setTimeout(() => {
        dismiss(id)
      }, duration)

      return id
    },
    [dismiss]
  )

  const value = useMemo(
    () => ({
      toast,
      dismiss,
      success: (title, description = "") => toast({ title, description, variant: "success" }),
      error: (title, description = "") => toast({ title, description, variant: "destructive" }),
      info: (title, description = "") => toast({ title, description, variant: "default" }),
    }),
    [dismiss, toast]
  )

  return <ToastContext.Provider value={{ ...value, toasts }}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
