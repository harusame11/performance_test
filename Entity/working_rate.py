from flask_sqlalchemy import SQLAlchemy

from Entity.db_init import db

class Working_rate(db.Model):
    __tablename__ = 'working_rate'
    emp_id = db.Column(db.Integer, primary_key=True,autoincrement=True)
    emp_name = db.Column(db.String(100), nullable=False)
    work_hours = db.Column(db.Float, nullable=False)
    rate = db.Column(db.Float,nullable=False)

#目前未导入id，所以用姓名查询工时
    def __repr__(self):
        return f'<WorkHour {self.name} {self.hours}h>'