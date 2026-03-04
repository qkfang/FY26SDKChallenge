import { Configuration, LogLevel } from '@azure/msal-browser';

const TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID || 'common';
const CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID || '';

export const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      loggerCallback: (_level, message) => {
        console.log(message);
      },
    },
  },
};

export const loginRequest = {
  scopes: ['User.Read'],
};
