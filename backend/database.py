from extensions import db
from sqlalchemy.ext.mutable import MutableList

class Room(db.Model):
    __tablename__ = 'rooms'
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(6), unique=True, nullable=False)
    room_name = db.Column(db.String(50), nullable=False)
    users = db.Column(MutableList.as_mutable(db.PickleType), default=[])
    presenters = db.Column(MutableList.as_mutable(db.PickleType), default=[])
    currently_presenting = db.Column(db.String(50), default=None)
    status = db.Column(db.String(50), default="waiting")
    presentation_history = db.Column(MutableList.as_mutable(db.PickleType), default=[])
    ratings = db.Column(MutableList.as_mutable(db.PickleType), default=[])