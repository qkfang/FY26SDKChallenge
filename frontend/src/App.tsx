import { useState, useEffect } from 'react';
import RequirementForm from './components/RequirementForm';
import DeploymentProgress from './components/DeploymentProgress';
import { api, DeploymentStatus, ResourceConfig } from './services/api';
import './App.css';

function App() {
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check backend health on mount
    api.checkHealth()
      .then(() => setIsConnected(true))
      .catch(() => setIsConnected(false));
  }, []);

  useEffect(() => {
    if (!deploymentId) return;

    // Poll for deployment status
    const pollInterval = setInterval(async () => {
      try {
        const status = await api.getDeploymentStatus(deploymentId);
        setDeploymentStatus(status);

        // Stop polling if deployment is complete or failed
        if (status.status === 'completed' || status.status === 'failed') {
          setIsLoading(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error fetching deployment status:', error);
        clearInterval(pollInterval);
        setIsLoading(false);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [deploymentId]);

  const handleStartDeployment = async (
    requirement: string,
    resourceConfig: ResourceConfig
  ) => {
    setIsLoading(true);
    setDeploymentStatus(null);

    try {
      const response = await api.startDeployment({
        requirement,
        resourceConfig
      });
      setDeploymentId(response.deploymentId);
    } catch (error: any) {
      console.error('Error starting deployment:', error);
      alert(`Failed to start deployment: ${error.response?.data?.error || error.message}`);
      setIsLoading(false);
    }
  };

  const handleNewDeployment = () => {
    setDeploymentId(null);
    setDeploymentStatus(null);
    setIsLoading(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Fabric Automation App</h1>
        <p>Powered by GitHub Copilot CLI SDK</p>
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

        {deploymentStatus?.status === 'completed' && (
          <div className="alert alert-info">
            <p>Deployment completed! Want to start a new deployment?</p>
            <button onClick={handleNewDeployment} className="btn-secondary">
              Start New Deployment
            </button>
          </div>
        )}

        {(!deploymentId || deploymentStatus?.status === 'completed') && !isLoading && (
          <RequirementForm onSubmit={handleStartDeployment} isLoading={isLoading} />
        )}

        {deploymentStatus && <DeploymentProgress status={deploymentStatus} />}

        <div className="info-section">
          <h3>ℹ️ About This Application</h3>
          <div className="info-content">
            <p>
              This application uses the GitHub Copilot CLI SDK to automate Microsoft Fabric
              resource deployment. Simply describe your requirements in natural language,
              and Copilot will generate a deployment plan.
            </p>
            <h4>Features:</h4>
            <ul>
              <li>Natural language requirement processing using GitHub Copilot</li>
              <li>Automated deployment planning for Fabric resources</li>
              <li>Real-time progress tracking and activity logs</li>
              <li>Support for lakehouses, workspaces, and data pipelines</li>
            </ul>
            <h4>Getting Started:</h4>
            <ol>
              <li>Ensure GitHub Copilot CLI is installed and authenticated</li>
              <li>Optionally configure your Fabric API credentials</li>
              <li>Describe your deployment requirement</li>
              <li>Watch as Copilot generates your deployment plan</li>
            </ol>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with React, TypeScript, and GitHub Copilot CLI SDK</p>
        <p>Microsoft Fabric Automation · 2026</p>
      </footer>
    </div>
  );
}

export default App;
