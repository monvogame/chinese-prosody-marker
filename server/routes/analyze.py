"""POST /api/analyze 路由"""
import time

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from models import ApiConfigModel
from utils.llm_client import LLMClient, LLMConfig
from utils.sse_helper import send_thinking, send_phase_complete, send_complete, send_error
from utils.time_estimator import estimate_analysis_time, calculate_progress
from agents.agent1_prosody import run_agent1
from agents.agent2_marker import run_agent2

router = APIRouter()


class AnalyzeRequest(BaseModel):
    text: str
    api_config: ApiConfigModel


async def _run_analysis(text: str, config: ApiConfigModel):
    llm_config = LLMConfig(
        provider=config.provider, api_key=config.api_key,
        base_url=config.base_url, model=config.model,
    )
    client = LLMClient(llm_config)
    char_count = len(text)
    estimate = estimate_analysis_time(char_count, config.provider)
    start_time = time.time()

    try:
        # Agent1 阶段
        agent1_start = time.time()
        yield send_thinking("agent1", "正在启动韵律分析...", 0)

        agent1_output = None
        async for event in run_agent1(client, text):
            if event["type"] == "thinking":
                elapsed = time.time() - agent1_start
                progress = calculate_progress("agent1", elapsed, estimate.total_seconds, char_count)
                yield send_thinking("agent1", event["content"], progress)
            elif event["type"] == "result":
                agent1_output = event["data"]

        if agent1_output is None:
            yield send_error("PARSE_ERROR", "Agent1 分析未产生结果")
            return

        yield send_phase_complete("agent1", 80)

        # Agent2 阶段（规则引擎，瞬时完成）
        yield send_thinking("agent2", "正在转换标记数据...", 85)

        agent2_output = None
        async for event in run_agent2(client, agent1_output):
            if event["type"] == "result":
                agent2_output = event["data"]

        if agent2_output is None:
            yield send_error("PARSE_ERROR", "Agent2 标记转换未产生结果")
            return

        yield send_phase_complete("agent2", 99)

        # 完成
        total_elapsed = int((time.time() - start_time) * 1000)
        agent2_output["metadata"] = {
            "char_count": char_count,
            "analysis_time_ms": total_elapsed,
            "model": llm_config.get_model(),
        }
        yield send_complete(agent2_output)

    except Exception as e:
        error_msg = str(e)
        if "401" in error_msg or "Unauthorized" in error_msg:
            yield send_error("INVALID_API_KEY", f"API Key 无效: {error_msg}")
        elif "429" in error_msg or "rate" in error_msg.lower():
            yield send_error("RATE_LIMITED", f"请求过于频繁，请稍后重试: {error_msg}", retry_after=30)
        else:
            yield send_error("MODEL_ERROR", f"模型调用出错: {error_msg}")
    finally:
        await client.close()


@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    text = request.text.strip()
    if not text:
        return StreamingResponse(
            _empty_error("请输入文本内容"),
            media_type="text/event-stream",
        )
    if not request.api_config.api_key:
        return StreamingResponse(
            _empty_error("请先配置 API Key"),
            media_type="text/event-stream",
        )

    return StreamingResponse(
        _run_analysis(text, request.api_config),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def _empty_error(message: str):
    yield send_error("INVALID_INPUT", message)
