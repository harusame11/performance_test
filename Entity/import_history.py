from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

from Entity.db_init import db
class ImportHistory(db.Model):
    __tablename__ = 'import_history'
    id = db.Column(db.Integer, primary_key=True,autoincrement=True)
    filename = db.Column(db.String(255), nullable=False)
    # import_time = db.Column(db.DateTime, nullable=False, default=datetime.now)