from flask import Blueprint, jsonify, Flask, send_from_directory, render_template
import os

frontend_bp = Blueprint('frontend_routes', __name__, url_prefix='/')

@frontend_bp.route('/')
def index():
    return send_from_directory(os.path.join(frontend_bp.root_path, '../frontend/build'), 'index.html')
