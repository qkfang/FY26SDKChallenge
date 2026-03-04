import React, { useEffect, useRef, useState } from 'react';
import { api, DeploymentStatus } from '../services/api';
import './DeploySteps.css';

interface StepState {
  deploymentId: string | null;
  status: DeploymentStatus | null;
  isRunning: boolean;
}

interface DeployStepsProps {
  workspaceDir: string;
  sessionId?: string;
}

const STEPS = [
  {
    id: 'bicep',
    label: 'Bicep',
    icon: '🏗️',
    description: 'Provision Azure resources',
    script: 'deploy-bicep.ps1',
  },
  {
    id: 'cli',
    label: 'CLI',
    icon: '🖥️',
    description: 'Fabric workspaces & resources',
    script: 'deploy-cli.ps1',
  },
  {
    id: 'fabric',
    label: 'Fabric Resource',
    icon: '🧱',
    description: 'Deploy Fabric artifacts',
    script: 'deploy.ps1',
  },
];

const ENVIRONMENTS = ['DEV', 'QA', 'PROD'];

const DeploySteps: React.FC<DeployStepsProps> = ({ workspaceDir, sessionId: _sessionId }) => {
  const [selectedEnv, setSelectedEnv] = useState('DEV');
  const [stepStates, setStepStates] = useState<Record<string, StepState>>(() =>
    Object.fromEntries(STEPS.map(s => [s.id, { deploymentId: null, status: null, isRunning: false }]))
  );
  const pollRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const stopPolling = (stepId: string) => {
    if (pollRefs.current[stepId]) {
      clearInterval(pollRefs.current[stepId]);
      delete pollRefs.current[stepId];
    }
  };

  const startPolling = (stepId: string, deploymentId: string) => {
    stopPolling(stepId);
    pollRefs.current[stepId] = setInterval(async () => {
      try {
        const status = await api.getDeploymentStatus(deploymentId);
        setStepStates(prev => ({
          ...prev,
          [stepId]: { ...prev[stepId], status }
        }));
        if (status.status === 'completed' || status.status === 'failed') {
          stopPolling(stepId);
          setStepStates(prev => ({
            ...prev,
            [stepId]: { ...prev[stepId], isRunning: false }
          }));
        }
      } catch {
        stopPolling(stepId);
        setStepStates(prev => ({
          ...prev,
          [stepId]: { ...prev[stepId], isRunning: false }
        }));
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      STEPS.forEach(s => stopPolling(s.id));
    };
  }, []);

  const handleRun = async (stepId: string) => {
    setStepStates(prev => ({
      ...prev,
      [stepId]: { deploymentId: null, status: null, isRunning: true }
    }));

    const useEnv = (stepId === 'cli' || stepId === 'fabric') ? selectedEnv : undefined;
    try {
      const { deploymentId } = await api.runDeployStep(stepId, workspaceDir, useEnv);
      setStepStates(prev => ({
        ...prev,
        [stepId]: { ...prev[stepId], deploymentId }
      }));
      startPolling(stepId, deploymentId);
    } catch (error: any) {
      setStepStates(prev => ({
        ...prev,
        [stepId]: {
          deploymentId: null,
          isRunning: false,
          status: {
            id: '',
            status: 'failed',
            progress: 0,
            messages: [],
            error: error.response?.data?.error || error.message
          }
        }
      }));
    }
  };

  const envSteps = new Set(['cli', 'fabric']);

  return (
    <div className="deploy-steps">
      <div className="deploy-steps__env-bar">
        <label className="deploy-steps__env-label">Environment</label>
        <select
          className="deploy-steps__env-select"
          value={selectedEnv}
          onChange={e => setSelectedEnv(e.target.value)}
        >
          {ENVIRONMENTS.map(env => (
            <option key={env} value={env}>{env}</option>
          ))}
        </select>
      </div>
      <div className="deploy-steps__grid">
        {STEPS.map(step => {
          const state = stepStates[step.id];
          const s = state.status;
          const isDone = s?.status === 'completed';
          const isFailed = s?.status === 'failed';
          const isRunning = state.isRunning;
          const showEnv = envSteps.has(step.id);

          return (
            <div key={step.id} className={`step-card ${isDone ? 'step-card--done' : ''} ${isFailed ? 'step-card--failed' : ''}`}>
              <div className="step-card__header">
                <span className="step-card__icon">{step.icon}</span>
                <div className="step-card__meta">
                  <span className="step-card__label">{step.label}{showEnv ? ` (${selectedEnv})` : ''}</span>
                  <span className="step-card__desc">{step.description}</span>
                  <code className="step-card__script">{step.script}</code>
                </div>
                {s && (
                  <span className={`step-card__badge step-card__badge--${s.status}`}>
                    {s.status === 'completed' && '✓'}
                    {s.status === 'failed' && '✗'}
                    {(s.status === 'in-progress' || s.status === 'pending') && '⟳'}
                    {' '}{s.status}
                  </span>
                )}
              </div>

              {s && (
                <div className="step-card__progress-bar">
                  <div className="step-card__progress-fill" style={{ width: `${s.progress}%` }} />
                </div>
              )}

              <button
                className={`step-card__btn ${isRunning ? 'step-card__btn--running' : ''}`}
                onClick={() => handleRun(step.id)}
                disabled={isRunning}
              >
                {isRunning ? '⟳ Running...' : isDone ? '↺ Rerun' : isFailed ? '↺ Retry' : '▶ Run'}
              </button>

              {s && s.messages.length > 0 && (
                <StepLog messages={s.messages} />
              )}

              {isFailed && s?.error && (
                <div className="step-card__error">{s.error}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StepLog: React.FC<{ messages: DeploymentStatus['messages'] }> = ({ messages }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  return (
    <div className="step-log" ref={ref}>
      {messages.map((msg, i) => (
        <div key={i} className={`step-log__line step-log__line--${msg.type}`}>
          <span className="step-log__time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          <span className="step-log__text">{msg.message}</span>
        </div>
      ))}
    </div>
  );
};

export default DeploySteps;
