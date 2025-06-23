import { generateText, streamText } from "ai"
import { groq } from "@ai-sdk/groq"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  attachments?: File[]
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export class AIClient {
  private model = groq("llama-3.1-8b-instant")

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    try {
      const { text } = await generateText({
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        system:
          "You are Grok, a helpful AI assistant created by xAI. You are witty, informative, and slightly rebellious in your responses. Keep your answers helpful but with a touch of humor when appropriate.",
      })

      return text
    } catch (error) {
      console.error("AI generation error:", error)
      return "I'm having trouble generating a response right now. Please try again."
    }
  }

  async *streamResponse(messages: ChatMessage[]) {
    try {
      const result = streamText({
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        system:
          "You are Grok, a helpful AI assistant created by xAI. You are witty, informative, and slightly rebellious in your responses.",
      })

      for await (const chunk of result.textStream) {
        yield chunk
      }
    } catch (error) {
      console.error("AI streaming error:", error)
      yield "I'm having trouble generating a response right now. Please try again."
    }
  }
}

export const aiClient = new AIClient()
