from app import db

class test(db.Model):
    id = db.Column(db.Integer, primary_key=True)