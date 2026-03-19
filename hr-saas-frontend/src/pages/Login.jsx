import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api } from "../lib/api"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import Logo from "../components/Logo"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { setToken } = useAuth()
  const { success: showSuccessToast, error: showErrorToast } = useToast()

  const login = async () => {
    try {
      setError("")
      setIsLoading(true)
      console.log("[Login] attempting login:", email)

      const res = await api.post("/login", {
        email,
        password,
      })

      const accessToken = res?.data?.access_token
      if (!accessToken) {
        throw new Error("Missing access_token in login response")
      }

      setToken(accessToken)
      showSuccessToast("Welcome back", "Login successful.")
      navigate("/app")
    } catch (err) {
      console.error("[Login] failed:", err)
      setError("Login failed. Please check your credentials.")
      showErrorToast("Login failed", "Please check your credentials and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 px-4 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-purple-500/15 blur-3xl" />
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
            <CardTitle className="text-2xl font-extrabold">Welcome back</CardTitle>
            <CardDescription className="mt-2 text-slate-400">Sign in to your Worklyn workspace</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-6 text-left text-sm text-slate-400 transition hover:-translate-x-[2px] hover:text-white"
          >
            ← Back to Home
          </button>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
          ) : null}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                className="h-11 rounded-xl border-slate-700 bg-slate-950"
                placeholder="you@company.com"
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                className="h-11 rounded-xl border-slate-700 bg-slate-950"
                placeholder="Enter your password"
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") login()
                }}
              />
            </div>

            <Button
              onClick={login}
              disabled={isLoading || !email.trim() || !password}
              className="h-11 w-full rounded-xl bg-indigo-600 font-semibold text-white transition-all duration-300 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-950/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Login"}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm text-slate-300">
            New company?{" "}
            <Link className="text-indigo-300 underline hover:text-indigo-200" to="/register">
              Create tenant
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
