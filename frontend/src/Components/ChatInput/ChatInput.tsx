import React, { useState } from 'react';

interface ChatInputProps {
    onSend: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
    const [messageInput, setMessageInput] = useState('');

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && messageInput.trim()) {
            onSend(messageInput);
            setMessageInput('');
        }
    };

    const handleSend = () => {
        if (messageInput.trim()) {
            onSend(messageInput);
            setMessageInput('');
        }
    };

    return (
        <div className="chat-input">
            <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
            />
            <button onClick={handleSend}>Send</button>
        </div>
    );
};

export default ChatInput;