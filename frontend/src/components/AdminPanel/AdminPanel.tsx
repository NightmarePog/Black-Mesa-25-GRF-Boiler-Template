import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

interface Room {
    room_code: string;
    room_name: string;
    users: string[];
    presenters: string[];
    status: 'waiting' | 'started' | 'offline';
    currently_presenting: string | null;
    presentation_history?: string[];
}

const socket = io(window.location.origin);

const AdminPanel = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRooms = async () => {
        try {
            const response = await fetch('/api/v1/get_rooms');
            if (!response.ok) throw new Error('Failed to load rooms');
            const data = await response.json();
            setRooms(data.map((room: Room) => ({
                ...room,
                presentation_history: room.presentation_history || []
            })));

            data.forEach((room: Room) => {
                socket.emit('admin_join', { room_code: room.room_code });
            });
        } catch (err) {
            setError('Failed to load rooms');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async () => {
        const roomName = window.prompt('Zadejte název místnosti:');
        if (!roomName) return;

        try {
            const response = await fetch(`/api/v1/create_room/${encodeURIComponent(roomName)}`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create room');
            }

            const data = await response.json();
            alert(`Místnost vytvořena! Kód: ${data.room_code}`);
            await fetchRooms();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Chyba při vytváření místnosti');
        }
    };

    useEffect(() => {
        const checkAdmin = () => {
            const isAdmin = localStorage.getItem('admin') === 'true';
            if (!isAdmin) navigate('/login');
        };

        const handleRoomUpdate = (updatedRoom: Room) => {
          setRooms(prev =>
              prev.map(room =>
                  room.room_code === updatedRoom.room_code ? { 
                      ...room, 
                      ...updatedRoom,
                      presentation_history: updatedRoom.presentation_history || []
                  } : room
              )
          );
          if (selectedRoom?.room_code === updatedRoom.room_code) {
              setSelectedRoom(prev => ({
                  ...prev!,
                  ...updatedRoom,
                  presentation_history: updatedRoom.presentation_history || []
              }));
          }
      };

        checkAdmin();
        fetchRooms();

        socket.on('room_update', handleRoomUpdate);
        socket.on('presenter_changed', (data: any) => {
            setRooms(prev =>
                prev.map(room =>
                    room.room_code === data.room_code ? { 
                        ...room, 
                        currently_presenting: data.currently_presenting,
                        presentation_history: data.presentation_history || []
                    } : room
                )
            );
        });

        return () => {
            socket.off('room_update');
            socket.off('presenter_changed');
        };
    }, [navigate]);

    const handleRoomAction = (action: 'start' | 'stop', roomCode: string) => {
        const newStatus = action === 'start' ? 'started' : 'offline';
        socket.emit(`${action}_room`, { room_code: roomCode });
    };

    const handleStartRating = (roomCode: string) => {
      socket.emit('start_rating', { 
          room_code: roomCode,
          presenter: selectedRoom?.currently_presenting  // Přidat prezentujícího
      });
  };

    const handleLogout = () => {
        localStorage.removeItem('admin');
        navigate('/');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'started': return '#2ecc71';
            case 'waiting': return '#f1c40f';
            case 'offline': return '#e74c3c';
            default: return '#2c3e50';
        }
    };

    if (loading) return <div className="loading">Načítání...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="room-container">
            <header className="admin-header">
                <h1>Admin Panel</h1>
                <div>
                    <button onClick={handleCreateRoom} className="create-button">
                        Vytvořit místnost
                    </button>
                    <button onClick={handleLogout} className="exit-button">
                        Odhlásit se
                    </button>
                </div>
            </header>

            <div className="main-content">
                {!selectedRoom ? (
                    <>
                        <div className="counters">
                            <div className="counter">
                                <span className="counter-label">Celkem místností</span>
                                <span className="counter-value">{rooms.length}</span>
                            </div>
                            <div className="counter">
                                <span className="counter-label">Aktivní místnosti</span>
                                <span className="counter-value">
                                    {rooms.filter(r => r.status === 'started').length}
                                </span>
                            </div>
                        </div>

                        <div className="users-section">
                            <h2>Všechny místnosti</h2>
                            <div className="users-list">
                                {rooms.map((room) => (
                                    <div
                                        key={room.room_code}
                                        className="user-item room-card"
                                        onClick={() => setSelectedRoom(room)}
                                    >
                                        <div className="room-info">
                                            <div className="room-header">
                                                <span className="username">{room.room_name}</span>
                                                <span 
                                                    className="status-badge"
                                                    style={{ backgroundColor: getStatusColor(room.status) }}
                                                >
                                                    {room.status}
                                                </span>
                                            </div>
                                            <div className="room-code">{room.room_code}</div>
                                            {room.currently_presenting && (
                                                <div className="presenting-info">
                                                    <span className="presenter-icon">🎤</span>
                                                    {room.currently_presenting}
                                                </div>
                                            )}
                                            <div className="room-actions">
                                                {room.status !== 'started' && (
                                                    <button 
                                                        className="action-button start"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRoomAction('start', room.room_code);
                                                        }}
                                                    >
                                                        Spustit
                                                    </button>
                                                )}
                                                {room.status !== 'offline' && (
                                                    <button 
                                                        className="action-button stop"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRoomAction('stop', room.room_code);
                                                        }}
                                                    >
                                                        Zastavit
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="room-detail">
                        <div className="mobile-header">
                            <button 
                                className="presentation-button"
                                onClick={() => setSelectedRoom(null)}
                            >
                                ← Zpět na seznam
                            </button>
                        </div>

                        <div className="counter">
                            <span className="counter-label">Kód místnosti</span>
                            <span className="counter-value">{selectedRoom.room_code}</span>
                        </div>

                        <div className="status-display">
                            <span className="status-label">Aktuální stav:</span>
                            <span 
                                className="status-badge"
                                style={{ backgroundColor: getStatusColor(selectedRoom.status) }}
                            >
                                {selectedRoom.status}
                            </span>
                        </div>

                        <div className="current-presenter-control">
                            <h3>Aktuální prezentující: {selectedRoom.currently_presenting || "Žádný"}</h3>
                            <button 
                                className="control-button"
                                onClick={() => handleStartRating(selectedRoom.room_code)}
                                disabled={!selectedRoom.currently_presenting}
                            >
                                Začít hodnotit
                            </button>
                        </div>

                        <div className="room-controls">
                            <button 
                                className={`control-button ${selectedRoom.status === 'started' ? 'active' : ''}`}
                                onClick={() => handleRoomAction('start', selectedRoom.room_code)}
                            >
                                Spustit místnost
                            </button>
                            <button 
                                className={`control-button ${selectedRoom.status === 'offline' ? 'active' : ''}`}
                                onClick={() => handleRoomAction('stop', selectedRoom.room_code)}
                            >
                                Zastavit místnost
                            </button>
                        </div>

                        <div className="users-section">
                            <h2>Účastníci ({selectedRoom.users.length})</h2>
                            <div className="users-list">
                                {selectedRoom.users.map((user) => (
                                    <div key={user} className="user-item">
                                        <span className="username">{user}</span>
                                        {selectedRoom.presenters.includes(user) && 
                                            <span className="presenter-icon">🎤</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;