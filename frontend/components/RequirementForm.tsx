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
  const [workspaceSuffix, setWorkspaceSuffix] = useState('fabric-workspace');
  const [envDev, setEnvDev] = useState(true);
  const [envQa, setEnvQa] = useState(true);
  const [envProd, setEnvProd] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requirement.trim()) {
      const suffix = workspaceSuffix.trim();
      const resourceConfig: ResourceConfig = {
        notebookName: notebookName.trim() || undefined,
        sqlServerName: sqlServerName.trim() || undefined,
        workspaces: {
          dev: envDev && suffix ? `${suffix}-dev` : undefined,
          qa: envQa && suffix ? `${suffix}-qa` : undefined,
          prod: envProd && suffix ? `${suffix}-prod` : undefined,
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

        {/* Fabric Artifacts section hidden */}

        <div className="form-section">
          <h3 className="form-section-title">Workspace Configuration</h3>
          <div className="form-group">
            <label htmlFor="workspaceSuffix">Workspace Name Prefix</label>
            <input type="text" id="workspaceSuffix" value={workspaceSuffix}
              onChange={(e) => setWorkspaceSuffix(e.target.value)}
              placeholder="fabric-workspace" disabled={isLoading} />
            <p className="form-section-hint" style={{ marginTop: 6 }}>Environments will be appended as suffix (e.g. {workspaceSuffix}-dev)</p>
          </div>
          <label className="env-label">Environments</label>
          <div className="env-checkboxes">
            <label className="env-checkbox">
              <input type="checkbox" checked={envDev} onChange={(e) => setEnvDev(e.target.checked)} disabled={isLoading} />
              <span>DEV</span>
            </label>
            <label className="env-checkbox">
              <input type="checkbox" checked={envQa} onChange={(e) => setEnvQa(e.target.checked)} disabled={isLoading} />
              <span>QA</span>
            </label>
            <label className="env-checkbox">
              <input type="checkbox" checked={envProd} onChange={(e) => setEnvProd(e.target.checked)} disabled={isLoading} />
              <span>PROD</span>
            </label>
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
