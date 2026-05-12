"""
中文韵律标记助手 - 后端服务
FastAPI + SSE 流式推送
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.analyze import router as analyze_router
from routes.connection import router as connection_router

app = FastAPI(
    title="中文韵律标记助手 API",
    version="0.1.0",
    description="为中文文本提供韵律标记分析服务"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api")
app.include_router(connection_router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "chinese-prosody-marker"}
