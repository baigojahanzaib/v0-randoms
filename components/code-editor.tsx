"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Play, Save } from "lucide-react"
import { updateSandbox } from "@/lib/sandbox-service"
import MonacoEditor from "@/components/monaco-editor"
import { captureException } from "@/lib/sentry"

interface CodeEditorProps {
  files: Record<string, string>
  sandboxId: string
  onFilesChange: (files: Record<string, string>) => void
}

export default function CodeEditor({ files, sandboxId, onFilesChange }: CodeEditorProps) {
  const [activeFile, setActiveFile] = useState<string>("")
  const [currentCode, setCurrentCode] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (Object.keys(files).length > 0 && !activeFile) {
      // Set the first file as active by default
      const firstFile = Object.keys(files)[0]
      setActiveFile(firstFile)
      setCurrentCode(files[firstFile])
    }
  }, [files, activeFile])

  useEffect(() => {
    if (activeFile) {
      setCurrentCode(files[activeFile] || "")
    }
  }, [activeFile, files])

  const handleCodeChange = (value: string) => {
    setCurrentCode(value)
    setError(null)
  }

  const handleSaveFile = async () => {
    if (!activeFile) return

    const updatedFiles = {
      ...files,
      [activeFile]: currentCode,
    }

    onFilesChange(updatedFiles)
    setError(null)

    if (sandboxId) {
      setIsLoading(true)
      try {
        await updateSandbox(sandboxId, { [activeFile]: currentCode })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to save file"
        setError(errorMessage)
        captureException(error instanceof Error ? error : new Error(errorMessage), {
          file: activeFile,
          action: "save",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleRunCode = async () => {
    if (!sandboxId) return

    setIsLoading(true)
    setError(null)
    try {
      await updateSandbox(sandboxId, files)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to run code"
      setError(errorMessage)
      captureException(error instanceof Error ? error : new Error(errorMessage), {
        action: "run",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (Object.keys(files).length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4 bg-slate-100">
        <p className="text-slate-500">No code has been generated yet. Describe your app to get started.</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-slate-200 bg-white p-2 flex justify-between items-center">
        <Tabs value={activeFile} onValueChange={setActiveFile} className="w-full overflow-x-auto">
          <TabsList className="flex w-auto h-9 bg-slate-100">
            {Object.keys(files).map((filename) => (
              <TabsTrigger key={filename} value={filename} className="px-3 py-1 text-xs">
                {filename.split("/").pop()}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex gap-2 ml-2">
          <Button size="sm" variant="outline" onClick={handleSaveFile} disabled={isLoading} className="h-8 px-2">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            onClick={handleRunCode}
            disabled={isLoading}
            className="h-8 px-2 bg-slate-900 text-white hover:bg-slate-800"
          >
            <Play className="h-4 w-4 mr-1" />
            Run
          </Button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{error}</div>}

      <div className="flex-1 overflow-hidden">
        {activeFile && <MonacoEditor value={currentCode} onChange={handleCodeChange} language={activeFile} />}
      </div>
    </div>
  )
}
