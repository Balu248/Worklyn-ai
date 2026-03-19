import { useState } from "react"
import { Bot, SendHorizonal } from "lucide-react"
import { api } from "../lib/api"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"

function AIChat() {
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState([])
  const [isAsking, setIsAsking] = useState(false)

  const askAI = async () => {
    try {
      const trimmed = question.trim()
      if (!trimmed || isAsking) return

      setIsAsking(true)

      setMessages((prev) => [...prev, { role: "user", text: trimmed }])

      console.log("[AIChat] asking:", trimmed)
      const res = await api.post(`/ask?question=${encodeURIComponent(trimmed)}`, {})
      console.log("[AIChat] response:", res.data)

      setMessages((prev) => [...prev, { role: "assistant", text: res?.data?.answer ?? "(No answer returned)" }])
      setQuestion("")
    } catch (err) {
      console.error("[AIChat] ask failed:", err)

      setMessages((prev) => [...prev, { role: "assistant", text: "Error contacting AI server." }])
    } finally {
      setIsAsking(false)
    }
  }

  return (
    <Card className="mx-auto flex h-[calc(100vh-12rem)] max-w-7xl flex-col rounded-3xl border-slate-800 bg-slate-900/70 shadow-2xl shadow-slate-950/20">
      <CardHeader className="border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <span className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <Bot className="h-5 w-5 text-indigo-300" />
            </span>
            AI Assistant
          </CardTitle>
          <Badge className="border-indigo-500/30 bg-indigo-500/15 text-indigo-100">AI Powered</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <ScrollArea className="flex-1 rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-5 text-sm text-slate-400">
                Ask Worklyn about leave policy, onboarding, documents, or internal workforce guidance.
              </div>
            ) : null}

            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-lg transition-all duration-300 ${
                    msg.role === "user" ? "ml-auto bg-indigo-600 text-white" : "bg-slate-700 text-slate-100"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-3">
          <Input
            className="h-12 rounded-xl border-slate-700 bg-slate-950"
            placeholder="Ask Worklyn AI a policy question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") askAI()
            }}
          />

          <Button className="h-12 rounded-xl px-6" onClick={askAI} disabled={isAsking || !question.trim()}>
            <SendHorizonal className="mr-2 h-4 w-4" />
            {isAsking ? "Asking..." : "Ask"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default AIChat
