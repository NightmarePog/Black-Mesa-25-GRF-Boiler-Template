from extensions import db
from sqlalchemy.ext.mutable import MutableList

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    score1 = db.Column(db.Integer, default=0)
    score2 = db.Column(db.Integer, default=0)
    score3 = db.Column(db.Integer, default=0)

class Room(db.Model):
    __tablename__ = 'rooms'
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(6), unique=True, nullable=False)
    room_name = db.Column(db.String(50), nullable=False)
    user_ids = db.Column(MutableList.as_mutable(db.PickleType), default=[])
    presenter_ids = db.Column(MutableList.as_mutable(db.PickleType), default=[])
