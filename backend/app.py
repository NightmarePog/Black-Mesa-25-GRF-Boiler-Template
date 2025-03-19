from flask import Flask, jsonify, send_from_directory
import os

app = Flask(__name__, static_folder="../frontend/build/static")

# API!!!
@app.route("/api/hello", methods=["GET"])
def hello():
    return jsonify({"message": "hi!"})

# načtení frontendu, radši na to nehrab
@app.route("/")
def main_page():
    return send_from_directory(os.path.join(app.root_path, '../frontend/build'), 'index.html')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
