import React from 'react';

interface Message {
    username: string;
    content: string;
    type?: string;
}

interface ChatMessagesProps {
    messages: Message[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
    return (
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
    );
};

export default ChatMessages;