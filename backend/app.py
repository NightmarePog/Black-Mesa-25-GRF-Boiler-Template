from flask import Flask, jsonify, send_from_directory, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
import os
from api import api_bp
from frontend_routes import frontend_bp
from extensions import db, socketio
from database import Room 
from websocket import register_socket_handlers
from flask_cors import CORS

def create_app():
    app = Flask(__name__, static_folder="../frontend/build/static")
    CORS(app, resources={r"/*": {"origins": "*"}})
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    app.register_blueprint(api_bp)
    app.register_blueprint(frontend_bp)

    register_socket_handlers()

    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")

    with app.app_context():
        db.create_all()
    
    return app

if __name__ == "__main__":
    app = create_app()
    socketio.run(app, host="0.0.0.0", port=5000, debug=True, allow_unsafe_werkzeug=True)