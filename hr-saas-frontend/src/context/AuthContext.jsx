import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { decodeJwt } from "../lib/jwt"

const AuthContext = createContext(null)

function getAuthFromToken(token) {
  const payload = decodeJwt(token)
  if (!payload) return null

  const role = payload.role ?? payload.user_role ?? payload.roles?.[0] ?? null
  const tenantId = payload.tenant_id ?? payload.tenantId ?? payload.tenant ?? null

  return {
    token,
    payload,
    role,
    tenantId,
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"))

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") {
        setToken(e.newValue)
      }
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const auth = useMemo(() => {
    if (!token) return { token: null, payload: null, role: null, tenantId: null }

    const parsed = getAuthFromToken(token)
    if (!parsed) return { token, payload: null, role: null, tenantId: null }

    return parsed
  }, [token])

  const value = useMemo(() => {
    return {
      ...auth,
      setToken: (nextToken) => {
        if (nextToken) {
          localStorage.setItem("token", nextToken)
        } else {
          localStorage.removeItem("token")
        }
        setToken(nextToken)
      },
      logout: () => {
        localStorage.removeItem("token")
        setToken(null)
      },
    }
  }, [auth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
