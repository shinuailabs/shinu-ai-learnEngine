import { Search, Settings2, Sparkles, Loader2, Play } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'

interface SearchHeaderProps {
  onSearch: () => void
  query: string
  onQueryChange: (val: string) => void
  isPending: boolean
  maxVideos: number
  onMaxVideosChange: (val: number) => void
  transcriptLanguage: string
  onTranscriptLanguageChange: (val: string) => void
  numWorkers: number
  onNumWorkersChange: (val: number) => void
}

export function SearchHeader({
  onSearch,
  query,
  onQueryChange,
  isPending,
  maxVideos,
  onMaxVideosChange,
  transcriptLanguage,
  onTranscriptLanguageChange,
  numWorkers,
  onNumWorkersChange,
}: SearchHeaderProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isPending) {
      onSearch()
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 py-12 text-center">
      <div className="space-y-4">
        <h2 className="flex items-center justify-center gap-3 text-4xl font-bold tracking-tight text-card-foreground md:text-5xl">
          🚀 Learn Anything with AI
        </h2>
        <p className="text-lg text-muted-foreground">
          Search, analyze, and master topics using AI-powered learning workflows
        </p>
      </div>

      <div className="relative">
        <form onSubmit={handleSubmit} className="group relative flex flex-col gap-4">
          <div className="relative flex items-center overflow-hidden rounded-[24px] border border-border bg-card shadow-2xl transition-all focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="ml-6 h-6 w-6 text-muted-foreground" />
            <input
              type="text"
              placeholder="What do you want to learn today?"
              className="h-16 w-full bg-transparent px-4 text-lg outline-none placeholder:text-muted-foreground/60"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
            <Button
              type="submit"
              disabled={isPending || !query.trim()}
              className="mr-2 h-12 gap-2 rounded-[18px] px-8"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
              {isPending ? 'Processing...' : 'Run'}
            </Button>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <Settings2 className="h-4 w-4" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>

          {showAdvanced && (
            <Card className="grid grid-cols-1 gap-6 p-6 animate-in sm:grid-cols-3">
              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Max Videos
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm outline-none focus:border-primary/50"
                  value={maxVideos}
                  onChange={(e) => onMaxVideosChange(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Language
                </label>
                <select
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm outline-none focus:border-primary/50"
                  value={transcriptLanguage}
                  onChange={(e) => onTranscriptLanguageChange(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Workers
                </label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm outline-none focus:border-primary/50"
                  value={numWorkers}
                  onChange={(e) => onNumWorkersChange(Number(e.target.value))}
                />
              </div>
            </Card>
          )}
        </form>
      </div>
    </div>
  )
}
