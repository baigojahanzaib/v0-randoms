"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import type { editor } from "monaco-editor"

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  height?: string
}

export default function MonacoEditor({ value, onChange, language = "javascript", height = "100%" }: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let editorInstance: editor.IStandaloneCodeEditor | null = null

    const initMonaco = async () => {
      if (!editorRef.current) return

      const monaco = await import("monaco-editor")

      // Register language support for JSX/TSX
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.React,
        jsxFactory: "React.createElement",
        reactNamespace: "React",
        allowNonTsExtensions: true,
        allowJs: true,
        target: monaco.languages.typescript.ScriptTarget.Latest,
      })

      // Set the language based on file extension
      const getLanguageFromFilename = (filename: string) => {
        if (filename.endsWith(".js") || filename.endsWith(".jsx")) return "javascript"
        if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "typescript"
        if (filename.endsWith(".json")) return "json"
        if (filename.endsWith(".css")) return "css"
        if (filename.endsWith(".html")) return "html"
        return "javascript"
      }

      editorInstance = monaco.editor.create(editorRef.current, {
        value,
        language: getLanguageFromFilename(language),
        theme: "vs-dark",
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        fontFamily: "Menlo, Monaco, 'Courier New', monospace",
        tabSize: 2,
        wordWrap: "on",
        lineNumbers: "on",
      })

      editorInstance.onDidChangeModelContent(() => {
        onChange(editorInstance?.getValue() || "")
      })

      setEditorInstance(editorInstance)
      setIsLoading(false)
    }

    initMonaco()

    return () => {
      editorInstance?.dispose()
    }
  }, [])

  // Update editor value when prop changes
  useEffect(() => {
    if (editorInstance && value !== editorInstance.getValue()) {
      editorInstance.setValue(value)
    }
  }, [value, editorInstance])

  // Update editor language when prop changes
  useEffect(() => {
    if (editorInstance) {
      const model = editorInstance.getModel()
      if (model) {
        const monaco = (window as any).monaco
        if (monaco) {
          monaco.editor.setModelLanguage(model, language)
        }
      }
    }
  }, [language, editorInstance])

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 bg-opacity-50">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      <div ref={editorRef} style={{ height, width: "100%" }} />
    </div>
  )
}
