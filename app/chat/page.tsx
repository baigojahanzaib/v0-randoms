"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Eye, Send, Upload, AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import ChatMessage from "@/components/chat-message"
import CodeEditor from "@/components/code-editor"
import MobilePreview from "@/components/mobile-preview"
import { useSearchParams } from "next/navigation"
import { generateCode } from "@/lib/ai-service"
import { createSandbox } from "@/lib/sandbox-service"
import { captureException } from "@/lib/sentry"
import { trackEvent } from "@/lib/analytics"
import { motion, AnimatePresence } from "framer-motion"

export default function ChatPage() {
  const searchParams = useSearchParams()
  const initialPrompt = searchParams.get("prompt") || ""

  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("preview")
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({})
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [sandboxId, setSandboxId] = useState("")
  const [error, setError] = useState<string | null>(null)

  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialPrompt) {
      handleInitialPrompt(initialPrompt)
    }
  }, [initialPrompt])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleInitialPrompt = async (prompt: string) => {
    setIsLoading(true)
    setError(null)

    // Track event
    trackEvent("initial_prompt", { prompt_length: prompt.length })

    // Add user message
    setMessages([{ role: "user", content: prompt }])

    try {
      // Add thinking message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Thinking about how to build your app...",
          status: "thinking",
        },
      ])

      // Generate code using AI
      const response = await generateCode(prompt)

      // Create sandbox
      const { sandboxId, files, qrCode } = await createSandbox(response.files)

      setSandboxId(sandboxId)
      setProjectFiles(files)
      setQrCodeUrl(qrCode)

      // Track successful code generation
      trackEvent("code_generated", {
        file_count: Object.keys(response.files).length,
        sandbox_id: sandboxId,
      })

      // Update assistant message with completed status
      setMessages((prev) => [
        prev[0],
        {
          role: "assistant",
          content: response.explanation,
          files: response.files,
          status: "completed",
        },
      ])

      toast({
        title: "App created successfully!",
        description: "Your mobile app has been generated and is ready to preview.",
      })
    } catch (error) {
      console.error("Error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"

      setError(errorMessage)
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        prompt,
        action: "initial_prompt",
      })

      trackEvent("error", {
        error_type: "initial_prompt_error",
        error_message: errorMessage,
      })

      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error while building your app. Please try again with a different description.",
          status: "error",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input
    setInput("")
    setIsLoading(true)
    setError(null)

    // Track event
    trackEvent("send_message", { message_length: userMessage.length })

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    try {
      // Add thinking message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Thinking about your request...",
          status: "thinking",
        },
      ])

      // Generate code update using AI
      const response = await generateCode(userMessage, projectFiles)

      // Update sandbox
      const { files, qrCode } = await createSandbox(response.files, sandboxId)

      setProjectFiles(files)
      setQrCodeUrl(qrCode)

      // Track successful code update
      trackEvent("code_updated", {
        file_count: Object.keys(response.changedFiles || {}).length,
      })

      // Update assistant message with completed status
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: response.explanation,
          files: response.changedFiles,
          status: "completed",
        },
      ])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"

      setError(errorMessage)
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        message: userMessage,
        action: "send_message",
      })

      trackEvent("error", {
        error_type: "message_error",
        error_message: errorMessage,
      })

      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error while processing your request. Please try again with a different description.",
          status: "error",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    if (messages.length >= 2) {
      const lastUserMessage = messages.filter((m) => m.role === "user").pop()
      if (lastUserMessage) {
        // Remove the last assistant message
        setMessages(messages.filter((m) => m.status !== "error"))

        // Retry with the last user message
        setInput(lastUserMessage.content)
      }
    }
    setError(null)
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Chat sidebar */}
      <div className="w-full md:w-1/3 flex flex-col border-r border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Alert variant="destructive" className="m-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <p>{error}</p>
                  <Button size="sm" variant="outline" onClick={handleRetry}>
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChatMessage message={message} />
            </motion.div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to modify your app..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="outline" disabled={isLoading}>
              <Upload className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Preview and code area */}
      <div className="hidden md:flex md:w-2/3 flex-col">
        <div className="p-4 border-b border-slate-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="preview" className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-1">
                <Code className="h-4 w-4" />
                Code
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === "preview" ? (
            <MobilePreview qrCodeUrl={qrCodeUrl} sandboxId={sandboxId} />
          ) : (
            <CodeEditor files={projectFiles} sandboxId={sandboxId} onFilesChange={setProjectFiles} />
          )}
        </div>
      </div>
    </div>
  )
}
