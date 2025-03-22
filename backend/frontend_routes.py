from flask import Blueprint, jsonify, Flask, send_from_directory, render_template
import os

# Vytvoření blueprintu pro frontend
frontend_bp = Blueprint('frontend', __name__, url_prefix='/')

# Cesta k React buildu (absolutní cesta pro spolehlivost)
REACT_BUILD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/build'))

# --------------------------------------------------
# 1. Sloužení statických souborů Reactu (CSS, JS)
# --------------------------------------------------
@frontend_bp.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(os.path.join(REACT_BUILD_DIR, 'static'), filename)

# --------------------------------------------------
# 2. Zachycení všech rout pro React Router
# --------------------------------------------------
@frontend_bp.route('/')
def index():
    return send_from_directory(REACT_BUILD_DIR, 'index.html')

@frontend_bp.route('/<path:path>')  # Zachytí všechny cesty včetně /login, /about atd.
def catch_all(path):
    return send_from_directory(REACT_BUILD_DIR, 'index.html')

# --------------------------------------------------
# Vytvoření Flask aplikace a registrace blueprintů
# --------------------------------------------------
app = Flask(__name__)

# Příklad API blueprintu (musí být registrován PŘED frontendem!)
api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/data')
def get_data():
    return jsonify({"message": "API funguje!"})

app.register_blueprint(api_bp)
app.register_blueprint(frontend_bp)

if __name__ == '__main__':
    app.run(debug=True)