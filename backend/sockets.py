from extensions import db, socketio
from flask_socketio import join_room, leave_room
from database import database  # Import databázového modelu
import datetime

def handle_join_room(data):
    username = data['username']
    room = data['room']
    join_room(room)
    socketio.emit('message', {
        'type': 'system',
        'content': f'{username} joined the room {room}'
    }, room=room)
    

def handle_new_message(data):
    message = data['message']
    username = data['username']
    room = data['room']
    
    # Uložení zprávy do databáze
    #new_message = database(name=username, content=message)  # Předpokládám, že máte content sloupec
    #db.session.add(new_message)
    #db.session.commit()
    
    socketio.emit('new_message', {
        'username': username,
        'content': message,
        'timestamp': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }, room=room)

def register_socket_handlers():
    socketio.on_event('join_room', handle_join_room)
    socketio.on_event('send_message', handle_new_message)