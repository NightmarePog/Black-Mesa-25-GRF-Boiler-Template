from flask import Blueprint, jsonify
from database import Room
from extensions import db
from utils import get_unique_room_code

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

@api_bp.route("/create_room/<room_name>", methods=["POST"])
def create_room(room_name):
    code = get_unique_room_code()
    room = Room(room_name=room_name, room_code=code)
    db.session.add(room)
    db.session.commit()
    return jsonify({"message": "Room created!", "room_code": code})


@api_bp.route("/hi", methods=["GET"])
def hello():
    return jsonify({"message": "hi!"})