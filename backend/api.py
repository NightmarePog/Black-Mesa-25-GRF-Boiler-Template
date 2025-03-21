from flask import Blueprint, jsonify

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

@api_bp.route("/hi", methods=["GET"])
def hello():
    return jsonify({"message": "hi!"})