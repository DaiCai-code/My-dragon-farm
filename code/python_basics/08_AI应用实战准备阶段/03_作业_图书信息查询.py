"""
 @Time        : 2026-11-21 20:15:32
 @Author      : daizhitong
 @Description :
    基于FastAPI的图书信息查询系统
"""
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="图书信息查询系统", description="一个简单的图书馆图书信息查询API", version="1.0.0")

class Book(BaseModel):
    id: int
    name: str
    author: str
    price: float
    stock: int

books = [
    Book(id=1, name="《活着是为了快乐》", author="余华", price=29.9, stock=10),
    Book(id=2, name="《Python从入门到精通》", author="张三", price=39.9, stock=5),
    Book(id=3, name="《FastAPI从入门到实战》", author="李四", price=49.9, stock=8),
]

@app.get("/",summary="获取欢迎信息",description="这是一个返回欢迎信息的接口",response_model=str,tags=["欢迎信息"])
def say_hello():
    return "欢迎使用图书信息查询系统！"

@app.get("/books",summary="获取图书列表",description="这是一个返回图书列表的接口",response_model=list[Book],tags=["图书查询"])
def get_all_books():
    return books

@app.get("/books/count",summary="获取图书数量",description="这是一个返回图书数量的接口",response_model=dict,tags=["图书查询"])
def get_books_count():
    return {"count": len(books)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
