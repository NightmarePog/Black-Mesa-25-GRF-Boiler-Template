import React, { useState } from 'react';

interface JoinRoomProps {
    onJoin: (username: string, room: string) => void;
}

const JoinRoom: React.FC<JoinRoomProps> = ({ onJoin }) => {
    const [username, setUsername] = useState('');
    const [room, setRoom] = useState('general');

    const handleJoin = () => {
        if (username && room) {
            onJoin(username, room);
        }
    };

    return (
        <div className="join-container">
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="text"
                placeholder="Room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
            />
            <button onClick={handleJoin}>Join Room</button>
        </div>
    );
};

export default JoinRoom;