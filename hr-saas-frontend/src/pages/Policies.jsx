import { useEffect, useMemo, useState } from "react"
import { FileText, RefreshCw, Upload } from "lucide-react"
import { api } from "../lib/api"
import { useAuth } from "../context/AuthContext"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { Separator } from "../components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { useToast } from "../context/ToastContext"

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === "string" && detail.trim()) {
    return detail
  }
  return fallback
}

function formatDate(value) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString()
}

function normalizePolicies(data) {
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((policy) => ({
    id: policy?.id ?? policy?.filename,
    filename: policy?.filename ?? "Untitled.pdf",
    uploaded_by: policy?.uploaded_by ?? "-",
    created_at: policy?.created_at ?? null,
  }))
}

function Policies() {
  const { role } = useAuth()
  const canUpload = useMemo(() => role === "admin" || role === "hr", [role])
  const { success: showSuccessToast, error: showErrorToast } = useToast()

  const [file, setFile] = useState(null)
  const [policies, setPolicies] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const fetchPolicies = async () => {
    try {
      setIsLoadingPolicies(true)
      const res = await api.get("/policies")
      setPolicies(normalizePolicies(res.data))
    } catch (err) {
      console.error("Error fetching policies:", err)
      const message = getErrorMessage(err, "Failed to load policies.")
      setError(message)
      showErrorToast("Unable to load policies", message)
    } finally {
      setIsLoadingPolicies(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [])

  const upload = async () => {
    try {
      if (!canUpload) return
      if (!file || isUploading) return

      setError("")
      setSuccess("")
      setIsUploading(true)

      console.log("[Policies] uploading file:", file?.name)

      const formData = new FormData()
      formData.append("file", file)

      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("[Policies] upload response:", res.data)
      setSuccess("Document uploaded successfully")
      showSuccessToast("Policy uploaded", `${file.name} is now available in Policy Center.`)
      setFile(null)
      await fetchPolicies()
      setIsUploadOpen(false)
    } catch (err) {
      console.error("[Policies] upload failed:", err)
      const message = getErrorMessage(err, "Upload failed. Please try again.")
      setError(message)
      showErrorToast("Upload failed", message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card className="rounded-3xl border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl shadow-slate-950/30">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-3xl">
              <span className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <FileText className="h-5 w-5 text-indigo-300" />
              </span>
              Policy Center
            </CardTitle>
            <CardDescription className="mt-3 max-w-2xl">
              Upload policy PDFs and review everything already available to your tenant in one polished Worklyn workspace.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="rounded-xl border-slate-700 bg-slate-900/80" onClick={fetchPolicies} disabled={isLoadingPolicies}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingPolicies ? "animate-spin" : ""}`} />
              {isLoadingPolicies ? "Refreshing..." : "Refresh"}
            </Button>
            {canUpload ? (
              <Button className="rounded-xl" onClick={() => {
                setError("")
                setSuccess("")
                setFile(null)
                setIsUploadOpen(true)
              }}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Policy
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      {error ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div> : null}

      <Card className="rounded-3xl border-slate-800 bg-slate-900/70 shadow-xl shadow-slate-950/20">
        <CardHeader>
          <CardTitle>Uploaded policies</CardTitle>
          <CardDescription>{policies.length} {policies.length === 1 ? "file" : "files"} available</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPolicies ? <div className="py-10 text-sm text-slate-300">Loading policies...</div> : null}

          {!isLoadingPolicies && policies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-10 text-sm text-slate-400">
              No policies uploaded yet
            </div>
          ) : null}

          {!isLoadingPolicies && policies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File name</TableHead>
                  <TableHead>Uploaded by</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-3">
                        <Badge className="border-red-500/30 bg-red-500/15 text-red-100">PDF</Badge>
                        <span>{policy.filename}</span>
                      </div>
                    </TableCell>
                    <TableCell>{policy.uploaded_by}</TableCell>
                    <TableCell>{formatDate(policy.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isUploadOpen} onOpenChange={(open) => !isUploading && setIsUploadOpen(open)}>
        <DialogContent className="max-w-xl rounded-3xl border-slate-800 bg-slate-900">
          <DialogHeader>
            <DialogTitle>Upload policy</DialogTitle>
            <DialogDescription>Upload a PDF document for your tenant knowledge base.</DialogDescription>
          </DialogHeader>

          <Separator />

          <div className="space-y-5 px-6 pb-2 pt-4">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                setSuccess("")
                setError("")
                setFile(e.target.files?.[0] ?? null)
              }}
              className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-white hover:file:bg-slate-700"
            />

            {file ? (
              <Card className="rounded-2xl border-slate-800 bg-slate-950/70">
                <CardContent className="p-4 text-sm text-slate-300">Selected: {file.name}</CardContent>
              </Card>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-5 text-sm text-slate-400">
                Choose a PDF file to upload.
              </div>
            )}
          </div>

          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" className="rounded-xl border-slate-700 bg-slate-900" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={upload} disabled={isUploading || !file}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Policies
