import asyncio
import time
from fastapi import FastAPI

# 创建FastAPI实例
app = FastAPI(title="异步编程演示")

# 同步操作演示
def mock_io_task():
    print("开始查询数据...")
    time.sleep(3) # 固定等待3秒
    print("数据查询完成...")

@app.get("/sync_demo")
def sync_handle():
    t1 = time.time()    # 获取当前时间

    # 执行3次任务，依次等待
    mock_io_task()
    mock_io_task()
    mock_io_task()

    t2 = time.time()    # 获取当前时间
    cost = round(t2 - t1, 2)
    return {"模式":"同步串行", "执行耗时(秒)": cost}


# 异步操作演示
async def mock_async_task2():
    print("开始查询数据...")
    await asyncio.sleep(3)
    print("数据查询完成...")

@app.get("/async_demo")
async def async_handle2():
    t1 = time.time()         # 获取当前时间
    # 一次性调度3个任务 同时启动这3个任务，并发执行，等所有任务都完成后，再继续往下执行
    await asyncio.gather(
        mock_async_task2(),
        mock_async_task2(),
        mock_async_task2()
    )
    t2 = time.time()        # 获取当前时间
    cost = round(t2 - t1, 2)
    return {"模式":"异步并发", "执行耗时(秒)": cost}

# 启动FastAPI服务器
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)