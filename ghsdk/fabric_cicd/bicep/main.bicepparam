// main.bicepparam
// Default parameter values for main.bicep.
// Override these with a custom .bicepparam file or --parameters flags.

using './main.bicep'

param location = 'eastus'
param capacityName = 'fabriccapacity'
param capacitySkuName = 'F2'
param capacityAdminMembers = []

// Set workspace names for each environment; leave empty to skip that env.
param devWorkspaceName = 'fabric-workspace-dev'
param qaWorkspaceName = 'fabric-workspace-qa'
param prodWorkspaceName = 'fabric-workspace-prod'

// Client ID of the user-assigned managed identity used by deployment scripts.
// Replace with your actual managed identity client ID.
param managedIdentityId = ''

param tags = {
  project: 'fabric-cicd'
  managedBy: 'bicep'
}
