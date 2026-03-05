import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import './CopilotChat.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface CopilotChatProps {
  sessionId: string;
}

const CopilotChat: React.FC<CopilotChatProps> = ({ sessionId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const { reply } = await api.chat(text, sessionId);
      setMessages((prev) => [...prev, { role: 'assistant', text: reply || '(no response)' }]);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message;
      setMessages((prev) => [...prev, { role: 'assistant', text: `Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="copilot-chat">
      <div className="chat-messages">
        {messages.length === 0 && !loading && (
          <p className="chat-empty">Send a message to start chatting with GitHub Copilot.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
            <span className="chat-role">{msg.role === 'user' ? 'You' : 'Copilot'}</span>
            <div className="chat-text">{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble chat-bubble--assistant chat-bubble--loading">
            <span className="chat-role">Copilot</span>
            <div className="chat-text">Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          rows={1}
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button className="chat-send-btn" onClick={send} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>

      <div className="chat-repo-links">
        <a href="https://github.com/qkfang/FY26SDKChallenge_Template" target="_blank" rel="noopener noreferrer">Template Repo</a>
        <a href="https://github.com/qkfang/FY26SDKChallenge_UserRepo" target="_blank" rel="noopener noreferrer">User Repo</a>
      </div>
    </div>
  );
};

export default CopilotChat;
