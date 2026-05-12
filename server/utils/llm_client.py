"""
统一 LLM 客户端封装
支持 OpenAI / Anthropic / DeepSeek / 自定义兼容接口
"""
import json
from typing import AsyncGenerator, Optional
from dataclasses import dataclass

import httpx


@dataclass
class LLMConfig:
    provider: str  # openai | anthropic | deepseek | custom
    api_key: str
    base_url: Optional[str] = None
    model: Optional[str] = None

    def get_base_url(self) -> str:
        if self.base_url:
            return self.base_url.rstrip("/")
        if self.provider == "openai":
            return "https://api.openai.com/v1"
        elif self.provider == "anthropic":
            return "https://api.anthropic.com"
        elif self.provider == "deepseek":
            return "https://api.deepseek.com/v1"
        else:
            raise ValueError("自定义 provider 必须提供 base_url")

    def get_model(self) -> str:
        if self.model:
            return self.model
        if self.provider == "openai":
            return "gpt-4o"
        elif self.provider == "anthropic":
            return "claude-sonnet-4-20250514"
        elif self.provider == "deepseek":
            return "deepseek-v4-pro[1m]"
        else:
            raise ValueError("自定义 provider 必须提供 model")


class LLMClient:
    """统一的 LLM 调用客户端"""

    def __init__(self, config: LLMConfig):
        self.config = config
        self.client = httpx.AsyncClient(timeout=180.0)

    async def stream_chat(
        self, system_prompt: str, user_message: str
    ) -> AsyncGenerator[dict, None]:
        """流式调用 LLM"""
        if self.config.provider == "anthropic":
            async for event in self._stream_anthropic(system_prompt, user_message):
                yield event
        else:
            async for event in self._stream_openai_compat(system_prompt, user_message):
                yield event

    async def _stream_openai_compat(
        self, system_prompt: str, user_message: str
    ) -> AsyncGenerator[dict, None]:
        url = f"{self.config.get_base_url()}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.config.get_model(),
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "stream": True,
            "temperature": 0.3,
        }

        full_text = ""
        async with self.client.stream("POST", url, headers=headers, json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data_str = line[6:]
                if data_str == "[DONE]":
                    break
                try:
                    data = json.loads(data_str)
                    choice = data.get("choices", [{}])[0]
                    delta = choice.get("delta", {})

                    if "reasoning_content" in delta and delta["reasoning_content"]:
                        yield {"type": "thinking", "content": delta["reasoning_content"]}

                    if "content" in delta and delta["content"]:
                        full_text += delta["content"]
                        yield {"type": "text", "content": delta["content"]}
                except (json.JSONDecodeError, IndexError, KeyError):
                    continue

        yield {"type": "done", "content": full_text}

    async def _stream_anthropic(
        self, system_prompt: str, user_message: str
    ) -> AsyncGenerator[dict, None]:
        url = f"{self.config.get_base_url()}/v1/messages"
        headers = {
            "x-api-key": self.config.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.config.get_model(),
            "max_tokens": 16000,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_message}],
            "stream": True,
            "temperature": 1.0,
            "thinking": {"type": "enabled", "budget_tokens": 8000},
        }

        full_text = ""
        async with self.client.stream("POST", url, headers=headers, json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data_str = line[6:]
                try:
                    data = json.loads(data_str)
                    event_type = data.get("type", "")

                    if event_type == "content_block_delta":
                        delta = data.get("delta", {})
                        delta_type = delta.get("type", "")

                        if delta_type == "thinking_delta":
                            yield {"type": "thinking", "content": delta.get("thinking", "")}
                        elif delta_type == "text_delta":
                            text = delta.get("text", "")
                            full_text += text
                            yield {"type": "text", "content": text}
                    elif event_type == "message_stop":
                        break
                except (json.JSONDecodeError, KeyError):
                    continue

        yield {"type": "done", "content": full_text}

    async def close(self):
        await self.client.aclose()
