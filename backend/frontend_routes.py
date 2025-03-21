from flask import Blueprint, send_from_directory
import os

frontend_bp = Blueprint('frontend_routes', __name__, url_prefix='/')

@frontend_bp.route('/')
@frontend_bp.route('/<path:path>')  # Nová catch-all route pro všechny cesty
def serve_react_app(path=None):
    build_dir = os.path.join(frontend_bp.root_path, '../frontend/build')
    
    # Pokud se jedná o API cestu nebo statický soubor, necháme to na jiných routách
    if path and (path.startswith('api/') or path.startswith('static/')):
        return send_from_directory(build_dir, path)
    
    # Pro všechny ostatní cesty vrátíme index.html
    return send_from_directory(build_dir, 'index.html')