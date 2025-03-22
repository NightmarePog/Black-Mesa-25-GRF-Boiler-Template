import pytest
from flask import Flask
from flask.testing import FlaskClient
from socketio import Client
from app import create_app, db
from database import User, Room

@pytest.fixture(scope="module")
def test_app():
    # Vytvoření testovací aplikace s in-memory databází
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def test_client(test_app):
    # Testovací klient pro HTTP požadavky
    return test_app.test_client()

    
@pytest.fixture
def socket_client(test_app):
    # Testovací klient pro WebSocket komunikaci
    client = Client()
    client.connect('http://localhost:5000', transports=['websocket'])
    yield client
    client.disconnect()

def test_full_room_lifecycle(test_client, socket_client):
    # 1. Vytvoření místnosti
    res = test_client.post('/api/v1/create_room/TestovaciMistnost')
    room_code = res.json['room_code']
    
    # 2. Připojení uživatele přes WebSocket
    user_data = None
    def user_registered(data):
        nonlocal user_data
        user_data = data
    
    socket_client.on('user_registered', user_registered)
    socket_client.emit('join_room', {
        'username': 'TestUser',
        'room_code': room_code
    })
    socket_client.sleep(2)  # Čekání na odpověď
    
    assert user_data is not None
    user_id = user_data['user_id']
    
    # 3. Ověření stavu místnosti
    res = test_client.get(f'/api/v1/get_room_info/{room_code}')
    assert str(user_id) in res.json['users']
    
    # 4. Nastavení skóre
    test_client.post('/api/v1/SetRate', json={
        'playerID': user_id,
        'rateOrder': 2,
        'score': 42
    })
    
    # 5. Kontrola skóre
    res = test_client.get(f'/api/v1/GetRate?playerID={user_id}&rateOrder=2')
    assert res.json['score'] == 42
    
    # 6. Opuštění místnosti
    socket_client.emit('leave_room', {
        'user_id': user_id,
        'room_code': room_code
    })
    socket_client.sleep(1)
    
    # 7. Ověření smazání uživatele
    user = User.query.get(user_id)
    assert user is None

def test_presentation_flow(test_client, socket_client):
    # Vytvoření místnosti
    res = test_client.post('/api/v1/create_room/PresentationTest')
    room_code = res.json['room_code']
    
    # Připojení uživatele
    user_id = None
    socket_client.on('user_registered', lambda data: globals().update({'user_id': data['user_id']}))
    socket_client.emit('join_room', {'username': 'Presenter', 'room_code': room_code})
    socket_client.sleep(1)
    
    # Testování prezentování
    presentation_data = None
    def handle_presentation(data):
        nonlocal presentation_data
        presentation_data = data
    
    # Chci prezentovat
    socket_client.on('want_present', handle_presentation)
    socket_client.emit('want_present', {
        'user_id': user_id,
        'room_code': room_code
    })
    socket_client.sleep(1)
    
    assert user_id in presentation_data['presenters']
    
    # Přestat prezentovat
    socket_client.on('do_not_want_present', handle_presentation)
    socket_client.emit('do_not_want_present', {
        'user_id': user_id,
        'room_code': room_code
    })
    socket_client.sleep(1)
    
    assert user_id not in presentation_data['presenters']

def test_error_handling(test_client, socket_client):
    # Testování chybějících dat
    res = test_client.post('/api/v1/create_user', json={})
    assert res.status_code == 400
    
    # Neplatné ID pro smazání
    res = test_client.delete('/api/v1/delete_user/999999')
    assert res.status_code == 404
    
    # Neplatný pokus o připojení
    def handle_error(data):
        assert 'Vyplňte všechny údaje' in data['message']
    
    socket_client.on('error', handle_error)
    socket_client.emit('join_room', {})
    socket_client.sleep(1)

def test_concurrent_users(test_client):
    # Testování více současných uživatelů
    room_res = test_client.post('/api/v1/create_room/ConcurrentRoom')
    room_code = room_res.json['room_code']
    
    users = []
    for i in range(3):
        user_res = test_client.post('/api/v1/create_user', json={'name': f'User{i+1}'})
        user_id = user_res.json['user']['id']
        join_res = test_client.post(f'/api/v1/join_room/{room_code}', json={'user_id': user_id})
        users.append(user_id)
    
    room_info = test_client.get(f'/api/v1/get_room_info/{room_code}').json
    assert len(room_info['users']) == 3
    assert all(str(u) in room_info['users'] for u in users)