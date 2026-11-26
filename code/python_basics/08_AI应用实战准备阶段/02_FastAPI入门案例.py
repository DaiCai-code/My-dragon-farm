from fastapi import FastAPI
from pydantic import BaseModel

class user(BaseModel):
    id: int
    name: str
    age: int
    honey: str

app = FastAPI(title="FastAPI 入门案例", description="这是一个简单的 FastAPI 入门案例", version="0.1.0")

@app.get("/",summary="获取欢迎信息",description="这是一个获取欢迎信息的接口",response_model=str, tags=["欢迎信息"])
def hello():
    print("你好，欢迎来到后端系统！！！")
    return"你好，欢迎来到后端系统！！！"

@app.get("/list",summary="获取用户列表",description="这是一个获取用户列表的接口",response_model=list[user], tags=["用户列表"])
def user_list():
    return [
        user(id=1, name="张三", age=18, honey="打乒乓球"),
        user(id=2, name="李四", age=19, honey="打篮球"),
    ]

@app.get("/list2",summary="获取用户列表",description="这是一个获取用户列表的接口",response_model=list[user], tags=["用户列表"])
def user_list():
    return [
        user(id=3, name="王五", age=18, honey="打羽毛球"),
        user(id=4, name="赵六", age=19, honey="打乒乓球"),
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
