import { useState, useEffect, useCallback } from 'react';
import { useIsAuthenticated } from '@azure/msal-react';
import LoginPage from './components/LoginPage';
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

function App() {
  const isAuthenticated = useIsAuthenticated();
  const [loginSkipped, setLoginSkipped] = useState(false);
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

  const hasEntraConfig = Boolean(import.meta.env.VITE_AZURE_CLIENT_ID);

  if (!isAuthenticated && !loginSkipped) {
    return <LoginPage onSkip={() => setLoginSkipped(true)} hasConfig={hasEntraConfig} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Fabric Automation App</h1>
        <span style={{ margin: '0 12px', opacity: 0.7 }}>Powered by GitHub Copilot SDK</span>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'Backend Connected' : 'Backend Disconnected'}
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
