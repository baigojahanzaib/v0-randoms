"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"
import type { ChatSession } from "@/lib/ai-client"
import { ChatStorage } from "@/lib/chat-storage"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSessionSelect: (session: ChatSession) => void
}

export function SearchDialog({ open, onOpenChange, onSessionSelect }: SearchDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ChatSession[]>([])

  useEffect(() => {
    if (query.trim()) {
      const searchResults = ChatStorage.searchSessions(query)
      setResults(searchResults)
    } else {
      setResults([])
    }
  }, [query])

  const handleSessionClick = (session: ChatSession) => {
    onSessionSelect(session)
    onOpenChange(false)
    setQuery("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Conversations</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search your conversations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-96">
          <div className="space-y-2">
            {results.map((session) => (
              <Button
                key={session.id}
                variant="ghost"
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => handleSessionClick(session)}
              >
                <div className="space-y-1">
                  <div className="font-medium truncate">
                    {session.title !== "New Chat"
                      ? session.title
                      : session.messages.find((m) => m.role === "user")?.content.slice(0, 60) + "..." || "New Chat"}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {session.messages.length} messages • {session.updatedAt.toLocaleDateString()}
                  </div>
                </div>
              </Button>
            ))}

            {query && results.length === 0 && (
              <div className="text-center text-gray-500 py-8">No conversations found matching "{query}"</div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
