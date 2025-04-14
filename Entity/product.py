from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ARRAY

from Entity.db_init import db

class Product(db.Model):
    __tablename__ = 'product'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    number = db.Column(db.Integer, nullable=False)
    leader_id = db.Column(ARRAY(db.String(20)), nullable=False)
    @classmethod
    def add_product(cls,productname,leader_id,number=0):
        new_product = cls(
            name=productname
            ,leader_id=leader_id
            ,number=number
        )
        db.session.add(new_product)  # 添加到会话
        db.session.commit()  # 提交事务
    @classmethod
    def delete_product(cls,productid):
        try:
            Product.query.filter_by(id=productid).delete()
            db.session.commit()
            return "Success"
        except Exception as e:
            print("error:", e)
            return "Error"