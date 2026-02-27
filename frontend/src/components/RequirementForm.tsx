import React, { useState } from 'react';
import './RequirementForm.css';

interface RequirementFormProps {
  onSubmit: (requirement: string, workspaceName?: string, lakehouseName?: string) => void;
  isLoading: boolean;
}

const RequirementForm: React.FC<RequirementFormProps> = ({ onSubmit, isLoading }) => {
  const [requirement, setRequirement] = useState('create hello world notebook');
  const [workspaceName, setWorkspaceName] = useState('ghcsdk');
  const [lakehouseName, setLakehouseName] = useState('ghcsdk');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requirement.trim()) {
      onSubmit(
        requirement,
        workspaceName || undefined,
        lakehouseName || undefined
      );
    }
  };

  const exampleRequirements = [
    'Create a new lakehouse for sales data analytics',
    'Set up a data pipeline that ingests CSV files from Azure Blob Storage into a lakehouse',
    'Create a workspace and lakehouse for marketing analytics with sample notebooks',
  ];

  return (
    <div className="requirement-form">
      <h2>Define Your Fabric Deployment Requirement</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="requirement">Deployment Requirement *</label>
          <textarea
            id="requirement"
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="Describe what you want to deploy in Microsoft Fabric..."
            rows={6}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="workspaceName">Workspace Name (Optional)</label>
            <input
              type="text"
              id="workspaceName"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g., Analytics Workspace"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lakehouseName">Lakehouse Name (Optional)</label>
            <input
              type="text"
              id="lakehouseName"
              value={lakehouseName}
              onChange={(e) => setLakehouseName(e.target.value)}
              placeholder="e.g., Sales Data Lakehouse"
              disabled={isLoading}
            />
          </div>
        </div>

        <button type="submit" disabled={!requirement.trim() || isLoading}>
          {isLoading ? 'Processing...' : 'Start Deployment'}
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
