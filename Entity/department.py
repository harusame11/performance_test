from flask_sqlalchemy import SQLAlchemy

from Entity.db_init import db


class Department(db.Model):
    __tablename__ = 'department'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    avgattendance = db.Column(db.Float, nullable=False)
    number = db.Column(db.Integer, nullable=False)
    leader_id = db.Column(db.String(20), db.ForeignKey('users.emp_id'), nullable=False)
    @classmethod
    def all_department(cls):
        return cls.query.all()
    @classmethod
    def add_department(cls,departmentname,leader_id,avgattendance=0,number=0):
        new_department = cls(
            name=departmentname,
            leader_id=leader_id
            ,avgattendance=avgattendance
            ,number=number
        )
        db.session.add(new_department)  # 添加到会话
        db.session.commit()  # 提交事务
    @classmethod
    def delete_department(cls,departmentid):
        try:
            Department.query.filter_by(id=departmentid).delete()
            db.session.commit()
            return "Success"
        except Exception as e:
            print("error:", e)
            return "Error"