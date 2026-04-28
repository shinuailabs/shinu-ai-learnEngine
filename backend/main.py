from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import papers, pipeline, runs

app = FastAPI(
    title="Shinu Learn Engine API",
    version="1.0.0",
    description="FastAPI backend for the Shinu Learn Engine RAG and YouTube analysis platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(runs.router)
app.include_router(pipeline.router)
app.include_router(papers.router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "shinu-learn-engine-api"}
