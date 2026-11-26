import json
import os
from typing import Any
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
from openai import OpenAI
import logging
import time
from fastapi import Request
from fastapi.responses import JSONResponse

#配置 logging 的基础配置 （日志级别、日志格式）
logging.basicConfig(
     level=logging.INFO,
     format="%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"
)

#创建当前模块的日志记录器
logger = logging.getLogger(__name__)

#创建一个fastapi实例对象
app = FastAPI(title="AI智能伴侣",description="一个基大模型的的智能伴侣,可以按照你的需求进行对话",version="1.1")

#创建一个openai客户端,指定模型的apikey及模型服务商地址
client = OpenAI(
    api_key=os.environ.get('DEEPSEEK_API_KEY'),
    base_url="https://api.deepseek.com",
)

#AI提示词模板
 # 系统提示词模板
SYSTEM_PROMPT_TEMPLATE = """你叫 %s，现在是用户的真实伴侣，请完全代入伴侣角色。
    规则：
        1. 每次只回1条消息
        2. 禁止任何场景或状态描述性文字
        3. 匹配用户的语言
        4. 回复简短，像微信聊天一样
        5. 有需要的话可以用❤️🌸等emoji表情
        6. 用符合伴侣性格的方式对话
        7. 回复的内容, 要充分体现伴侣的性格特征
        8. 不要太肉麻（比如想你之类的，就日常聊天）
    伴侣性格：
        - %s
    你必须严格遵守上述规则来回复用户。
    """

#定义响应结果的类型
class ApiResponse(BaseModel):
    code:int
    message:str
    data:Any = None

#定义接收创建会话参数的类型
class CreateSessionRequest(BaseModel):
    nick_name:str
    nature:str

#定义接收chat对话请求参数类型
class ChatRequest(BaseModel):
    message:str
    nature:str
    nick_name:str
    session_name:str

#在项目下新建一个sessions文件夹，用来保存以后新建的会话文件
SESSION_DIR = "sessions"
if not os.path.exists(SESSION_DIR):
    os.mkdir(SESSION_DIR)
#定义一个函数,根据会话名,获取该会话文件的路径
def get_session_path(session_name):
    return f"{SESSION_DIR}/{session_name}.json"

#开发一个获取伴侣预设信息的接口
@app.get("/api/presets",summary="获取伴侣预设信息",response_model=ApiResponse,description="获取伴侣预设信息接口",tags=["伴侣信息"])
def load_presets():
    logger.info("加载伴侣预设信息start~~~")
    #第一步: 从文件中查询伴侣信息
    #   1.1 判断文件是否存在,不存在,返回错误信息
    #   1.2 如果存在,读取文件内容
    if not os.path.exists("data/companion_presets.json"):
        logger.error("伴侣预设文件不存在：%s", "data/companion_presets.json")
        return ApiResponse(code=500,message="获取伴侣预设信息失败")
    else:
        with open("data/companion_presets.json","r",encoding="utf-8") as f:
            load_data = json.load(f)
    #第二步: 给前端响应
        logger.info("加载伴侣预设信息成功，共 %d 个伴侣", len(load_data))
        return ApiResponse(code=200,message="获取伴侣预设信息成功",data=load_data)

#定义一个新建会话的接口
@app.post("/api/sessions",summary="新建会话",response_model=ApiResponse,description="新建会话接口",tags=["会话管理"])
def create_session(request:CreateSessionRequest):
    logger.info("创建会话start~~~")
    logger.info("接收前端传递的参数为：%s", request)
    #第一步: 创建一个文件[为了保存以后用户的聊天历史记录]
    #   1.1 先给创建的文件起一个名字
    file_name = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    #   1.2 创建文件,创建文件前,判断该文件是否存在,如果不存在则创建，如果存在则返回错误信息
    if os.path.exists(get_session_path(file_name)):
        logger.warning("会话文件已存在，创建失败：%s", file_name)
        return ApiResponse(code=500, message="创建会话失败")
    else:
        with open(get_session_path(file_name),"w",encoding="utf-8") as f:
        # 第二步: 保存前端传入的伴侣相关信息、会话的名称
        #   2.1 准备要存储的数据
            data = {
                "nick_name":request.nick_name,
                "nature":request.nature,
                "session_name":file_name,
                "messages":[]
            }
        #   2.2 存储构建好的数据，json存储
            json.dump(data,f,ensure_ascii=False,indent=4)

    #第三步：将创建的会话名响应给前端
    logger.info("创建会话成功：%s", file_name)
    return ApiResponse(code=200,message="创建会话成功",data=file_name)

#AI对话接口
@app.post("/api/chat",summary="AI对话",response_model=ApiResponse,description="AI对话接口",tags=["AI对话"])
def chat(request:ChatRequest):
    logger.info("AI对话start~~~")
    logger.info("接收前端传递的参数为：%s", request)

    #第一步: 根据会话名称,查询该会话中的历史记录
    session_path = get_session_path(request.session_name)
    if not os.path.exists(session_path):
        logger.warning("会话不存在：%s", request.session_name)
        return ApiResponse(code=500, message="会话不存在")
    else:
        with open(session_path,"r",encoding="utf-8") as f:
            load_data = json.load(f)
    #第二步: 调用大模型,将历史记录发给模型实现对话
    #   2.1 构建发送给模型的完整信息 [系统提示词,历史会话记录,最新一次问题]
    history_message = load_data.get("messages")
    messages = [{"role": "system", "content": SYSTEM_PROMPT_TEMPLATE % (request.nick_name, request.nature)}]
    for msg in history_message:
        messages.append(msg)
    messages.append({"role": "user", "content": request.message})

    #   2.2 将构建的完整信息，发送给大模型
    start_time = time.perf_counter()
    response = client.chat.completions.create(
        model="deepseek-flash",
        messages=messages,
        stream=False,
        reasoning_effort="high",
        extra_body={"thinking": {"type": "disabled"}},
    )
    logger.info("调用大模型完成，耗时 %.2f 秒", time.perf_counter() - start_time)
    #第三步: 获取模型的回复结果
    ai_response= response.choices[0].message.content
    logger.info("AI回复内容：%s", ai_response)
    #第四步: 将最新一轮的对话信息,更新到会话文件中
    history_message.append({"role": "user", "content": request.message})
    history_message.append({"role": "assistant", "content": ai_response})
    load_data["messages"] = history_message
    load_data["nick_name"] = request.nick_name
    load_data["nature"] = request.nature
    with open(session_path,"w",encoding="utf-8") as f:
        json.dump(load_data,f,ensure_ascii=False,indent=4)
    #第五步: 返回AI的结果给前端
    return ApiResponse(code = 200,message="AI对话成功",data = ai_response)

#加载会话列表
@app.get("/api/sessions",summary="加载会话列表",response_model=ApiResponse,description="获取所有会话列表，按时间降序排列（最新的会话在最前面）",tags=["会话管理"])
def get_sessions():
    logger.info("加载会话列表start~~~")
    #获取sessions下的所有json文件文件名
    if not os.path.exists(SESSION_DIR):
        logger.error("会话文件夹不存在：%s", SESSION_DIR)
        return ApiResponse(code=500, message="会话文件夹不存在")

    file_names = [f[:-5] for f in os.listdir(SESSION_DIR) if f.endswith(".json")]

    file_names.sort(reverse=True)

    logger.info("加载会话列表成功，共 %d 个会话", len(file_names))

    return ApiResponse(code=200, message="加载会话列表成功", data=file_names)

# 加载指定会话
@app.get("/api/sessions/{session_name}",summary="加载指定会话",response_model=ApiResponse,description="获取指定会话的详细信息，包括聊天记录，伴侣设置等",tags=["会话管理"])
def get_session(session_name: str):     # 请求示例：/api/sessions/2026-05-25_10-47-15
    logger.info("加载指定会话start~~~，会话名：%s", session_name)
    #根据请求参数session_name，获取会话文件
    if ".." in session_name or "\\" in session_name:
        logger.warning("非法的会话名：%s", session_name)
        return ApiResponse(code=500, message="会话名不合法")
    session_path = get_session_path(session_name)
    if not os.path.exists(session_path):
        logger.warning("会话不存在：%s", session_name)
        return ApiResponse(code=500, message="会话不存在")

    #读取会话文件
    with open(session_path, "r", encoding="utf-8") as f:
        load_data = json.load(f)

    #根据响应示例来进行响应
    return ApiResponse(code=200, message="获取会话信息成功", data=load_data)

# 删除会话
@app.delete("/api/sessions/{session_name}",summary="删除会话",response_model=ApiResponse,description="删除指定会话，包括会话的聊天记录，伴侣设置等",tags=["会话管理"])
def delete_session(session_name: str):      #请求示例 DELETE /api/sessions/2026-05-25_10-47-15
    logger.info("删除会话start~~~，会话名：%s", session_name)
    #根据请求参数session_name，获取会话文件
    if ".." in session_name or "\\" in session_name:
        logger.warning("非法的会话名：%s", session_name)
        return ApiResponse(code=500, message="会话名不合法")
    session_path = get_session_path(session_name)
    if not os.path.exists(session_path):
        logger.warning("会话不存在：%s", session_name)
        return ApiResponse(code=500, message="会话不存在")
    #删除这个会话文件
    try:
        os.remove(session_path)
    except OSError as e:
        logger.exception("删除会话文件失败：%s", session_path)
        return ApiResponse(code=500, message="删除会话失败")
    #根据响应示例来进行返回响应
    logger.info("删除会话成功：%s", session_name)
    return ApiResponse(code=200, message="删除会话成功")

#定义一个自定义异常处理器
#作用：将接口中出现异常，统统可以被自定义的异常处理器捕获到，捕获到之后，可以在函数中，定义自己的处理方案
#     也可以按照前端需要的格式，响应数据
# from fastapi import Request
# from fastapi.responses import JSONResponse
@app.exception_handler(Exception)
def handle_exception(request: Request, e: Exception):
    """
    全局异常处理器
    :param request:请求对象（包含请求中的各种参数，比如请求路径、请求方法、请求头、请求体等）
    :param e:捕获到的异常对象
    :return:响应给前端的数据
    """
    logging.error(f"异常信息原因: {e}")
    logging.error(f"出现异常的方法: {request.method}")
    logging.error(f"出现异常的请求路径: {request.url}")
    logging.error(f"出现异常的请求头信息: {request.headers}")
    #from fastapi.responses import JSONResponse # 导入JSONResponse
    return JSONResponse(content={"code": 500, "message": "后端代码异常，请联系开发人员即时排查","data": None})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app,host="0.0.0.0",port=8000)
