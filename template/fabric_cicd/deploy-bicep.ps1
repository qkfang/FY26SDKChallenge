# deploy-bicep.ps1 — Provision Azure resources via Bicep (capacity + workspaces).
#
# Usage:
#   .\deploy-bicep.ps1
#   .\deploy-bicep.ps1 -ResourceGroup "my-rg" -Location "westus"

param(
    [string]$ResourceGroup = "rg-fabricsdk",
    [string]$Location = "australiaeast",
    [string]$TemplateFile = "bicep/main.bicep",
    [string]$ParameterFile = "bicep/main.bicepparam"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Load .env variables ───────────────────────────────────────────────────────
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

# ── Ensure resource group exists ─────────────────────────────────────────────
$rgExists = az group exists --name $ResourceGroup | ConvertFrom-Json
if (-not $rgExists) {
    Write-Host "Creating resource group '$ResourceGroup' in '$Location'..."
    az group create --name $ResourceGroup --location $Location --output none
} else {
    Write-Host "Resource group '$ResourceGroup' already exists."
}

# ── Deploy Bicep template ─────────────────────────────────────────────────────
Write-Host "Deploying Bicep template '$TemplateFile' to '$ResourceGroup'..."
$rawOutput = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file $TemplateFile `
    --parameters $ParameterFile `
    --output json 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Error "Bicep deployment failed. Re-run with --verbose for details."
    exit 1
}

Write-Host "Raw output:"
Write-Host ($rawOutput | Out-String)

$deployOutput = $rawOutput | Out-String | ConvertFrom-Json

# ── Display deployment outputs ────────────────────────────────────────────────
$outputs = $deployOutput.properties.outputs

Write-Host "Deployment succeeded. Outputs:"
Write-Host "  capacityId       = $($outputs.capacityId.value)"
Write-Host "  capacityName     = $($outputs.capacityName.value)"
