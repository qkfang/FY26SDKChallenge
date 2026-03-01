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

// ── SQL Server ────────────────────────────────────────────────────────────────
@description('Name of the SQL Server resource.')
param sqlServerName string = 'fabricsqlcicd'

@description('Azure AD admin display name for SQL Server.')
param sqlAadAdminName string

@description('Azure AD admin object ID for SQL Server.')
param sqlAadAdminObjectId string

@description('Name of the SQL database.')
param sqlDatabaseName string = 'fabricdb'

@description('SQL Database SKU name.')
param sqlDatabaseSkuName string = 'Basic'

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

// ── SQL Server ───────────────────────────────────────────────────────────────
module sql 'sql_server.bicep' = {
  name: 'deploy-sql-server'
  params: {
    sqlServerName: sqlServerName
    location: location
    aadAdminName: sqlAadAdminName
    aadAdminObjectId: sqlAadAdminObjectId
    databaseName: sqlDatabaseName
    databaseSkuName: sqlDatabaseSkuName
  }
}

// ── Outputs ──────────────────────────────────────────────────────────────────
output capacityId string = capacity.outputs.capacityId
output capacityName string = capacity.outputs.capacityName
output sqlServerFqdn string = sql.outputs.sqlServerFqdn
output sqlDatabaseName string = sql.outputs.databaseName
