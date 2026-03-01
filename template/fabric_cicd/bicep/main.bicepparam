// main.bicepparam
// Default parameter values for main.bicep.
// Override these with a custom .bicepparam file or --parameters flags.

using './main.bicep'

param location = 'australiaeast'
param capacityName = 'fabriccapacitycicd'
param capacitySkuName = 'F2'
param capacityAdminMembers = []


