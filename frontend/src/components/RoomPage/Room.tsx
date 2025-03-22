import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './style.css';

const socket = io('http://localhost:5000', {
    withCredentials: true,
    transports: ['websocket']
});

const Room: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const [users, setUsers] = useState<string[]>([]);
    const [presenters, setPresenters] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<string>('');

    useEffect(() => {
        const storedUsername = localStorage.getItem('username') || '';
        setCurrentUser(storedUsername);

        if (!storedUsername || !roomCode) {
            window.location.href = '/';
            return;
        }

        socket.emit('join_room', {
            username: storedUsername,
            room_code: roomCode
        });

        socket.on('room_update', (data) => {
            setUsers(data.users);
            if(data.presenters) setPresenters(data.presenters);
        });

        socket.on('want_present', (data) => {
            setPresenters(data.presenters);
        });

        socket.on('do_not_want_present', (data) => {
            setPresenters(data.presenters);
        });

        socket.on('error', (error) => {
            alert(error.message);
            window.location.href = '/';
        });

        return () => {
            socket.off('room_update');
            socket.off('want_present');
            socket.off('do_not_want_present');
            socket.off('error');
            socket.emit('leave_room', {
                username: storedUsername,
                room_code: roomCode
            });
        };
    }, [roomCode]);

    const handleWantPresent = () => {
        socket.emit('want_present', {
            username: currentUser,
            room_code: roomCode
        });
    };

    const handleDoNotWantPresent = () => {
        socket.emit('do_not_want_present', {
            username: currentUser,
            room_code: roomCode
        });
    };

    const handleLeaveRoom = () => {
        socket.emit('leave_room', {
            username: currentUser,
            room_code: roomCode
        });
        window.location.href = '/';
    };

    const isPresenting = presenters.includes(currentUser);

    return (
        <div className="room-container">
            <div className="room-header">
                <h2>Místnost: {roomCode}</h2>
                <div className="user-info">
                    <span>Přihlášen jako: {currentUser}</span>
                    <button onClick={handleLeaveRoom}>Opustit místnost</button>
                </div>
            </div>

            <div className="presentation-controls">
                {isPresenting ? (
                    <button 
                        className="unpresent-button"
                        onClick={handleDoNotWantPresent}
                    >
                        Nechci prezentovat
                    </button>
                ) : (
                    <button 
                        className="present-button"
                        onClick={handleWantPresent}
                    >
                        Chci prezentovat
                    </button>
                )}
            </div>

            <div className="users-list">
                <h3>Aktivní uživatelé ({users.length}):</h3>
                <ul>
                    {users.map((user, index) => (
                        <li key={index}>{user}</li>
                    ))}
                </ul>
            </div>

            <div className="presenters-list">
                <h3>Prezentující ({presenters.length}):</h3>
                <ul>
                    {presenters.map((presenter, index) => (
                        <li key={index}>{presenter}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Room;