import React, { useState, useRef, useEffect } from 'react';
import { ResourceConfig, WorkspaceConfig } from '../services/api';
import './RequirementForm.css';

interface RequirementFormProps {
  onSubmit: (requirement: string, resourceConfig: ResourceConfig) => void;
  isLoading: boolean;
  initialConfig?: WorkspaceConfig | null;
}

const RequirementForm: React.FC<RequirementFormProps> = ({ onSubmit, isLoading, initialConfig }) => {
  const [requirement, setRequirement] = useState('create hello world notebook');
  const [notebookName, _setNotebookName] = useState('');
  const [sqlServerName, _setSqlServerName] = useState('');
  const [workspaceSuffix, setWorkspaceSuffix] = useState('fabric-workspace');
  const [fabricCapacity, setFabricCapacity] = useState('fabriccapacitycicd');
  const [envDev, setEnvDev] = useState(true);
  const [envQa, setEnvQa] = useState(true);
  const [envProd, setEnvProd] = useState(true);
  const [showExamples, setShowExamples] = useState(false);
  const examplesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialConfig) {
      setRequirement(initialConfig.requirement || 'create hello world notebook');
      setWorkspaceSuffix(initialConfig.workspaceSuffix || 'fabric-workspace');
      setFabricCapacity(initialConfig.fabricCapacity || 'fabriccapacitycicd');
      setEnvDev(initialConfig.envDev ?? true);
      setEnvQa(initialConfig.envQa ?? true);
      setEnvProd(initialConfig.envProd ?? true);
    }
  }, [initialConfig]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (examplesRef.current && !examplesRef.current.contains(e.target as Node)) {
        setShowExamples(false);
      }
    };
    if (showExamples) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExamples]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requirement.trim()) {
      const suffix = workspaceSuffix.trim();
      const resourceConfig: ResourceConfig = {
        notebookName: notebookName.trim() || undefined,
        sqlServerName: sqlServerName.trim() || undefined,
        fabricCapacity: fabricCapacity.trim() || undefined,
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
          <label htmlFor="requirement">
            Deployment Requirement *
            <span className="examples-tip-inline" ref={examplesRef} style={{ marginLeft: 8, position: 'relative', display: 'inline-block' }}>
              <button type="button" className="tip-icon" onClick={() => setShowExamples(!showExamples)} title="Example requirements">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Examples</span>
              </button>
              {showExamples && (
                <div className="examples-dropdown">
                  {examples.map((example, index) => (
                    <button key={index} type="button" onClick={() => { setRequirement(example); setShowExamples(false); }} disabled={isLoading}>
                      {example}
                    </button>
                  ))}
                </div>
              )}
            </span>
          </label>
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
          <div className="form-section-columns" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="form-group">
              <label htmlFor="workspaceSuffix">Workspace Name Prefix</label>
              <input type="text" id="workspaceSuffix" value={workspaceSuffix}
                onChange={(e) => setWorkspaceSuffix(e.target.value)}
                placeholder="fabric-workspace" disabled={isLoading} />
              <p className="form-section-hint" style={{ marginTop: 6 }}>Environments will be appended as suffix (e.g. {workspaceSuffix}-dev)</p>
            </div>
            <div className="form-group">
              <label htmlFor="fabricCapacity">Fabric Capacity</label>
              <input type="text" id="fabricCapacity" value={fabricCapacity}
                onChange={(e) => setFabricCapacity(e.target.value)}
                placeholder="fabriccapacitycicd" disabled={isLoading} />
            </div>
            <div className="form-group">
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
          </div>
        </div>

        <button type="submit" disabled={!requirement.trim() || isLoading}>
          {isLoading ? 'Setting up workspace...' : 'Setup Workspace →'}
        </button>
      </form>


    </div>
  );
};

export default RequirementForm;
