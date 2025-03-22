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
    const [currentPresenter, setCurrentPresenter] = useState<string | null>(null);
    const [roomStatus, setRoomStatus] = useState<'waiting' | 'started' | 'offline'>('waiting');

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
            setPresenters(data.presenters || []);
            setRoomStatus(data.status);
            setCurrentPresenter(data.currently_presenting);
        });

        socket.on('presenter_changed', (data) => {
            setCurrentPresenter(data.currently_presenting);
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
            socket.off('presenter_changed');
            socket.off('error');
            socket.emit('leave_room', {
                username: storedUsername,
                room_code: roomCode
            });
        };
    }, [roomCode]);

    const togglePresentation = () => {
        if (presenters.includes(currentUser)) {
            socket.emit('do_not_want_present', {
                username: currentUser,
                room_code: roomCode
            });
        } else {
            socket.emit('want_present', {
                username: currentUser,
                room_code: roomCode
            });
        }
    };

    const handleLeaveRoom = () => {
        socket.emit('leave_room', {
            username: currentUser,
            room_code: roomCode
        });
        window.location.href = '/';
    };

    const isPresenting = presenters.includes(currentUser);
    const isPresentationActive = roomStatus === 'started';

    return (
        <div className="room-container">
            <div className="counters">
                <div className="counter">
                    <span className="counter-label">Připojeno:</span>
                    <span className="counter-value">{users.length}</span>
                </div>
                <div className="counter">
                    <span className="counter-label">Prezentující:</span>
                    <span className="counter-value">{presenters.length}</span>
                </div>
            </div>

            <main className="main-content">
                {currentPresenter ? (
                    <h1 className="waiting-title">🎤 Právě prezentuje: {currentPresenter}</h1>
                ) : (
                    <h1 className="waiting-title">
                        {roomStatus === 'started' ? 'Prezentace probíhá' : 'Čekání na zahájení'}
                    </h1>
                )}
                
                <button 
                    className={`presentation-button ${isPresenting ? 'active' : ''}`}
                    onClick={togglePresentation}
                    disabled={isPresentationActive}
                >
                    {isPresentationActive ? (
                        'Prezentace probíhá'
                    ) : isPresenting ? (
                        <>
                            <span className="icon">⭐</span>
                            Prezentuji
                        </>
                    ) : (
                        'Chci prezentovat'
                    )}
                </button>

                <div className="users-section">
                    <h2>Aktivní uživatelé</h2>
                    <div className="users-list">
                        {users.map((user) => (
                            <div key={user} className="user-item">
                                <span className="username">{user}</span>
                                {presenters.includes(user) && (
                                    <span className="presenter-icon">🎤</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <button 
                    className="exit-button"
                    onClick={handleLeaveRoom}
                >
                    Opustit místnost
                </button>
            </main>
        </div>
    );
};

export default Room;