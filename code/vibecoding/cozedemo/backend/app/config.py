"""应用配置：全部来自环境变量 / .env，业务代码不出现任何硬编码凭证。"""

from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """后端运行参数。字段名与 .env 中的大写变量名一一对应（不区分大小写）。"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ---- Coze 接入 ----
    coze_api_base: str = "https://api.coze.cn"
    coze_chat_path: str = "/v3/chat"
    coze_pat: SecretStr = SecretStr("")
    # Coze 要求 Authorization: Bearer pat_xxx。
    # 若你的网关/代理已去掉前缀，把 .env 里的 COZE_AUTH_SCHEME 置空即可。
    coze_auth_scheme: str = "Bearer"
    coze_bot_id: str = ""
    coze_user_id: str = "cozedemo-user"

    # ---- 超时（秒）----
    connect_timeout: float = 10.0
    # read 是「每次读取的空闲超时」，不是整条流的总时长
    read_timeout: float = 120.0
    total_timeout: float = 300.0

    # ---- 业务限制 ----
    max_message_chars: int = 4000

    # ---- 跨域 ----
    # 用逗号分隔的字符串，避免 pydantic-settings 对列表型环境变量要求 JSON 数组
    cors_origins: str = "http://127.0.0.1:5500,http://localhost:5500"

    @property
    def configured(self) -> bool:
        """凭证是否齐备（缺任何一项都直接拒绝请求，避免上游返回难懂的错误）。"""
        return bool(self.coze_pat.get_secret_value().strip() and self.coze_bot_id.strip())

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def chat_url(self) -> str:
        return self.coze_api_base.rstrip("/") + self.coze_chat_path

    def auth_header_value(self) -> str:
        """拼出 Authorization 的值；scheme 为空时就是裸 token。"""
        scheme = self.coze_auth_scheme.strip()
        token = self.coze_pat.get_secret_value().strip()
        return f"{scheme} {token}".strip()


@lru_cache
def get_settings() -> Settings:
    """模块级单例，整个进程只读一次 .env。"""
    return Settings()
