import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import './CopilotChat.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface PendingToolApproval {
  toolName: string;
  args: any;
}

interface CopilotChatProps {
  sessionId: string;
}

const CopilotChat: React.FC<CopilotChatProps> = ({ sessionId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [pendingTool, setPendingTool] = useState<PendingToolApproval | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streamingText, pendingTool]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);
    setStreamingText('');
    setPendingTool(null);

    try {
      const response = await fetch(`${(import.meta as any).env?.API_URL ?? ''}/api/deployment/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;

          try {
            const event = JSON.parse(raw);
            if (event.type === 'delta') {
              accumulated += event.text;
              setStreamingText(accumulated);
            } else if (event.type === 'tool_permission_request') {
              setPendingTool({ toolName: event.toolName, args: event.args });
            } else if (event.type === 'tool_executing') {
              setPendingTool(null);
            } else if (event.type === 'done') {
              setMessages((prev) => [...prev, { role: 'assistant', text: event.reply || accumulated }]);
              setStreamingText('');
              accumulated = '';
            } else if (event.type === 'error') {
              setMessages((prev) => [...prev, { role: 'assistant', text: `Error: ${event.message}` }]);
              setStreamingText('');
              accumulated = '';
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'assistant', text: `Error: ${err.message}` }]);
      setStreamingText('');
    } finally {
      setLoading(false);
      setPendingTool(null);
    }
  };

  const handleApprove = async (approveAll: boolean) => {
    setPendingTool(null);
    await api.approveTool(sessionId, approveAll);
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
        {messages.length === 0 && !loading && !streamingText && (
          <p className="chat-empty">Send a message to start chatting with GitHub Copilot.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
            <span className="chat-role">{msg.role === 'user' ? 'You' : 'Copilot'}</span>
            <div className="chat-text">{msg.text}</div>
          </div>
        ))}
        {streamingText && !pendingTool && (
          <div className="chat-bubble chat-bubble--assistant">
            <span className="chat-role">Copilot</span>
            <div className="chat-text">{streamingText}</div>
          </div>
        )}
        {loading && !streamingText && !pendingTool && (
          <div className="chat-bubble chat-bubble--assistant chat-bubble--loading">
            <span className="chat-role">Copilot</span>
            <div className="chat-text">Thinking…</div>
          </div>
        )}
        {pendingTool && (
          <div className="tool-approval">
            <div className="tool-approval-header">
              <span className="tool-approval-icon">⚙</span>
              <span className="tool-approval-title">Tool Permission Request</span>
            </div>
            <div className="tool-approval-body">
              <span className="tool-approval-label">Tool:</span>
              <span className="tool-approval-name">{pendingTool.toolName}</span>
              {pendingTool.args && Object.keys(pendingTool.args).length > 0 && (
                <pre className="tool-approval-args">{JSON.stringify(pendingTool.args, null, 2)}</pre>
              )}
            </div>
            <div className="tool-approval-actions">
              <button className="tool-btn tool-btn--once" onClick={() => handleApprove(false)}>
                Approve Once
              </button>
              <button className="tool-btn tool-btn--all" onClick={() => handleApprove(true)}>
                Approve All
              </button>
            </div>
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
        <a href="https://github.com/qkfang/FY26SDKChallenge_Template_Repo" target="_blank" rel="noopener noreferrer">Template Repo</a>
        <a href="https://github.com/qkfang/FY26SDKChallenge_Project_Repo" target="_blank" rel="noopener noreferrer">Project Repo</a>
      </div>
    </div>
  );
};

export default CopilotChat;
