"""Agent1 - 韵律分析师"""
import json
import re
from typing import AsyncGenerator, List

from utils.llm_client import LLMClient
from utils.shared import load_prompt, extract_json


def split_text_into_paragraphs(text: str) -> List[str]:
    return [p.strip() for p in re.split(r"\n\s*\n", text.strip()) if p.strip()]


async def run_agent1(client: LLMClient, text: str, prompt_name: str = "agent1_system.txt") -> AsyncGenerator[dict, None]:
    paragraphs = split_text_into_paragraphs(text)
    total = len(paragraphs)
    all_results = []

    for i, para in enumerate(paragraphs):
        system = load_prompt(prompt_name)
        user_msg = f"\n注意：这是全文的第 {i + 1}/{total} 段。请只分析这一段文本，确保输出严格的 JSON 格式。\n\n{para}"

        full_text = ""
        async for event in client.stream_chat(system, user_msg):
            if event["type"] == "thinking":
                yield {"type": "thinking", "content": event["content"]}
            elif event["type"] == "text":
                full_text += event["content"]
            elif event["type"] == "done":
                full_text = event["content"]

        try:
            para_result = json.loads(extract_json(full_text))
        except json.JSONDecodeError:
            para_result = {"raw": extract_json(full_text), "paragraphs": []}

        all_results.append(para_result)

    yield {"type": "result", "data": _merge_paragraph_results(all_results)}


def _merge_paragraph_results(results: list) -> dict:
    if not results:
        return {"analysis": {}, "paragraphs": []}

    analysis = results[0].get("analysis", {})
    merged_paragraphs = []

    for r in results:
        paras = r.get("paragraphs", [])
        if isinstance(paras, list):
            for p in paras:
                if isinstance(p, dict):
                    p["index"] = len(merged_paragraphs)
                    merged_paragraphs.append(p)
                elif isinstance(p, str):
                    merged_paragraphs.append({
                        "index": len(merged_paragraphs),
                        "emotion_shift": "",
                        "tempo": "中",
                        "sentences": [{
                            "index": 0, "text": p, "weight": "normal",
                            "emotion": "", "notes": "",
                            "word_groups": [{
                                "words": p, "stress": "normal", "tone": "flat",
                                "pause_after": "medium", "link_next": False,
                                "breath_before": "none", "volume_trend": "none",
                                "neutral_tone": False, "erhua": False,
                            }],
                        }],
                    })

    return {"analysis": analysis, "paragraphs": merged_paragraphs}
