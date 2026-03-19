import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom"

import Sidebar from "./components/Sidebar"
import Navbar from "./components/Navbar"
import { Toaster } from "./components/ui/toaster"
import { useAuth } from "./context/AuthContext"
import { ToastProvider } from "./context/ToastContext"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Landing from "./pages/Landing"
import Dashboard from "./pages/Dashboard"
import Assistant from "./pages/Assistant"
import Tasks from "./pages/Tasks"
import Policies from "./pages/Policies"
import Users from "./pages/Users"
import Analytics from "./pages/Analytics"

function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>

          <footer className="border-t border-slate-800 px-6 py-4 text-center text-sm text-slate-400">© 2026 Worklyn</footer>
        </div>
      </div>
    </div>
  )
}

function ProtectedLayout() {
  const { token } = useAuth()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Layout />
}

function HomeRoute() {
  const { token } = useAuth()

  if (token) {
    return <Navigate to="/app" replace />
  }

  return <Landing />
}

function AdminOnly({ children }) {
  const { role } = useAuth()

  if (role !== "admin") {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<HomeRoute />} />

          <Route path="/app" element={<ProtectedLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="policies" element={<Policies />} />
            <Route
              path="users"
              element={
                <AdminOnly>
                  <Users />
                </AdminOnly>
              }
            />
            <Route
              path="analytics"
              element={
                <AdminOnly>
                  <Analytics />
                </AdminOnly>
              }
            />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
