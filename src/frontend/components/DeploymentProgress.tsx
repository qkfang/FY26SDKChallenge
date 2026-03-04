import React, { useEffect, useRef, useState } from 'react';
import { DeploymentStatus } from '../services/api';
import './DeploymentProgress.css';

interface DeploymentProgressProps {
  status: DeploymentStatus | null;
}

interface Message {
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'progress';
  message: string;
}

const DeploymentProgress: React.FC<DeploymentProgressProps> = ({ status }) => {
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const messagesListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status?.messages) {
      setDisplayedMessages(status.messages);
    }
  }, [status?.messages]);

  useEffect(() => {
    const el = messagesListRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [displayedMessages]);

  if (!status) {
    return null;
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'completed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'in-progress':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'in-progress':
        return '⟳';
      default:
        return '○';
    }
  };

  return (
    <div className="deployment-progress">
      <div className="progress-header">
        <h2>Deployment Progress</h2>
        <div className="status-badge" style={{ backgroundColor: getStatusColor() }}>
          <span className="status-icon">{getStatusIcon()}</span>
          <span>{status.status.toUpperCase()}</span>
        </div>
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{
            width: `${status.progress}%`,
            backgroundColor: getStatusColor()
          }}
        />
        <span className="progress-text">{status.progress}%</span>
      </div>

      <div className="messages-container">
        <h3>Activity Log</h3>
        <div className="messages-list" ref={messagesListRef}>
          {displayedMessages.map((msg, index) => (
            <div key={index} className={`message message-${msg.type}`}>
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
              <span className="message-text">{msg.message}</span>
            </div>
          ))}
        </div>
      </div>

      {status.result && (
        <div className="result-container">
          <h3>Deployment Result</h3>
          <div className="result-content">
            <div className="result-resources">
              <h4>Resources Created:</h4>
              <ul>
                {status.result.resources.map((resource, index) => (
                  <li key={index}>{resource}</li>
                ))}
              </ul>
            </div>
            <div className="result-summary">
              <h4>Summary:</h4>
              <pre>{status.result.summary}</pre>
            </div>
          </div>
        </div>
      )}

      {status.error && (
        <div className="error-container">
          <h3>Error</h3>
          <p>{status.error}</p>
        </div>
      )}
    </div>
  );
};

export default DeploymentProgress;
