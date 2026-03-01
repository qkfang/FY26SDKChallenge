// workspace.bicep
// Creates Fabric workspace resources for a single environment via the
// Fabric REST API using a deploymentScript resource.
//
// NOTE: Fabric workspaces are not native ARM resources; they are created
// through the Fabric REST API. This module uses a deploymentScript to call
// the API so the provisioning is tracked inside an ARM deployment.
//
// Docs: https://learn.microsoft.com/rest/api/fabric/core/workspaces/create-workspace

@description('Name of the Fabric workspace to create.')
param workspaceName string

@description('Environment label (DEV, QA, or PROD). Appended to script name for uniqueness.')
@allowed(['DEV', 'QA', 'PROD'])
param environment string

@description('Fabric capacity ID to assign this workspace to.')
param capacityId string

@description('Azure region for the deployment script runner.')
param location string = resourceGroup().location

@description('User-assigned managed identity client ID used by the deployment script to authenticate against the Fabric API.')
param managedIdentityId string

@description('Name of the storage account used by the deployment script.')
param storageAccountName string

@secure()
@description('Access key of the storage account used by the deployment script.')
param storageAccountKey string

@description('Resource tags.')
param tags object = {}

resource deployWorkspace 'Microsoft.Resources/deploymentScripts@2023-08-01' = {
  name: 'deploy-fabric-workspace-${toLower(environment)}'
  location: location
  tags: tags
  kind: 'AzureCLI'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    azCliVersion: '2.52.0'
    retentionInterval: 'PT1H'
    timeout: 'PT10M'
    storageAccountSettings: {
      storageAccountName: storageAccountName
      storageAccountKey: storageAccountKey
    }
    environmentVariables: [
      {
        name: 'WORKSPACE_NAME'
        value: workspaceName
      }
      {
        name: 'CAPACITY_ID'
        value: capacityId
      }
    ]
    scriptContent: '''
      set -euo pipefail
      TOKEN=$(az account get-access-token --resource https://api.fabric.microsoft.com --query accessToken -o tsv)
      # Check if workspace already exists
      EXISTING=$(curl -s -H "Authorization: Bearer $TOKEN" \
        "https://api.fabric.microsoft.com/v1/workspaces" \
        | jq -r --arg NAME "$WORKSPACE_NAME" '.value[] | select(.displayName==$NAME) | .id')
      if [ -n "$EXISTING" ]; then
        echo "Workspace '$WORKSPACE_NAME' already exists (id=$EXISTING). Skipping creation."
        echo "{\"workspaceId\":\"$EXISTING\",\"created\":false}" > $AZ_SCRIPTS_OUTPUT_PATH
        exit 0
      fi
      # Create workspace
      RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"displayName\":\"$WORKSPACE_NAME\",\"capacityId\":\"$CAPACITY_ID\"}" \
        "https://api.fabric.microsoft.com/v1/workspaces")
      WS_ID=$(echo "$RESPONSE" | jq -r '.id')
      echo "Created workspace '$WORKSPACE_NAME' (id=$WS_ID)."
      echo "{\"workspaceId\":\"$WS_ID\",\"created\":true}" > $AZ_SCRIPTS_OUTPUT_PATH
    '''
  }
}

output workspaceId string = deployWorkspace.properties.outputs.workspaceId
output created bool = deployWorkspace.properties.outputs.created
