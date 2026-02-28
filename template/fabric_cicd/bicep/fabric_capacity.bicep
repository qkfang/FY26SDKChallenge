// fabric_capacity.bicep
// Provisions a Microsoft Fabric capacity (F-SKU) in Azure.
// Docs: https://learn.microsoft.com/azure/templates/microsoft.fabric/capacities

@description('Name of the Fabric capacity resource.')
param capacityName string

@description('Azure region for the capacity.')
param location string = resourceGroup().location

@description('Fabric SKU (e.g. F2, F4, F8, F16, F32, F64).')
@allowed(['F2', 'F4', 'F8', 'F16', 'F32', 'F64', 'F128', 'F256', 'F512', 'F1024', 'F2048'])
param skuName string = 'F2'

@description('Object IDs of the Fabric capacity administrators (AAD).')
param adminMembers array = []

@description('Resource tags.')
param tags object = {}

resource fabricCapacity 'Microsoft.Fabric/capacities@2023-11-01' = {
  name: capacityName
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: 'Fabric'
  }
  properties: {
    administration: {
      members: adminMembers
    }
  }
}

output capacityId string = fabricCapacity.id
output capacityName string = fabricCapacity.name
output capacityState string = fabricCapacity.properties.state
