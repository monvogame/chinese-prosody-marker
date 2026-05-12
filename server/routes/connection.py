"""POST /api/test-connection 路由"""
import httpx
from fastapi import APIRouter

from models import ApiConfigModel
from utils.llm_client import LLMConfig

router = APIRouter()


@router.post("/test-connection")
async def test_connection(config: ApiConfigModel):
    if not config.api_key:
        return {"success": False, "message": "请填写 API Key"}

    llm_cfg = LLMConfig(
        provider=config.provider, api_key=config.api_key,
        base_url=config.base_url, model=config.model,
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            if config.provider == "anthropic":
                return await _test_anthropic(client, llm_cfg)
            return await _test_openai_compat(client, llm_cfg)
    except httpx.TimeoutException:
        return {"success": False, "message": "连接超时，请检查 Base URL 和网络"}
    except httpx.ConnectError:
        return {"success": False, "message": "无法连接到服务器，请检查 Base URL"}
    except Exception as e:
        return {"success": False, "message": f"连接测试失败: {str(e)}"}


async def _test_openai_compat(client: httpx.AsyncClient, cfg: LLMConfig) -> dict:
    resp = await client.post(
        f"{cfg.get_base_url()}/chat/completions",
        headers={"Authorization": f"Bearer {cfg.api_key}", "Content-Type": "application/json"},
        json={
            "model": cfg.get_model(),
            "messages": [{"role": "user", "content": "回复 OK"}],
            "max_tokens": 10, "temperature": 0,
        },
        timeout=15.0,
    )

    if resp.status_code == 200:
        model_name = resp.json().get("model", cfg.get_model())
        return {"success": True, "message": "连接成功", "model_info": {"name": model_name, "supports_thinking": False}}
    elif resp.status_code == 401:
        return {"success": False, "message": "API Key 无效"}
    elif resp.status_code == 429:
        return {"success": False, "message": "请求过于频繁，请稍后重试"}
    return {"success": False, "message": f"服务器返回错误 {resp.status_code}: {resp.text[:200]}"}


async def _test_anthropic(client: httpx.AsyncClient, cfg: LLMConfig) -> dict:
    resp = await client.post(
        f"{cfg.get_base_url()}/v1/messages",
        headers={"x-api-key": cfg.api_key, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
        json={
            "model": cfg.get_model(), "max_tokens": 10,
            "messages": [{"role": "user", "content": "回复 OK"}],
        },
        timeout=15.0,
    )

    if resp.status_code == 200:
        model_name = resp.json().get("model", cfg.get_model())
        return {"success": True, "message": "连接成功", "model_info": {"name": model_name, "supports_thinking": True}}
    elif resp.status_code == 401:
        return {"success": False, "message": "API Key 无效"}
    elif resp.status_code == 429:
        return {"success": False, "message": "请求过于频繁，请稍后重试"}
    return {"success": False, "message": f"服务器返回错误 {resp.status_code}: {resp.text[:200]}"}
