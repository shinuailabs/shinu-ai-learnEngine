import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Navbar } from './components/layout/navbar'
import { SearchHeader } from './components/layout/search-header'
import { ThemeProvider } from './components/theme-provider'
import { PipelineDashboard } from './features/pipeline/pipeline-dashboard'
import {
  getLatestRun,
  getPapersStatus,
  getRunBundle,
  queryPapers,
  searchPipeline,
  triggerAssignments,
  triggerComparison,
  triggerSummaries,
  triggerTranscripts,
} from './lib/api'
import type { ArtifactGenerationRequest } from './lib/types'

const defaultArtifactRequest: ArtifactGenerationRequest = {
  refresh: false,
  transcript_language: 'en',
  use_ai_insights: false,
}

function App() {
  const queryClient = useQueryClient()
  const [selectedRunId, setSelectedRunId] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('CrewAI Tutorial')
  const [maxVideos, setMaxVideos] = useState(4)
  const [transcriptLanguage, setTranscriptLanguage] = useState('en')
  const [numWorkers, setNumWorkers] = useState(4)
  const [papersQuery, setPapersQuery] = useState('What are the main architectures for AI agents?')

  const latestRunQuery = useQuery({
    queryKey: ['runs', 'latest'],
    queryFn: getLatestRun,
  })

  const activeRunId = selectedRunId || latestRunQuery.data?.run_id || ''

  const runBundleQuery = useQuery({
    enabled: Boolean(activeRunId),
    queryKey: ['runs', activeRunId, 'bundle'],
    queryFn: () => getRunBundle(activeRunId),
  })

  const papersStatusQuery = useQuery({
    queryKey: ['papers', 'status'],
    queryFn: getPapersStatus,
  })

  const runMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Create the run
      const result = await searchPipeline({
        query: searchQuery,
        max_videos: maxVideos,
        transcript_language: transcriptLanguage,
        num_workers: numWorkers,
        use_env_keys: true,
        prefer_cache: false,
      })

      // Update the UI immediately to show the new run
      setSelectedRunId(result.run_id)
      void queryClient.invalidateQueries({ queryKey: ['runs', result.run_id, 'bundle'] })

      // Step 2: Trigger artifacts in background (but await them here to track mutation pending state)
      try {
        await triggerTranscripts(result.run_id, {
          ...defaultArtifactRequest,
          transcript_language: transcriptLanguage,
          num_workers: numWorkers,
        })
        void queryClient.invalidateQueries({ queryKey: ['runs', result.run_id, 'bundle'] })

        await triggerSummaries(result.run_id, {
          ...defaultArtifactRequest,
          transcript_language: transcriptLanguage,
          num_workers: numWorkers,
        })
        void queryClient.invalidateQueries({ queryKey: ['runs', result.run_id, 'bundle'] })

        await Promise.all([
          triggerComparison(result.run_id, {
            ...defaultArtifactRequest,
            transcript_language: transcriptLanguage,
            num_workers: numWorkers,
            use_ai_insights: false,
          }),
          triggerAssignments(result.run_id, {
            ...defaultArtifactRequest,
            transcript_language: transcriptLanguage,
            num_workers: numWorkers,
          }),
        ])
        void queryClient.invalidateQueries({ queryKey: ['runs', result.run_id, 'bundle'] })
      } catch (err) {
        console.error("Artifact generation background tasks failed:", err)
      }

      return result
    },
    onSuccess: (result) => {
      setStatusMessage('Analysis complete.')
      void queryClient.invalidateQueries({ queryKey: ['runs', 'latest'] })
    },
    onError: (error) => {
      setStatusMessage(error.message)
    },
  })

  const papersMutation = useMutation({
    mutationFn: () => queryPapers(papersQuery),
    onError: (error) => setStatusMessage(error.message),
  })

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background transition-colors duration-500 selection:bg-primary/20 selection:text-primary">
        <Navbar />
        
        {/* Subtle Watermark */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-[0.03] dark:opacity-[0.05] z-0">
          <img 
            src="/brand/ShinuAILabs_Logo.png" 
            alt="" 
            className="absolute -right-24 -top-24 h-[600px] w-[600px] object-contain rotate-12"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>

        <main className="relative z-10 mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
          <SearchHeader
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSearch={() => runMutation.mutate()}
            isPending={runMutation.isPending}
            maxVideos={maxVideos}
            onMaxVideosChange={setMaxVideos}
            transcriptLanguage={transcriptLanguage}
            onTranscriptLanguageChange={setTranscriptLanguage}
            numWorkers={numWorkers}
            onNumWorkersChange={setNumWorkers}
          />

          <div className="mt-12">
            <PipelineDashboard
              activeRunId={activeRunId}
              bundle={runBundleQuery.data}
              error={runBundleQuery.error instanceof Error ? runBundleQuery.error.message : undefined}
              isLoading={runBundleQuery.isLoading || latestRunQuery.isLoading || runMutation.isPending}
              isRunning={runMutation.isPending}
              onStartRun={() => runMutation.mutate()}
              papersMutation={papersMutation}
              papersStatus={papersStatusQuery.data}
              onPapersQueryChange={setPapersQuery}
              papersQuery={papersQuery}
            />
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App
