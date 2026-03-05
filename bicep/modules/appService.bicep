param name string
param location string
param appServicePlanName string
param appInsightsConnectionString string
param appInsightsInstrumentationKey string
param keyVaultUri string
param nodeVersion string = '20-lts'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: name
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|${nodeVersion}'
      appCommandLine: 'node backend/index.js'
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsightsInstrumentationKey
        }
        {
          name: 'KEY_VAULT_URI'
          value: keyVaultUri
        }
      ]
    }
  }
}

output id string = appService.id
output name string = appService.name
output principalId string = appService.identity.principalId
output defaultHostname string = appService.properties.defaultHostname
