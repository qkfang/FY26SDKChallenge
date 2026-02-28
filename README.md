# Fabric Automation App

A modern web application that automates Microsoft Fabric resource deployment using GitHub Copilot CLI SDK. Users can describe their deployment requirements in natural language, and the application leverages Copilot's AI capabilities to generate and execute deployment plans.

## 🚀 Features

- **Natural Language Processing**: Describe your Fabric deployment needs in plain English
- **AI-Powered Planning**: Uses GitHub Copilot CLI SDK to generate intelligent deployment plans
- **Real-Time Progress Tracking**: Watch your deployment progress with live status updates
- **Fabric API Integration**: Automated creation and management of:
  - Workspaces
  - Lakehouses
  - Data pipelines
  - Notebooks
- **Modern React UI**: Clean, responsive interface for defining and monitoring deployments

## 📋 Prerequisites

Before running this application, ensure you have:

1. **Node.js** (v18 or higher)
2. **GitHub Copilot CLI** installed and authenticated
   ```bash
   gh copilot --version
   ```
   If not installed, follow: https://docs.github.com/en/copilot/github-copilot-in-the-cli
3. **Microsoft Fabric Access** (optional for actual deployment execution)
   - Azure subscription with Fabric capacity
   - Service principal with appropriate permissions

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/qkfang/FY26SDKChallenge.git
   cd FY26SDKChallenge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

   This will install dependencies for both frontend and backend workspaces.

## 🏃‍♂️ Running the Application

### Development Mode

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend (port 3001)
npm run dev:backend

# Terminal 2 - Frontend (port 3000)
npm run dev:frontend
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Build

```bash
npm run build
npm start
```

## 📖 Usage

### Basic Workflow

1. **Open the Application**: Navigate to http://localhost:3000

2. **Define Your Requirement**: In the form, describe what you want to deploy:
   ```
   Example: "Create a new lakehouse for sales data analytics with a workspace called 'Sales Analytics'"
   ```

3. **Start Deployment**: Click "Start Deployment" to begin the process

4. **Monitor Progress**: Watch real-time updates as Copilot:
   - Analyzes your requirement
   - Generates a deployment plan
   - Provides step-by-step instructions

5. **Review Results**: Once complete, review the deployment plan and resources created

### Example Requirements

- "Create a new lakehouse for sales data analytics"
- "Set up a data pipeline that ingests CSV files from Azure Blob Storage into a lakehouse"
- "Create a workspace and lakehouse for marketing analytics with sample notebooks"

## 🔧 Configuration

### Fabric API Authentication (Optional)

To enable actual deployment execution (not just planning), configure Fabric API credentials:

1. **Service Principal Setup**:
   - Create a service principal in Azure AD
   - Grant necessary Fabric permissions
   - Note the tenant ID, client ID, and client secret

2. **Configure Access Token**:
   You can set the access token via the API:
   ```bash
   curl -X POST http://localhost:3001/api/deployment/configure \
     -H "Content-Type: application/json" \
     -d '{"accessToken": "YOUR_ACCESS_TOKEN"}'
   ```

## 🏗️ Architecture

```
fabric-automation-app/
├── frontend/              # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API client
│   │   └── App.tsx       # Main application
│   └── package.json
├── backend/              # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── services/     # Business logic
│   │   │   ├── copilotService.ts    # Copilot SDK integration
│   │   │   ├── fabricService.ts     # Fabric API client
│   │   │   └── deploymentService.ts # Orchestration
│   │   ├── routes/       # API endpoints
│   │   └── index.ts      # Server entry point
│   └── package.json
└── shared/               # Shared TypeScript types
    └── types/
```

## 🔌 API Endpoints

### POST /api/deployment/start
Start a new deployment

**Request:**
```json
{
  "requirement": "Create a lakehouse for analytics",
  "workspaceName": "Analytics Workspace",
  "lakehouseName": "Data Lakehouse"
}
```

**Response:**
```json
{
  "deploymentId": "uuid"
}
```

### GET /api/deployment/status/:deploymentId
Get deployment status

**Response:**
```json
{
  "id": "uuid",
  "status": "in-progress",
  "progress": 50,
  "messages": [...],
  "result": {...}
}
```

### POST /api/deployment/configure
Configure Fabric API credentials

**Request:**
```json
{
  "accessToken": "your-access-token"
}
```

### GET /api/health
Health check endpoint

## 🧪 Testing

Currently, the application includes manual testing capabilities through the UI. To test:

1. Start the development servers
2. Navigate to the frontend
3. Try the example requirements provided
4. Monitor the console logs for detailed operation information

## 📝 Technical Details

### Technologies Used

- **Frontend**:
  - React 18
  - TypeScript
  - Vite
  - Axios

- **Backend**:
  - Node.js
  - Express
  - TypeScript
  - GitHub Copilot CLI SDK
  - Axios (for Fabric API calls)

### How It Works

1. **User Input**: User describes deployment requirement in natural language
2. **Copilot Processing**: Backend creates a Copilot session and sends the requirement
3. **Plan Generation**: Copilot analyzes the requirement and generates a deployment plan
4. **Execution** (when configured): Backend executes Fabric API calls based on the plan
5. **Real-Time Updates**: Frontend polls backend for status and displays progress

## 🔒 Security Notes

- Never commit access tokens or credentials to version control
- Use environment variables for sensitive configuration
- The Copilot SDK requires local GitHub CLI authentication
- Fabric API calls require proper Azure AD authentication

## 🤝 Contributing

This is a challenge project. For contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT

## 🔗 Resources

- [Microsoft Fabric Documentation](https://learn.microsoft.com/en-us/fabric/)
- [GitHub Copilot CLI SDK](https://github.com/github/copilot-sdk)
- [Fabric REST API Reference](https://learn.microsoft.com/en-us/rest/api/fabric/)
- [Lakehouse Tutorial](https://learn.microsoft.com/en-us/fabric/data-engineering/tutorial-lakehouse-introduction)

## 📧 Support

For issues and questions, please open an issue on GitHub.