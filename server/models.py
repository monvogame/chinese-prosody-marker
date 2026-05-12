"""
共享的 Pydantic 模型
"""
from typing import Optional
from pydantic import BaseModel


class ApiConfigModel(BaseModel):
    provider: str
    api_key: str
    base_url: Optional[str] = None
    model: Optional[str] = None
