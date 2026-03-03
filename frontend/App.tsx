import { useState, useEffect, useCallback } from 'react';
import InitStep from './components/InitStep';
import RequirementForm from './components/RequirementForm';
import WorkspaceSetup from './components/WorkspaceSetup';
import DeploySteps from './components/DeploySteps';
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

function clearCookies() {
  document.cookie = 'copilotSessionId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict; Secure';
  document.cookie = 'workspaceDir=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict; Secure';
}

function App() {
  const [isConnected, setIsConnected] = useState(false);

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

  const handleInitReady = (dir: string, sid: string, config?: WorkspaceConfig | null) => {
    setWorkspaceDir(dir);
    setCookie('workspaceDir', dir);
    setSessionId(sid);
    setCookie('copilotSessionId', sid);
    setLoadedConfig(config || null);
  };

  const handleNewSession = () => {
    clearCookies();
    setWorkspaceDir('');
    setSessionId('');
    setSetupDeploymentId(null);
    setSetupStatus(null);
    setIsSettingUp(false);
    setLoadedConfig(null);
  };



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

        <div className="panel">
          <h2 className="panel-title">Step 1: Init Session</h2>
          <InitStep
            onSessionReady={handleInitReady}
            currentWorkspaceDir={workspaceDir}
            currentSessionId={sessionId}
          />
        </div>

        <div className={`panel ${!workspaceDir ? 'panel--locked' : ''}`}>
          <h2 className="panel-title">Step 2: Requirements {!workspaceDir && '🔒'}</h2>
          {workspaceDir ? (
            <RequirementForm onSubmit={handleRequirementSubmit} isLoading={isSettingUp} initialConfig={loadedConfig} />
          ) : (
            <p className="panel-locked-msg">Complete init step to unlock.</p>
          )}
        </div>

        <div className="panel">
          <h2 className="panel-title">Step 3: Prepare Fabric Workspace</h2>
          <WorkspaceSetup status={setupStatus} onReady={handleWorkspaceReady} sessionId={sessionId} workspaceDir={workspaceDir} />
        </div>

        <div className={`panel ${!workspaceDir ? 'panel--locked' : ''}`}>
          <h2 className="panel-title">Step 4: Deployment {!workspaceDir && '🔒'}</h2>
          {workspaceDir ? (
            <DeploySteps workspaceDir={workspaceDir} sessionId={sessionId || undefined} />
          ) : (
            <p className="panel-locked-msg">Complete workspace setup to unlock deployment.</p>
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
