param name string
param location string
param apiUrl string
param azureTenantId string
param azureClientId string

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: name
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {}
}

resource staticWebAppSettings 'Microsoft.Web/staticSites/config@2023-12-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    AZURE_TENANT_ID: azureTenantId
    AZURE_CLIENT_ID: azureClientId
    API_URL: apiUrl
  }
}

output id string = staticWebApp.id
output defaultHostname string = staticWebApp.properties.defaultHostname
output name string = staticWebApp.name
