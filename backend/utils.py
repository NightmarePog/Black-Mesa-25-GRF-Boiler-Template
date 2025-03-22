import random
from database import Room  # Ujistěte se, že importujete správný model

def generate_room_code():
    return ''.join(random.choices("0123456789", k=6))

def get_unique_room_code():
    code = generate_room_code()
    # Pokud existuje záznam se stejným kódem, generujeme nový
    while Room.query.filter_by(room_code=code).first() is not None:
        code = generate_room_code()
    return code
