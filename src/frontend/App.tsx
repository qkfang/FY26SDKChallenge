import { useState, useEffect, useCallback } from 'react';

const TABS = [
  { key: 'init', label: 'Init Session' },
  { key: 'requirements', label: 'Requirements' },
  { key: 'workspace', label: 'Prepare Workspace' },
  { key: 'chat', label: 'Fabric Chat' },
  { key: 'deploy', label: 'Deployment' },
] as const;
type TabKey = typeof TABS[number]['key'];
import { useIsAuthenticated } from '@azure/msal-react';
import LoginPage from './components/LoginPage';
import InitStep from './components/InitStep';
import RequirementForm from './components/RequirementForm';
import WorkspaceSetup from './components/WorkspaceSetup';
import DeploySteps from './components/DeploySteps';
import CopilotChat from './components/CopilotChat';
import { api, DeploymentStatus, ResourceConfig, WorkspaceConfig } from './services/api';
import './App.css';



function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

function setCookie(name: string, value: string) {
  const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict; Secure`;
}

function App() {
  const isAuthenticated = useIsAuthenticated();
  const [loginSkipped, setLoginSkipped] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('init');

  // Setup state
  const [setupDeploymentId, setSetupDeploymentId] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<DeploymentStatus | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Workspace info (persisted as cookies)
  const [workspaceDir, setWorkspaceDir] = useState<string>(() => getCookie('workspaceDir'));
  const [sessionId, setSessionId] = useState<string>(() => getCookie('copilotSessionId'));
  const [loadedConfig, setLoadedConfig] = useState<WorkspaceConfig | null>(null);

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
      const { deploymentId } = await api.setupWorkspace(requirement, resourceConfig, workspaceDir || undefined, sessionId || undefined);
      setSetupDeploymentId(deploymentId);
    } catch (error: any) {
      alert(`Failed to start workspace setup: ${error.response?.data?.error || error.message}`);
      setIsSettingUp(false);
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

  const handleReset = () => {
    setWorkspaceDir('');
    setCookie('workspaceDir', '');
    setSessionId('');
    setCookie('copilotSessionId', '');
    setLoadedConfig(null);
  };

  const handleInitReady = (dir: string, sid: string, config?: WorkspaceConfig | null) => {
    setWorkspaceDir(dir);
    setCookie('workspaceDir', dir);
    setSessionId(sid);
    setCookie('copilotSessionId', sid);
    setLoadedConfig(config || null);
  };

  const hasEntraConfig = Boolean(import.meta.env.AZURE_CLIENT_ID);

  if (!isAuthenticated && !loginSkipped) {
    return <LoginPage onSkip={() => setLoginSkipped(true)} hasConfig={hasEntraConfig} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Fabric Automation Agent App</h1>
        <span style={{ margin: '0 12px', opacity: 0.7 }}>Powered by GitHub Copilot SDK</span>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'Backend Connected' : 'Backend Disconnected'}
        </div>
      </header>

      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {!isConnected && (
          <div className="alert alert-warning">
            <strong>⚠️ Backend Disconnected</strong>
            <p>Please ensure the backend server is running on port 3001.</p>
            <code>npm run dev:backend</code>
          </div>
        )}

        {activeTab === 'init' && (
          <div className="panel">
            <InitStep
              onSessionReady={handleInitReady}
              onReset={handleReset}
              currentWorkspaceDir={workspaceDir}
              currentSessionId={sessionId}
            />
          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="panel">
            {workspaceDir ? (
              <RequirementForm onSubmit={handleRequirementSubmit} isLoading={isSettingUp} initialConfig={loadedConfig} />
            ) : (
              <p className="panel-locked-msg">Complete Init Session first.</p>
            )}
          </div>
        )}

        {activeTab === 'workspace' && (
          <div className="panel">
            <WorkspaceSetup status={setupStatus} onReady={handleWorkspaceReady} sessionId={sessionId} workspaceDir={workspaceDir} />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="panel">
            {sessionId ? (
              <CopilotChat sessionId={sessionId} />
            ) : (
              <p className="panel-locked-msg">Complete Init Session to unlock chat.</p>
            )}
          </div>
        )}

        {activeTab === 'deploy' && (
          <div className="panel">
            {workspaceDir ? (
              <DeploySteps workspaceDir={workspaceDir} sessionId={sessionId || undefined} />
            ) : (
              <p className="panel-locked-msg">Complete workspace setup to unlock deployment.</p>
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Built with React, TypeScript, and GitHub Copilot SDK</p>
        <p>Microsoft Fabric Automation · 2026</p>
      </footer>
    </div>
  );
}

export default App;
