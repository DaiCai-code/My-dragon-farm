"""Coze v3/chat 的调用与 SSE 解析。

上游是 SSE 长连接，这里做三件事：
1. 用共享的 httpx.AsyncClient 打开流式请求，非 2xx 在开流阶段就转成可读的错误；
2. 把上游 SSE 解析成归一化的 CozeEvent（meta / delta / done / error）；
3. 只保留 type == "answer" 的正文，过滤掉 verbose、follow_up、knowledge 等噪音。
"""

from __future__ import annotations

import codecs
import json
import logging
import re
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Literal

import httpx

from .config import Settings

logger = logging.getLogger(__name__)

# 防御异常上游：单个事件块超过该长度直接放弃缓冲，避免内存被打爆
MAX_BUFFER_BYTES = 1 * 1024 * 1024

_PAT_PATTERN = re.compile(r"pat_[A-Za-z0-9_\-]{8,}")


class CozeHTTPError(Exception):
    """上游返回了可映射为 HTTP 错误的状态码或网络异常。"""

    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


@dataclass(slots=True)
class CozeEvent:
    """归一化事件，路由层只认这四种 kind。"""

    kind: Literal["meta", "delta", "done", "error"]
    text: str = ""
    conversation_id: str | None = None
    chat_id: str | None = None
    code: str = ""
    message: str = ""


def redact(text: str, limit: int = 300) -> str:
    """截断并抹掉可能混进日志/响应里的 PAT。"""
    text = _PAT_PATTERN.sub("pat_***", text or "").strip()
    return text[:limit]


def map_upstream_error(status: int, detail: str) -> tuple[int, str, str]:
    """把 Coze 的状态码翻译成前端能直接展示的中文提示。"""
    suffix = f"（{redact(detail, 160)}）" if redact(detail, 160) else ""
    if status == 401:
        return (
            401,
            "COZE_AUTH",
            "鉴权失败：请检查 backend/.env 里的 COZE_PAT；"
            "若确认 PAT 正确，把 COZE_AUTH_SCHEME 改成 Bearer 后重启后端。" + suffix,
        )
    if status == 403:
        return (
            403,
            "COZE_FORBIDDEN",
            "无权访问该 Bot：请确认 Bot 已发布并授权给当前 PAT 所属的账号。" + suffix,
        )
    if status == 404:
        return (
            404,
            "COZE_NOT_FOUND",
            "Coze 接口或 Bot 不存在：请检查 COZE_BOT_ID 与 COZE_API_BASE。" + suffix,
        )
    if status == 429:
        return 429, "COZE_RATE_LIMIT", "请求过于频繁或额度不足，请稍后重试。" + suffix
    if status >= 500:
        return 502, "COZE_UPSTREAM", "Coze 服务暂时不可用，请稍后重试。" + suffix
    return 502, "COZE_UPSTREAM", f"Coze 返回异常状态 {status}。" + suffix


# Coze 用 HTTP 200 包装业务错误时的常见 code
_COZE_AUTH_CODES = {4100, 4101, 700012006}


def map_body_error(raw: str) -> tuple[int, str, str]:
    """解析 Coze 的 JSON 错误体，返回 (HTTP 状态, 错误码, 中文提示)。"""
    try:
        obj = json.loads(raw)
    except json.JSONDecodeError:
        obj = None

    if isinstance(obj, dict):
        biz_code = obj.get("code")
        biz_msg = redact(str(obj.get("msg") or ""), 200)
        if biz_code in _COZE_AUTH_CODES:
            return (
                401,
                "COZE_AUTH",
                "鉴权失败：Coze 返回「令牌不正确」，请检查 COZE_PAT 是否有效、"
                "且 COZE_AUTH_SCHEME 是否为 Bearer。",
            )
        if biz_code:
            return 502, "COZE_UPSTREAM", biz_msg or f"Coze 返回错误码 {biz_code}。"

    return 502, "COZE_UPSTREAM", f"Coze 返回了无法识别的响应：{redact(raw, 160) or '空响应'}"


def _build_body(settings: Settings, message: str) -> dict:
    return {
        "bot_id": settings.coze_bot_id,
        "user_id": settings.coze_user_id,
        "stream": True,
        "auto_save_history": True,
        # 只发本轮新消息，历史上下文由 conversation_id 在 Coze 侧维护
        "additional_messages": [
            {
                "role": "user",
                "type": "question",
                "content": message,
                "content_type": "text",
            }
        ],
        "parameters": {},
    }


async def open_chat_stream(
    client: httpx.AsyncClient,
    settings: Settings,
    message: str,
    conversation_id: str | None = None,
) -> httpx.Response:
    """打开 Coze 流式响应。非 2xx / 网络异常在这里就抛出，路由层可返回真正的状态码。"""
    params = {"conversation_id": conversation_id} if conversation_id else None
    headers = {
        "Authorization": settings.auth_header_value(),
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }
    request = client.build_request(
        "POST",
        settings.chat_url,
        params=params,
        json=_build_body(settings, message),
        headers=headers,
    )

    try:
        response = await client.send(request, stream=True)
    except httpx.TimeoutException as exc:
        raise CozeHTTPError(504, "UPSTREAM_TIMEOUT", "连接 Coze 超时，请检查网络后重试。") from exc
    except httpx.HTTPError as exc:
        logger.warning("请求 Coze 失败：%s", redact(str(exc)))
        raise CozeHTTPError(502, "UPSTREAM_NETWORK", "无法连接 Coze，请检查网络或代理设置。") from exc

    if response.status_code >= 400:
        raw = ""
        try:
            raw = (await response.aread())[:8192].decode("utf-8", "replace")
        except Exception:  # noqa: BLE001 - 读错误体失败不应掩盖真实状态码
            pass
        await response.aclose()
        status, code, msg = map_upstream_error(response.status_code, raw)
        raise CozeHTTPError(status, code, msg)

    # Coze 在「令牌错误」等业务异常时会返回 HTTP 200 + application/json 错误体，
    # 而不是 SSE 流。这里必须先识别出来，否则前端只会看到一条空回答。
    content_type = response.headers.get("content-type", "")
    if "text/event-stream" not in content_type:
        raw = ""
        try:
            raw = (await response.aread())[:8192].decode("utf-8", "replace")
        except Exception:  # noqa: BLE001
            pass
        await response.aclose()
        raise CozeHTTPError(*map_body_error(raw))

    return response


class _SseFramer:
    """把字节流切成 (event, data) 块，负责跨 chunk 缓冲与 UTF-8 增量解码。"""

    def __init__(self) -> None:
        self._decoder = codecs.getincrementaldecoder("utf-8")("replace")
        self._buffer = ""
        self._event = ""
        self._data: list[str] = []

    def feed(self, chunk: bytes) -> list[tuple[str, str]]:
        self._buffer += self._decoder.decode(chunk)
        if len(self._buffer) > MAX_BUFFER_BYTES:
            logger.warning("SSE 缓冲超过上限，丢弃异常数据")
            self._buffer = self._buffer[-MAX_BUFFER_BYTES:]
        events: list[tuple[str, str]] = []
        while "\n" in self._buffer:
            line, self._buffer = self._buffer.split("\n", 1)
            if line.endswith("\r"):
                line = line[:-1]
            if line == "":
                block = self._dispatch()
                if block is not None:
                    events.append(block)
                continue
            if line.startswith(":"):
                continue  # 心跳 / 注释
            if line.startswith("event:"):
                self._event = line[6:].strip()
            elif line.startswith("data:"):
                # SSE 规范：去掉一个前导空格，保留其余内容
                self._data.append(line[5:][1:] if line[5:].startswith(" ") else line[5:])
            # id: / retry: 忽略
        return events

    def close(self) -> list[tuple[str, str]]:
        """流结束时把残留的不完整行与未派发事件冲刷出来。"""
        events: list[tuple[str, str]] = []
        if self._buffer:
            tail = self._buffer.rstrip("\r\n")
            self._buffer = ""
            if tail:
                for line in tail.split("\n"):
                    line = line.rstrip("\r")
                    if line.startswith("event:"):
                        self._event = line[6:].strip()
                    elif line.startswith("data:"):
                        raw = line[5:]
                        self._data.append(raw[1:] if raw.startswith(" ") else raw)
        block = self._dispatch()
        if block is not None:
            events.append(block)
        return events

    def _dispatch(self) -> tuple[str, str] | None:
        if not self._data:
            self._event = ""
            return None
        payload = "\n".join(self._data)
        event_name = self._event or "message"
        self._event = ""
        self._data = []
        return event_name, payload


def _extract_ids(payload: dict, is_chat_event: bool = False) -> tuple[str | None, str | None]:
    """message 事件里 id 是 message_id；chat 事件里 id 才是 chat_id。"""
    conversation_id = payload.get("conversation_id") or None
    chat_id = payload.get("chat_id") or (payload.get("id") if is_chat_event else None)
    return conversation_id, chat_id


async def iter_events(response: httpx.Response) -> AsyncIterator[CozeEvent]:
    """把 Coze 的 SSE 流转成归一化事件，保证有且仅有一个终止事件。"""
    framer = _SseFramer()
    conversation_id: str | None = None
    chat_id: str | None = None
    meta_sent = False
    sent_prefix: dict[str, str] = {}  # message_id -> 已下发正文，用于 completed 兜底去重
    terminated = False

    def remember(obj: dict, is_chat_event: bool = False) -> None:
        nonlocal conversation_id, chat_id
        conv, chat = _extract_ids(obj, is_chat_event)
        conversation_id = conversation_id or conv
        chat_id = chat_id or chat

    def handle(event_name: str, payload: str) -> CozeEvent | None:
        nonlocal meta_sent, terminated

        if payload.strip() == "[DONE]":
            terminated = True
            return CozeEvent("done", conversation_id=conversation_id, chat_id=chat_id)

        try:
            obj = json.loads(payload)
        except json.JSONDecodeError:
            logger.debug("跳过非 JSON 事件 %s：%s", event_name, payload[:120])
            return None
        if not isinstance(obj, dict):
            return None

        is_chat_event = event_name.startswith("conversation.chat.")

        # Coze 偶尔在错误事件里直接给 {code, msg}
        if event_name in ("error", "conversation.chat.failed"):
            remember(obj, is_chat_event)
            err = obj.get("last_error") or obj
            terminated = True
            return CozeEvent(
                "error",
                conversation_id=conversation_id,
                chat_id=chat_id,
                code=str(err.get("code") or "COZE_FAILED"),
                message=redact(str(err.get("msg") or "Coze 处理失败，请重试。"), 200),
            )

        remember(obj, is_chat_event)

        if event_name in ("conversation.chat.created", "conversation.chat.in_progress", "conversation.chat.updated"):
            if meta_sent:
                return None
            meta_sent = True
            return CozeEvent("meta", conversation_id=conversation_id, chat_id=chat_id)

        if event_name == "conversation.message.delta":
            if obj.get("type") != "answer" or obj.get("content_type", "text") != "text":
                return None
            text = obj.get("content") or ""
            if not text:
                return None
            message_id = str(obj.get("id") or "")
            sent_prefix[message_id] = sent_prefix.get(message_id, "") + text
            return CozeEvent("delta", text=text, conversation_id=conversation_id)

        if event_name == "conversation.message.completed":
            # 兜底：completed 带完整正文，只补 delta 没覆盖到的后缀，避免重复输出
            if obj.get("type") != "answer":
                return None
            full = obj.get("content") or ""
            if not full:
                return None
            message_id = str(obj.get("id") or "")
            prev = sent_prefix.get(message_id, "")
            if full.startswith(prev):
                rest = full[len(prev) :]
                if not rest:
                    return None
                sent_prefix[message_id] = full
                return CozeEvent("delta", text=rest, conversation_id=conversation_id)
            if not prev:
                sent_prefix[message_id] = full
                return CozeEvent("delta", text=full, conversation_id=conversation_id)
            return None

        if event_name == "conversation.chat.completed":
            terminated = True
            return CozeEvent("done", conversation_id=conversation_id, chat_id=chat_id)

        if event_name == "done":
            if terminated:
                return None
            terminated = True
            return CozeEvent("done", conversation_id=conversation_id, chat_id=chat_id)

        return None  # verbose / follow_up / knowledge / 未知事件一律忽略

    try:
        async for chunk in response.aiter_bytes():
            for event_name, payload in framer.feed(chunk):
                event = handle(event_name, payload)
                if event is None:
                    continue
                yield event
                if event.kind in ("done", "error"):
                    return
        for event_name, payload in framer.close():
            event = handle(event_name, payload)
            if event is None:
                continue
            yield event
            if event.kind in ("done", "error"):
                return
    finally:
        await response.aclose()

    if not terminated:
        yield CozeEvent(
            "error",
            code="STREAM_TRUNCATED",
            message="连接提前结束，回答可能不完整，请重试。",
            conversation_id=conversation_id,
        )
