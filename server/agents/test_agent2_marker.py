"""测试版 Agent2 — 标记转换工程师（新格式）"""
from typing import AsyncGenerator, List, Dict, Any
import re
from datetime import datetime, timezone

from utils.llm_client import LLMClient


# 标点符号集合
PUNCTUATION = set("，。！？；：""''、…—～·,.;:?!\"'…~-()（）《》<>「」『』【】")

# 标点专属规则表
PUNCT_RULES: Dict[str, dict] = {
    "，": {"pause_after": "short", "pause_type": "区分性", "tone_direction": "flat"},
    ",": {"pause_after": "short", "pause_type": "区分性", "tone_direction": "flat"},
    "、": {"pause_after": "short", "pause_type": "并列性", "tone_direction": "flat"},
    "；": {"pause_after": "medium", "pause_type": "并列性", "tone_direction": "flat"},
    ";": {"pause_after": "medium", "pause_type": "并列性", "tone_direction": "flat"},
    "：": {"pause_after": "short", "pause_type": "生发性", "tone_direction": "flat"},
    ":": {"pause_after": "short", "pause_type": "生发性", "tone_direction": "flat"},
    "。": {"pause_after": "medium", "pause_type": "区分性", "tone_direction": "flat"},
    ".": {"pause_after": "medium", "pause_type": "区分性", "tone_direction": "flat"},
    "？": {"pause_after": "medium", "pause_type": "区分性", "tone_direction": "up"},
    "?": {"pause_after": "medium", "pause_type": "区分性", "tone_direction": "up"},
    "！": {"pause_after": "medium", "pause_type": "强调性", "tone_direction": "flat"},
    "!": {"pause_after": "medium", "pause_type": "强调性", "tone_direction": "flat"},
    "……": {"pause_after": "long", "pause_type": "回味性", "tone_direction": "flat"},
    "...": {"pause_after": "long", "pause_type": "回味性", "tone_direction": "flat"},
    "——": {"pause_after": "medium", "pause_type": "转换性", "tone_direction": "flat"},
    "--": {"pause_after": "medium", "pause_type": "转换性", "tone_direction": "flat"},
}

# 标点默认 marks
PUNCT_DEFAULT_MARKS: Dict[str, Any] = {
    "stress_level": "none",
    "stress_method": "volume",
    "link_next": False,
    "breath_before": "none",
    "speed_change": "normal",
    "volume_trend": "stable",
    "imagery_note": None,
}


def _is_punctuation(ch: str) -> bool:
    return ch in PUNCTUATION or ch.isspace()


def _split_words_to_chars(words: str) -> List[str]:
    """拆分词组为字符列表，处理数字和英文聚合"""
    result = []
    i = 0
    while i < len(words):
        ch = words[i]
        if ch.isspace():
            i += 1
            continue
        # 连续数字聚合
        if ch.isdigit():
            j = i
            while j < len(words) and words[j].isdigit():
                j += 1
            result.append(words[i:j])
            i = j
            continue
        # 连续英文字母聚合
        if ch.isascii() and ch.isalpha():
            j = i
            while j < len(words) and words[j].isascii() and words[j].isalpha():
                j += 1
            result.append(words[i:j])
            i = j
            continue
        # 省略号、破折号作为单个 token
        if ch in "…—" and i + 1 < len(words) and words[i + 1] == ch:
            result.append(ch + ch)
            i += 2
            continue
        result.append(ch)
        i += 1
    return [c for c in result if c.strip()]


def convert_word_groups_to_tokens_test(word_groups: list) -> list:
    """将测试版 Agent1 的 word_groups 转换为逐字 tokens"""
    tokens = []
    for wg in word_groups:
        words = wg.get("words", "")
        chars = _split_words_to_chars(words)
        if not chars:
            continue

        stress_level = wg.get("stress_level", "medium")
        stress_method = wg.get("stress_method", "volume")
        pause_after = wg.get("pause_after", "none")
        pause_type = wg.get("pause_type", "无")
        link_next = wg.get("link_next", False)
        breath_before = wg.get("breath_before", "none")
        speed_change = wg.get("speed_change", "normal")
        volume_trend = wg.get("volume_trend", "stable")
        tone_direction = wg.get("tone_direction", "flat")
        imagery_note = wg.get("imagery_note", None)

        for j, ch in enumerate(chars):
            is_last = (j == len(chars) - 1)

            if _is_punctuation(ch):
                punct_rule = PUNCT_RULES.get(ch, {"pause_after": "none", "pause_type": "无", "tone_direction": "flat"})
                marks = {
                    **PUNCT_DEFAULT_MARKS,
                    "pause_after": punct_rule["pause_after"],
                    "pause_type": punct_rule["pause_type"],
                    "tone_direction": punct_rule["tone_direction"],
                }
            else:
                marks = {
                    "stress_level": stress_level,
                    "stress_method": stress_method,
                    "pause_after": pause_after if is_last else "none",
                    "pause_type": pause_type if is_last else "无",
                    "link_next": True if not is_last else link_next,
                    "breath_before": breath_before if j == 0 else "none",
                    "speed_change": speed_change,
                    "volume_trend": volume_trend,
                    "tone_direction": tone_direction if is_last else "flat",
                    "imagery_note": imagery_note if j == 0 else None,
                }
                # 连读时不能有停顿
                if marks["link_next"] and marks["pause_after"] != "none":
                    marks["pause_after"] = "none"
                    marks["pause_type"] = "无"

            tokens.append({"text": ch, "marks": marks})

    return tokens


def validate_and_fix_tokens(tokens: list) -> list:
    """验证并修复 token 列表的逻辑一致性（测试版规则）"""
    for i, token in enumerate(tokens):
        m = token["marks"]

        # 规则 2.1: link_next=true 时 pause_after 必须为 none
        if m["link_next"] and m["pause_after"] != "none":
            m["pause_after"] = "none"
            m["pause_type"] = "无"

        # 规则 2.2: breath_before 非 none 时，前一字 pause_after 不能为 none
        if m["breath_before"] in ("inhale", "exhale") and i > 0:
            prev = tokens[i - 1]["marks"]
            if prev["pause_after"] == "none":
                prev["pause_after"] = "short"
                prev["pause_type"] = "灵活性"

    # 规则 2.3: 句末最后一个字符 pause_after 至少 medium
    # 规则 2.4: 段末最后一个字符 pause_after 至少 long
    if tokens:
        last = tokens[-1]["marks"]
        if last["pause_after"] in ("none", "short"):
            last["pause_after"] = "medium"
            if last["pause_type"] == "无":
                last["pause_type"] = "区分性"

    return tokens


def rule_based_convert_test(agent1_output: dict) -> dict:
    """将测试版 Agent1 输出转换为测试版最终格式"""
    analysis = agent1_output.get("analysis", {})
    paragraphs = agent1_output.get("paragraphs", [])

    result_paragraphs = []
    total_tokens = 0
    total_chars = 0

    for para in paragraphs:
        sentences = []
        for sent in para.get("sentences", []):
            word_groups = sent.get("word_groups", [])
            tokens = convert_word_groups_to_tokens_test(word_groups)
            tokens = validate_and_fix_tokens(tokens)

            total_tokens += len(tokens)
            total_chars += len(sent.get("text", ""))

            sentences.append({
                "sentence_index": sent.get("index", 0),
                "original_text": sent.get("text", ""),
                "sentence_weight": sent.get("weight", "normal"),
                "sentence_tone": sent.get("sentence_tone", ""),
                "intonation": sent.get("intonation", "flat"),
                "voice_quality": sent.get("voice_quality", "实声"),
                "emotion_note": sent.get("notes", ""),
                "tokens": tokens,
            })

        result_paragraphs.append({
            "paragraph_index": para.get("index", 0),
            "summary": para.get("summary", ""),
            "emotion": para.get("emotion", ""),
            "rhythm_type": para.get("rhythm_type", "舒缓型"),
            "identity_sense": para.get("identity_sense", "第三人称旁白"),
            "sentences": sentences,
        })

    overall_tone = analysis.get("overall_tone", "")
    return {
        "title": None,
        "text_type": analysis.get("text_type", ""),
        "overall_emotion": overall_tone,  # 兼容原版渲染
        "overall_tone": overall_tone,
        "purpose": analysis.get("purpose", ""),
        "imagery": analysis.get("imagery", ""),
        "inner_meaning": analysis.get("inner_meaning", ""),
        "key_emotions": analysis.get("key_emotions", []),
        "climax_position": analysis.get("climax_position", ""),
        "paragraphs": result_paragraphs,
        "metadata": {
            "char_count": total_chars,
            "token_count": total_tokens,
            "paragraph_count": len(result_paragraphs),
            "sentence_count": sum(len(p["sentences"]) for p in result_paragraphs),
            "converted_at": datetime.now(timezone.utc).isoformat(),
            "schema_version": "2.0",
        },
    }


async def run_test_agent2(client: LLMClient, agent1_output: dict) -> AsyncGenerator[dict, None]:
    """测试版 Agent2：规则引擎，不调用 LLM"""
    yield {"type": "thinking", "content": "正在转换标记数据（测试版格式）..."}
    result = rule_based_convert_test(agent1_output)
    yield {"type": "result", "data": result}
