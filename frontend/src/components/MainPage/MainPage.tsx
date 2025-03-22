import React, { useState } from 'react';
import './style.css';

const MainPage: React.FC = () => {
    const [roomCode, setRoomCode] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [showUsernameInput, setShowUsernameInput] = useState<boolean>(false);
    const [isCheckingRoom, setIsCheckingRoom] = useState<boolean>(false);

    const checkRoom = async () => {
        if (!roomCode.trim()) {
            alert('Zadejte kód místnosti');
            return;
        }

        setIsCheckingRoom(true);
        try {
            const response = await fetch(`/api/v1/exists_room/${roomCode}`);
            if (!response.ok) throw new Error('Chyba serveru');
            
            const data = await response.json();
            if (data.exists) {
                setShowUsernameInput(true);
            } else {
                alert('Místnost neexistuje!');
            }
        } catch (error) {
            console.error('Chyba:', error);
            alert('Nelze ověřit místnost');
        } finally {
            setIsCheckingRoom(false);
        }
    };

    const handleJoin = () => {
        if (!userName.trim()) {
            alert('Zadejte uživatelské jméno');
            return;
        }
        // Uložení jména do Local Storage
        localStorage.setItem('username', userName.trim());
        window.location.href = `/room/${roomCode}`;
    };

    return (
        <div className="main-container">
            <div className="content-box">
                {!showUsernameInput ? (
                    <div className="join-section">
                        <input
                            type="text"
                            placeholder="Zadejte připojovací kód"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && checkRoom()}
                            disabled={isCheckingRoom}
                        />
                        <button 
                            onClick={checkRoom}
                            disabled={isCheckingRoom}
                        >
                            {isCheckingRoom ? 'Kontroluji...' : 'Připojit se'}
                        </button>
                    </div>
                ) : (
                    <div className="username-section">
                        <h3>Připojujete se k místnosti: {roomCode}</h3>
                        <input
                            type="text"
                            placeholder="Vaše uživatelské jméno"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                            autoFocus
                        />
                        <div className="button-group">
                            <button onClick={handleJoin}>Vstoupit do místnosti</button>
                            <button 
                                className="back-button"
                                onClick={() => setShowUsernameInput(false)}
                            >
                                Zpět
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainPage;