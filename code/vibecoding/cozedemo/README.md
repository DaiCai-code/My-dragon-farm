# Coze 智能体对话应用

一个前后端分离的对话 Demo：前端聊天窗口 → FastAPI 代理 → Coze 智能体 → 真流式返回 → 前端打字机逐字呈现。

- 前端：原生 HTML / CSS / JavaScript，零构建，用 **Axios** 发起请求
- 后端：Python + **FastAPI**，依赖由 **uv** 管理
- 智能体：Coze 开放平台 `v3/chat` 流式接口

## 目录结构

```
cozedemo/
├─ backend/
│  ├─ pyproject.toml      # uv 项目定义与依赖
│  ├─ uv.lock             # 锁定版本，uv sync --locked 可复现
│  ├─ .python-version     # 3.14
│  ├─ .env.example        # 配置模板（可提交）
│  ├─ .env                # 真实凭证（已被 git 忽略，不提交）
│  └─ app/
│     ├─ config.py        # 环境变量 → 配置对象
│     ├─ schemas.py       # 请求 / 响应模型
│     ├─ coze_client.py   # Coze 请求构造 + SSE 解析
│     └─ main.py          # FastAPI 路由、CORS、流式转发
└─ frontend/
   ├─ index.html
   ├─ style.css
   ├─ script.js
   └─ vendor/axios.min.js # 本地化的 Axios 1.21.0
```

## 快速开始

### 1. 配置后端凭证

```bash
cd backend
cp .env.example .env      # Windows 下可直接复制文件
```

编辑 `backend/.env`：

| 变量 | 说明 |
| --- | --- |
| `COZE_PAT` | Coze 个人访问令牌，形如 `pat_xxx` |
| `COZE_AUTH_SCHEME` | 鉴权前缀，默认 `Bearer`，即 `Authorization: Bearer pat_xxx`。Coze 官方接口**必须带** `Bearer`；仅当你在前面加了自行去掉前缀的网关时才置空 |
| `COZE_BOT_ID` | 智能体 ID |
| `COZE_USER_ID` | 业务侧用户标识，多轮对话需保持一致 |
| `COZE_API_BASE` | 默认 `https://api.coze.cn` |
| `CORS_ORIGINS` | 放行的前端地址，逗号分隔 |

> 凭证只存在后端，前端代码与浏览器请求中永远不会出现 PAT。

### 2. 启动后端

```bash
cd backend
uv sync --locked                       # 首次运行，安装依赖
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

首次建项目（如果 `uv.lock` 不存在）：

```bash
uv init --bare --name cozedemo-backend --vcs none .
uv python pin 3.14
uv add "fastapi>=0.115,<1.0" "uvicorn>=0.30,<1.0" "httpx>=0.27,<1.0" "pydantic-settings>=2.4,<3.0"
```

> 这里特意不装 `uvicorn[standard]`：Windows 上不需要 uvloop，也能避开 httptools 等原生扩展的轮子问题。

### 3. 启动前端

另开一个终端：

```bash
cd frontend
python -m http.server 5500 --bind 127.0.0.1
```

浏览器打开 **http://127.0.0.1:5500/**。

> 不要用 `file://` 直接双击打开：此时 Origin 为 `null`，跨域与流式读取都会异常。

## 接口说明

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 返回配置状态，不请求 Coze、不泄露凭证 |
| POST | `/api/chat` | 流式对话，返回 `text/event-stream` |
| POST | `/api/chat/sync` | 非流式降级，返回完整答案 |

### `/api/chat` 的事件格式

```
event: meta
data: {"conversation_id":"7...","chat_id":"7..."}

event: delta
data: {"text":"你","conversation_id":"7..."}

event: done
data: {"conversation_id":"7...","chat_id":"7..."}

event: error
data: {"code":"COZE_AUTH","message":"鉴权失败：..."}
```

### 请求体

```json
{ "message": "你好", "conversation_id": "可选，上一轮返回的会话 ID" }
```

## 验证

```bash
# 配置是否就绪
curl -s http://127.0.0.1:8000/api/health

# 流式：应当立刻出现 meta，随后不断出现 delta，最后 done
curl -N -sS -X POST http://127.0.0.1:8000/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"你好，用一句话介绍你自己\"}"
```

浏览器端检查清单：

- 回答逐字出现，中文与 emoji 不乱码
- 刷新页面后历史消息与多轮上下文仍在
- 生成中可点击「停止」；生成中发送按钮禁用
- Enter 发送、Shift+Enter 换行；中文输入法选词回车不会误发
- 往上翻阅读时不会被强制拉回底部，出现「回到底部」按钮
- 访问 `http://127.0.0.1:5500/?fallback=1` 走非流式接口，打字机仍正常
- DevTools 里 `/api/chat` 的 Content-Type 为 `text/event-stream`，响应逐步增大

## 常见问题

**返回 401**

1. 确认 `COZE_PAT` 没粘贴错、没过期；
2. 确认 `.env` 里 `COZE_AUTH_SCHEME=Bearer`（Coze 官方接口必须带此前缀，缺了会返回 `code:4101 token incorrect`）；
3. Coze 控制台确认该令牌有对应 Bot 的访问权限。

**返回 403 / 404**

Bot 未发布或未授权，或 `COZE_BOT_ID` 填错。

**回答不分段、一次性出现**

说明中间有代理做缓冲。本项目后端已设置 `Cache-Control: no-cache, no-transform` 与 `X-Accel-Buffering: no`，若放在 Nginx 后面需额外配置 `proxy_buffering off`。

**页面提示「无法连接后端」**

后端没启动，或端口不是 8000。前端地址默认写死为 `http://127.0.0.1:8000`，可在 `index.html` 引入 `script.js` 之前用 `window.COZEDEMO_API_BASE` 覆盖。

## 安全提示

- `.env` 已被 git 忽略，**不要把真实 PAT 提交到仓库**。
- 本后端本质是「带凭证的代理」，只绑定 `127.0.0.1` 用于本地演示，不要直接暴露到公网，否则任何人都能消耗你的额度。
- 若令牌曾出现在聊天记录、截图或公开渠道，请到 Coze 控制台**立即轮换**。
