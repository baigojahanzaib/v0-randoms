import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Build Mobile Apps with AI</h1>
          <p className="text-lg text-slate-600">
            Describe your app idea in natural language and watch it come to life with React Native and Expo
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <form action="/chat" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-base">
                Describe your mobile app
              </Label>
              <textarea
                id="prompt"
                name="prompt"
                placeholder="Create a weather app that shows the current temperature, conditions, and 5-day forecast..."
                className="min-h-32 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                required
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  <Upload className="h-4 w-4" />
                  <span>Attach images or files</span>
                  <Input id="file-upload" type="file" className="hidden" multiple />
                </Label>
              </div>
              <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800">
                Start Building
              </Button>
            </div>
          </form>
        </div>

        <div className="text-center text-sm text-slate-500">
          Powered by Gemini AI and Expo. Your code will be hosted securely.
        </div>
      </div>
    </div>
  )
}
