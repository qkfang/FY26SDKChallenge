import React, { useState } from 'react';
import { ResourceConfig } from '../services/api';
import './RequirementForm.css';

interface RequirementFormProps {
  onSubmit: (requirement: string, resourceConfig: ResourceConfig) => void;
  isLoading: boolean;
}

const RequirementForm: React.FC<RequirementFormProps> = ({ onSubmit, isLoading }) => {
  const [requirement, setRequirement] = useState('create hello world notebook');
  const [notebookName, setNotebookName] = useState('');
  const [sqlServerName, setSqlServerName] = useState('');
  const [devWorkspace, setDevWorkspace] = useState('fabric-workspace-dev');
  const [qaWorkspace, setQaWorkspace] = useState('fabric-workspace-qa');
  const [prodWorkspace, setProdWorkspace] = useState('fabric-workspace-prod');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requirement.trim()) {
      const resourceConfig: ResourceConfig = {
        notebookName: notebookName.trim() || undefined,
        sqlServerName: sqlServerName.trim() || undefined,
        workspaces: {
          dev: devWorkspace.trim() || undefined,
          qa: qaWorkspace.trim() || undefined,
          prod: prodWorkspace.trim() || undefined,
        },
      };
      onSubmit(requirement, resourceConfig);
    }
  };

  const examples = [
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
              <input type="text" id="devWorkspace" value={devWorkspace}
                onChange={(e) => setDevWorkspace(e.target.value)}
                placeholder="fabric-workspace-dev" disabled={isLoading} />
            </div>
            <div className="form-group">
              <label htmlFor="qaWorkspace">QA Workspace</label>
              <input type="text" id="qaWorkspace" value={qaWorkspace}
                onChange={(e) => setQaWorkspace(e.target.value)}
                placeholder="fabric-workspace-qa" disabled={isLoading} />
            </div>
            <div className="form-group">
              <label htmlFor="prodWorkspace">PROD Workspace</label>
              <input type="text" id="prodWorkspace" value={prodWorkspace}
                onChange={(e) => setProdWorkspace(e.target.value)}
                placeholder="fabric-workspace-prod" disabled={isLoading} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={!requirement.trim() || isLoading}>
          {isLoading ? 'Setting up workspace...' : 'Setup Workspace →'}
        </button>
      </form>

      <div className="examples">
        <h3>Example Requirements:</h3>
        <ul>
          {examples.map((example, index) => (
            <li key={index}>
              <button type="button" onClick={() => setRequirement(example)} disabled={isLoading}>
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
