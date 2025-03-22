from extensions import db
from sqlalchemy.ext.mutable import MutableList

class rooms(db.Model):
    __tablename__ = 'rooms'
    id = db.Column(db.Integer, primary_key=True)
    room_name = db.Column(db.String(50), nullable=False)
    users = db.Column(MutableList.as_mutable(db.PickleType), default=[])
    presentations = db.Column(MutableList.as_mutable(db.PickleType), default={})