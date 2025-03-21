import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './Chat.css';

const socket = io(window.location.origin);
const DEFAULT_ROOM = 'general';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [username, setUsername] = useState('');
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
        if (username) {
            socket.emit('join_room', {
                username,
                room: DEFAULT_ROOM
            });
            setJoined(true);
        }
    };

    const sendMessage = () => {
        if (messageInput.trim() && username) {
            socket.emit('send_message', {
                message: messageInput,
                username,
                room: DEFAULT_ROOM
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
                <button className="submit-button" onClick={joinRoom}>Join Chat</button>
            </div>
        );
    }

    return (
        <div className="ctverec">
            <div className="messages-container">
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`${
                            msg.type === 'system' ? 'system-message' : 
                            msg.username === username ? 'message-right' : 'message-left'
                        }`}
                    >
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
            
            <div className="input-wrapper">
                <textarea
                    className="input-field"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                    placeholder="Type a message..."
                    rows="1"
                />
                <button className="submit-button" onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};

export default Chat;