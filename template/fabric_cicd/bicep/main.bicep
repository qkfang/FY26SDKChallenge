// main.bicep
// Orchestrates the full Azure resource provisioning for Fabric CI/CD.
//
// Deployment phases handled here:
//   1. Provision Fabric capacity (if not existing).
//
// Workspace creation is handled locally via Fabric REST API in deploy.ps1.
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

// ── Outputs ──────────────────────────────────────────────────────────────────
output capacityId string = capacity.outputs.capacityId
output capacityName string = capacity.outputs.capacityName
