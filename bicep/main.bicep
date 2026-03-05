targetScope = 'resourceGroup'

@description('Base name for all resources')
param baseName string

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('Deployment environment')
@allowed(['dev', 'qa', 'prod'])
param environment string = 'dev'

@description('Azure Entra ID tenant ID')
param azureTenantId string

@description('Azure Entra ID client ID')
param azureClientId string

var suffix = '${baseName}-${environment}'
var logAnalyticsName = '${suffix}-log'
var appInsightsName = '${suffix}-ai'
var keyVaultName = '${suffix}-kv'
var appServiceName = '${suffix}-api'
var appServicePlanName = '${suffix}-plan'
var staticWebAppName = '${suffix}-web'

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

module appInsights 'modules/appInsights.bicep' = {
  name: 'appInsights'
  params: {
    name: appInsightsName
    location: location
    logAnalyticsWorkspaceId: logAnalytics.id
  }
}

module appService 'modules/appService.bicep' = {
  name: 'appService'
  params: {
    name: appServiceName
    location: location
    appServicePlanName: appServicePlanName
    appInsightsConnectionString: appInsights.outputs.connectionString
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
    keyVaultUri: 'https://${keyVaultName}.vault.azure.net/'
  }
}

module staticWebApp 'modules/staticWebApp.bicep' = {
  name: 'staticWebApp'
  dependsOn: [appService]
  params: {
    name: staticWebAppName
    location: location
    apiUrl: 'https://${appService.outputs.defaultHostname}/api'
    azureTenantId: azureTenantId
    azureClientId: azureClientId
  }
}

module keyVault 'modules/keyVault.bicep' = {
  name: 'keyVault'
  dependsOn: [appService]
  params: {
    name: keyVaultName
    location: location
    appServicePrincipalId: appService.outputs.principalId
  }
}

output staticWebAppHostname string = staticWebApp.outputs.defaultHostname
output appServiceHostname string = appService.outputs.defaultHostname
output keyVaultName string = keyVault.outputs.name
output appInsightsName string = appInsightsName
