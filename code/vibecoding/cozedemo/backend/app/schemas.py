"""请求 / 响应模型。"""

from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    """一次提问。user_id 与凭证由后端统一持有，前端不可指定。"""

    message: str = Field(min_length=1, max_length=4000, description="用户输入内容")
    conversation_id: str | None = Field(
        default=None, max_length=128, description="多轮对话 ID，首次提问留空"
    )

    @field_validator("message")
    @classmethod
    def strip_and_check(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("消息不能为空")
        return value


class ChatSyncResponse(BaseModel):
    """非流式降级接口的返回体。"""

    answer: str
    conversation_id: str | None = None
    chat_id: str | None = None
