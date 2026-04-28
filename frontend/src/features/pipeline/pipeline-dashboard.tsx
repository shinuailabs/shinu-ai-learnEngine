import * as Tabs from '@radix-ui/react-tabs'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  CheckCheck,
  Circle,
  Layers3,
  Loader2,
  Workflow,
  Clock,
  BarChart3,
  Lightbulb,
  GraduationCap,
  ChevronRight,
  BookOpen,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import {
  type ReactNode,
  useEffect,
  useState,
  useMemo,
} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import type { AssignmentArtifact, RunBundle, PapersStatusResponse } from '../../lib/types'
import { cn } from '../../lib/utils'
import { PapersPanel } from '../papers/papers-panel'

interface PipelineDashboardProps {
  activeRunId: string
  bundle?: RunBundle
  isLoading: boolean
  error?: string
  onStartRun: () => void
  isRunning: boolean
  papersMutation: any
  papersStatus?: PapersStatusResponse
  onPapersQueryChange: (value: string) => void
  papersQuery: string
}

type ProgressMap = Record<string, boolean>

function MarkdownBody({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-sm prose-invert max-w-none space-y-4 text-sm leading-7 text-muted-foreground">
      <ReactMarkdown
        components={{
          a: ({ className, ...props }) => (
            <a
              className={cn('font-medium text-primary underline decoration-primary/20 underline-offset-4 hover:decoration-primary', className)}
              rel="noreferrer"
              target="_blank"
              {...props}
            />
          ),
          h1: ({ className, ...props }) => (
            <h1 className={cn('text-2xl font-bold tracking-tight text-card-foreground', className)} {...props} />
          ),
          h2: ({ className, ...props }) => (
            <h2 className={cn('text-xl font-bold tracking-tight text-card-foreground', className)} {...props} />
          ),
          h3: ({ className, ...props }) => (
            <h3 className={cn('text-lg font-bold text-card-foreground', className)} {...props} />
          ),
          p: ({ className, ...props }) => <p className={cn('text-muted-foreground', className)} {...props} />,
          ul: ({ className, ...props }) => <ul className={cn('list-disc space-y-2 pl-5', className)} {...props} />,
          ol: ({ className, ...props }) => <ol className={cn('list-decimal space-y-2 pl-5', className)} {...props} />,
          li: ({ className, ...props }) => <li className={cn('text-muted-foreground', className)} {...props} />,
          pre: ({ className, ...props }) => (
            <pre
              className={cn(
                'overflow-x-auto rounded-xl border border-border bg-muted/50 p-4 text-[13px] leading-6 text-card-foreground',
                className,
              )}
              {...props}
            />
          ),
          code: ({ className, ...props }) => (
            <code
              className={cn('rounded bg-muted px-1.5 py-0.5 text-[0.9em] text-card-foreground', className)}
              {...props}
            />
          ),
        }}
        remarkPlugins={[remarkGfm]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

function getVideoThumbnail(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

function trimText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1).trimEnd()}...`
}

export function PipelineDashboard({
  activeRunId,
  bundle,
  isLoading,
  error,
  isRunning,
  papersMutation,
  papersStatus,
  onPapersQueryChange,
  papersQuery,
}: PipelineDashboardProps) {
  const videos = useMemo(() => bundle?.videos.videos ?? [], [bundle])
  const transcripts = useMemo(() => bundle?.transcripts.items ?? [], [bundle])
  const summaries = useMemo(() => bundle?.summaries.items ?? [], [bundle])
  const comparison = useMemo(() => bundle?.comparison.rows ?? [], [bundle])
  const assignments = useMemo(() => bundle?.assignments.items ?? [], [bundle])
  
  const [activeTab, setActiveTab] = useState('roadmap')
  const [assignmentProgress, setAssignmentProgress] = useState<Record<string, ProgressMap>>({})

  useEffect(() => {
    if (!activeRunId) {
      setAssignmentProgress({})
      return
    }

    const nextState: Record<string, ProgressMap> = {}
    for (const item of assignments) {
      const storageKey = `shinu-learn-engine-assignment-progress:${activeRunId}:${item.video_id}`
      const saved = localStorage.getItem(storageKey)
      if (!saved) {
        nextState[item.video_id] = {}
        continue
      }

      try {
        nextState[item.video_id] = JSON.parse(saved) as ProgressMap
      } catch {
        nextState[item.video_id] = {}
      }
    }
    setAssignmentProgress(prev => {
      const isSame = JSON.stringify(prev) === JSON.stringify(nextState)
      return isSame ? prev : nextState
    })
  }, [activeRunId, bundle])

  const toggleAssignmentItem = (videoId: string, itemId: string) => {
    if (!activeRunId) return
    setAssignmentProgress((current) => {
      const nextVideoState = {
        ...(current[videoId] ?? {}),
        [itemId]: !(current[videoId] ?? {})[itemId],
      }
      localStorage.setItem(
        `shinu-learn-engine-assignment-progress:${activeRunId}:${videoId}`,
        JSON.stringify(nextVideoState),
      )
      return { ...current, [videoId]: nextVideoState }
    })
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px,1fr,320px]">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-[600px] w-full animate-pulse rounded-2xl bg-muted" />
        <div className="space-y-4">
          <div className="h-40 w-full animate-pulse rounded-2xl bg-muted" />
          <div className="h-60 w-full animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center border-destructive/20 bg-destructive/5">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-xl font-bold text-card-foreground">Workspace Error</h3>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button variant="secondary" className="mt-6" onClick={() => window.location.reload()}>
          Retry Workspace Load
        </Button>
      </Card>
    )
  }

  if (!bundle) {
    return (
      <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-card-foreground">No Learning Session Active</h3>
        <p className="mt-2 max-w-md text-muted-foreground">
          Enter a topic in the search bar above to generate an AI-powered learning path, videos, and assignments.
        </p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px,1fr,320px] animate-in">
      {/* LEFT PANEL - Video Results */}
      <aside className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-card-foreground">Video Sources</h3>
          <Badge variant="secondary">{videos.length} Results</Badge>
        </div>
        <div className="flex max-h-[800px] flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {videos.map((video) => (
            <a 
              key={video.video_id} 
              href={video.url} 
              target="_blank" 
              rel="noreferrer"
              className="block outline-none"
            >
              <Card className="group overflow-hidden p-0 transition-all hover:ring-2 hover:ring-primary/30">
                <div className="flex h-24 gap-4 p-3">
                  <div className="relative aspect-video flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img src={getVideoThumbnail(video.video_id)} alt={video.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] text-white">
                      {video.duration}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center overflow-hidden">
                    <p className="truncate text-xs font-medium text-primary">{video.channel}</p>
                    <h4 className="mt-1 line-clamp-2 text-sm font-semibold leading-tight text-card-foreground">
                      {video.title}
                    </h4>
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      </aside>

      {/* CENTER PANEL - Workspace */}
      <main className="flex flex-col gap-6">
        <Card className="flex flex-col overflow-hidden border-none bg-card/50 shadow-xl p-0">
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
            <div className="border-b border-border bg-muted/30 px-6 py-2">
              <Tabs.List className="flex gap-2">
                {[
                  ['roadmap', 'Roadmap'],
                  ['transcripts', 'Transcripts'],
                  ['summaries', 'Summaries'],
                  ['comparison', 'Comparison'],
                  ['assignments', 'Assignments'],
                  ['papers', 'Research'],
                ].map(([value, label]) => (
                  <Tabs.Trigger
                    key={value}
                    value={value}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                  >
                    {label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </div>

            <div className="p-8 min-h-[600px]">
              <Tabs.Content value="roadmap" className="animate-in space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-card-foreground tracking-tight">Your Learning Roadmap</h2>
                  <p className="text-muted-foreground">We've structured the content from {videos.length} videos into a sequential learning path.</p>
                </div>

                <div className="space-y-6">
                  {summaries.slice(0, 4).map((item, index) => (
                    <div key={item.video_id} className="relative flex gap-6">
                      {index !== 3 && <div className="absolute left-6 top-10 bottom-[-24px] w-px bg-border" />}
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary shadow-inner">
                        {index + 1}
                      </div>
                      <Card className="flex-1 p-6 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setActiveTab('summaries')}>
                        <h4 className="text-lg font-bold text-card-foreground">{item.title}</h4>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.high_level_overview}</p>
                        <div className="mt-4 flex items-center gap-4">
                          <Badge variant="secondary" className="bg-muted">15-20 mins</Badge>
                          <span className="flex items-center gap-1 text-xs font-medium text-primary">
                            Explore Module <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center pt-6">
                  <Button size="lg" className="h-14 px-10 text-lg shadow-xl" onClick={() => setActiveTab('summaries')}>
                    Start Learning Now
                  </Button>
                </div>
              </Tabs.Content>

              <Tabs.Content value="transcripts" className="animate-in space-y-6">
                {transcripts.map((item) => (
                  <div key={item.video_id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-bold text-card-foreground">{item.title}</h4>
                      <Badge>{item.language}</Badge>
                    </div>
                    <Card className="p-6 bg-muted/20">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {item.cleaned_text || 'No transcript available.'}
                      </p>
                    </Card>
                  </div>
                ))}
              </Tabs.Content>

              <Tabs.Content value="summaries" className="animate-in space-y-8">
                {summaries.length > 0 ? (
                  summaries.map((item) => (
                    <div key={item.video_id} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-card-foreground">
                          <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors decoration-primary/30 underline-offset-4 hover:underline">
                            {item.title}
                          </a>
                        </h3>
                      </div>
                      
                      {item.available ? (
                        <>
                          <MarkdownBody markdown={item.high_level_overview} />
                          <div className="grid gap-6 md:grid-cols-2">
                             <Card className="p-6 border-emerald-500/20 bg-emerald-500/5">
                                <h5 className="flex items-center gap-2 font-bold text-emerald-500 mb-4">
                                  <Lightbulb className="h-4 w-4" /> Key Insights
                                </h5>
                                {item.insights.length > 0 ? (
                                  <ul className="space-y-3">
                                    {item.insights.map((insight, i) => (
                                      <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                        <span className="text-emerald-500 mt-1 font-bold">✓</span> {insight}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">No specific insights available.</p>
                                )}
                             </Card>
                             <Card className="p-6 border-amber-500/20 bg-amber-500/5">
                                <h5 className="flex items-center gap-2 font-bold text-amber-500 mb-4">
                                  <AlertCircle className="h-4 w-4" /> Limitations
                                </h5>
                                {item.limitations.length > 0 ? (
                                  <ul className="space-y-3">
                                    {item.limitations.map((lim, i) => (
                                      <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                        <span className="text-amber-500 mt-1 font-bold">•</span> {lim}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">No limitations noted.</p>
                                )}
                             </Card>
                          </div>
                        </>
                      ) : (
                        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-muted/10">
                          {isRunning ? (
                            <>
                              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
                              <p className="text-sm font-medium text-muted-foreground">Summary generation in progress...</p>
                              <p className="text-xs text-muted-foreground/60 mt-1">This usually takes 30-60 seconds per video.</p>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-8 w-8 text-destructive mb-4" />
                              <p className="text-sm font-medium text-destructive">Summary generation failed.</p>
                              <p className="text-xs text-muted-foreground/60 mt-1">No transcript was found or the AI processing was interrupted.</p>
                            </>
                          )}
                        </Card>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-20 text-center">
                    <p className="text-muted-foreground">No videos available to summarize.</p>
                  </div>
                )}
              </Tabs.Content>

              <Tabs.Content value="comparison" className="animate-in space-y-6">
                <Card className="overflow-hidden border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider">Topic</th>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider">Depth</th>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider">Difficulty</th>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider">Style</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {comparison.map((row) => (
                          <tr key={row.video_id} className="hover:bg-muted/30">
                            <td className="px-6 py-4 font-medium text-card-foreground">
                              <a href={row.url} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors decoration-primary/30 underline-offset-4 hover:underline">
                                {row.title}
                              </a>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{row.content_depth}</td>
                            <td className="px-6 py-4 text-muted-foreground">{row.difficulty}</td>
                            <td className="px-6 py-4 text-muted-foreground">{row.teaching_style}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </Tabs.Content>

              <Tabs.Content value="assignments" className="animate-in space-y-10">
                {assignments.length > 0 ? (
                  assignments.map((item) => {
                    const progressItems = item.checklist.length > 0 
                      ? item.checklist 
                      : item.sections.map(s => ({ id: s.id, label: s.title }))
                    const completedCount = progressItems.filter(p => assignmentProgress[item.video_id]?.[p.id]).length
                    const progressPercent = progressItems.length > 0 ? Math.round((completedCount / progressItems.length) * 100) : 0

                    return (
                      <div key={item.video_id} className="space-y-6">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-card-foreground">📝 AI Generated Assignment</h3>
                            <p className="text-sm text-muted-foreground">Practical tasks based on: {item.title}</p>
                          </div>
                          
                          {item.available && (
                            <div className="w-full max-w-[200px] space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-primary">
                                <span>Progress</span>
                                <span>{progressPercent}%</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-muted shadow-inner">
                                 <motion.div 
                                   className="h-full bg-primary" 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${progressPercent}%` }}
                                   transition={{ duration: 0.5 }}
                                 />
                              </div>
                            </div>
                          )}
                        </div>

                        {item.available ? (
                          <div className="grid gap-8 lg:grid-cols-[1fr,300px]">
                            <div className="space-y-6">
                              {item.sections.length > 0 ? (
                                item.sections.map((section) => (
                                  <Card key={section.id} className="p-8">
                                    <h4 className="text-xl font-bold text-card-foreground mb-4">{section.title}</h4>
                                    <MarkdownBody markdown={section.markdown} />
                                    <div className="mt-8 flex gap-4">
                                      <Button className="h-11 px-8">Submit Answer</Button>
                                      <Button variant="secondary" className="h-11 px-8">Generate Solution</Button>
                                    </div>
                                  </Card>
                                ))
                              ) : (
                                <Card className="p-8">
                                   <h4 className="text-xl font-bold text-card-foreground mb-4">Core Task</h4>
                                   <MarkdownBody markdown={item.markdown || 'No task content available.'} />
                                   <div className="mt-8 flex gap-4">
                                      <Button className="h-11 px-8">Submit Answer</Button>
                                      <Button variant="secondary" className="h-11 px-8">Generate Solution</Button>
                                    </div>
                                </Card>
                              )}
                            </div>

                            <div className="space-y-6">
                              <h5 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Task Checklist</h5>
                              <div className="space-y-3">
                                {progressItems.map((task) => (
                                  <button
                                    key={task.id}
                                    onClick={() => toggleAssignmentItem(item.video_id, task.id)}
                                    className={cn(
                                      "flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left transition-all",
                                      assignmentProgress[item.video_id]?.[task.id] 
                                        ? "bg-primary/10 border-primary/30" 
                                        : "bg-muted/30 hover:bg-muted/50"
                                    )}
                                  >
                                    {assignmentProgress[item.video_id]?.[task.id] 
                                      ? <CheckCircle2 className="h-5 w-5 text-primary" />
                                      : <Circle className="h-5 w-5 text-muted-foreground" />
                                    }
                                    <span className={cn("text-sm font-medium", assignmentProgress[item.video_id]?.[task.id] ? "text-primary" : "text-card-foreground")}>
                                      {task.label}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed bg-muted/10">
                          {isRunning ? (
                            <>
                              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-6" />
                              <h4 className="text-lg font-bold text-card-foreground">Assignment Generation Pending</h4>
                              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                We are creating personalized learning tasks based on the video summaries. This will be available shortly.
                              </p>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-10 w-10 text-destructive mb-6" />
                              <h4 className="text-lg font-bold text-destructive">Assignment Generation Failed</h4>
                              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                We couldn't generate an assignment for this video. This often happens if the transcript or summary is missing.
                              </p>
                            </>
                          )}
                        </Card>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-20 text-center">
                    <p className="text-muted-foreground">No videos available for assignments.</p>
                  </div>
                )}
              </Tabs.Content>

              <Tabs.Content value="papers" className="animate-in">
                <PapersPanel
                  isLoading={papersMutation.isPending}
                  onQueryChange={onPapersQueryChange}
                  onSubmit={() => papersMutation.mutate()}
                  query={papersQuery}
                  result={papersMutation.data}
                  status={papersStatus}
                />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </Card>
      </main>

      {/* RIGHT PANEL - AI Insights */}
      <aside className="flex flex-col gap-8">
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-card-foreground">AI Insights</h3>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
               <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Session Stats</p>
               <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-[10px] uppercase text-muted-foreground">Difficulty</p>
                    <p className="text-sm font-bold text-card-foreground">Beginner</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-[10px] uppercase text-muted-foreground">Est. Time</p>
                    <p className="text-sm font-bold text-card-foreground">~45 mins</p>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
               <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Key Concepts</p>
               <div className="flex flex-wrap gap-2">
                 {['AI Agents', 'LLM Workflow', 'Process Orchestration', 'Multi-Agent systems'].map(tag => (
                   <Badge key={tag} className="bg-primary/5 hover:bg-primary/10 transition-colors border-none py-1.5">{tag}</Badge>
                 ))}
               </div>
            </div>

            <div className="space-y-3 pt-2">
               <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next Up</p>
               <div className="space-y-2">
                 <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-3 text-sm font-medium text-primary cursor-pointer hover:bg-primary/10 transition-all border border-primary/10">
                   <div className="h-2 w-2 rounded-full bg-primary" />
                   LangGraph Masterclass
                 </div>
                 <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted/80 transition-all">
                   <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                   AutoGen with Python
                 </div>
               </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-primary/5 border-primary/20">
           <h4 className="flex items-center gap-2 font-bold text-primary text-sm mb-3">
             <GraduationCap className="h-4 w-4" /> Learning Tip
           </h4>
           <p className="text-xs leading-relaxed text-muted-foreground">
             Try following the implementation steps in the **Summaries** tab before attempting the **Assignments**. Hands-on coding is the fastest way to master AI workflows.
           </p>
        </Card>
      </aside>
    </div>
  )
}
