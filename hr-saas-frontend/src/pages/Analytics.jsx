import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  BarChart3,
  Bot,
  Clock3,
  Database,
  FileText,
  RefreshCw,
  Search,
  Sparkles,
  Users2,
  Zap,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { api } from "../lib/api"
import { Badge } from "../components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { useAuth } from "../context/AuthContext"

const CHART_COLORS = ["#38bdf8", "#818cf8", "#22c55e", "#f59e0b", "#f97316", "#ec4899"]

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/A"
  return new Intl.NumberFormat("en-US").format(Number(value))
}

function formatLatency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/A"
  return `${Math.round(Number(value))} ms`
}

function formatCompactDate(value) {
  if (!value) return "Current"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatDateTime(value) {
  if (!value) return "Live snapshot"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Live snapshot"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/A"
  return `${Math.round(Number(value))}%`
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "")
}

function parseNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toDisplayName(value) {
  if (!value) return "Unknown user"
  return String(value)
}

function extractRecords(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.logs)) return payload.logs
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.queries)) return payload.queries
  return []
}

function normalizeRecord(item, index) {
  const latencyMs = parseNumber(
    firstDefined(item?.latency_ms, item?.average_latency_ms, item?.latency, item?.duration_ms, item?.response_time_ms)
  )
  const retrievalCount = parseNumber(
    firstDefined(item?.retrieval_count, item?.retrieved_documents, item?.documents_retrieved, item?.doc_count)
  )
  const timestamp = firstDefined(
    item?.timestamp,
    item?.created_at,
    item?.createdAt,
    item?.query_timestamp,
    item?.time,
    item?.date
  )
  const user = toDisplayName(firstDefined(item?.user, item?.user_id, item?.user_email, item?.email, item?.name))
  const question = firstDefined(item?.question, item?.query, item?.prompt, item?.text, item?.message)
  const topic = firstDefined(item?.topic, item?.category, item?.subject)

  return {
    id: item?.id ?? `${user}-${timestamp ?? "snapshot"}-${index}`,
    latencyMs,
    retrievalCount,
    timestamp,
    user,
    question,
    topic,
  }
}

function buildTimeline(records, totalQueries, averageLatency) {
  if (!records.length) {
    return [
      {
        label: "Current",
        queries: totalQueries ?? 0,
        latency: averageLatency ?? 0,
      },
    ]
  }

  const grouped = new Map()

  records.forEach((record) => {
    if (!record.timestamp) return

    const date = new Date(record.timestamp)
    if (Number.isNaN(date.getTime())) return

    const key = date.toISOString().slice(0, 10)
    const existing = grouped.get(key) ?? { key, label: formatCompactDate(date), queries: 0, latencyTotal: 0, latencyCount: 0 }
    existing.queries += 1

    if (record.latencyMs !== null) {
      existing.latencyTotal += record.latencyMs
      existing.latencyCount += 1
    }

    grouped.set(key, existing)
  })

  if (!grouped.size) {
    return [
      {
        label: "Current",
        queries: totalQueries ?? records.length,
        latency: averageLatency ?? 0,
      },
    ]
  }

  return Array.from(grouped.values())
    .sort((left, right) => left.key.localeCompare(right.key))
    .map((entry) => ({
      label: entry.label,
      queries: entry.queries,
      latency: entry.latencyCount ? Math.round(entry.latencyTotal / entry.latencyCount) : 0,
    }))
}

function groupByUser(records) {
  const grouped = new Map()

  records.forEach((record) => {
    const key = record.user || "Unknown user"
    const current = grouped.get(key) ?? { user: key, queries: 0 }
    current.queries += 1
    grouped.set(key, current)
  })

  return Array.from(grouped.values()).sort((left, right) => right.queries - left.queries)
}

function countTopValues(records, field) {
  const grouped = new Map()

  records.forEach((record) => {
    const value = record[field]
    if (!value) return
    grouped.set(value, (grouped.get(value) ?? 0) + 1)
  })

  return Array.from(grouped.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5)
}

function MetricCard({ title, value, description, icon: Icon, tone = "text-cyan-300" }) {
  return (
    <Card className="rounded-3xl border-slate-800 bg-slate-900/70 shadow-xl shadow-slate-950/20">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-3 text-3xl text-white">{value}</CardTitle>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
          <Icon className={`h-5 w-5 ${tone}`} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-400">{description}</p>
      </CardContent>
    </Card>
  )
}

function SectionCard({ title, description, action, children, className = "" }) {
  return (
    <Card className={`rounded-3xl border-slate-800 bg-slate-900/70 shadow-xl shadow-slate-950/20 ${className}`}>
      <CardHeader className="flex flex-col gap-3 border-b border-slate-800/80 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle className="text-white">{title}</CardTitle>
          {description ? <CardDescription className="mt-2">{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  )
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-10 text-center">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
        <Icon className="h-5 w-5 text-slate-300" />
      </div>
      <p className="mt-4 text-base font-semibold text-white">{title}</p>
      <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/95 px-4 py-3 shadow-2xl">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-sm">
            <span className="text-slate-300">{entry.name}</span>
            <span className="font-semibold text-white">
              {entry.dataKey.toLowerCase().includes("latency") ? formatLatency(entry.value) : formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Analytics() {
  const { tenantId } = useAuth()
  const [rawData, setRawData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeUsers, setActiveUsers] = useState(null)
  const [documentsIndexed, setDocumentsIndexed] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = async () => {
    try {
      setError("")
      setIsLoading(true)

      const [analyticsResult, usersResult, policiesResult] = await Promise.allSettled([
        api.get("/analytics/latency"),
        api.get("/users"),
        api.get("/policies"),
      ])

      if (analyticsResult.status !== "fulfilled") {
        throw analyticsResult.reason
      }

      setRawData(analyticsResult.value.data)
      setActiveUsers(usersResult.status === "fulfilled" && Array.isArray(usersResult.value.data) ? usersResult.value.data.length : null)
      setDocumentsIndexed(
        policiesResult.status === "fulfilled" && Array.isArray(policiesResult.value.data) ? policiesResult.value.data.length : null
      )
      setLastUpdated(new Date().toISOString())
    } catch (err) {
      console.error("[Analytics] failed:", err)
      setError("Failed to load analytics.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const analytics = useMemo(() => {
    const records = extractRecords(rawData).map(normalizeRecord).filter((record) => record.latencyMs !== null || record.question || record.timestamp)

    const totalQueries = parseNumber(rawData?.total_queries) ?? records.length
    const averageLatency =
      parseNumber(rawData?.average_latency_ms) ??
      (records.length
        ? Math.round(
            records.reduce((total, record) => total + (record.latencyMs ?? 0), 0) /
              Math.max(
                records.reduce((count, record) => count + (record.latencyMs !== null ? 1 : 0), 0),
                1
              )
          )
        : 0)
    const maxLatency = records.length
      ? Math.max(...records.map((record) => record.latencyMs ?? 0))
      : averageLatency || null
    const retrievalAverage = records.some((record) => record.retrievalCount !== null)
      ? (
          records.reduce((total, record) => total + (record.retrievalCount ?? 0), 0) /
          Math.max(records.reduce((count, record) => count + (record.retrievalCount !== null ? 1 : 0), 0), 1)
        ).toFixed(1)
      : null
    const queriesByUser = groupByUser(records)
    const timeline = buildTimeline(records, totalQueries, averageLatency)
    const latencyBars = records.length
      ? records.slice(0, 10).map((record, index) => ({
          label: record.timestamp ? formatCompactDate(record.timestamp) : `Q${index + 1}`,
          latency: record.latencyMs ?? 0,
          slow: (record.latencyMs ?? 0) >= Math.max((averageLatency ?? 0) * 1.2, 1200),
        }))
      : [{ label: "Average", latency: averageLatency ?? 0, slow: (averageLatency ?? 0) >= 1200 }]
    const slowResponses = records.filter((record) => (record.latencyMs ?? 0) >= Math.max((averageLatency ?? 0) * 1.2, 1200)).slice(0, 5)
    const topQuestions = countTopValues(records, "question")
    const topTopics = countTopValues(records, "topic")
    const coverageScore = totalQueries ? Math.min(100, Math.round((records.length / totalQueries) * 100)) : 0

    return {
      totalQueries,
      averageLatency,
      maxLatency,
      retrievalAverage,
      queriesByUser,
      timeline,
      latencyBars,
      slowResponses,
      topQuestions,
      topTopics,
      records,
      coverageScore,
    }
  }, [rawData])

  const usagePieData = analytics.queriesByUser.slice(0, 5)

  return (
    <div className="mx-auto max-w-7xl space-y-6 bg-slate-900">
      <Card className="overflow-hidden rounded-[2rem] border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 shadow-2xl shadow-slate-950/40">
        <CardHeader className="relative gap-4 overflow-hidden px-8 py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.16),transparent_36%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-100">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Analytics Control Center
                </Badge>
                <Badge className="border-slate-700 bg-slate-900/80 text-slate-200">Tenant: {tenantId || "Unavailable"}</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Worklyn Analytics</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
                A professional SaaS dashboard built on top of the existing analytics API, with frontend-side processing for
                latency metrics, usage summaries, and insight panels.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-100">
                <Activity className="mr-1.5 h-3.5 w-3.5" />
                Last updated: {formatDateTime(lastUpdated)}
              </Badge>
              <button
                type="button"
                onClick={load}
                disabled={isLoading}
                className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Queries"
          value={isLoading && !rawData ? "..." : formatNumber(analytics.totalQueries)}
          description="Live query volume from the analytics endpoint."
          icon={Search}
          tone="text-cyan-300"
        />
        <MetricCard
          title="Avg Latency"
          value={isLoading && !rawData ? "..." : formatLatency(analytics.averageLatency)}
          description="Average response time across the available analytics dataset."
          icon={Clock3}
          tone="text-amber-300"
        />
        <MetricCard
          title="Active Users"
          value={isLoading && activeUsers === null ? "..." : formatNumber(activeUsers)}
          description="Workspace members loaded from the existing users endpoint."
          icon={Users2}
          tone="text-emerald-300"
        />
        <MetricCard
          title="Documents Indexed"
          value={isLoading && documentsIndexed === null ? "..." : formatNumber(documentsIndexed)}
          description="Uploaded policy documents available to the tenant."
          icon={FileText}
          tone="text-violet-300"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto flex-wrap rounded-2xl border-slate-800 bg-slate-900/80 p-2">
          <TabsTrigger value="overview" className="rounded-xl px-4 py-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="rounded-xl px-4 py-2">
            Performance
          </TabsTrigger>
          <TabsTrigger value="usage" className="rounded-xl px-4 py-2">
            Usage
          </TabsTrigger>
          <TabsTrigger value="insights" className="rounded-xl px-4 py-2">
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <SectionCard
              title="Queries Over Time"
              description="Frontend-side grouping of analytics records by timestamp when detailed events are available."
            >
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.timeline} margin={{ top: 16, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="queries"
                      name="Queries"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#38bdf8" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Latency Trend" description="A compact latency signal for the currently available analytics data.">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.timeline} margin={{ top: 16, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="latency"
                      name="Latency"
                      stroke="#818cf8"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#818cf8" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <SectionCard title="Analytics Coverage" description="How much granular detail the current API payload exposes.">
              <div className="space-y-4">
                <div>
                  <p className="text-4xl font-bold text-white">{formatPercent(analytics.coverageScore)}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Detailed query records available: {formatNumber(analytics.records.length)} of {formatNumber(analytics.totalQueries)}.
                  </p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500" style={{ width: `${analytics.coverageScore}%` }} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Latency Ceiling" description="Peak response time seen in the current analytics dataset.">
              <div>
                <p className="text-4xl font-bold text-white">{formatLatency(analytics.maxLatency)}</p>
                <p className="mt-2 text-sm text-slate-400">Useful for spotting worst-case performance in demos and reviews.</p>
              </div>
            </SectionCard>

            <SectionCard title="Retrieval Activity" description="Average retrieved document count when per-query retrieval data exists.">
              <div>
                <p className="text-4xl font-bold text-white">
                  {analytics.retrievalAverage === null ? "N/A" : analytics.retrievalAverage}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  The current backend payload does not always include retrieval counts, so this panel adapts gracefully.
                </p>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <MetricCard
              title="Average Latency"
              value={formatLatency(analytics.averageLatency)}
              description="Core speed metric from `/analytics/latency`."
              icon={Zap}
              tone="text-cyan-300"
            />
            <MetricCard
              title="Max Latency"
              value={formatLatency(analytics.maxLatency)}
              description="Calculated from detailed records when available, otherwise falls back to the current aggregate."
              icon={BarChart3}
              tone="text-rose-300"
            />
            <MetricCard
              title="Retrieval Count Avg"
              value={analytics.retrievalAverage === null ? "N/A" : analytics.retrievalAverage}
              description="Shown only when the frontend can derive it from the response payload."
              icon={Database}
              tone="text-emerald-300"
            />
          </div>

          <SectionCard title="Latency Distribution" description="Bar chart of recent latency observations, highlighting slower responses.">
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.latencyBars} margin={{ top: 16, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="latency" name="Latency" radius={[10, 10, 0, 0]}>
                    {analytics.latencyBars.map((entry, index) => (
                      <Cell key={`${entry.label}-${index}`} fill={entry.slow ? "#fb7185" : "#38bdf8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title="Slow Responses"
            description="Responses are flagged as slow when they exceed 120% of the average latency or cross 1200 ms."
          >
            {analytics.slowResponses.length ? (
              <div className="space-y-3">
                {analytics.slowResponses.map((record) => (
                  <div
                    key={record.id}
                    className="flex flex-col gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">{record.question || "Slow analytics event"}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {record.user} | {formatDateTime(record.timestamp)}
                      </p>
                    </div>
                    <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-100">{formatLatency(record.latencyMs)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clock3}
                title="No slow outliers surfaced"
                description="The current payload only exposes aggregate latency or does not contain enough detailed events to list slow responses individually."
              />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
            <SectionCard title="Queries Per User" description="Grouped in the frontend when user-level analytics data is present.">
              {analytics.queriesByUser.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Queries Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.queriesByUser.map((entry) => (
                      <TableRow key={entry.user}>
                        <TableCell className="font-medium text-white">{entry.user}</TableCell>
                        <TableCell className="text-right">{formatNumber(entry.queries)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={Users2}
                  title="User-level usage is not in the current analytics payload"
                  description="The backend currently returns aggregate query totals and latency, so the table is ready but waiting for user-level records to populate."
                />
              )}
            </SectionCard>

            <SectionCard title="Usage Share" description="Optional chart view for the most active users in the analytics dataset.">
              {usagePieData.length ? (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usagePieData}
                        dataKey="queries"
                        nameKey="user"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                      >
                        {usagePieData.map((entry, index) => (
                          <Cell key={entry.user} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="No usage segmentation available yet"
                  description="Once the analytics API includes user-level event rows, this chart will automatically visualize query distribution by user."
                />
              )}
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Top Questions Asked" description="Frequently repeated prompts extracted directly from analytics records.">
              {analytics.topQuestions.length ? (
                <div className="space-y-3">
                  {analytics.topQuestions.map((item, index) => (
                    <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Question {index + 1}</p>
                          <p className="mt-2 font-medium text-white">{item.label}</p>
                        </div>
                        <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-100">{formatNumber(item.count)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Bot}
                  title="Top questions are unavailable in the current payload"
                  description="The UI is ready for AI question analytics, but the backend endpoint currently returns only aggregate totals and average latency."
                />
              )}
            </SectionCard>

            <SectionCard title="Frequently Searched Topics" description="Common themes grouped from topic metadata when the response includes it.">
              {analytics.topTopics.length ? (
                <div className="space-y-3">
                  {analytics.topTopics.map((item, index) => (
                    <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Topic {index + 1}</p>
                          <p className="mt-2 font-medium text-white">{item.label}</p>
                        </div>
                        <Badge className="border-violet-500/30 bg-violet-500/10 text-violet-100">{formatNumber(item.count)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Sparkles}
                  title="Topic analytics are waiting on richer event data"
                  description="This section intentionally avoids fake demo numbers and will populate automatically if the analytics response begins exposing searchable topic metadata."
                />
              )}
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Analytics
