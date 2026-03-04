

az group create --name "rg-ghcsdk" --location "eastus2"

az deployment group create -g "rg-ghcsdk" --template-file main.bicep --parameters main.bicepparam
