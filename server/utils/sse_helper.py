"""SSE 推送工具函数"""
import json
from typing import Any, Optional


def sse_event(event: str, data: Any) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def send_thinking(phase: str, content: str, progress: int) -> str:
    return sse_event("thinking", {"phase": phase, "content": content, "progress": progress})


def send_phase_complete(phase: str, progress: int) -> str:
    return sse_event("phase_complete", {"phase": phase, "progress": progress})


def send_complete(result: dict) -> str:
    return sse_event("complete", {"result": result})


def send_error(code: str, message: str, retry_after: Optional[int] = None) -> str:
    return sse_event("error", {"code": code, "message": message, "retry_after": retry_after})
