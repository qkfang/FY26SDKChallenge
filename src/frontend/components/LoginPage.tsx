import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import './LoginPage.css';

interface LoginPageProps {
  onSkip: () => void;
  hasConfig: boolean;
}

function LoginPage({ onSkip, hasConfig }: LoginPageProps) {
  const { instance } = useMsal();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      await instance.loginRedirect(loginRequest);
    } catch (err: any) {
      if (err.errorCode !== 'user_cancelled') {
        setError(err.message || 'Login failed');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>🚀 Fabric Automation</h1>
        <p>Sign in with Azure Entra ID or skip to continue as guest.</p>

        {error && <div className="login-error">{error}</div>}

        {hasConfig ? (
          <>
            <button className="login-btn login-btn--entra" onClick={handleLogin}>
              Sign in with Azure Entra ID
            </button>
            <div className="login-divider">or</div>
          </>
        ) : (
          <p className="login-no-config">
            Azure Entra ID not configured. Set AZURE_CLIENT_ID and AZURE_TENANT_ID to enable.
          </p>
        )}

        <button className="login-btn login-btn--skip" onClick={onSkip}>
          Skip Login
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
