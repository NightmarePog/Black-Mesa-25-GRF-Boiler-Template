from flask import request
from extensions import db, socketio
from flask_socketio import join_room, leave_room
from database import Room  # Import your database model


def handle_join_room(data):
    room_code = data.get('room_code')
    username = data.get('username')
    
    if not username or not room_code:
        socketio.emit('error', {'message': 'Vyplňte všechny údaje'}, room=request.sid)
        return

    room = Room.query.filter_by(room_code=room_code).first()
    if not room:
        socketio.emit('error', {'message': 'Místnost neexistuje'}, room=request.sid)
        return

    try:
        # Vytvoření nového uživatele
        new_user = User(
            name=username,
            score1=0,
            score2=0,
            score3=0
        )
        db.session.add(new_user)
        db.session.commit()

        # Přidání ID uživatele do místnosti
        if new_user.id not in room.user_ids:
            room.user_ids.append(new_user.id)
            db.session.commit()

        join_room(room_code)
        
        # Odeslat ID nového uživatele zpět klientovi
        socketio.emit('user_registered', {
            'user_id': new_user.id,
            'username': new_user.name
        }, room=request.sid)

        # Broadcast aktualizace místnosti
        socketio.emit('room_update', {
            'users': [{"id": u.id, "name": u.name} for u in User.query.filter(User.id.in_(room.user_ids)).all()],
            'presenters': room.presenter_ids,
            'room_code': room_code
        }, room=room_code)

    except Exception as e:
        db.session.rollback()
        socketio.emit('error', {'message': 'Chyba při vytváření uživatele'}, room=request.sid)
        print(f"Chyba: {str(e)}")

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
    
    # Přidání uživatele do presenters
    try:
        room.presenters.append(username)
        db.session.commit()
    except Exception as e:
        print(f"Chyba při přidávání uživatele do presenters: {e}")
    
    # Odeslat aktualizovaný seznam všem v místnosti
    socketio.emit('want_present', {
        'presenters': room.presenters,
        'room_code': room_code
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
    user_id = data.get('user_id')
    room_code = data.get('room_code')
    
    room = Room.query.filter_by(room_code=room_code).first()
    user = User.query.get(user_id)

    if not room or not user:
        return  # Můžeme přidat logování chyby nebo vrácení chybové zprávy

    try:
        # Odebrání uživatele z místnosti
        if user.id in room.user_ids:
            room.user_ids.remove(user.id)
            
            # Odebrání z prezentujících pokud je tam
            if user.id in room.presenter_ids:
                room.presenter_ids.remove(user.id)
            
            # Smazání celého uživatele z databáze
            db.session.delete(user)
            db.session.commit()

        # Socket.io operace
        leave_room(room_code)
        socketio.emit('room_update', {
            'users': room.user_ids,
            'presenters': room.presenter_ids,
            'room_code': room_code
        }, room=room_code)

    except Exception as e:
        db.session.rollback()
        print(f"Chyba při zpracování opuštění místnosti: {str(e)}")
        # Můžeme přidat vrácení chybové zprávy klientovi

def register_socket_handlers():
    print("Registrace socket handlerů")
    
    socketio.on_event('join_room', handle_join_room)
    socketio.on_event('leave_room', handle_leave_room)
    socketio.on_event('want_present', want_present)
    socketio.on_event('do_not_want_present', do_not_want_present)
