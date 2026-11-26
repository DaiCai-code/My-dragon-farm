from datetime import datetime
from sqlalchemy import create_engine, Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase, Session

# 1. 创建SQLAlchemy引擎, 管理数据库连接、配置信息
engine = create_engine("mysql+pymysql://root:root@localhost:3306/db_01",
                       echo=True)  # echo=True : 由连接产生的 SQL 语句, 会输出在日志中;


# 2. 声明模型父类, 定义与数据库表映射的模型类 (ORM --> 对象关系映射 : 类 ---> 表)
class Base(DeclarativeBase):
    pass


class AiMessage(Base):
    __tablename__ = "ai_message"  # 指定表名

    # 格式 --> 属性名: Mapped[对象属性类型] = mapped_column(类型(SQLALchemy中的类型), 是否为空, 是否主键, 字段注释)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment='主键')
    session_id: Mapped[int] = mapped_column(Integer, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(String(500), nullable=False)
    create_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    def __repr__(self):
        return f"<AiMessage(id={self.id}, session_id={self.session_id}, role={self.role}, content={self.content}, create_time={self.create_time})>"


# 自动创建表
# Base.metadata.create_all(engine)

if __name__ == '__main__':

    with Session(engine) as session:
        # 1. 执行操作 - 新增数据
        session.add(AiMessage(session_id=1, role="assistant", content="你笑什么呢~", create_time=datetime.now()))
        session.add(AiMessage(session_id=1, role="user", content="就是好笑呀", create_time=datetime.now()))
        session.commit()



    # # 3. 执行操作 - 新增数据
    # # 3.1 获取操作数据库的会话对象session
    # session = Session(engine)
    #
    # # 3.2 执行操作
    # session.add(AiMessage(session_id=1, role="assistant", content="你笑什么呢~", create_time=datetime.now()))
    # session.add(AiMessage(session_id=1, role="user", content="就是好笑呀", create_time=datetime.now()))
    # session.commit()
    #
    # # 3.3 释放session
    # session.close()