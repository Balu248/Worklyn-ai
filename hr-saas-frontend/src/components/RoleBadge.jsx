import { Badge } from "./ui/badge"

const ROLE_STYLES = {
  admin: "border-rose-500/30 bg-rose-500/10 text-rose-100",
  hr: "border-cyan-500/30 bg-cyan-500/10 text-cyan-100",
  employee: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  guest: "border-slate-700 bg-slate-900 text-slate-200",
}

function formatRole(role) {
  const normalized = String(role || "guest").toLowerCase()
  if (normalized === "hr") return "HR"
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export default function RoleBadge({ role, className = "" }) {
  const normalized = String(role || "guest").toLowerCase()
  const style = ROLE_STYLES[normalized] ?? ROLE_STYLES.guest

  return <Badge className={`${style} ${className}`.trim()}>{formatRole(role)}</Badge>
}
