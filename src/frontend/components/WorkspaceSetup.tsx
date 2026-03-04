import React, { useEffect, useRef, useState } from 'react';
import { api, DeploymentStatus } from '../services/api';
import './WorkspaceSetup.css';

interface WorkspaceSetupProps {
  status: DeploymentStatus | null;
  onReady: (workspaceDir: string, sessionId?: string) => void;
  sessionId: string;
  workspaceDir: string;
}

const WorkspaceSetup: React.FC<WorkspaceSetupProps> = ({ status, onReady, sessionId, workspaceDir }) => {
  const [notified, setNotified] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [status?.messages]);

  useEffect(() => {
    if (!notified && status?.status === 'completed' && status.workspaceDir) {
      setNotified(true);
      onReady(status.workspaceDir, status.copilotSessionId);
    }
  }, [status?.status, status?.workspaceDir, notified, onReady]);

  if (!status) {
    return (
      <div className="workspace-setup workspace-setup--empty">
        <p>Submit your requirement to begin workspace setup.</p>
      </div>
    );
  }

  const isRunning = status.status === 'pending' || status.status === 'in-progress';
  const isDone = status.status === 'completed';
  const isFailed = status.status === 'failed';

  return (
    <div className="workspace-setup">
      <div className="ws-status-row">
        <span className={`ws-badge ws-badge--${status.status}`}>
          {status.status === 'in-progress' && '⟳ '}
          {status.status === 'completed' && '✓ '}
          {status.status === 'failed' && '✗ '}
          {status.status === 'pending' && '○ '}
          {status.status.toUpperCase()}
        </span>
        <div className="ws-progress-bar">
          <div className="ws-progress-fill" style={{ width: `${status.progress}%` }} />
        </div>
        <span className="ws-progress-pct">{status.progress}%</span>
      </div>

      <div className="ws-log" ref={messagesRef}>
        {status.messages.map((msg, i) => (
          <div key={i} className={`ws-log-line ws-log-line--${msg.type}`}>
            <span className="ws-log-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            <span className="ws-log-text">{msg.message}</span>
          </div>
        ))}
        {isRunning && <div className="ws-log-line ws-log-line--progress">⟳ Running...</div>}
      </div>

      {isDone && status.workspaceDir && (
        <div className="ws-ready-banner">
          ✅ Workspace ready — proceed to the <strong>Deploy</strong> tab to run deployment steps.
        </div>
      )}

      {isFailed && (
        <div className="ws-error-banner">
          ❌ Setup failed: {status.error}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSetup;
