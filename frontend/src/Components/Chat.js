import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Připojení k backendu

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [username, setUsername] = useState('');
    const [room, setRoom] = useState('general');
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        socket.on('new_message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        socket.on('message', (systemMsg) => {
            setMessages(prev => [...prev, {
                username: 'System',
                content: systemMsg.content,
                type: 'system'
            }]);
        });

        return () => {
            socket.off('new_message');
            socket.off('message');
        };
    }, []);

    const joinRoom = () => {
        if (username && room) {
            socket.emit('join_room', {
                username,
                room
            });
            setJoined(true);
        }
    };

    const sendMessage = () => {
        if (messageInput.trim() && username && room) {
            socket.emit('send_message', {
                message: messageInput,
                username,
                room
            });
            setMessageInput('');
        }
    };

    if (!joined) {
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
                <button onClick={joinRoom}>Join Room</button>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.type}`}>
                        {msg.type === 'system' ? (
                            <em>{msg.content}</em>
                        ) : (
                            <>
                                <strong>{msg.username}: </strong>
                                {msg.content}
                            </>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="chat-input">
                <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};

export default Chat;