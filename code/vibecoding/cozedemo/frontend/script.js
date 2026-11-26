/* ============================================================
 * Coze 对话 · 前端主逻辑
 * 分层：CONFIG / Storage / DOM / Api / SseParser / Typer / Render / Flow
 * 关键约束：模型文本一律走 textContent，避免任何 HTML 注入。
 * ============================================================ */
(function () {
  "use strict";

  /* ---------------- 配置 ---------------- */

  const CONFIG = {
    // 后端地址；如需改动，在 index.html 里提前定义 window.COZEDEMO_API_BASE
    API_BASE: window.COZEDEMO_API_BASE || "http://127.0.0.1:8000",
    KEY_MESSAGES: "cozedemo.messages.v1",
    KEY_CONV: "cozedemo.conversation_id",
    MAX_HISTORY: 100,
    // 打字机：基础速度、上限速度、期望排空时长（秒）
    TYPE_MIN_CPS: 45,
    TYPE_MAX_CPS: 220,
    TYPE_DRAIN_SEC: 1.8,
    TYPE_MAX_QUEUE: 20000,
    SCROLL_NEAR: 80,
  };

  // ?fallback=1 强制走非流式接口，便于验证降级链路
  const FORCE_SYNC = new URLSearchParams(location.search).get("fallback") === "1";

  /* ---------------- DOM ---------------- */

  const $ = (id) => document.getElementById(id);

  const dom = {
    scroller: $("scroller"),
    thread: $("thread"),
    empty: $("empty"),
    composer: $("composer"),
    input: $("input"),
    send: $("send"),
    stop: $("stop"),
    newChat: $("new-chat"),
    conn: $("conn-status"),
    errorBar: $("error-bar"),
    jumpBottom: $("jump-bottom"),
    template: $("msg-template"),
  };

  /* ---------------- 状态 ---------------- */

  const state = {
    messages: [],
    conversationId: null,
    streaming: false,
    controller: null,
    typer: null,
    bot: null,      // 当前正在生成的助手消息节点
  };

  /* ---------------- 工具 ---------------- */

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isInstantMode() {
    return prefersReducedMotion() || document.hidden;
  }

  function isAbortError(err) {
    if (!err) return false;
    return (
      err.name === "AbortError" ||
      err.name === "CanceledError" ||
      err.code === "ERR_CANCELED"
    );
  }

  function isSessionError(err) {
    return Boolean(err) && (err.status === 400 || err.status === 404);
  }

  function humanizeError(err) {
    if (!err) return "发生未知错误，请重试。";
    if (err.message) return err.message;
    return "请求失败，请重试。";
  }

  /* ---------------- 本地存储 ---------------- */

  const Storage = {
    loadMessages() {
      try {
        const arr = JSON.parse(localStorage.getItem(CONFIG.KEY_MESSAGES) || "[]");
        return Array.isArray(arr)
          ? arr.filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
          : [];
      } catch {
        return [];
      }
    },
    saveMessages(list) {
      try {
        localStorage.setItem(CONFIG.KEY_MESSAGES, JSON.stringify(list.slice(-CONFIG.MAX_HISTORY)));
      } catch {
        /* 隐私模式等写入失败时静默降级 */
      }
    },
    loadConversation() {
      try {
        return localStorage.getItem(CONFIG.KEY_CONV) || null;
      } catch {
        return null;
      }
    },
    saveConversation(cid) {
      try {
        if (cid) localStorage.setItem(CONFIG.KEY_CONV, cid);
        else localStorage.removeItem(CONFIG.KEY_CONV);
      } catch {
        /* 忽略 */
      }
    },
    clear() {
      try {
        localStorage.removeItem(CONFIG.KEY_MESSAGES);
        localStorage.removeItem(CONFIG.KEY_CONV);
      } catch {
        /* 忽略 */
      }
    },
  };

  /* ---------------- SSE 解析 ---------------- */

  /**
   * 按「事件块」解析，而不是按网络 chunk 直接切行：
   * 一个 JSON 很可能被拆到两个 chunk 里，必须缓冲到空行才派发。
   */
  class SseParser {
    constructor() {
      this.buf = "";
    }

    feed(chunk) {
      this.buf = (this.buf + chunk).replace(/\r\n/g, "\n");
      const out = [];
      let idx = this.buf.indexOf("\n\n");
      while (idx !== -1) {
        const raw = this.buf.slice(0, idx);
        this.buf = this.buf.slice(idx + 2);
        const ev = this.parseBlock(raw);
        if (ev) out.push(ev);
        idx = this.buf.indexOf("\n\n");
      }
      return out;
    }

    flush() {
      const raw = this.buf.trim();
      this.buf = "";
      if (!raw) return [];
      const ev = this.parseBlock(raw);
      return ev ? [ev] : [];
    }

    parseBlock(raw) {
      let event = "message";
      const data = [];
      for (const line of raw.split("\n")) {
        if (!line || line.startsWith(":")) continue; // 心跳 / 注释
        if (line.startsWith("event:")) {
          event = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          data.push(line.slice(5).replace(/^ /, ""));
        }
      }
      if (!data.length) return null;
      const payload = data.join("\n");
      if (payload.trim() === "[DONE]") return { event: "done", data: {} };
      try {
        return { event, data: JSON.parse(payload) };
      } catch {
        console.debug("[sse] 忽略无法解析的事件块", payload.slice(0, 120));
        return null;
      }
    }
  }

  /* ---------------- API 层 ---------------- */

  // 流式读取走 XHR 适配器：浏览器的 XHR 会在数据到达时触发 progress 事件，
  // 我们借此拿到 responseText 的增量。相比 axios 的 fetch 适配器 + ReadableStream，
  // 它在「用户点击停止」时能干净地 abort（fetch 适配器中止时会抛内部迭代器错误）。
  const http = axios.create({ baseURL: CONFIG.API_BASE });

  function supportsStream() {
    return typeof window.XMLHttpRequest !== "undefined";
  }

  function defaultMessage(status) {
    switch (status) {
      case 401:
        return "鉴权失败，请检查后端的 Coze 凭证。";
      case 403:
        return "无权访问该 Bot，请确认已发布并授权。";
      case 404:
        return "接口或会话不存在。";
      case 422:
        return "消息格式不正确。";
      case 429:
        return "请求过于频繁，请稍后再试。";
      case 503:
        return "后端尚未完成配置。";
      default:
        return "请求失败（" + status + "）。";
    }
  }

  /**
   * 把后端的 {error:{code,message}} 响应体转成本地 Error。
   * payload 可以是已解析的对象，也可以是 JSON 字符串。
   */
  function makeHttpError(status, payload) {
    let body = payload;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = null;
      }
    }
    const info = body && body.error ? body.error : null;
    const err = new Error((info && info.message) || defaultMessage(status));
    err.code = (info && info.code) || "HTTP_" + status;
    err.status = status;
    return err;
  }

  function toFriendlyError(err) {
    if (isAbortError(err)) return err;
    if (err && (err.code === "ERR_NETWORK" || err.code === "ECONNABORTED")) {
      const e = new Error("无法连接后端，请确认 uvicorn 已在 8000 端口启动。");
      e.code = "ERR_NETWORK";
      return e;
    }
    return err;
  }

  /**
   * 流式对话：边收边解析 SSE，把事件 yield 给上层。
   *
   * 实现说明：用 axios 的 XHR 适配器 + onDownloadProgress。
   * XHR 在 readyState=3 时就能读到累积的 responseText，我们把新增部分
   * 喂给 SseParser，天然实现「真流式」。
   * 停止生成由自己监听 signal 完成，不依赖 axios 内部的中止接线。
   */
  async function* chatStream({ message, conversationId, signal }) {
    if (!supportsStream()) throw new Error("当前浏览器不支持流式读取");

    const parser = new SseParser();
    const events = [];        // 已解析待消费的事件
    let received = "";        // 已消费过的响应文本长度基准
    let status = 0;           // HTTP 状态码（首个 progress 事件即可拿到）
    let closed = false;       // 请求是否已结束
    let failure = null;       // 结束时的错误
    let wake = null;          // 等待新事件的 resolver

    const notify = () => {
      if (wake) {
        const fn = wake;
        wake = null;
        fn();
      }
    };

    // 主动停止：自己监听 signal，不依赖 axios 内部的中止接线
    //（其监听器会在请求 settle 时被移除，存在竞态，偶尔漏掉 abort）。
    const onAbort = () => {
      if (failure || closed) return;
      const err = new Error("已停止生成");
      err.name = "AbortError";
      err.code = "ERR_CANCELED";
      failure = err;
      closed = true;
      notify();
    };
    if (signal) {
      if (signal.aborted) onAbort();
      else signal.addEventListener("abort", onAbort, { once: true });
    }

    // 把增量文本解析成事件推进队列
    const absorb = (delta) => {
      for (const ev of parser.feed(delta)) events.push(ev);
    };

    const request = http.post(
      "/api/chat",
      { message, conversation_id: conversationId || null },
      {
        responseType: "text",
        timeout: 0,                 // 关键：非 0 会在长流中途掐断
        signal,
        validateStatus: () => true, // 自己处理非 2xx，否则读不到中文错误
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        onDownloadProgress: (evt) => {
          // axios 的 XHR 适配器会把原生 ProgressEvent 直接传进来
          const xhr = evt.currentTarget || evt.target || (evt.event && evt.event.currentTarget);
          if (!xhr) return;
          if (!status && xhr.status) status = xhr.status;

          let text = "";
          try {
            text = xhr.responseText || "";
          } catch {
            return; // 响应体尚不可读
          }
          if (text.length <= received.length) return;

          const delta = text.slice(received.length);
          received = text;
          // 非 2xx 的响应体是 JSON 错误，交给结束分支统一解析
          if (status >= 400) return;

          absorb(delta);
          notify();
        },
      }
    );

    request.then(
      (res) => {
        if (closed) return; // 已被停止，忽略迟到的结果
        const finalStatus = res.status || status;
        const full = typeof res.data === "string" ? res.data : "";

        if (finalStatus >= 400) {
          failure = makeHttpError(finalStatus, full || received);
        } else {
          // progress 事件可能一个都没触发（极快的响应），补齐剩余文本
          if (full.length > received.length) {
            absorb(full.slice(received.length));
            received = full;
          }
          for (const ev of parser.flush()) events.push(ev);
        }
        closed = true;
        notify();
      },
      (err) => {
        if (closed) return; // 已被停止，忽略随之而来的 CanceledError
        failure = toFriendlyError(err);
        closed = true;
        notify();
      }
    );

    // 消费者（上层 for-await）从这里逐个取事件
    for (;;) {
      while (events.length) yield events.shift();
      if (failure) throw failure;
      if (closed) return;
      await new Promise((resolve) => {
        wake = resolve;
      });
    }
  }

  /** 非流式降级接口。 */
  async function chatSync({ message, conversationId, signal }) {
    let res;
    try {
      res = await http.post(
        "/api/chat/sync",
        { message, conversation_id: conversationId || null },
        {
          timeout: 0,
          signal,
          validateStatus: () => true,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err) {
      throw toFriendlyError(err);
    }
    if (res.status >= 400) throw makeHttpError(res.status, res.data);
    return res.data || {};
  }

  /** 后端健康状态，只用于顶部的连接指示。 */
  async function checkHealth() {
    return http.get("/api/health", {
      timeout: 8000,
      validateStatus: () => true,
    });
  }

  /* ---------------- 打字机 ---------------- */

  /**
   * 把「网络到达速度」与「渲染速度」解耦：
   * 收到的文本先进队列，requestAnimationFrame 每帧批量吐字。
   */
  function createTyper({ onUpdate, onFinish }) {
    let queue = [];
    let text = "";
    let raf = 0;
    let lastTs = 0;
    let carry = 0;
    let terminal = null;
    let stopped = false;
    let finished = false;

    function flushQueue() {
      if (!queue.length) return;
      text += queue.join("");
      queue = [];
    }

    function settle() {
        if (!terminal || finished) return;
      const result = terminal;
      terminal = null;
      finished = true;
      onFinish(result);
    }

    function schedule() {
      if (raf || stopped) return;
      lastTs = performance.now();
      raf = requestAnimationFrame(tick);
    }

    function tick(now) {
      raf = 0;
      if (stopped) return;

      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;

      if (queue.length) {
        // 积压越多吐得越快，避免长回答看起来卡住
        const cps = Math.min(
          CONFIG.TYPE_MAX_CPS,
          Math.max(CONFIG.TYPE_MIN_CPS, queue.length / CONFIG.TYPE_DRAIN_SEC)
        );
        carry += cps * dt;
        const count = Math.floor(carry);
        if (count > 0) {
          carry -= count;
          text += queue.splice(0, count).join("");
          onUpdate(text);
        }
      }

      if (queue.length) schedule();
      else settle();
    }

    return {
      push(chunk) {
        if (!chunk || stopped || finished) return;

        if (isInstantMode()) {
          text += chunk;
          onUpdate(text);
          return;
        }

        const chars = Array.from(chunk); // 按码点切，避免拆坏 emoji
        if (queue.length + chars.length > CONFIG.TYPE_MAX_QUEUE) {
          flushQueue();
          text += chunk;
          onUpdate(text);
        } else {
          for (const ch of chars) queue.push(ch);
        }
        schedule();
      },

      end(result) {
            if (finished || terminal || stopped) return;
        terminal = result;
        if (isInstantMode() || !queue.length) {
          settle();
          return;
        }
        schedule();
      },

      /** 用户主动停止：立即显示已收到的内容，不再触发 onFinish。 */
      abort() {
        if (stopped) return;
        stopped = true;
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
        flushQueue();
        if (text) onUpdate(text);
        terminal = null;
      },
    };
  }

  /* ---------------- 渲染 ---------------- */

  function createMessageEl(role) {
    const node = dom.template.content.firstElementChild.cloneNode(true);
    node.classList.add(role === "user" ? "msg--user" : "msg--bot");
    return {
      node,
      contentEl: node.querySelector(".msg-content"),
      textEl: node.querySelector(".msg-text"),
      caretEl: node.querySelector(".caret"),
    };
  }

  function appendMessageEl(role, text, animate) {
    const msg = createMessageEl(role);
    msg.textEl.textContent = text || "";
    msg.caretEl.hidden = true;
    if (animate === false) msg.node.style.animation = "none";
    dom.thread.appendChild(msg.node);
    return msg;
  }

  function createThinking() {
    const span = document.createElement("span");
    span.className = "thinking";
    span.setAttribute("aria-label", "正在生成");
    for (let i = 0; i < 3; i += 1) span.appendChild(document.createElement("i"));
    return span;
  }

  function appendNote(node, text) {
    const p = document.createElement("p");
    p.className = "msg-note";
    p.textContent = text;
    node.appendChild(p);
  }

  function appendError(node, message, retryText) {
    const box = document.createElement("div");
    box.className = "msg-error";
    box.setAttribute("role", "alert");
    const body = document.createElement("div");
    body.textContent = message;
    box.appendChild(body);

    if (retryText) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "retry-btn";
      btn.textContent = "重试";
      btn.addEventListener("click", () => {
        box.remove();
        node.remove();
        runAssistant(retryText);
      });
      box.appendChild(btn);
    }

    node.appendChild(box);
  }

  function hideEmpty() {
    if (dom.empty && dom.empty.parentNode) dom.empty.remove();
  }

  function showEmpty() {
    if (dom.empty && !dom.empty.parentNode) dom.thread.prepend(dom.empty);
  }

  /* ---------------- 滚动 ---------------- */

  function isNearBottom() {
    const s = dom.scroller;
    return s.scrollHeight - s.scrollTop - s.clientHeight < CONFIG.SCROLL_NEAR;
  }

  function scrollToBottom(smooth) {
    dom.scroller.scrollTo({ top: dom.scroller.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  function updateJumpButton() {
    dom.jumpBottom.hidden = isNearBottom();
  }

  /* ---------------- 输入区 ---------------- */

  function autoGrow() {
    dom.input.style.height = "auto";
    dom.input.style.height = Math.min(dom.input.scrollHeight, 160) + "px";
  }

  function updateComposer() {
    dom.stop.hidden = !state.streaming;
    dom.send.hidden = state.streaming;
    dom.send.disabled = state.streaming || !dom.input.value.trim();
  }

  function setStreaming(on) {
    state.streaming = on;
    updateComposer();
  }

  function clearErrorBar() {
    dom.errorBar.hidden = true;
    dom.errorBar.textContent = "";
  }

  function showErrorBar(message) {
    dom.errorBar.textContent = message;
    dom.errorBar.hidden = false;
  }

  function setConnection(text, kind) {
    dom.conn.textContent = text;
    dom.conn.dataset.state = kind || "idle";
  }

  /* ---------------- 会话与历史 ---------------- */

  function setConversation(cid) {
    state.conversationId = cid || null;
    Storage.saveConversation(state.conversationId);
  }

  function pushHistory(message) {
    state.messages.push(message);
    Storage.saveMessages(state.messages);
  }

  function lastUserText() {
    for (let i = state.messages.length - 1; i >= 0; i -= 1) {
      if (state.messages[i].role === "user") return state.messages[i].content;
    }
    return "";
  }

  /* ---------------- 一轮问答 ---------------- */

  function finishTurn(bot, result) {
    // 一轮只结束一次：「停止」和请求异常都可能走到这里
    if (!bot || bot.finished) return;
    bot.finished = true;

    setStreaming(false);
    state.controller = null;
    state.typer = null;
    state.bot = null;

    // 「新对话」会先删除节点再中止请求，此时这一轮已经作废，不能再写入历史
    if (!bot.node.isConnected) return;

    bot.caretEl.hidden = true;

    const thinking = bot.contentEl.querySelector(".thinking");
    if (thinking) thinking.remove();

    const content = bot.textEl.textContent;

    if (result.status === "aborted") {
      if (content) {
        appendNote(bot.node, "已停止生成");
        pushHistory({ role: "assistant", content, ts: Date.now() });
      } else {
        bot.node.remove();
      }
      return;
    }

    if (result.status === "error") {
      appendError(bot.node, result.message, lastUserText());
      return;
    }

    if (!content) {
      appendError(bot.node, "没有收到回复内容，请重试。", lastUserText());
      return;
    }

    pushHistory({ role: "assistant", content, ts: Date.now() });
  }

  /**
   * 发出一次请求并把结果喂给打字机。
   * 非流式模式或浏览器不支持流时自动走 /api/chat/sync。
   */
  async function streamOnce(text, signal, onEvent, stats) {
    if (FORCE_SYNC || !supportsStream()) {
      const data = await chatSync({ message: text, conversationId: state.conversationId, signal });
      if (data.conversation_id) setConversation(data.conversation_id);
      stats.ended = true;
      onEvent({ event: "delta", data: { text: data.answer || "" } });
      onEvent({ event: "done", data: { conversation_id: data.conversation_id } });
      return stats;
    }

    for await (const ev of chatStream({
      message: text,
      conversationId: state.conversationId,
      signal,
    })) {
      if (ev.event === "done" || ev.event === "error") stats.ended = true;
      onEvent(ev);
    }
    return stats;
  }

  function makeEventHandler(typer, stats) {
    return function onEvent(ev) {
      const data = (ev && ev.data) || {};

      if (ev.event === "meta" || ev.event === "delta") {
        if (data.conversation_id) setConversation(data.conversation_id);
      }

      if (ev.event === "delta") {
        const chunk = data.text || "";
        if (!chunk) return;
        stats.received += chunk.length;
        typer.push(chunk);
      } else if (ev.event === "done") {
        if (data.conversation_id) setConversation(data.conversation_id);
        typer.end({ status: "done" });
      } else if (ev.event === "error") {
        typer.end({
          status: "error",
          message: data.message || "生成失败，请重试。",
          code: data.code || "",
        });
      }
    };
  }

  async function runAssistant(text) {
    if (state.streaming) return;

    const bot = appendMessageEl("bot", "");
    const thinking = createThinking();
    bot.contentEl.insertBefore(thinking, bot.caretEl);

    const stats = { received: 0, ended: false };
    const hadConversation = Boolean(state.conversationId);

    const typer = createTyper({
      onUpdate: (value) => {
        if (value) {
          const dots = bot.contentEl.querySelector(".thinking");
          if (dots) dots.remove();
          bot.caretEl.hidden = false;
        }
        bot.textEl.textContent = value;
        if (isNearBottom()) scrollToBottom(false);
        updateJumpButton();
      },
      onFinish: (result) => finishTurn(bot, result),
    });

    state.typer = typer;
    state.bot = bot;
    const controller = new AbortController();
    state.controller = controller;
    setStreaming(true);
    updateJumpButton();

    const onEvent = makeEventHandler(typer, stats);

    try {
      await streamOnce(text, controller.signal, onEvent, stats);
      if (!stats.ended) typer.end({ status: "done" });
    } catch (err) {
      // 主动停止时，不同适配器抛出的错误类型不一（CanceledError / AbortError / DOMException），
      // 因此以 AbortController 的状态为准，最可靠。
      if (controller.signal.aborted || isAbortError(err)) {
        typer.abort();
        finishTurn(bot, { status: "aborted" });
        return;
      }

      // 会话过期：清掉 conversation_id 后自动重试一次
      if (hadConversation && state.conversationId && isSessionError(err) && stats.received === 0) {
        setConversation(null);
        showErrorBar("原会话已失效，已自动开始新对话。");
        try {
          await streamOnce(text, controller.signal, onEvent, stats);
          if (!stats.ended) typer.end({ status: "done" });
          return;
        } catch (retryErr) {
          if (isAbortError(retryErr)) {
            typer.abort();
            finishTurn(bot, { status: "aborted" });
            return;
          }
          typer.end({ status: "error", message: humanizeError(retryErr), code: retryErr.code || "" });
          return;
        }
      }

      typer.end({ status: "error", message: humanizeError(err), code: err.code || "" });
    }
  }

  function send(rawText) {
    if (state.streaming) return;
    const text = String(rawText || "").trim();
    if (!text) return;

    clearErrorBar();
    hideEmpty();

    appendMessageEl("user", text);
    pushHistory({ role: "user", content: text, ts: Date.now() });

    dom.input.value = "";
    autoGrow();
    updateComposer();

    runAssistant(text);
    scrollToBottom(false);
  }

  /**
   * 用户点击「停止」。
   * 两种情形都要收尾：
   * 1) 请求还在跑 —— abort 掉；
   * 2) 请求已结束、只剩打字机在追赶 —— 直接吐出剩余文字并结束本轮。
   * 否则第 2 种情况下按钮会一直挂着不响应。
   */
  function stopStreaming() {
    if (!state.streaming) return;

    if (state.controller) state.controller.abort();

    if (state.typer) state.typer.abort();
    if (state.bot) finishTurn(state.bot, { status: "aborted" });
    else setStreaming(false);
  }

  function startNewChat() {
    if (state.streaming) {
      stopStreaming();
      setStreaming(false); // 立即恢复 UI，不等异步的 abort 回调
    }

    state.messages = [];
    setConversation(null);
    Storage.clear();

    Array.from(dom.thread.children).forEach((child) => {
      if (child !== dom.empty) child.remove();
    });
    showEmpty();
    clearErrorBar();
    dom.input.value = "";
    autoGrow();
    updateComposer();
    updateJumpButton();
    dom.input.focus();
  }

  /* ---------------- 初始化 ---------------- */

  function restore() {
    state.conversationId = Storage.loadConversation();
    state.messages = Storage.loadMessages();

    if (!state.messages.length) {
      updateComposer();
      return;
    }

    hideEmpty();
    for (const m of state.messages) {
      appendMessageEl(m.role === "user" ? "user" : "bot", m.content, false);
    }
    requestAnimationFrame(() => scrollToBottom(false));
    updateComposer();
  }

  function bindEvents() {
    dom.composer.addEventListener("submit", (e) => {
      e.preventDefault();
      send(dom.input.value);
    });

    dom.input.addEventListener("input", () => {
      autoGrow();
      updateComposer();
    });

    // 中文输入法选词时按 Enter 是确认候选，不能当发送
    dom.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
        e.preventDefault();
        send(dom.input.value);
      }
    });

    dom.stop.addEventListener("click", stopStreaming);
    dom.newChat.addEventListener("click", startNewChat);

    dom.jumpBottom.addEventListener("click", () => scrollToBottom(true));
    dom.scroller.addEventListener("scroll", updateJumpButton, { passive: true });

    dom.empty.querySelectorAll(".hint").forEach((btn) => {
      btn.addEventListener("click", () => {
        dom.input.value = btn.textContent.trim();
        autoGrow();
        updateComposer();
        send(dom.input.value);
      });
    });

    // 生成过程中用户上滑阅读时，不要让新内容把视图拽走
    window.addEventListener("resize", updateJumpButton);
  }

  async function probeBackend() {
    try {
      const res = await checkHealth();
      if (res.status >= 400) {
        setConnection("后端异常（" + res.status + "）", "error");
        return;
      }
      const data = res.data || {};
      if (!data.configured) {
        setConnection("后端未配置 Coze 凭证", "error");
      } else {
        setConnection("连接就绪", "ok");
      }
    } catch {
      setConnection("后端未连接", "error");
    }
  }

  function init() {
    bindEvents();
    restore();
    autoGrow();
    updateComposer();
    updateJumpButton();
    probeBackend();
    dom.input.focus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
