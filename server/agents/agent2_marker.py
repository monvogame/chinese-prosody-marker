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
        "neutral_tone": False, "erhua": False,
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
        neutral_tone = wg.get("neutral_tone", False)
        erhua = wg.get("erhua", False)

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
                    "neutral_tone": neutral_tone,
                    "erhua": erhua,
                }
                if marks["link_next"] and marks["pause_after"] != "none":
                    marks["pause_after"] = "none"

            tokens.append({"text": ch, "marks": marks})

    return tokens


async def run_agent2(client: LLMClient, agent1_output: dict) -> AsyncGenerator[dict, None]:
    yield {"type": "thinking", "content": "正在转换标记数据..."}
    result = rule_based_convert(agent1_output)
    yield {"type": "result", "data": result}


def _ensure_punctuation(tokens: list, original_text: str) -> list:
    """根据原句文本补回 LLM 可能遗漏的标点符号"""
    if not original_text:
        return tokens

    # 将原句拆为字符序列（去除不可见空白但保留标点）
    orig_chars = [ch for ch in original_text if not ch.isspace() or ch in "  "]
    orig_chars = [ch for ch in original_text if not (ch.isspace() and ch not in "  ")]
    orig_chars = list(original_text.replace(" ", "").replace("\n", "").replace("\r", ""))

    result = []
    ti = 0  # 当前 token 索引
    for orig_ch in orig_chars:
        if ti < len(tokens) and tokens[ti]["text"] == orig_ch:
            result.append(tokens[ti])
            ti += 1
        else:
            # 查找：当前 token 是否在后续位置匹配
            found = False
            for k in range(ti, min(ti + 3, len(tokens))):
                if tokens[k]["text"] == orig_ch:
                    # 中间漏掉的 token 先插入
                    for skip in range(ti, k):
                        result.append(tokens[skip])
                    result.append(tokens[k])
                    ti = k + 1
                    found = True
                    break
            if not found:
                # 该字符在 tokens 中完全缺失，作为独立标点插入
                if _is_punctuation(orig_ch):
                    result.append({"text": orig_ch, "marks": _punct_marks(orig_ch)})
                # 如果是非标点也缺失，跳过（不应发生）

    # 追加剩余的 tokens
    while ti < len(tokens):
        result.append(tokens[ti])
        ti += 1

    return result


def rule_based_convert(agent1_output: dict) -> dict:
    analysis = agent1_output.get("analysis", {})
    paragraphs = agent1_output.get("paragraphs", [])

    result_paragraphs = []
    for para in paragraphs:
        sentences = []
        for sent in para.get("sentences", []):
            tokens = convert_word_groups_to_tokens(sent.get("word_groups", []))
            tokens = _ensure_punctuation(tokens, sent.get("text", ""))
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
