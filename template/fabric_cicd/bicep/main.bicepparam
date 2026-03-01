// main.bicepparam
// Default parameter values for main.bicep.
// Override these with a custom .bicepparam file or --parameters flags.

using './main.bicep'

param location = 'australiaeast'
param capacityName = 'fabriccapacitycicd'
param capacitySkuName = 'F2'
param capacityAdminMembers = []
param sqlServerName = 'fabricsqlcicd'
param sqlAadAdminName = readEnvironmentVariable('SQL_AAD_ADMIN_NAME', '')
param sqlAadAdminObjectId = readEnvironmentVariable('SQL_AAD_ADMIN_OBJECT_ID', '')
param sqlDatabaseName = 'fabricdb'
param sqlDatabaseSkuName = 'Basic'


