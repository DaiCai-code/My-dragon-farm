"""FastAPI 入口：把前端的提问转给 Coze 智能体，并以 SSE 真流式回传。"""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from .config import get_settings
from .coze_client import CozeHTTPError, iter_events, open_chat_stream
from .schemas import ChatRequest, ChatSyncResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

settings = get_settings()

SSE_HEADERS = {
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """整个进程共用一个连接池，避免每次请求重新握手 TLS。"""
    timeout = httpx.Timeout(
        connect=settings.connect_timeout,
        read=settings.read_timeout,
        write=30.0,
        pool=10.0,
    )
    app.state.http = httpx.AsyncClient(timeout=timeout, follow_redirects=False)
    try:
        yield
    finally:
        await app.state.http.aclose()


app = FastAPI(title="Coze Chat Proxy", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
    max_age=600,
)


def error_response(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


def sse(event: str, payload: dict) -> str:
    """组装一条 SSE 事件；ensure_ascii=False 保证中文直接可读。"""
    return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


@app.exception_handler(RequestValidationError)
async def on_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    """把 pydantic 的英文 422 换成前端可直接展示的中文提示。"""
    logger.info("请求校验失败：%s", exc.errors())
    return error_response(422, "INVALID_REQUEST", "消息不能为空，且长度不能超过 4000 字。")


@app.get("/api/health")
async def health() -> dict:
    """只反映配置状态，不发起 Coze 请求、不返回任何凭证。"""
    return {
        "status": "ok",
        "configured": settings.configured,
        "auth_scheme": settings.coze_auth_scheme or "none",
        "bot_id_tail": settings.coze_bot_id[-4:] if settings.coze_bot_id else "",
    }


@app.post("/api/chat", response_model=None)
async def chat(req: ChatRequest, request: Request):
    """流式对话：先鉴权校验、开流，成功后才切换到 SSE。

    返回类型可能是 StreamingResponse 或 JSONResponse，故关闭自动响应模型推导。
    """
    if not settings.configured:
        return error_response(503, "NOT_CONFIGURED", "后端尚未配置 Coze 凭证，请检查 backend/.env。")

    try:
        upstream = await open_chat_stream(
            request.app.state.http, settings, req.message, req.conversation_id
        )
    except CozeHTTPError as exc:
        logger.warning("打开 Coze 流失败：%s %s", exc.code, exc.message)
        return error_response(exc.status, exc.code, exc.message)

    async def relay() -> AsyncIterator[str]:
        try:
            async for event in iter_events(upstream):
                if event.kind == "meta":
                    yield sse(
                        "meta",
                        {"conversation_id": event.conversation_id, "chat_id": event.chat_id},
                    )
                elif event.kind == "delta":
                    yield sse(
                        "delta",
                        {"text": event.text, "conversation_id": event.conversation_id},
                    )
                elif event.kind == "done":
                    yield sse(
                        "done",
                        {"conversation_id": event.conversation_id, "chat_id": event.chat_id},
                    )
                    return
                elif event.kind == "error":
                    yield sse(
                        "error",
                        {
                            "code": event.code,
                            "message": event.message,
                            "conversation_id": event.conversation_id,
                        },
                    )
                    return
        except asyncio.CancelledError:
            raise  # 客户端已断开，交给 Starlette 收尾
        except httpx.TimeoutException:
            yield sse("error", {"code": "UPSTREAM_TIMEOUT", "message": "连接 Coze 超时，请稍后重试。"})
        except Exception:  # noqa: BLE001 - 流已开始，只能通过 SSE 告知前端
            logger.exception("转发流失败")
            yield sse("error", {"code": "INTERNAL", "message": "服务内部错误，请稍后重试。"})

    return StreamingResponse(relay(), media_type="text/event-stream", headers=SSE_HEADERS)


@app.post("/api/chat/sync", response_model=ChatSyncResponse)
async def chat_sync(req: ChatRequest, request: Request) -> ChatSyncResponse:
    """降级接口：复用同一套 SSE 解析，在服务端拼完整答案再返回。"""
    if not settings.configured:
        raise _HTTPError(503, "NOT_CONFIGURED", "后端尚未配置 Coze 凭证，请检查 backend/.env。")

    try:
        upstream = await open_chat_stream(
            request.app.state.http, settings, req.message, req.conversation_id
        )
    except CozeHTTPError as exc:
        raise _HTTPError(exc.status, exc.code, exc.message) from exc

    parts: list[str] = []
    conversation_id: str | None = None
    chat_id: str | None = None
    try:
        async with asyncio.timeout(settings.total_timeout):
            async for event in iter_events(upstream):
                if event.kind == "delta":
                    parts.append(event.text)
                elif event.kind == "done":
                    conversation_id = event.conversation_id or conversation_id
                    chat_id = event.chat_id or chat_id
                elif event.kind == "error":
                    raise _HTTPError(502, event.code or "COZE_FAILED", event.message)
                if event.conversation_id:
                    conversation_id = event.conversation_id
    except TimeoutError as exc:
        raise _HTTPError(504, "UPSTREAM_TIMEOUT", "等待 Coze 回答超时，请稍后重试。") from exc

    return ChatSyncResponse(answer="".join(parts), conversation_id=conversation_id, chat_id=chat_id)


class _HTTPError(Exception):
    """内部用：把错误带到全局异常处理器，统一输出中文 JSON。"""

    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


@app.exception_handler(_HTTPError)
async def on_http_error(request: Request, exc: _HTTPError) -> JSONResponse:
    return error_response(exc.status, exc.code, exc.message)
