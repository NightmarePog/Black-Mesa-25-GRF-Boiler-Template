from flask import request
from extensions import db, socketio
from flask_socketio import join_room, leave_room
from database import Room  # Import your database model
import random
from datetime import datetime  # Přidat chybějící import
import datetime

votes_tracker = {}

def start_room(data):
    room_code = data.get('room_code')
    room = Room.query.filter_by(room_code=room_code).first()
    if room:
        # Vybrat náhodného prezentujícího
        if len(room.presenters) > 0:
            import random
            room.currently_presenting = random.choice(room.presenters)
        else:
            room.currently_presenting = None
        
        room.status = "started"
        db.session.commit()
        
        socketio.emit('room_update', {
            'users': room.users,
            'presenters': room.presenters,
            'room_code': room_code,
            'status': room.status,
            'currently_presenting': room.currently_presenting
        }, room=room_code)
    else:
        socketio.emit('error', {'message': 'Místnost neexistuje'}, room=request.sid)

def change_presenter(data):
    room_code = data.get('room_code')
    room = Room.query.filter_by(room_code=room_code).first()
    
    if not room or not room.presenters:
        return

    # Získat prezentující, kteří ještě neprezentovali
    available = [p for p in room.presenters if p not in room.presentation_history]
    
    # Pokud všichni už prezentovali, resetovat historii
    if not available:
        available = room.presenters
        room.presentation_history = []

    # Vybrat náhodného prezentujícího
    new_presenter = random.choice(available)
    room.presentation_history.append(new_presenter)
    room.currently_presenting = new_presenter
    
    db.session.commit()

    socketio.emit('presenter_changed', {
        'room_code': room_code,
        'currently_presenting': new_presenter,
        'presentation_history': room.presentation_history,
        'remaining_presenters': len(room.presenters) - len(room.presentation_history)
    }, room=room_code)

def stop_room(data):
    room_code = data.get('room_code')
    room = Room.query.filter_by(room_code=room_code).first()
    if room:
        room.status = "offline"
        db.session.commit()
        socketio.emit('room_update', {
            'users': room.users,
            'presenters': room.presenters,
            'room_code': room_code,
            "status": room.status
        }, room=room_code)
    else:
        print("Místnost neexistuje")
        socketio.emit('error', {'message': 'Místnost neexistuje'}, room=request.sid)

def waiting_room(data):
    room_code = data.get('room_code')
    room = Room.query.filter_by(room_code=room_code).first()
    if room:
        room.status = "waiting"
        db.session.commit()
        socketio.emit('room_update', {
            'users': room.users,
            'presenters': room.presenters,
            'room_code': room_code,
            "status": room.status
        }, room=room_code)
    else:
        print("Místnost neexistuje")
        socketio.emit('error', {'message': 'Místnost neexistuje'}, room=request.sid)

def handle_join_room(data):
    username = data.get('username')
    room_code = data.get('room_code')
    print(username, room_code)
    if not username or not room_code:
        print("Vyplňte všechny údaje")
        socketio.emit('error', {'message': 'Vyplňte všechny údaje'}, room=request.sid)
        return

    room = Room.query.filter_by(room_code=room_code).first()
    if not room:
        print("Místnost neexistuje")
        socketio.emit('error', {'message': 'Místnost neexistuje'}, room=request.sid)
        return

    # Přidání uživatele do místnosti
    if username not in room.users:
        print("Přidání uživatele do místnosti")
        try:
            room.users.append(username)
            db.session.commit()
        except Exception as e:
            socketio.emit('error', {'message': 'Chyba databáze'}, room=request.sid)
            return

    join_room(room_code)
    
    # Odeslat aktualizovaný seznam všem v místnosti
    socketio.emit('room_update', {
        'users': room.users,
        "presenters": room.presenters,
        'room_code': room_code,
        "status": room.status
    }, room=room_code)

def want_present(data):
    username = data.get('username')
    room_code = data.get('room_code')
    print(username, room_code)

    if not username or not room_code:
        print("Vyplňte všechny údaje")
        socketio.emit('error', {'message': 'Vyplňte všechny údaje'}, room=request.sid)
        return
    
    room = Room.query.filter_by(room_code=room_code).first()
    if not room:
        print("Místnost neexistuje")
        socketio.emit('error', {'message': 'Místnost neexistuje'}, room=request.sid)
        return
    
    # Přidání do user do databáze do presenters
    try:
        room.presenters.append(username)
        db.session.commit()
    except Exception as e:
        print(f"Chyba při přidávání uživatele do presenters: {e}")
    
    # Odeslat aktualizovaný seznam všem v místnosti
    socketio.emit('want_present', {
        'users': room.users,  # Přidáno
        'presenters': room.presenters,
        'room_code': room_code,
        'status': room.status  # Přidáno
    }, room=room_code)

def do_not_want_present(data):
    username = data.get('username')
    room_code = data.get('room_code')
    print(username, room_code)
    if not username or not room_code:
        print("Vyplňte všechny údaje")
        socketio.emit('error', {'message': 'Vyplňte všechny údaje'}, room=request.sid)
        return

    room = Room.query.filter_by(room_code=room_code).first()
    if not room:
        print("Místnost neexistuje")
        socketio.emit('error', {'message': 'Místnost neexistuje'}, room=request.sid)
        return

    # Odebrání uživatele z presenters
    try:
        room.presenters.remove(username)
        db.session.commit()
    except Exception as e:
        print(f"Chyba při odebírání uživatele z presenters: {e}")

    # Odeslat aktualizovaný seznam všem v místnosti
    socketio.emit('do_not_want_present', {
        'presenters': room.presenters,
        'room_code': room_code
    }, room=room_code)

def handle_leave_room(data):
    username = data.get('username')
    room_code = data.get('room_code')
    
    room = Room.query.filter_by(room_code=room_code).first()
    if room and username in room.users:
        try:
            room.users.remove(username)
            if username in room.presenters:
                try:
                    room.presenters.remove(username)
                    db.session.commit()
                except Exception as e:
                    print(f"Chyba při odebírání uživatele z presenters: {e}")

            db.session.commit()
        except Exception as e:
            print(f"Chyba při odstraňování uživatele: {e}")
    
    leave_room(room_code)
    socketio.emit('room_update', {
        'users': room.users if room else [],
        'presenters': room.presenters if room else [],
        'room_code': room_code,
        "status": room.status
    }, room=room_code)

def admin_join(data):
    room_code = data.get('room_code')
    if room_code:
        join_room(room_code)
        print(f"Admin připojen do místnosti: {room_code}")


def handle_start_rating(data):
    room_code = data.get('room_code')
    room = Room.query.filter_by(room_code=room_code).first()
    
    if room and room.currently_presenting:
        socketio.emit('rating_started', {
            'presenter': room.currently_presenting
        }, room=room_code)
        
        # Resetujeme stav hodnocení
        room.ratings = []
        db.session.commit()

active_ratings = {}

def start_rating(data):
    room_code = data.get('room_code')
    room = Room.query.filter_by(room_code=room_code).first()
    
    if room and room.currently_presenting:
        # Inicializace s aktuálními uživateli
        active_ratings[room_code] = {
            'presenter': room.currently_presenting,
            'users': set(room.users),  # Použít skutečné uživatele
            'rated': set(),
            'ratings': []
        }
        
        socketio.emit('rating_started', {
            'presenter': room.currently_presenting
        }, room=room_code)

def handle_rating(data):
    room_code = data.get('room_code')
    username = data.get('username')
    presenter = data.get('presenter')
    
    if not all([room_code, username, presenter]):
        return

    if room_code in active_ratings:
        # Přidání hodnocení
        rating_data = {
            'user': username,
            'presenter': presenter,
            'q1': data.get('q1'),
            'q2': data.get('q2'),
            'q3': data.get('q3'),
            'comment': data.get('comment'),
            'timestamp': datetime.datetime.now()
        }
        
        active_ratings[room_code]['rated'].add(username)
        active_ratings[room_code]['ratings'].append(rating_data)

        # Kontrola kompletního hodnocení
        if active_ratings[room_code]['users'].issubset(active_ratings[room_code]['rated']):
            room = Room.query.filter_by(room_code=room_code).first()
            if room:
                room.ratings.extend(active_ratings[room_code]['ratings'])
                db.session.commit()
            
            change_presenter({'room_code': room_code})
            del active_ratings[room_code]
            socketio.emit('rating_finished', room=room_code)

def handle_submit_rating(data):
    room_code = data.get('room_code')
    username = data.get('username')
    rating = data.get('rating')
    
    if room_code in votes_tracker:
        tracker = votes_tracker[room_code]
        if username in tracker['expected']:
            tracker['received'].add(username)
            
            # Uložení hodnocení do databáze
            room = Room.query.filter_by(room_code=room_code).first()
            if room:
                room.presentation_history.append({
                    'presenter': tracker['presenter'],
                    'user': username,
                    'rating': rating,
                    'timestamp': datetime.now()
                })
                db.session.commit()
            
            # Kontrola dokončení
            if len(tracker['received']) == len(tracker['expected']):
                change_presenter({'room_code': room_code})
                socketio.emit('end_rating', room=room_code)
                del votes_tracker[room_code]


def register_socket_handlers():
    print("Registrace socket handlerů")
    socketio.on_event('join_room', handle_join_room)
    socketio.on_event('leave_room', handle_leave_room)
    socketio.on_event('want_present', want_present)
    socketio.on_event('do_not_want_present', do_not_want_present)
    socketio.on_event('start_room', start_room)
    socketio.on_event('stop_room', stop_room)
    socketio.on_event('waiting_room', waiting_room)
    socketio.on_event('admin_join', admin_join)
    socketio.on_event('change_presenter', change_presenter)
    socketio.on_event('start_rating', start_rating)
    socketio.on_event('submit_rating', handle_rating) 