// main.bicep
// Orchestrates the full Azure resource provisioning for Fabric CI/CD.
//
// Deployment phases handled here (Phase 1):
//   1. Provision Fabric capacity (if not existing).
//   2. Create Fabric workspaces for DEV, QA, and PROD environments.
//
// Run with:
//   az deployment group create \
//     --resource-group <rg> \
//     --template-file main.bicep \
//     --parameters @main.bicepparam

@description('Azure region for all resources.')
param location string = resourceGroup().location

// ── Capacity ─────────────────────────────────────────────────────────────────
@description('Name of the Fabric capacity resource.')
param capacityName string = 'fabriccapacitycicd'

@description('Fabric SKU.')
@allowed(['F2', 'F4'])
param capacitySkuName string = 'F2'

@description('AAD object IDs of Fabric capacity administrators.')
param capacityAdminMembers array = []

// ── Workspaces ────────────────────────────────────────────────────────────────
param devWorkspaceName string = ''
param qaWorkspaceName string = ''
param prodWorkspaceName string = ''

// ── Managed Identity ──────────────────────────────────────────────────────────
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-fabric-deploy'
  location: location
}

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, managedIdentity.id, 'Contributor')
  properties: {
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b24988ac-6180-42a0-ab88-20f7382dd24c')
  }
}

// ── Fabric Capacity ──────────────────────────────────────────────────────────
module capacity 'fabric_capacity.bicep' = {
  name: 'deploy-fabric-capacity'
  params: {
    capacityName: capacityName
    location: location
    skuName: capacitySkuName
    adminMembers: capacityAdminMembers
  }
}

// ── DEV Workspace ────────────────────────────────────────────────────────────
module devWorkspace 'workspace.bicep' = if (!empty(devWorkspaceName)) {
  name: 'deploy-workspace-dev'
  params: {
    workspaceName: devWorkspaceName
    environment: 'DEV'
    capacityId: capacity.outputs.capacityId
    location: location
    managedIdentityId: managedIdentity.id
  }
}

// ── QA Workspace ─────────────────────────────────────────────────────────────
module qaWorkspace 'workspace.bicep' = if (!empty(qaWorkspaceName)) {
  name: 'deploy-workspace-qa'
  params: {
    workspaceName: qaWorkspaceName
    environment: 'QA'
    capacityId: capacity.outputs.capacityId
    location: location
    managedIdentityId: managedIdentity.id
  }
}

// ── PROD Workspace ────────────────────────────────────────────────────────────
module prodWorkspace 'workspace.bicep' = if (!empty(prodWorkspaceName)) {
  name: 'deploy-workspace-prod'
  params: {
    workspaceName: prodWorkspaceName
    environment: 'PROD'
    capacityId: capacity.outputs.capacityId
    location: location
    managedIdentityId: managedIdentity.id
  }
}

// ── Outputs ──────────────────────────────────────────────────────────────────
output capacityId string = capacity.outputs.capacityId
output capacityName string = capacity.outputs.capacityName
output devWorkspaceId string = !empty(devWorkspaceName) ? devWorkspace.outputs.workspaceId : ''
output qaWorkspaceId string = !empty(qaWorkspaceName) ? qaWorkspace.outputs.workspaceId : ''
output prodWorkspaceId string = !empty(prodWorkspaceName) ? prodWorkspace.outputs.workspaceId : ''
