"""Agent2 — 原版 Agent2.0 标记转换器
复用标准 rule_based_convert，与原版 agent1_system.txt 输出格式完全兼容。
"""
from typing import AsyncGenerator

from utils.llm_client import LLMClient
from agents.agent2_marker import rule_based_convert


async def run_origin_agent2(client: LLMClient, agent1_output: dict) -> AsyncGenerator[dict, None]:
    yield {"type": "thinking", "content": "正在转换标记数据（原版2.0）..."}
    result = rule_based_convert(agent1_output)
    yield {"type": "result", "data": result}
