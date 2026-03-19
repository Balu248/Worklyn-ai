import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api } from "../lib/api"
import { useToast } from "../context/ToastContext"
import Logo from "../components/Logo"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

export default function Register() {
  const [companyName, setCompanyName] = useState("")
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const navigate = useNavigate()
  const { success: showSuccessToast, error: showErrorToast } = useToast()

  const signup = async () => {
    try {
      const company_name = companyName.trim()
      const name = adminName.trim()
      const email = adminEmail.trim()

      if (!company_name || !email || !password) return
      if (!name) {
        alert("Admin name is required")
        return
      }

      setError("")
      setSuccess("")
      setIsLoading(true)

      console.log("[Register] creating tenant:", company_name)
      const tenantRes = await api.post("/tenants", { name: company_name })
      const tenant_id = tenantRes?.data?.tenant_id ?? tenantRes?.data?.id ?? tenantRes?.data?.tenant?.id

      if (!tenant_id) {
        throw new Error("Missing tenant_id from /tenants response")
      }

      console.log("[Register] registering admin user:", { email, tenant_id })
      await api.post("/register", {
        email,
        password,
        tenant_id,
        role: "admin",
        name,
      })

      setSuccess("Company created. Please log in.")
      showSuccessToast("Company created", "Your workspace is ready. Redirecting to login.")
      setCompanyName("")
      setAdminName("")
      setAdminEmail("")
      setPassword("")

      setTimeout(() => navigate("/login"), 800)
    } catch (err) {
      console.error("[Register] failed:", err)
      setError("Signup failed. Please try again.")
      showErrorToast("Signup failed", "We couldn't create the tenant right now.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 px-4 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-80px] top-12 h-[360px] w-[360px] rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute bottom-[-80px] right-12 h-[420px] w-[420px] rounded-full bg-purple-500/15 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md rounded-3xl border-slate-800 bg-slate-900/80 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex items-center gap-3">
            <Logo className="h-10 w-10" labelClassName="text-lg" />
            <div className="text-left">
              <p className="text-xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">Worklyn</span>
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI-Powered Workforce Intelligence Platform</p>
            </div>
          </div>

          <div>
            <CardTitle className="text-2xl font-extrabold">Create your company</CardTitle>
            <CardDescription className="mt-2 text-slate-400">Set up a new Worklyn tenant and admin account</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {error ? (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
          ) : null}

          {success ? (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>
          ) : null}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company name</Label>
              <Input
                className="h-11 rounded-xl border-slate-700 bg-slate-950"
                placeholder="Acme Inc"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Admin full name</Label>
              <Input
                className="h-11 rounded-xl border-slate-700 bg-slate-950"
                placeholder="Alex Johnson"
                value={adminName}
                onChange={(event) => setAdminName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Admin email</Label>
              <Input
                className="h-11 rounded-xl border-slate-700 bg-slate-950"
                placeholder="admin@company.com"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                className="h-11 rounded-xl border-slate-700 bg-slate-950"
                placeholder="Create a secure password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") signup()
                }}
              />
            </div>

            <Button
              onClick={signup}
              disabled={isLoading || !companyName.trim() || !adminName.trim() || !adminEmail.trim() || !password}
              className="h-11 w-full rounded-xl bg-indigo-600 font-semibold text-white transition-all duration-300 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-950/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Create Company"}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm text-slate-300">
            Already have an account?{" "}
            <Link className="text-indigo-300 underline hover:text-indigo-200" to="/login">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
