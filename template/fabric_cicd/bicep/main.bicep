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

@description('Client ID of the user-assigned managed identity used by deployment scripts.')
param managedIdentityId string


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
    managedIdentityId: managedIdentityId
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
    managedIdentityId: managedIdentityId
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
    managedIdentityId: managedIdentityId
  }
}

// ── Outputs ──────────────────────────────────────────────────────────────────
output capacityId string = capacity.outputs.capacityId
output capacityName string = capacity.outputs.capacityName
output devWorkspaceId string = !empty(devWorkspaceName) ? devWorkspace.outputs.workspaceId : ''
output qaWorkspaceId string = !empty(qaWorkspaceName) ? qaWorkspace.outputs.workspaceId : ''
output prodWorkspaceId string = !empty(prodWorkspaceName) ? prodWorkspace.outputs.workspaceId : ''
