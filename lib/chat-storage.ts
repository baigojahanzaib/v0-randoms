import type { ChatSession } from "./ai-client"

export class ChatStorage {
  private static STORAGE_KEY = "grok-chat-sessions"

  static getSessions(): ChatSession[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []

      const sessions = JSON.parse(stored)
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }))
    } catch (error) {
      console.error("Error loading chat sessions:", error)
      return []
    }
  }

  static saveSession(session: ChatSession): void {
    if (typeof window === "undefined") return

    try {
      const sessions = this.getSessions()
      const existingIndex = sessions.findIndex((s) => s.id === session.id)

      if (existingIndex >= 0) {
        sessions[existingIndex] = session
      } else {
        sessions.unshift(session)
      }

      // Keep only last 50 sessions
      const trimmedSessions = sessions.slice(0, 50)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedSessions))
    } catch (error) {
      console.error("Error saving chat session:", error)
    }
  }

  static deleteSession(sessionId: string): void {
    if (typeof window === "undefined") return

    try {
      const sessions = this.getSessions()
      const filtered = sessions.filter((s) => s.id !== sessionId)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error("Error deleting chat session:", error)
    }
  }

  static searchSessions(query: string): ChatSession[] {
    const sessions = this.getSessions()
    const lowercaseQuery = query.toLowerCase()

    return sessions.filter(
      (session) =>
        session.title.toLowerCase().includes(lowercaseQuery) ||
        session.messages.some((msg) => msg.content.toLowerCase().includes(lowercaseQuery)),
    )
  }
}
