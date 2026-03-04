param(
    [ValidateSet('dev', 'qa', 'prod')]
    [string]$Environment = 'dev'
)

az group create --name "rg-ghcsdk-$Environment" --location "eastus2"

az deployment group create -g "rg-ghcsdk-$Environment" --template-file main.bicep --parameters "main.$Environment.bicepparam"
