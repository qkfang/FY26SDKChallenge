param name string
param location string

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: name
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {}
}

output id string = staticWebApp.id
output defaultHostname string = staticWebApp.properties.defaultHostname
output name string = staticWebApp.name
