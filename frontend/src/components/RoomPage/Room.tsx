import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './style.css';

const socket = io(window.location.origin, {
    withCredentials: true,
    transports: ['websocket']
});

interface RatingData {
    q1?: number;
    q2?: number;
    q3?: number;
    comment?: string;
}

const Room: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const [users, setUsers] = useState<string[]>([]);
    const [presenters, setPresenters] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<string>('');
    const [currentPresenter, setCurrentPresenter] = useState<string | null>(null);
    const [currentRatedPresenter, setCurrentRatedPresenter] = useState<string>('');
    const [roomStatus, setRoomStatus] = useState<'waiting' | 'started' | 'offline'>('waiting');
    const [showRating, setShowRating] = useState(false);
    const [ratings, setRatings] = useState<RatingData>({});
    const [timeLeft, setTimeLeft] = useState(30);

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

        const handleRoomUpdate = (data: any) => {
            setUsers(data?.users || []);
            setPresenters(data?.presenters || []);
            setRoomStatus(data?.status || 'waiting');
            setCurrentPresenter(data?.currently_presenting || null);
        };

        const handleRatingStarted = (data: { presenter: string }) => {
            setCurrentRatedPresenter(data.presenter);
            setShowRating(true);
            setTimeLeft(30);
            
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleRatingSubmit();
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        };

        socket.on('room_update', handleRoomUpdate);
        socket.on('presenter_changed', (data: any) => setCurrentPresenter(data.currently_presenting));
        socket.on('want_present', handleRoomUpdate);
        socket.on('do_not_want_present', handleRoomUpdate);
        socket.on('rating_started', handleRatingStarted);
        socket.on('error', (error: any) => {
            alert(error.message);
            window.location.href = '/';
        });

        return () => {
            socket.off('room_update', handleRoomUpdate);
            socket.off('presenter_changed');
            socket.off('want_present', handleRoomUpdate);
            socket.off('do_not_want_present', handleRoomUpdate);
            socket.off('rating_started', handleRatingStarted);
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

    const handleRatingChange = (question: string, value: number) => {
        setRatings(prev => ({
            ...prev,
            [question]: value
        }));
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setRatings(prev => ({
            ...prev,
            comment: e.target.value
        }));
    };

    const handleRatingSubmit = () => {
        if (ratings.q1 && ratings.q2 && ratings.q3) {
            socket.emit('submit_rating', {
                room_code: roomCode,
                username: currentUser,
                presenter: currentRatedPresenter,
                ...ratings
            });
            setShowRating(false);
            setRatings({});
        }
    };

    const isPresenting = presenters.includes(currentUser);
    const isPresentationActive = roomStatus === 'started';

    return (
        <div className="room-container">
            {showRating && (
                <div className="rating-overlay">
                    <h2>Hodnocení: {currentRatedPresenter}</h2>
                    <div className="timer">Zbývající čas: {timeLeft}s</div>
                    
                    <div className="rating-form">
                        {[1, 2, 3].map((qNum) => (
                            <div key={qNum} className="rating-question">
                                <h3>{qNum}. {[
                                    'Přínosnost nápadu',
                                    'Kreativita nápadu', 
                                    'Uskutečnitelnost nápadu'
                                ][qNum - 1]}</h3>
                                <div className="scale-buttons">
                                    {[-3, -2, -1, 1, 2, 3].map((value) => (
                                        <button
                                            key={value}
                                            className={`scale-btn ${ratings[`q${qNum}` as keyof typeof ratings] === value ? 'selected' : ''}`}
                                            onClick={() => handleRatingChange(`q${qNum}`, value)}
                                        >
                                            {value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        <textarea
                            className="comment-box"
                            placeholder="Vaše poznámky..."
                            value={ratings.comment || ''}
                            onChange={handleCommentChange}
                        />
                        
                        <button
                            className="submit-rating"
                            onClick={handleRatingSubmit}
                            disabled={!ratings.q1 || !ratings.q2 || !ratings.q3}
                        >
                            Odeslat hodnocení
                        </button>
                    </div>
                </div>
            )}

            <div className="counters">
                <div className="counter">
                    <span className="counter-label">Připojeno:</span>
                    <span className="counter-value">{users.length}</span>
                </div>
                <div className="counter">
                    <span className="counter-label">Prezentující:</span>
                    <span className="counter-value">{presenters?.length || 0}</span>
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
                        {(users || []).map((user) => (
                            <div key={user} className="user-item">
                                <span className="username">{user}</span>
                                {presenters?.includes(user) && (
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