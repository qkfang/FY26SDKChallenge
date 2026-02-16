# Fabric Automation App - Usage Guide

## Quick Start

### Prerequisites
- Node.js v18 or higher
- npm v9 or higher
- GitHub Copilot CLI (optional, fallback available)

### Installation

```bash
# Clone the repository
git clone https://github.com/qkfang/FY26SDKChallenge.git
cd FY26SDKChallenge

# Install dependencies
npm install
```

### Running the Application

#### Development Mode (Recommended)
```bash
# Start both frontend and backend
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend server on http://localhost:3000

#### Running Separately
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

#### Production Mode
```bash
# Build the application
npm run build

# Start the server
npm start
```

## Using the Application

### Step 1: Access the Interface
Open your browser to http://localhost:3000

### Step 2: Define Your Requirement
You can either:
- **Type your own requirement** in the text area
- **Use an example** by clicking one of the example buttons

Example requirements:
- "Create a new lakehouse for sales data analytics"
- "Set up a data pipeline that ingests CSV files from Azure Blob Storage into a lakehouse"
- "Create a workspace and lakehouse for marketing analytics with sample notebooks"

### Step 3: Optional Configuration
- **Workspace Name**: Specify a custom workspace name
- **Lakehouse Name**: Specify a custom lakehouse name

### Step 4: Start Deployment
Click the **"Start Deployment"** button to begin the process.

### Step 5: Monitor Progress
Watch the real-time progress bar and activity log as the deployment plan is generated.

### Step 6: Review Results
Once complete, review:
- **Resources Created**: List of resources in the deployment plan
- **Summary**: Detailed deployment plan with API calls and instructions

## Deployment Plan Components

Each generated plan includes:

1. **Overview**: Summary of what will be deployed
2. **Prerequisites**: Required setup before deployment
3. **Deployment Steps**: Step-by-step instructions with:
   - Fabric API endpoints
   - Complete request bodies (JSON format)
   - Expected responses
4. **Configuration**: Required settings and configurations
5. **Verification**: Steps to verify successful deployment

## API Endpoints

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Start Deployment
```bash
curl -X POST http://localhost:3001/api/deployment/start \
  -H "Content-Type: application/json" \
  -d '{
    "requirement": "Create a new lakehouse for sales data",
    "workspaceName": "Sales Workspace",
    "lakehouseName": "Sales Lakehouse"
  }'
```

Response:
```json
{
  "deploymentId": "uuid-string"
}
```

### Get Deployment Status
```bash
curl http://localhost:3001/api/deployment/status/{deploymentId}
```

### Configure Fabric API (Optional)
```bash
curl -X POST http://localhost:3001/api/deployment/configure \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "your-fabric-api-token"
  }'
```

## Fabric API Authentication (Optional)

To enable actual deployment execution (not just plan generation):

### Step 1: Create Service Principal
1. Go to Azure Portal
2. Navigate to Azure Active Directory > App Registrations
3. Create a new registration
4. Note the Application (client) ID and Tenant ID

### Step 2: Create Client Secret
1. Go to Certificates & secrets
2. Create a new client secret
3. Save the secret value immediately

### Step 3: Assign Permissions
1. Grant the service principal:
   - Fabric Admin role
   - Or workspace-level permissions

### Step 4: Get Access Token
```bash
curl -X POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id={client-id}" \
  -d "client_secret={client-secret}" \
  -d "scope=https://api.fabric.microsoft.com/.default" \
  -d "grant_type=client_credentials"
```

### Step 5: Configure in Application
Use the access token with the `/api/deployment/configure` endpoint.

## GitHub Copilot CLI Setup (Optional)

For enhanced deployment planning:

### Install GitHub CLI
```bash
# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Windows
winget install GitHub.cli
```

### Install Copilot Extension
```bash
gh extension install github/gh-copilot
```

### Authenticate
```bash
gh auth login
```

### Verify Installation
```bash
gh copilot --version
```

## Troubleshooting

### Backend Disconnected
**Issue**: Frontend shows "Backend Disconnected"

**Solution**:
1. Ensure backend is running: `npm run dev:backend`
2. Check port 3001 is available
3. Refresh the frontend

### Port Already in Use
**Issue**: Error: Port 3000 or 3001 already in use

**Solution**:
```bash
# Find process using the port
lsof -i :3000
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Build Errors
**Issue**: TypeScript compilation errors

**Solution**:
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Copilot CLI Not Available
**Issue**: Copilot CLI not found

**Solution**: The application has a fallback mechanism. It will generate deployment plans even without Copilot CLI installed. For enhanced AI-powered planning, install Copilot CLI following the setup guide above.

## Development Tips

### Project Structure
```
fabric-automation-app/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── services/     # API client
│   │   └── App.tsx       # Main app
│   └── package.json
├── backend/              # Express server
│   ├── src/
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   └── index.ts      # Entry point
│   └── package.json
└── shared/               # Shared types
    └── types/
```

### Adding New Features
1. Update types in `shared/types/index.ts`
2. Add backend logic in `backend/src/services/`
3. Create API routes in `backend/src/routes/`
4. Build UI components in `frontend/src/components/`
5. Update API client in `frontend/src/services/api.ts`

### Testing Changes
```bash
# Watch mode for backend
npm run dev:backend

# Watch mode for frontend
npm run dev:frontend
```

### Building for Production
```bash
# Build both
npm run build

# Or build individually
npm run build:backend
npm run build:frontend
```

## Environment Variables

Create `.env` files if needed:

### Backend `.env`
```
PORT=3001
NODE_ENV=development
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:3001
```

## Performance Considerations

- **Rate Limiting**: API endpoints are rate-limited (10 deployments per 15 minutes)
- **Session Management**: Copilot sessions are automatically cleaned up
- **Polling**: Frontend polls every 1 second for deployment status

## Security Notes

- Never commit access tokens or credentials
- Use environment variables for sensitive data
- Rate limiting is enabled on all API endpoints
- CORS is configured for development

## Support and Contribution

For issues, questions, or contributions:
1. Open an issue on GitHub
2. Fork the repository
3. Create a feature branch
4. Submit a pull request

## License

MIT License - See LICENSE file for details
