from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from performance.Entity.User import User
from performance.Entity.department import Department
from performance.Entity.working_rate import Working_rate
from performance.config import Config

# 替换成你的实际数据库 URI，例如：
# 'mysql+pymysql://username:password@localhost/dbname'
DATABASE_URI = Config.SQLALCHEMY_DATABASE_URI  # 示例用 SQLite，你的写法可能是 MySQL 或 PostgreSQL

engine = create_engine(DATABASE_URI)
Session = sessionmaker(bind=engine)
session = Session()

def refresh_avgtime():
    all_department = session.query(Department).all()
    all_users = session.query(User).all()
    for department in all_department:
        deptid = department.id
        length = 0
        time = 0
        for user in all_users:
            if user.departmentid == deptid:
                length += 1
                working_rate = session.query(Working_rate).filter_by(emp_id=user.emp_id).first()
                if working_rate and working_rate.work_hours:
                    time += working_rate.work_hours
        avgtime = time / length if length > 0 else 0
        department.avgattendance = avgtime

    session.commit()

if __name__ == '__main__':
    refresh_avgtime()
