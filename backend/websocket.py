from app import socketio

@socketio.on('message')
def handle_message(msg):
    print(f'Received message: {msg}')
    socketio.send(f'Echo: {msg}')
