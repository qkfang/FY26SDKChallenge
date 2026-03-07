import React, { useEffect, useState } from 'react';
import { api, SessionEntry, WorkspaceConfig } from '../services/api';
import './InitStep.css';

interface InitStepProps {
  onNewProject: (workspaceDir: string, copilotSessionId: string) => void;
  onOpenProject: (workspaceDir: string, copilotSessionId: string, config?: WorkspaceConfig | null) => void;
  onReset: () => void;
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

const InitStep: React.FC<InitStepProps> = ({ onNewProject, onOpenProject, onReset, currentWorkspaceDir, currentSessionId }) => {
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
      onNewProject(workspaceDir, copilotSessionId);
    } catch (err: any) {
      alert(`Failed to create session: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePickExisting = async () => {
    if (!selectedDir) return;
    const session = availableSessions.find(s => s.workspaceDir === selectedDir);
    const sid = session?.copilotSessionId || '';
    if (session) addToPastSessions(session);
    const config = await api.getWorkspaceConfig(selectedDir);
    onOpenProject(selectedDir, config?.copilotSessionId || sid, config);
  };

  const dirLabel = (dir: string) => dir.split(/[/\\]/).pop() || dir;

  return (
    <div className="init-step">
      <div className="init-step__options">
        <div className="init-step__option">
          <h3>Start New Project</h3>
          <p>Create a fresh workspace folder and Copilot session.</p>
          <div className="init-step__action-row">
            <button className="btn-init" onClick={handleNewProject} disabled={isCreating}>
              {isCreating ? 'Creating...' : '✨ New Project'}
            </button>
            <button className="btn-init btn-init--reset" onClick={onReset} title="Clear current session and workspace">
              🔄 Reset
            </button>
          </div>
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

      {currentWorkspaceDir && (
        <div className="init-step__current">
          {currentSessionId && (
            <div className="init-step__info-row">
              <span className="init-step__info-label">Copilot Session:</span>
              <code className="init-step__info-value">{currentSessionId}</code>
              <button className="btn-open-folder" title="Open session folder" onClick={() => {
                const base = currentWorkspaceDir.replace(/[/\\]temp[/\\]ws[/\\].*$/, '');
                api.openFolder(`${base}\\temp\\ghcsdk\\session-state`);
              }}>
                📂
              </button>
            </div>
          )}
          <div className="init-step__info-row">
            <span className="init-step__info-label">Workspace:</span>
            <code className="init-step__info-value">{currentWorkspaceDir}</code>
            <button className="btn-open-folder" title="Open in Explorer" onClick={() => api.openFolder(currentWorkspaceDir)}>
              📂
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InitStep;
