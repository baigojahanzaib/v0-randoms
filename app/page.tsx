"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Search,
  History,
  Plus,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Edit,
  Newspaper,
  Users,
  Paperclip,
  PanelLeftClose,
} from "lucide-react"
import { ChatInterface } from "@/components/chat-interface"
import { ChatHistory } from "@/components/chat-history"
import { SearchDialog } from "@/components/search-dialog"
import type { ChatSession, ChatMessage } from "@/lib/ai-client"
import { ChatStorage } from "@/lib/chat-storage"

export default function GrokInterface() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [historyExpanded, setHistoryExpanded] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)

  // Chat state
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)

  // Load sessions on mount
  useEffect(() => {
    const loadedSessions = ChatStorage.getSessions()
    setSessions(loadedSessions)
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setActiveSession(newSession)
    setShowWelcome(false)
  }

  const handleSessionUpdate = (updatedSession: ChatSession) => {
    // Update title based on first message if it's still "New Chat"
    if (updatedSession.title === "New Chat" && updatedSession.messages.length > 0) {
      const firstUserMessage = updatedSession.messages.find((m) => m.role === "user")
      if (firstUserMessage) {
        updatedSession.title =
          firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "")
      }
    }

    ChatStorage.saveSession(updatedSession)
    setActiveSession(updatedSession)

    // Refresh sessions list
    const updatedSessions = ChatStorage.getSessions()
    setSessions(updatedSessions)
  }

  const handleSessionSelect = (session: ChatSession) => {
    setActiveSession(session)
    setShowWelcome(false)
  }

  const handleSessionDelete = (sessionId: string) => {
    if (activeSession?.id === sessionId) {
      setActiveSession(null)
      setShowWelcome(true)
    }
  }

  const refreshSessions = () => {
    const loadedSessions = ChatStorage.getSessions()
    setSessions(loadedSessions)
  }

  const handleWelcomeSubmit = () => {
    if (!inputValue.trim()) return

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    newSession.messages = [userMessage]
    newSession.title = inputValue.slice(0, 50) + (inputValue.length > 50 ? "..." : "")

    setActiveSession(newSession)
    setShowWelcome(false)
    setInputValue("")

    // This will trigger the AI response in ChatInterface
    setTimeout(() => {
      handleSessionUpdate(newSession)
    }, 100)
  }

  const suggestionButtons = [
    { icon: ImageIcon, label: "Create Images", prompt: "Help me create an image of a futuristic city" },
    { icon: Edit, label: "Edit Text", prompt: "Help me improve this text: " },
    { icon: Newspaper, label: "Latest News", prompt: "What are the latest developments in AI technology?" },
    { icon: Users, label: "Personas", prompt: "Act as a creative writing assistant and help me brainstorm ideas" },
  ]

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-14" : "w-64"} transition-all duration-200 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-center p-3">
          {sidebarCollapsed ? (
            <div className="flex items-center justify-center relative group">
              <svg width="35" height="33" viewBox="0 0 35 33" fill="none" className="fill-black dark:fill-white">
                <path
                  d="M13.2371 21.0407L24.3186 12.8506C24.8619 12.4491 25.6384 12.6057 25.8973 13.2294C27.2597 16.5185 26.651 20.4712 23.9403 23.1851C21.2297 25.8989 17.4581 26.4941 14.0108 25.1386L10.2449 26.8843C15.6463 30.5806 22.2053 29.6665 26.304 25.5601C29.5551 22.3051 30.562 17.8683 29.6205 13.8673L29.629 13.8758C28.2637 7.99809 29.9647 5.64871 33.449 0.844576C33.5314 0.730667 33.6139 0.616757 33.6964 0.5L29.1113 5.09055V5.07631L13.2343 21.0436"
                  fill="currentColor"
                />
                <path
                  d="M10.9503 23.0313C7.07343 19.3235 7.74185 13.5853 11.0498 10.2763C13.4959 7.82722 17.5036 6.82767 21.0021 8.2971L24.7595 6.55998C24.0826 6.07017 23.215 5.54334 22.2195 5.17313C17.7198 3.31926 12.3326 4.24192 8.67479 7.90126C5.15635 11.4239 4.0499 16.8403 5.94992 21.4622C7.36924 24.9165 5.04257 27.3598 2.69884 29.826C1.86829 30.7002 1.0349 31.5745 0.36364 32.5L10.9474 23.0341"
                  fill="currentColor"
                />
              </svg>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="absolute inset-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <PanelLeftClose className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center w-full justify-between">
              <div className="flex items-center">
                <svg width="35" height="33" viewBox="0 0 35 33" fill="none" className="fill-black dark:fill-white">
                  <path
                    d="M13.2371 21.0407L24.3186 12.8506C24.8619 12.4491 25.6384 12.6057 25.8973 13.2294C27.2597 16.5185 26.651 20.4712 23.9403 23.1851C21.2297 25.8989 17.4581 26.4941 14.0108 25.1386L10.2449 26.8843C15.6463 30.5806 22.2053 29.6665 26.304 25.5601C29.5551 22.3051 30.562 17.8683 29.6205 13.8673L29.629 13.8758C28.2637 7.99809 29.9647 5.64871 33.449 0.844576C33.5314 0.730667 33.6139 0.616757 33.6964 0.5L29.1113 5.09055V5.07631L13.2343 21.0436"
                    fill="currentColor"
                  />
                  <path
                    d="M10.9503 23.0313C7.07343 19.3235 7.74185 13.5853 11.0498 10.2763C13.4959 7.82722 17.5036 6.82767 21.0021 8.2971L24.7595 6.55998C24.0826 6.07017 23.215 5.54334 22.2195 5.17313C17.7198 3.31926 12.3326 4.24192 8.67479 7.90126C5.15635 11.4239 4.0499 16.8403 5.94992 21.4622C7.36924 24.9165 5.04257 27.3598 2.69884 29.826C1.86829 30.7002 1.0349 31.5745 0.36364 32.5L10.9474 23.0341"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8 p-0"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="px-3 mb-4">
            <Button
              variant="outline"
              className="w-full justify-between text-gray-500 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-full"
              onClick={() => setSearchOpen(true)}
            >
              <span className="flex items-center gap-2">
                <span>Search</span>
                <span className="text-xs">Ctrl+K</span>
              </span>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 px-3 pl-[7px]">
          {/* Search button for collapsed mode */}
          {sidebarCollapsed && (
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                className="w-10 h-10 p-0 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="space-y-1">
            {/* New Chat */}
            <Button
              variant="ghost"
              className={`${sidebarCollapsed ? "w-10 h-10 p-0 rounded-full justify-center" : "w-full justify-start gap-3"} text-gray-700 dark:text-gray-300 my-0 mx-px px-0 py-0 ${!sidebarCollapsed ? "pl-1.5" : ""}`}
              onClick={createNewChat}
            >
              <Plus className="h-5 w-5" />
              {!sidebarCollapsed && "New Chat"}
            </Button>

            {/* Chat History */}
            <Button
              variant="ghost"
              className={`${sidebarCollapsed ? "w-10 h-10 p-0 rounded-full justify-center" : "justify-between w-full px-1.5"} text-gray-700 dark:text-gray-300 mb-0.5`}
              onClick={() => setHistoryExpanded(!historyExpanded)}
            >
              <div className="flex items-center gap-3">
                <History className="h-5 w-5" />
                {!sidebarCollapsed && "Chat History"}
              </div>
              {!sidebarCollapsed &&
                (historyExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
            </Button>

            {historyExpanded && !sidebarCollapsed && (
              <div className="max-h-[22rem] overflow-y-auto">
                <ChatHistory
                  sessions={sessions}
                  activeSessionId={activeSession?.id || null}
                  onSessionSelect={handleSessionSelect}
                  onSessionDelete={handleSessionDelete}
                  onSessionsUpdate={refreshSessions}
                />
              </div>
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium">
              JB
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">Jahanzaib Baigo</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {activeSession && (
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{activeSession.title}</h1>
            )}
          </div>
        </div>

        {/* Content */}
        {showWelcome ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full">
            {/* Logo */}
            <div className="mb-12">
              <svg width="320" height="64" viewBox="0 0 88 33" fill="none" className="fill-black dark:fill-white">
                <path
                  d="M76.4462 24.7077V8.41584H79.0216V19.1679L84.4685 12.9109H87.5908L82.6908 18.2731L87.6364 24.7077H84.5596L80.5539 19.1788L79.0216 19.1679V24.7077H76.4462Z"
                  fill="currentColor"
                />
                <path
                  d="M68.6362 24.9815C64.8074 24.9815 62.7335 22.2662 62.7335 18.7979C62.7335 15.3068 64.8074 12.6143 68.6362 12.6143C72.4878 12.6143 74.5389 15.3068 74.5389 18.7979C74.5389 22.2662 72.4878 24.9815 68.6362 24.9815ZM65.4228 18.7979C65.4228 21.4904 66.8813 22.8366 68.6362 22.8366C70.4139 22.8366 71.8497 21.4904 71.8497 18.7979C71.8497 16.1054 70.4139 14.7363 68.6362 14.7363C66.8813 14.7363 65.4228 16.1054 65.4228 18.7979Z"
                  fill="currentColor"
                />
                <path
                  d="M55.5659 24.7077V14.782L57.731 12.9109H62.3347V15.1014H58.1413V24.7077H55.5659Z"
                  fill="currentColor"
                />
                <path
                  d="M45.7187 25.009C40.8101 25.009 37.8834 21.4448 37.8834 16.5846C37.8834 11.6788 40.9146 8.02795 45.8145 8.02795C49.6433 8.02795 52.4466 9.99027 53.1075 13.6411H50.1675C49.7345 11.5647 48.0024 10.401 45.8145 10.401C42.282 10.401 40.7322 13.4586 40.7322 16.5846C40.7322 19.7106 42.282 22.7454 45.8145 22.7454C49.1875 22.7454 50.6689 20.3039 50.7828 18.2731H45.7006V15.9105H53.381L53.3684 17.1457C53.3684 21.7359 51.4978 25.009 45.7187 25.009Z"
                  fill="currentColor"
                />
                <path
                  d="M13.2371 21.0407L24.3186 12.8506C24.8619 12.4491 25.6384 12.6057 25.8973 13.2294C27.2597 16.5185 26.651 20.4712 23.9403 23.1851C21.2297 25.8989 17.4581 26.4941 14.0108 25.1386L10.2449 26.8843C15.6463 30.5806 22.2053 29.6665 26.304 25.5601C29.5551 22.3051 30.562 17.8683 29.6205 13.8673L29.629 13.8758C28.2637 7.99809 29.9647 5.64871 33.449 0.844576C33.5314 0.730667 33.6139 0.616757 33.6964 0.5L29.1113 5.09055V5.07631L13.2343 21.0436"
                  fill="currentColor"
                />
                <path
                  d="M10.9503 23.0313C7.07343 19.3235 7.74185 13.5853 11.0498 10.2763C13.4959 7.82722 17.5036 6.82767 21.0021 8.2971L24.7595 6.55998C24.0826 6.07017 23.215 5.54334 22.2195 5.17313C17.7198 3.31926 12.3326 4.24192 8.67479 7.90126C5.15635 11.4239 4.0499 16.8403 5.94992 21.4622C7.36924 24.9165 5.04257 27.3598 2.69884 29.826C1.86829 30.7002 1.0349 31.5745 0.36364 32.5L10.9474 23.0341"
                  fill="currentColor"
                />
              </svg>
            </div>

            {/* Suggestion Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-2xl">
              {suggestionButtons.map((button, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => {
                    setInputValue(button.prompt)
                  }}
                >
                  <button.icon className="h-6 w-6" />
                  <span className="text-sm">{button.label}</span>
                </Button>
              ))}
            </div>

            {/* Input Area */}
            <div className="w-full max-w-3xl">
              <Card className="relative bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-4">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleWelcomeSubmit()
                      }
                    }}
                    placeholder="What do you want to know?"
                    className="w-full bg-transparent border-none outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 min-h-[60px] max-h-[120px] overflow-y-auto"
                    rows={3}
                  />

                  {/* Bottom Controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2 rounded-full">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleWelcomeSubmit}
                        disabled={!inputValue.trim()}
                        size="sm"
                        className="rounded-full"
                      >
                        Start Chat
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : activeSession ? (
          <ChatInterface session={activeSession} onSessionUpdate={handleSessionUpdate} />
        ) : null}
      </div>

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} onSessionSelect={handleSessionSelect} />
    </div>
  )
}
