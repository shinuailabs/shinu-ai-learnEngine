# CLAUDE.md — Developer & AI Agent Reference

This file contains developer context, known issues, architecture decisions, and conventions for the **Shinu Learn Engine** codebase. It is intended for AI coding assistants and human developers maintaining or extending this project.

---

## Project Overview

**Shinu Learn Engine** is an AI-powered Learning Intelligence Platform. It takes YouTube videos and academic papers as input and outputs structured learning artifacts: summaries, comparisons, assignments, and RAG-based answers.

**Two operational modes coexist:**

| Mode | Entry Point | Port | Notes |
|---|---|---|---|
| **Gradio UI** (Legacy/Internal) | `app.py` | `7860` | Single command, no build step |
| **React + FastAPI** (Primary) | `backend/main.py` + `frontend/` | `8000` / `5174` | Modern dashboard with real-time updates |

---

## How to Run

### Gradio UI (Primary — use this)

**Windows PowerShell:**
```powershell
$env:PYTHONUTF8='1'; $env:PYTHONUNBUFFERED='1'; .venv\Scripts\python.exe app.py
```

**Linux / macOS:**
```bash
PYTHONUTF8=1 python app.py
```

**Available CLI flags:**
```
--host 127.0.0.1     Host (default: 127.0.0.1)
--port 7860          Port (default: 7860)
--share              Generate a public Gradio share link
--demo               Demo mode: uses cached pipeline_output_* data, no API keys needed
--debug              Show full tracebacks in the Gradio UI
```

### FastAPI Backend (Optional)
```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

### React Frontend (Optional)
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Stored in `.env` at the repository root. Loaded via `python-dotenv`.

| Variable | Purpose |
|---|---|
| `PYTHONUTF8` | **Must be `1` on Windows** to prevent emoji UnicodeEncodeError in cp1252 terminals |
| `PYTHONUNBUFFERED` | Set to `1` for real-time stdout flushing (recommended) |
| `OPENROUTER_API_KEY` | LLM API key for summarization, comparison, and assignment generation |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key for video search |

> `PYTHONUTF8` and `PYTHONUNBUFFERED` are **not** in `.env` — set them as shell env vars before running.

---

## Known Issues & Fixes Applied

### 1. UnicodeEncodeError on Windows
**Symptom:** `UnicodeEncodeError: 'charmap' codec can't encode character '\U0001f4bb'`  
**Root cause:** Windows PowerShell defaults to cp1252 encoding. Emoji in `print()` statements crash the process.  
**Fix:** Always run with `$env:PYTHONUTF8='1'` set, or use `python -X utf8 app.py`.

### 2. Gradio 6 — `show_copy_button` removed from `gr.Textbox`
**Symptom:** `TypeError: Textbox.__init__() got an unexpected keyword argument 'show_copy_button'`  
**Root cause:** The `show_copy_button` parameter was removed in Gradio 6.x.  
**Fix:** Removed `show_copy_button=True` from all five `gr.Textbox` calls in `app.py` (lines ~1575–1670).

### 3. Gradio 6 — `css` moved from `gr.Blocks()` to `app.launch()`
**Symptom:** `UserWarning: The parameters have been moved from the Blocks constructor to the launch() method in Gradio 6.0: css.`  
**Root cause:** In Gradio 6, CSS must be passed to `launch()`, not `gr.Blocks()`.  
**Fix:** Removed `css=css` from `gr.Blocks(...)`. Updated `create_gradio_app()` to return `(app, css)`. Passed `css=css` to `app.launch()` in the `__main__` block.

### 4. Comparison Table — All values showing "Unknown"
**Symptom:** Difficulty, Teaching Style, Content Depth columns all show grey "Unknown" badges.  
**Root cause:** These fields are populated by AI insights (`generate_ai_insights()`). If no summary files exist (0 successful summaries due to API rate limits or failures), `_get_fallback_insights()` returns `"Unknown"` for all categorical fields.  
**Fix (UI):** Unknown/N/A values in those columns now render as an amber **⚠ No data** badge (with a tooltip) instead of a grey "Unknown" badge, clearly communicating to the user that AI summarization must complete first.  
**Root fix:** Ensure `OPENROUTER_API_KEY` is valid and not rate-limited. The summarization step must succeed before comparison AI insights can be generated.

### 5. YouTube Bot Detection / 429 Errors
**Symptom:** `ERROR: [youtube] Sign in to confirm you’re not a bot.` or `HTTP Error 429: Too Many Requests`
**Root cause:** YouTube blocks automated transcript fetching from certain IPs or after too many requests.
**Fix:** 
1.  **Fallback Library**: Added `youtube-transcript-api` as a secondary fetcher in `src/fetch_youtube_transcript.py`.
2.  **UI Feedback**: Updated `PipelineDashboard` to show "Generation Failed" with an explanation if transcripts cannot be retrieved, instead of spinning forever.
3.  **Workaround**: Use a different network (hotspot) or wait for the IP block to lift (usually 30-60 mins).

---

## Architecture

### Core Pipeline Modules (`src/`)

| Module | Purpose |
|---|---|
| `src/youtube_pipeline.py` | YouTube search, transcript fetch, summarization orchestration |
| `src/compare_youtube_outputs.py` | Multi-video comparison table generation |
| `src/assignment_generator.py` | Educational assignment generation from summaries |
| `src/papers_rag.py` | Academic PDF indexing and semantic search (LlamaIndex + LanceDB) |
| `src/fetch_youtube_transcript.py` | Individual transcript fetching |
| `src/summarize_youtube_transcript.py` | Individual transcript summarization |
| `src/configs/config.yaml` | Runtime configuration (model selection, workers, paths, etc.) |

### Gradio App (`app.py`)

- Single ~1810-line file containing the full Gradio UI and all step functions.
- `create_gradio_app()` returns `(app, css)` — both needed for `launch()`.
- Pipeline state is stored in a global `pipeline_state` dict between steps.
- **Fallback / Demo mode:** If YouTube API is unavailable, the app reads from the most recent `pipeline_output_*` folder (read-only). Pass `--demo` to force this mode.
- Step functions are chained via Gradio's `.then()` API for sequential pipeline execution.

#### Comparison Table (`generate_comparison_table_with_script`)

- The table is generated as raw HTML and rendered in a `gr.HTML` component.
- **"Video" column** — A virtual column (not in the DataFrame) built inside the rendering loop using `Video ID` and `URL` columns from the DataFrame.
  - Thumbnail URL pattern: `https://img.youtube.com/vi/{video_id}/mqdefault.jpg`
  - Clicking the thumbnail opens the video on YouTube in a new tab (`target="_blank"`).
  - The `onerror` handler hides the `<img>` if the thumbnail fails to load.
- **Title column** — Rendered as a clickable `<a>` link to the YouTube URL, opening in a new tab.
- **Categorical badges** (Difficulty, Teaching Style, Content Depth):
  - Known values (`Beginner`, `Intermediate`, `Advanced`, `Code-along`, etc.) get colour-coded filled badges.
  - Unknown/empty/N/A values get an amber **⚠ No data** warning badge with a tooltip explaining that AI summarization must run first.
- `available_columns` always prepends `"Video"` and then filters the rest against what's actually in the DataFrame.

### FastAPI Backend (`backend/`)

| File | Purpose |
|---|---|
| `backend/main.py` | App entrypoint, router registration |
| `backend/routers/runs.py` | Run metadata and artifact endpoints |
| `backend/routers/pipeline.py` | Pipeline execution endpoints |
| `backend/routers/papers.py` | Academic papers query endpoints |
| `backend/services/run_service.py` | List and read pipeline run directories |
| `backend/services/pipeline_service.py` | Wrap pipeline execution |
| `backend/services/papers_service.py` | Wrap RAG queries |
| `backend/services/artifact_readers.py` | Read JSON/Markdown artifact files |
| `backend/schemas/` | Pydantic request/response models |

### React Frontend (`frontend/`)

Built with Vite + React 18 + TypeScript + Tailwind CSS. All `/api` requests are proxied to `http://127.0.0.1:8000` via `vite.config.ts`.

---

## Pipeline Output Artifacts

Each pipeline run creates a timestamped directory:

```
pipeline_output_<unix_timestamp>/
├── metadata/
│   ├── search_results_*.json      ← Video search results
│   ├── fetch_results_*.json       ← Transcript fetch status
│   └── summary_results_*.json     ← Summarization results
├── transcripts/
│   └── <video_id>.en.srt         ← Raw subtitle files
├── summaries/
│   └── <video_id>_summary.json   ← Structured AI summaries
└── assignments/
    └── <video_id>_assignment.md  ← Generated assignments
```

---

## Academic Papers Storage

```
papers/agents/          ← Source PDF documents (add PDFs here)
storage/
├── papers_index/       ← LlamaIndex persistent index
└── papers_vectordb/    ← LanceDB vector store
```

The RAG system is initialized lazily via `get_rag_system()` and cached globally in `_rag_system`. It will rebuild the index only if `force_rebuild=True` is passed.

---

## Dependencies

Key packages from `requirements.txt`:

| Package | Version / Notes |
|---|---|
| `gradio` | **6.x** — note Gradio 6 breaking changes (see Known Issues) |
| `fastapi` | REST API framework |
| `uvicorn` | ASGI server |
| `llama-index` | RAG framework |
| `lancedb` | Vector database |
| `sentence-transformers` | Embedding model for RAG |
| `yt-dlp` | `>=2025.9.26` — Primary YouTube transcript fetching |
| `youtube-transcript-api` | Secondary fallback for transcript fetching |
| `google-api-python-client` | YouTube Data API v3 |
| `openai` | OpenAI-compatible API calls (OpenRouter) |
| `python-dotenv` | `.env` loading |

---

## Configuration

Primary runtime config: `src/configs/config.yaml`

Key settings:
- OpenRouter model name
- Worker count for parallel summarization/generation
- Transcript language preference
- Output directory base name
- Prompt template paths

---

## Conventions

- **Emoji in print():** Always pair with `PYTHONUTF8=1` on Windows. Do not remove emoji — they're intentional UX.
- **Global state:** `pipeline_state` dict in `app.py` persists data between Gradio pipeline steps. Reset at the start of Step 1.
- **Fallback mode:** Detected by `pipeline_state.get("fallback_mode")`. In fallback mode, no new files are written to `pipeline_output_*` folders — they are treated as read-only.
- **Demo mode:** `demo_mode` global bool controls whether fallback indicators are shown to the user.
- **CSS:** Must be passed to `app.launch(css=css)`, not to `gr.Blocks()`. This is a Gradio 6 requirement.
- **Return from `create_gradio_app()`:** Returns `(app, css)` tuple — not just `app`.
- **Comparison table HTML:** Generated in `generate_comparison_table_with_script()`. The "Video" column is always the first column and is always available (virtual — not a DataFrame column). Do not add `"Video"` to the DataFrame itself; build it in the rendering loop from `row.get("URL")` and `row.get("Video ID")`.
- **YouTube thumbnail URL:** Always use `https://img.youtube.com/vi/{video_id}/mqdefault.jpg` (320×180 medium quality). The `onerror` attribute on `<img>` hides broken images gracefully.
- **Unknown badge rule:** Any value that is `"unknown"`, `"n/a"`, `"nan"`, `"none"`, or empty string in a categorical column renders as the amber `⚠ No data` badge — never as a coloured category badge.
