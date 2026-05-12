"""Agent2 - 标记工程师"""
from typing import AsyncGenerator, List

from utils.llm_client import LLMClient


PUNCTUATION = set("，。！？；：""''、…—～·,.;:?!\"'…~-()（）《》<>")


def _is_punctuation(ch: str) -> bool:
    return ch in PUNCTUATION or ch.isspace()


def _split_words_to_chars(words: str) -> List[str]:
    return [ch for ch in words if ch.strip()]


def _punct_marks(ch: str) -> dict:
    pause_map = {
        "，": "short", ",": "short", "。": "medium", ".": "medium",
        "！": "medium", "!": "medium", "？": "medium", "?": "medium",
        "；": "medium", ";": "medium", "：": "short", ":": "short",
        "……": "long", "…": "long", "...": "long",
        "——": "medium", "--": "medium", "、": "short",
    }
    return {
        "stress": "normal", "tone": "flat", "pause_after": pause_map.get(ch, "none"),
        "link_next": False, "breath_before": "none", "volume_trend": "none",
    }


def convert_word_groups_to_tokens(word_groups: list) -> list:
    tokens = []
    for wg in word_groups:
        words = wg.get("words", "")
        chars = _split_words_to_chars(words)
        if not chars:
            continue

        stress = wg.get("stress", "normal")
        tone = wg.get("tone", "flat")
        pause_after = wg.get("pause_after", "none")
        link_next = wg.get("link_next", False)
        breath_before = wg.get("breath_before", "none")
        volume_trend = wg.get("volume_trend", "none")

        for j, ch in enumerate(chars):
            is_last = (j == len(chars) - 1)

            if _is_punctuation(ch):
                marks = _punct_marks(ch)
            else:
                marks = {
                    "stress": stress,
                    "tone": tone if is_last else "flat",
                    "pause_after": pause_after if is_last else "none",
                    "link_next": (link_next if is_last else True),
                    "breath_before": breath_before if j == 0 else "none",
                    "volume_trend": volume_trend,
                }
                if marks["link_next"] and marks["pause_after"] != "none":
                    marks["pause_after"] = "none"

            tokens.append({"text": ch, "marks": marks})

    return tokens


async def run_agent2(client: LLMClient, agent1_output: dict) -> AsyncGenerator[dict, None]:
    yield {"type": "thinking", "content": "正在转换标记数据..."}
    result = rule_based_convert(agent1_output)
    yield {"type": "result", "data": result}


def rule_based_convert(agent1_output: dict) -> dict:
    analysis = agent1_output.get("analysis", {})
    paragraphs = agent1_output.get("paragraphs", [])

    result_paragraphs = []
    for para in paragraphs:
        sentences = []
        for sent in para.get("sentences", []):
            tokens = convert_word_groups_to_tokens(sent.get("word_groups", []))
            sentences.append({
                "sentence_index": sent.get("index", 0),
                "original_text": sent.get("text", ""),
                "sentence_weight": sent.get("weight", "normal"),
                "tokens": tokens,
            })
        result_paragraphs.append({
            "paragraph_index": para.get("index", 0),
            "emotion": para.get("emotion_shift", ""),
            "sentences": sentences,
        })

    return {
        "title": "",
        "overall_emotion": analysis.get("overall_emotion", ""),
        "text_type": analysis.get("text_type", ""),
        "paragraphs": result_paragraphs,
    }
