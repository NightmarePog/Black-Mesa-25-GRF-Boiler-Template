import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import JoinRoom from '../JoinRoom/joinRoom';
import ChatMessages from '../ChatMessages/ChatMessages';
import ChatInput from '../ChatInput/ChatInput';

const socket = io('http://localhost:5000'); // Připojení k backendu

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<{ username: string; content: string; type?: string }[]>([]);
    const [username, setUsername] = useState('');
    const [room, setRoom] = useState('general');
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        socket.on('new_message', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        socket.on('message', (systemMsg) => {
            setMessages((prev) => [
                ...prev,
                {
                    username: 'System',
                    content: systemMsg.content,
                    type: 'system',
                },
            ]);
        });

        return () => {
            socket.off('new_message');
            socket.off('message');
        };
    }, []);

    const joinRoom = (username: string, room: string) => {
        socket.emit('join_room', { username, room });
        setJoined(true);
    };

    const sendMessage = (message: string) => {
        if (message.trim() && username && room) {
            socket.emit('send_message', {
                message,
                username,
                room,
            });
        }
    };

    if (!joined) {
        return <JoinRoom onJoin={joinRoom} />;
    }

    return (
        <div className="chat-container">
            <ChatMessages messages={messages} />
            <ChatInput onSend={sendMessage} />
        </div>
    );
};

export default Chat;