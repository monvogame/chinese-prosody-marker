"""
共享的 prompt 和 JSON 工具函数
"""
import re
import os


def load_prompt(name: str) -> str:
    """从 prompts 目录加载 prompt 模板"""
    dir_path = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(dir_path, "..", "prompts", name)
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()


def extract_json(text: str) -> str:
    """从 LLM 输出中提取 JSON 字符串"""
    text = text.strip()
    m = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if m:
        return m.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text
