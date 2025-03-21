from extensions import db
from sqlalchemy.ext.mutable import MutableList

class database(db.Model):
    __tablename__ = 'database'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)