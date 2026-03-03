import { useState, useEffect, useCallback } from 'react';
import RequirementForm from './components/RequirementForm';
import WorkspaceSetup from './components/WorkspaceSetup';
import DeploySteps from './components/DeploySteps';
import { api, DeploymentStatus, ResourceConfig } from './services/api';
import './App.css';

type Tab = 'requirement' | 'workspace' | 'deploy';

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

function setCookie(name: string, value: string) {
  const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict; Secure`;
}

function clearCookies() {
  document.cookie = 'copilotSessionId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict; Secure';
  document.cookie = 'workspaceDir=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict; Secure';
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('requirement');
  const [isConnected, setIsConnected] = useState(false);

  // Setup state
  const [setupDeploymentId, setSetupDeploymentId] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<DeploymentStatus | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Workspace info (persisted as cookies)
  const [workspaceDir, setWorkspaceDir] = useState<string>(() => getCookie('workspaceDir'));
  const [sessionId, setSessionId] = useState<string>(() => getCookie('copilotSessionId'));

  useEffect(() => {
    api.checkHealth()
      .then(() => setIsConnected(true))
      .catch(() => setIsConnected(false));
  }, []);

  // Poll setup status
  useEffect(() => {
    if (!setupDeploymentId) return;

    const interval = setInterval(async () => {
      try {
        const status = await api.getDeploymentStatus(setupDeploymentId);
        setSetupStatus(status);

        if (status.status === 'completed' || status.status === 'failed') {
          setIsSettingUp(false);
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
        setIsSettingUp(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [setupDeploymentId]);

  const handleRequirementSubmit = async (requirement: string, resourceConfig: ResourceConfig) => {
    setIsSettingUp(true);
    setSetupStatus(null);
    setSetupDeploymentId(null);
    setActiveTab('workspace');

    try {
      const { deploymentId } = await api.setupWorkspace(requirement, resourceConfig);
      setSetupDeploymentId(deploymentId);
    } catch (error: any) {
      alert(`Failed to start workspace setup: ${error.response?.data?.error || error.message}`);
      setIsSettingUp(false);
      setActiveTab('requirement');
    }
  };

  const handleWorkspaceReady = useCallback((dir: string, sid?: string) => {
    setWorkspaceDir(dir);
    setCookie('workspaceDir', dir);
    if (sid) {
      setSessionId(sid);
      setCookie('copilotSessionId', sid);
    }
  }, []);

  const handleNewSession = () => {
    clearCookies();
    setWorkspaceDir('');
    setSessionId('');
    setSetupDeploymentId(null);
    setSetupStatus(null);
    setIsSettingUp(false);
    setActiveTab('requirement');
  };

  const tabs: { id: Tab; label: string; locked: boolean }[] = [
    { id: 'requirement', label: '1 · Requirement', locked: false },
    { id: 'workspace', label: '2 · Workspace', locked: false },
    { id: 'deploy', label: '3 · Deploy', locked: !workspaceDir },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Fabric Automation App</h1>
        <p>Powered by GitHub Copilot SDK</p>
        <div className="header-controls">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isConnected ? 'Backend Connected' : 'Backend Disconnected'}
          </div>
          {(workspaceDir || sessionId) && (
            <button className="btn-new-session" onClick={handleNewSession} title="Clear saved session and start fresh">
              🔄 New Session
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {!isConnected && (
          <div className="alert alert-warning">
            <strong>⚠️ Backend Disconnected</strong>
            <p>Please ensure the backend server is running on port 3001.</p>
            <code>npm run dev:backend</code>
          </div>
        )}

        {/* Tab bar */}
        <div className="tab-bar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'tab-btn--active' : ''} ${tab.locked ? 'tab-btn--locked' : ''}`}
              onClick={() => !tab.locked && setActiveTab(tab.id)}
              disabled={tab.locked}
            >
              {tab.label}
              {tab.id === 'deploy' && tab.locked && ' 🔒'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="tab-content">
          {activeTab === 'requirement' && (
            <RequirementForm onSubmit={handleRequirementSubmit} isLoading={isSettingUp} />
          )}

          {activeTab === 'workspace' && (
            <WorkspaceSetup status={setupStatus} onReady={handleWorkspaceReady} />
          )}

          {activeTab === 'deploy' && workspaceDir && (
            <DeploySteps workspaceDir={workspaceDir} sessionId={sessionId || undefined} />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with React, TypeScript, and GitHub Copilot SDK</p>
        <p>Microsoft Fabric Automation · 2026</p>
      </footer>
    </div>
  );
}

export default App;
