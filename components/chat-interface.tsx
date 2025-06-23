"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Paperclip, Send, Copy, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react"
import { type ChatMessage, type ChatSession, aiClient } from "@/lib/ai-client"

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface ChatInterfaceProps {
  session: ChatSession
  onSessionUpdate: (session: ChatSession) => void
}

export function ChatInterface({ session, onSessionUpdate }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [session.messages, streamingMessage])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    const updatedSession = {
      ...session,
      messages: [...session.messages, userMessage],
      updatedAt: new Date(),
    }

    onSessionUpdate(updatedSession)
    setInputValue("")
    setIsGenerating(true)
    setStreamingMessage("")

    try {
      let fullResponse = ""

      for await (const chunk of aiClient.streamResponse(updatedSession.messages)) {
        fullResponse += chunk
        setStreamingMessage(fullResponse)
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fullResponse,
        timestamp: new Date(),
      }

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
        updatedAt: new Date(),
      }

      onSessionUpdate(finalSession)
      setStreamingMessage("")
    } catch (error) {
      console.error("Error generating response:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const regenerateResponse = async (messageIndex: number) => {
    if (isGenerating) return

    const messagesUpToPoint = session.messages.slice(0, messageIndex)
    setIsGenerating(true)
    setStreamingMessage("")

    try {
      let fullResponse = ""

      for await (const chunk of aiClient.streamResponse(messagesUpToPoint)) {
        fullResponse += chunk
        setStreamingMessage(fullResponse)
      }

      const newMessages = [...messagesUpToPoint]
      newMessages[messageIndex] = {
        ...session.messages[messageIndex],
        content: fullResponse,
        timestamp: new Date(),
      }

      const updatedSession = {
        ...session,
        messages: newMessages,
        updatedAt: new Date(),
      }

      onSessionUpdate(updatedSession)
      setStreamingMessage("")
    } catch (error) {
      console.error("Error regenerating response:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {session.messages.map((message, index) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${message.role === "user" ? "order-2" : "order-1"}`}>
                <Card
                  className={`p-4 ${
                    message.role === "user" ? "bg-blue-500 text-white ml-auto" : "bg-gray-50 dark:bg-gray-800"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>

                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(message.content)}
                        className="h-8 px-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => regenerateResponse(index)}
                        className="h-8 px-2"
                        disabled={isGenerating}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </Card>

                <div className={`text-xs text-gray-500 mt-1 ${message.role === "user" ? "text-right" : "text-left"}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>

              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  message.role === "user"
                    ? "bg-blue-500 text-white order-1 mr-3"
                    : "bg-gray-200 dark:bg-gray-700 order-2 ml-3"
                }`}
              >
                {message.role === "user" ? "U" : "G"}
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[80%] order-1">
                <Card className="p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="whitespace-pre-wrap break-words">
                    {streamingMessage}
                    <span className="animate-pulse">|</span>
                  </div>
                </Card>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-200 dark:bg-gray-700 order-2 ml-3">
                G
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto">
          <Card className="relative bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Grok anything..."
                className="w-full bg-transparent border-none outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 min-h-[60px] max-h-[120px] overflow-y-auto"
                rows={3}
                disabled={isGenerating}
              />

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2 rounded-full">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => {
                      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
                        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
                        const recognition = new SpeechRecognition()

                        recognition.continuous = false
                        recognition.interimResults = false
                        recognition.lang = "en-US"

                        recognition.onstart = () => {
                          console.log("Speech recognition started")
                        }

                        recognition.onresult = (event) => {
                          const transcript = event.results[0][0].transcript
                          setInputValue((prev) => prev + (prev ? " " : "") + transcript)
                        }

                        recognition.onerror = (event) => {
                          console.error("Speech recognition error:", event.error)
                        }

                        recognition.start()
                      } else {
                        console.log("Speech recognition not supported")
                      }
                    }}
                    aria-label="Voice input"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M15.7806 10.1963C16.1326 10.3011 16.3336 10.6714 16.2288 11.0234L16.1487 11.2725C15.3429 13.6262 13.2236 15.3697 10.6644 15.6299L10.6653 16.835H12.0833L12.2171 16.8486C12.5202 16.9106 12.7484 17.1786 12.7484 17.5C12.7484 17.8214 12.5202 18.0894 12.2171 18.1514L12.0833 18.165H7.91632C7.5492 18.1649 7.25128 17.8672 7.25128 17.5C7.25128 17.1328 7.5492 16.8351 7.91632 16.835H9.33527L9.33429 15.6299C6.775 15.3697 4.6558 13.6262 3.84992 11.2725L3.76984 11.0234L3.74445 10.8906C3.71751 10.5825 3.91011 10.2879 4.21808 10.1963C4.52615 10.1047 4.84769 10.2466 4.99347 10.5195L5.04523 10.6436L5.10871 10.8418C5.8047 12.8745 7.73211 14.335 9.99933 14.335C12.3396 14.3349 14.3179 12.7789 14.9534 10.6436L15.0052 10.5195C15.151 10.2466 15.4725 10.1046 15.7806 10.1963ZM12.2513 5.41699C12.2513 4.17354 11.2437 3.16521 10.0003 3.16504C8.75675 3.16504 7.74835 4.17343 7.74835 5.41699V9.16699C7.74853 10.4104 8.75685 11.418 10.0003 11.418C11.2436 11.4178 12.2511 10.4103 12.2513 9.16699V5.41699ZM13.5814 9.16699C13.5812 11.1448 11.9781 12.7479 10.0003 12.748C8.02232 12.748 6.41845 11.1449 6.41828 9.16699V5.41699C6.41828 3.43889 8.02221 1.83496 10.0003 1.83496C11.9783 1.83514 13.5814 3.439 13.5814 5.41699V9.16699Z"></path>
                    </svg>
                  </Button>

                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isGenerating}
                    size="sm"
                    className="rounded-full"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
