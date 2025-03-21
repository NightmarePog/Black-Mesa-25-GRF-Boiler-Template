from flask import Flask, jsonify, send_from_directory
from api import api_bp
from frontend_routes import frontend_bp
import os

app = Flask(__name__, static_folder="../frontend/build/static")
app.register_blueprint(api_bp)
app.register_blueprint(frontend_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)