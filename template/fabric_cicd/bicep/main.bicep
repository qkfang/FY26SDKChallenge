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
param capacityName string = 'fabriccapacity'

@description('Fabric SKU.')
@allowed(['F2', 'F4', 'F8', 'F16', 'F32', 'F64', 'F128', 'F256', 'F512', 'F1024', 'F2048'])
param capacitySkuName string = 'F2'

@description('AAD object IDs of Fabric capacity administrators.')
param capacityAdminMembers array = []

// ── Workspaces ────────────────────────────────────────────────────────────────
@description('Workspace display name for the DEV environment. Leave empty to skip.')
param devWorkspaceName string = ''

@description('Workspace display name for the QA environment. Leave empty to skip.')
param qaWorkspaceName string = ''

@description('Workspace display name for the PROD environment. Leave empty to skip.')
param prodWorkspaceName string = ''

@description('Client ID of the user-assigned managed identity used by deployment scripts.')
param managedIdentityId string

@description('Resource tags applied to all resources.')
param tags object = {
  project: 'fabric-cicd'
  managedBy: 'bicep'
}

// ── Fabric Capacity ──────────────────────────────────────────────────────────
module capacity 'fabric_capacity.bicep' = {
  name: 'deploy-fabric-capacity'
  params: {
    capacityName: capacityName
    location: location
    skuName: capacitySkuName
    adminMembers: capacityAdminMembers
    tags: tags
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
    tags: union(tags, { environment: 'DEV' })
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
    tags: union(tags, { environment: 'QA' })
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
    tags: union(tags, { environment: 'PROD' })
  }
}

// ── Outputs ──────────────────────────────────────────────────────────────────
output capacityId string = capacity.outputs.capacityId
output capacityName string = capacity.outputs.capacityName
output devWorkspaceId string = !empty(devWorkspaceName) ? devWorkspace.outputs.workspaceId : ''
output qaWorkspaceId string = !empty(qaWorkspaceName) ? qaWorkspace.outputs.workspaceId : ''
output prodWorkspaceId string = !empty(prodWorkspaceName) ? prodWorkspace.outputs.workspaceId : ''
