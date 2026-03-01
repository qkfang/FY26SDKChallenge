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

# ── Auto-detect AAD admin for SQL Server if not set ──────────────────────────
if (-not $env:SQL_AAD_ADMIN_NAME -or -not $env:SQL_AAD_ADMIN_OBJECT_ID) {
    Write-Host "Detecting signed-in user for SQL AAD admin..."
    $adUser = az ad signed-in-user show --output json | ConvertFrom-Json
    $env:SQL_AAD_ADMIN_NAME = $adUser.userPrincipalName
    $env:SQL_AAD_ADMIN_OBJECT_ID = $adUser.id
    Write-Host "  SQL AAD Admin: $($env:SQL_AAD_ADMIN_NAME) ($($env:SQL_AAD_ADMIN_OBJECT_ID))"
}

# ── Deploy Bicep template ─────────────────────────────────────────────────────
Write-Host "Deploying Bicep template '$TemplateFile' to '$ResourceGroup'..."
$rawOutput = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file $TemplateFile `
    --parameters $ParameterFile `
    --verbose `
    --output json 2>&1

$jsonLines = $rawOutput | Where-Object { $_ -notmatch '^\s*(WARNING|INFO|VERBOSE|Bicep CLI)' }

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed. Raw output:"
    $rawOutput | ForEach-Object { Write-Host $_ }
    exit 1
}

Write-Host "Raw output:"
Write-Host ($rawOutput | Out-String)

$deployOutput = $jsonLines | Out-String | ConvertFrom-Json

# ── Display deployment outputs ────────────────────────────────────────────────
$outputs = $deployOutput.properties.outputs

Write-Host "Deployment succeeded. Outputs:"
Write-Host "  capacityId       = $($outputs.capacityId.value)"
Write-Host "  capacityName     = $($outputs.capacityName.value)"
