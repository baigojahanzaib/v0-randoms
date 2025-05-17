import { Check, FileCode, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: {
    role: "user" | "assistant"
    content: string
    status?: "thinking" | "completed" | "error"
    files?: Record<string, string>
  }
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isThinking = message.status === "thinking"
  const isCompleted = message.status === "completed"

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          isUser ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900",
        )}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>

        {isThinking && (
          <div className="mt-2 flex items-center text-sm text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            Processing...
          </div>
        )}

        {isCompleted && message.files && (
          <div className="mt-2 space-y-1">
            {Object.keys(message.files).map((filename) => (
              <div key={filename} className="flex items-center text-xs text-slate-500">
                <FileCode className="h-3 w-3 mr-1" />
                <span className="flex-1 truncate">{filename}</span>
                <Check className="h-3 w-3 text-green-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
