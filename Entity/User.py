from flask_sqlalchemy import SQLAlchemy

from Entity.db_init import db


class User(db.Model):
    __tablename__ = 'users'

    emp_id = db.Column(db.String(20), primary_key=True)
    emp_name = db.Column(db.String(50), nullable=False)
    position = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    isSA = db.Column(db.Boolean, nullable=False)
    isRJ = db.Column(db.Boolean, nullable=False)
    isPJ = db.Column(db.Boolean, nullable=False)
    immediate_leader = db.Column(db.String(20), db.ForeignKey('users.emp_id'))
    directJudgeid = db.Column(db.String(20),)
    top_leader = db.Column(db.String(20), db.ForeignKey('users.emp_id'))
    ProductGroup = db.Column(db.String(100))
    departmentid = db.Column(db.Integer, db.ForeignKey('department.id'), nullable=False)
    productid = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)

    def to_dict(self):
        return {
            "emp_id": self.emp_id,
            "emp_name": self.emp_name,
            "position": self.position,
            "department": self.department,
            "isSA": self.isSA,
            "isRJ": self.isRJ,
            "isPJ": self.isPJ,
            "directJudgeid": self.directJudgeid,
            "ProductGroup": self.ProductGroup,
            "immediate_leader": self.immediate_leader,
            "top_leader": self.top_leader,
            "productid": self.productid,
            "departmentid": self.departmentid
        }
    @classmethod
    def find_by_judge_id(cls, identify):
        return User.query.filter(
            (User.directJudgeid == identify) | (User.immediate_leader == identify)
        ).all()
    def change_info(self, emp_id=None, emp_name=None, position=None, department=None,
                    isSA=None, isRJ=None, isPJ=None, directJudgeid=None, ProductGroup=None,
                    immediate_leader=None, top_leader=None, productid=None, departmentid=None):

        if emp_id is not None:
            self.emp_id = emp_id
        if emp_name is not None:
            self.emp_name = emp_name
        if position is not None:
            self.position = position
        if department is not None:
            self.department = department
        if isSA is not None:
            self.isSA = isSA
        if isRJ is not None:
            self.isRJ = isRJ
        if isPJ is not None:
            self.isPJ = isPJ
        if directJudgeid is not None:
            self.directJudgeid = directJudgeid
        if ProductGroup is not None:
            self.ProductGroup = ProductGroup
        if immediate_leader is not None:
            self.immediate_leader = immediate_leader
        if top_leader is not None:
            self.top_leader = top_leader
        if productid is not None:
            self.productid = productid
        if departmentid is not None:
            self.departmentid = departmentid

        db.session.commit()  # 提交数据库更改
    @classmethod
    def add_user(cls, emp_id, emp_name, position, department, isSA, isRJ, isPJ,directJudgeid, ProductGroup, immediate_leader,productid, departmentid, top_leader=None,):
        new_user = cls(
            emp_id=emp_id,
            emp_name=emp_name,
            position=position,
            department=department,
            isSA=isSA,
            isRJ=isRJ,
            isPJ=isPJ,
            directJudgeid=directJudgeid,
            ProductGroup=ProductGroup,
            immediate_leader=immediate_leader,
            productid=productid,
            departmentid=departmentid,
            top_leader=top_leader
        )  # 添加到会话
        db.session.add(new_user)
        db.session.commit()
    @classmethod
    def delete_user(cls,emp_id):
        try:
            User.query.filter_by(emp_id=emp_id).delete()
            db.session.commit()
            return "Success"
        except Exception as e:
            print("error:", e)
            return "Error"
