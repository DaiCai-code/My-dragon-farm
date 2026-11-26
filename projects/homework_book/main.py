import os
import json
from typing import Any

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# 文件路径

# 确保 data 目录存在
if not os.path.exists("data"):
    os.makedirs("data")

# ==================== Pydantic数据模型 ====================
class books(BaseModel):
    id: str
    title: str
    author: str
    publisher: str
    total_pages: int
    price: float

class result(BaseModel):
    code: int
    msg: str
    data: Any = None
# ==================== FastAPI 实例 ====================
app = FastAPI()

# 把 static 目录挂载到 /static 路径，/static/style.css、/static/app.js 才能访问
# app.mount("/static", StaticFiles(directory="static"), name="static")

# ==================== API接口-操作函数(绑定路径与函数) ====================
# 1. 访问首页 ("static/index.html")
@app.get("/")
def read_root():
    # 返回static/index.html文件
    return FileResponse("static/index.html")

# 2. 查询全部书籍 --> 请求参数、路径、请求方式、响应数据 ， 参照接口文档 【逻辑： 加载 data/books.json 中的数据, 组装并返回】
@app.get("/api/books")
def get_books():
    if not os.path.exists("data/books.json"):
        return result(code=500, msg="Error")
    with open("data/books.json", "r", encoding="utf-8") as f:
        books = json.load(f)
    return result(code=200, msg="Success", data=books)

# 3. 新增书籍 --> 请求参数、路径、请求方式、响应数据 ， 参照接口文档  【逻辑： 加载 data/books.json 中的现有数据, 将新的数据放在列表尾部, 然后再存入文件中】
@app.post("/api/books")
def add_book(book: books):
    if not os.path.exists("data/books.json"):
        return result(code=500, msg="Error")
    with open("data/books.json", "r", encoding="utf-8") as f:
        books = json.load(f)
    books.append(book.dict())
    with open("data/books.json", "w", encoding="utf-8") as f:
        json.dump(books, f, ensure_ascii=False, indent=4)
    return result(code=200, msg="Success")

# 4. 删除书籍 --> 请求参数、路径、请求方式、响应数据 ， 参照接口文档 【逻辑： 加载 data/books.json 中的现有数据, 找到要删除的这本书籍, 从列表中删除掉, 然后再存入文件中】
@app.delete("/api/books/{book_id}")
def delete_book(book_id: str):
    if os.path.exists("data/books.json"):
        with open("data/books.json", "r", encoding="utf-8") as f:
            books = json.load(f)
        for i in range(len(books)):
            if books[i]["id"] == book_id:
                del books[i]
                break
        with open("data/books.json", "w", encoding="utf-8") as f:
            json.dump(books, f, ensure_ascii=False, indent=4)
        return result(code=200, msg="Success")
    else:
        return result(code=500, msg="Error")


# 5. 启动FastAPI服务
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
