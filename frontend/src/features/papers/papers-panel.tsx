import { BookOpenText, FileText, Search, Loader2, Database, FileStack } from 'lucide-react'
import { type FormEvent } from 'react'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import type { PapersQueryResponse, PapersStatusResponse } from '../../lib/types'

interface PapersPanelProps {
  status?: PapersStatusResponse
  result?: PapersQueryResponse
  query: string
  onQueryChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
}

export function PapersPanel({
  status,
  result,
  query,
  onQueryChange,
  onSubmit,
  isLoading,
}: PapersPanelProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
        <div className="space-y-6">
          <div className="space-y-2">
            <Badge>Academic papers RAG</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-card-foreground">
              Deep Academic Insights
            </h2>
            <p className="text-muted-foreground">
              Query the indexed paper collection and inspect supporting excerpts with AI-powered citations.
            </p>
          </div>

          <Card className="p-0 overflow-hidden border-primary/20">
            <form onSubmit={handleSubmit} className="flex flex-col">
              <textarea
                className="min-h-[160px] w-full border-none bg-card/50 p-6 text-base text-card-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0"
                placeholder="What are the main architectures for AI agents?"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
              />
              <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                   <Database className="h-3 w-3" /> {status?.pdf_count || 0} Papers Indexed
                </p>
                <Button disabled={isLoading || !query.trim()} className="gap-2 h-11 px-6">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {isLoading ? 'Analyzing...' : 'Search papers'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
           <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Index Status</h5>
           <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">PDF Collection</span>
                <Badge variant="secondary">{status?.pdf_count || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Vector Index</span>
                <Badge className={status?.index_exists ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : ""}>
                   {status?.index_exists ? 'Ready' : 'Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">RAG Status</span>
                <div className="flex items-center gap-2">
                   <div className={status?.ready ? "h-2 w-2 rounded-full bg-emerald-500 animate-pulse" : "h-2 w-2 rounded-full bg-amber-500"} />
                   <span className="text-xs font-bold uppercase tracking-wider">{status?.ready ? 'Active' : 'Offline'}</span>
                </div>
              </div>
           </Card>

           <Card className="p-6 bg-primary/5 border-primary/20">
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-bold text-primary">Pro Tip:</span> Academic papers provide rigorous evidence for concepts discussed in videos. Combine both for a comprehensive view.
              </p>
           </Card>
        </div>
      </div>

      {result && !isLoading ? (
        <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] animate-in">
          <Card className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpenText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-card-foreground">AI Synthesis</h3>
                <p className="text-xs text-muted-foreground">Generated from {result.num_sources} academic sources</p>
              </div>
            </div>
            <div className="prose prose-sm prose-invert max-w-none">
               <p className="text-base leading-relaxed text-card-foreground/90 whitespace-pre-wrap">{result.response}</p>
            </div>
          </Card>

          <div className="space-y-6">
             <div className="flex items-center gap-3">
               <FileStack className="h-5 w-5 text-primary" />
               <h4 className="font-bold text-card-foreground">Supporting Citations</h4>
             </div>
             <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
               {result.sources.map((source, index) => (
                 <Card key={`${source.file_name}-${index}`} className="p-5 hover:bg-muted/30 transition-colors">
                   <div className="flex flex-wrap gap-2 mb-3">
                     <Badge variant="secondary" className="lowercase">{source.file_name}</Badge>
                     <Badge className="bg-primary/5 text-primary border-none">Score {source.score.toFixed(3)}</Badge>
                   </div>
                   <p className="text-sm leading-relaxed text-muted-foreground italic">
                     "{trimText(source.text, 280)}"
                   </p>
                 </Card>
               ))}
             </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
