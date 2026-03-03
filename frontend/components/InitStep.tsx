import React, { useEffect, useState } from 'react';
import { api, SessionEntry } from '../services/api';
import './InitStep.css';

interface InitStepProps {
  onSessionReady: (workspaceDir: string, copilotSessionId: string) => void;
  currentWorkspaceDir: string;
  currentSessionId: string;
}

const COOKIE_KEY = 'pastSessions';

function getPastSessions(): SessionEntry[] {
  const match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_KEY + '=([^;]*)'));
  if (!match) return [];
  try { return JSON.parse(decodeURIComponent(match[1])); } catch { return []; }
}

function savePastSessions(sessions: SessionEntry[]) {
  const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(sessions))}; expires=${expires}; path=/; SameSite=Strict`;
}

function addToPastSessions(entry: SessionEntry) {
  const sessions = getPastSessions().filter(s => s.workspaceDir !== entry.workspaceDir);
  sessions.unshift(entry);
  savePastSessions(sessions.slice(0, 20));
}

const InitStep: React.FC<InitStepProps> = ({ onSessionReady, currentWorkspaceDir, currentSessionId }) => {
  const [pastSessions, setPastSessions] = useState<SessionEntry[]>([]);
  const [serverSessions, setServerSessions] = useState<SessionEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDir, setSelectedDir] = useState('');

  useEffect(() => {
    setPastSessions(getPastSessions());
    api.listSessions().then(setServerSessions).catch(() => {});
  }, []);

  // Merge server sessions with cookie sessions (server is source of truth for available dirs)
  const availableSessions = serverSessions.map(s => {
    const cookie = pastSessions.find(p => p.workspaceDir === s.workspaceDir);
    return { ...s, copilotSessionId: cookie?.copilotSessionId || s.copilotSessionId };
  });

  const handleNewProject = async () => {
    setIsCreating(true);
    try {
      const { workspaceDir, copilotSessionId } = await api.initSession();
      addToPastSessions({ workspaceDir, copilotSessionId, createdAt: new Date().toISOString() });
      onSessionReady(workspaceDir, copilotSessionId);
    } catch (err: any) {
      alert(`Failed to create session: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePickExisting = () => {
    if (!selectedDir) return;
    const session = availableSessions.find(s => s.workspaceDir === selectedDir);
    const sid = session?.copilotSessionId || '';
    if (session) addToPastSessions(session);
    onSessionReady(selectedDir, sid);
  };

  const dirLabel = (dir: string) => dir.split(/[/\\]/).pop() || dir;

  return (
    <div className="init-step">
      {currentWorkspaceDir && (
        <div className="init-step__current">
          <div className="init-step__info-row">
            <span className="init-step__info-label">Workspace:</span>
            <code className="init-step__info-value">{currentWorkspaceDir}</code>
          </div>
          {currentSessionId && (
            <div className="init-step__info-row">
              <span className="init-step__info-label">Copilot Session:</span>
              <code className="init-step__info-value">{currentSessionId}</code>
            </div>
          )}
        </div>
      )}

      <div className="init-step__options">
        <div className="init-step__option">
          <h3>Start New Project</h3>
          <p>Create a fresh workspace folder and Copilot session.</p>
          <button className="btn-init" onClick={handleNewProject} disabled={isCreating}>
            {isCreating ? 'Creating...' : '✨ New Project'}
          </button>
        </div>

        <div className="init-step__divider">or</div>

        <div className="init-step__option">
          <h3>Resume Existing Project</h3>
          <p>Pick a previous workspace to continue working on.</p>
          <div className="init-step__select-row">
            <select
              className="init-step__select"
              value={selectedDir}
              onChange={e => setSelectedDir(e.target.value)}
              disabled={availableSessions.length === 0}
            >
              <option value="">
                {availableSessions.length === 0 ? 'No existing sessions' : '-- select a session --'}
              </option>
              {availableSessions.map(s => (
                <option key={s.workspaceDir} value={s.workspaceDir}>
                  {dirLabel(s.workspaceDir)} ({new Date(s.createdAt).toLocaleString()})
                </option>
              ))}
            </select>
            <button className="btn-init btn-init--secondary" onClick={handlePickExisting} disabled={!selectedDir}>
              📂 Open
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitStep;
