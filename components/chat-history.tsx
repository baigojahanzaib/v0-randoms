"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import type { ChatSession } from "@/lib/ai-client"
import { ChatStorage } from "@/lib/chat-storage"
import { Trash2 } from "lucide-react"

interface ChatHistoryProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSessionSelect: (session: ChatSession) => void
  onSessionDelete: (sessionId: string) => void
  onSessionsUpdate: () => void
}

export function ChatHistory({
  sessions,
  activeSessionId,
  onSessionSelect,
  onSessionDelete,
  onSessionsUpdate,
}: ChatHistoryProps) {
  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    ChatStorage.deleteSession(sessionId)
    onSessionDelete(sessionId)
    onSessionsUpdate()
  }

  const formatTitle = (session: ChatSession) => {
    if (session.title !== "New Chat") return session.title

    const firstUserMessage = session.messages.find((m) => m.role === "user")
    if (firstUserMessage) {
      return firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "")
    }

    return "New Chat"
  }

  return (
    <div className="space-y-1">
      {sessions.map((session) => (
        <div key={session.id} className="group relative">
          <Button
            variant={activeSessionId === session.id ? "secondary" : "ghost"}
            className="w-full justify-start text-left h-auto p-2 pl-6 pr-8 text-sm"
            onClick={() => onSessionSelect(session)}
          >
            <div className="truncate">{formatTitle(session)}</div>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => handleDelete(e, session.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  )
}
