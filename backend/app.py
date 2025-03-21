from flask import Flask, jsonify, send_from_directory
from api import api_bp
from frontend_routes import frontend_bp
from database import database 
import os
from extensions import db, socketio
from sockets import register_socket_handlers

def create_app():
    app = Flask(__name__, static_folder="../frontend/build/static")
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'your_secret_key'

    # Inicializace rozšíření
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")  # Povolení CORS pro WebSockety

    # Registrace socket handlers
    register_socket_handlers()

    with app.app_context():
        db.create_all()

    # Registrace blueprintů
    app.register_blueprint(api_bp)
    app.register_blueprint(frontend_bp)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0")
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)  # Pouze socketio.run!