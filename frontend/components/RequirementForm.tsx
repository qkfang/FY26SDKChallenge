import React, { useState } from 'react';
import { ResourceConfig } from '../services/api';
import './RequirementForm.css';

interface RequirementFormProps {
  onSubmit: (requirement: string, resourceConfig: ResourceConfig, selectedSteps: string[]) => void;
  isLoading: boolean;
  savedSessionId?: string;
  savedTempFolder?: string;
  onNewSession?: () => void;
}

const STEPS = [
  { id: 'bicep', label: 'Bicep', description: 'deploy-bicep.ps1 — Azure resource provisioning' },
  { id: 'resource', label: 'Resource', description: 'deploy-cli.ps1 — Fabric workspace & resources' },
  { id: 'fabric', label: 'Fabric', description: 'deploy.ps1 — Fabric artifact deployment' },
];

const RequirementForm: React.FC<RequirementFormProps> = ({
  onSubmit,
  isLoading,
  savedSessionId,
  savedTempFolder,
  onNewSession,
}) => {
  const [requirement, setRequirement] = useState('create hello world notebook');
  const [notebookName, setNotebookName] = useState('');
  const [sqlServerName, setSqlServerName] = useState('');
  const [devWorkspace, setDevWorkspace] = useState('fabric-workspace-dev');
  const [qaWorkspace, setQaWorkspace] = useState('fabric-workspace-qa');
  const [prodWorkspace, setProdWorkspace] = useState('fabric-workspace-prod');
  const [selectedSteps, setSelectedSteps] = useState<string[]>(['bicep', 'resource', 'fabric']);

  const toggleStep = (stepId: string) => {
    setSelectedSteps(prev =>
      prev.includes(stepId) ? prev.filter(s => s !== stepId) : [...prev, stepId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requirement.trim() && selectedSteps.length > 0) {
      const resourceConfig: ResourceConfig = {
        notebookName: notebookName.trim() || undefined,
        sqlServerName: sqlServerName.trim() || undefined,
        workspaces: {
          dev: devWorkspace.trim() || undefined,
          qa: qaWorkspace.trim() || undefined,
          prod: prodWorkspace.trim() || undefined,
        },
      };
      onSubmit(requirement, resourceConfig, selectedSteps);
    }
  };

  const exampleRequirements = [
    'Create a new lakehouse for sales data analytics',
    'Set up a data pipeline that ingests CSV files from Azure Blob Storage into a lakehouse',
    'Create a workspace and lakehouse for marketing analytics with sample notebooks',
  ];

  return (
    <div className="requirement-form">
      <h2>Configure Fabric Deployment</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="requirement">Deployment Requirement *</label>
          <textarea
            id="requirement"
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="Describe what you want to deploy in Microsoft Fabric..."
            rows={4}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Deployment Steps</h3>
          <p className="form-section-hint">Select which steps to execute. You can rerun individual steps.</p>
          <div className="steps-grid">
            {STEPS.map(step => (
              <label key={step.id} className={`step-option ${selectedSteps.includes(step.id) ? 'step-selected' : ''} ${isLoading ? 'step-disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedSteps.includes(step.id)}
                  onChange={() => toggleStep(step.id)}
                  disabled={isLoading}
                />
                <div className="step-info">
                  <span className="step-label">{step.label}</span>
                  <span className="step-desc">{step.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {(savedSessionId || savedTempFolder) && (
          <div className="form-section session-info">
            <h3 className="form-section-title">📎 Saved Session</h3>
            {savedSessionId && (
              <div className="session-field">
                <span className="session-field-label">Session ID:</span>
                <code className="session-field-value">{savedSessionId}</code>
              </div>
            )}
            {savedTempFolder && (
              <div className="session-field">
                <span className="session-field-label">Temp Folder:</span>
                <code className="session-field-value">{savedTempFolder}</code>
              </div>
            )}
            {onNewSession && (
              <button type="button" className="btn-new-session" onClick={onNewSession} disabled={isLoading}>
                🔄 New Session
              </button>
            )}
          </div>
        )}

        <div className="form-section">
          <h3 className="form-section-title">Fabric Artifacts</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="notebookName">Notebook Name</label>
              <input
                type="text"
                id="notebookName"
                value={notebookName}
                onChange={(e) => setNotebookName(e.target.value)}
                placeholder="e.g., Notebook_Sales"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="sqlServerName">SQL Server Name</label>
              <input
                type="text"
                id="sqlServerName"
                value={sqlServerName}
                onChange={(e) => setSqlServerName(e.target.value)}
                placeholder="e.g., dev-sql-server"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Workspace Names per Environment</h3>
          <p className="form-section-hint">Leave empty to skip creating that environment's workspace.</p>
          <div className="form-row form-row-3">
            <div className="form-group">
              <label htmlFor="devWorkspace">DEV Workspace</label>
              <input
                type="text"
                id="devWorkspace"
                value={devWorkspace}
                onChange={(e) => setDevWorkspace(e.target.value)}
                placeholder="fabric-workspace-dev"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="qaWorkspace">QA Workspace</label>
              <input
                type="text"
                id="qaWorkspace"
                value={qaWorkspace}
                onChange={(e) => setQaWorkspace(e.target.value)}
                placeholder="fabric-workspace-qa"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="prodWorkspace">PROD Workspace</label>
              <input
                type="text"
                id="prodWorkspace"
                value={prodWorkspace}
                onChange={(e) => setProdWorkspace(e.target.value)}
                placeholder="fabric-workspace-prod"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={!requirement.trim() || selectedSteps.length === 0 || isLoading}>
          {isLoading ? 'Deploying...' : 'Start Deployment'}
        </button>
      </form>

      <div className="examples">
        <h3>Example Requirements:</h3>
        <ul>
          {exampleRequirements.map((example, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => setRequirement(example)}
                disabled={isLoading}
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RequirementForm;

