import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './style.css';

const socket = io('http://localhost:5000', {
    withCredentials: true,
    transports: ['websocket']  // Explicitně nastavte transport
});

const Room: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const [users, setUsers] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<string>('');

    useEffect(() => {
        // Získání uživatelského jména z Local Storage
        const storedUsername = localStorage.getItem('username') || '';
        setCurrentUser(storedUsername);

        if (!storedUsername || !roomCode) {
            window.location.href = '/';
            return;
        }

        // Připojení k místnosti přes WebSocket
        socket.emit('join_room', {
            username: storedUsername,
            room_code: roomCode
        });

        // Posluchač pro aktualizace seznamu uživatelů
        socket.on('room_update', (data) => {
            setUsers(data.users);
        });

        // Posluchač pro chyby
        socket.on('error', (error) => {
            alert(error.message);
            window.location.href = '/';
        });

        // Úklid při odpojení
        return () => {
            socket.off('room_update');
            socket.off('error');
            socket.emit('leave_room', {
                username: storedUsername,
                room_code: roomCode
            });
        };
    }, [roomCode]);

    const handleLeaveRoom = () => {
        socket.emit('leave_room', {
            username: currentUser,
            room_code: roomCode
        });
        window.location.href = '/';
    };

    return (
        <div className="room-container">
            <div className="room-header">
                <h2>Místnost: {roomCode}</h2>
                <div className="user-info">
                    <span>Přihlášen jako: {currentUser}</span>
                    <button onClick={handleLeaveRoom}>Opustit místnost</button>
                </div>
            </div>
            
            <div className="users-list">
                <h3>Aktivní uživatelé ({users.length}):</h3>
                <ul>
                    {users.map((user, index) => (
                        <li key={index}>{user}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Room;