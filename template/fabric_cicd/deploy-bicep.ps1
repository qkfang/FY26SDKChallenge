# deploy-bicep.ps1 — Provision Azure resources via Bicep (capacity + workspaces).
#
# Usage:
#   .\deploy-bicep.ps1
#   .\deploy-bicep.ps1 -ResourceGroup "my-rg" -Location "westus"

param(
    [string]$Environment = "DEV",
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

# ── Auto-detect signed-in user ────────────────────────────────────────────────
$adUser = az ad signed-in-user show --output json | ConvertFrom-Json

# ── Auto-detect AAD admin for SQL Server if not set ──────────────────────────
if (-not $env:SQL_AAD_ADMIN_NAME -or -not $env:SQL_AAD_ADMIN_OBJECT_ID) {
    $env:SQL_AAD_ADMIN_NAME = $adUser.userPrincipalName
    $env:SQL_AAD_ADMIN_OBJECT_ID = $adUser.id
    Write-Host "  SQL AAD Admin: $($env:SQL_AAD_ADMIN_NAME) ($($env:SQL_AAD_ADMIN_OBJECT_ID))"
}

# ── Auto-detect capacity admin ────────────────────────────────────────────────
$capacityAdmin = if ($env:FABRIC_CAPACITY_ADMIN_ID) { $env:FABRIC_CAPACITY_ADMIN_ID } else { $adUser.userPrincipalName }
Write-Host "  Capacity Admin: $capacityAdmin"

# ── Deploy Bicep template ─────────────────────────────────────────────────────
Write-Host "Deploying Bicep template '$TemplateFile' to '$ResourceGroup'..."
$adminArray = "[\""$capacityAdmin\""]"
$rawOutput = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file $TemplateFile `
    --parameters $ParameterFile `
    --parameters capacityAdminMembers="$adminArray" `
    --only-show-errors `
    --output json 2>&1

$jsonLines = $rawOutput | Where-Object { $_ -notmatch '^\s*(WARNING|INFO|VERBOSE|Bicep CLI)' }

if ($LASTEXITCODE -ne 0) {
    Write-Error "Bicep deployment failed."
    exit 1
}

$deployOutput = $jsonLines | Out-String | ConvertFrom-Json
$outputs = $deployOutput.properties.outputs

# ── Write outputs to config/variable.json for the target environment ─────────
$variableFile = "config/variable.json"
$variableConfig = if (Test-Path $variableFile) { Get-Content $variableFile -Raw | ConvertFrom-Json } else { [pscustomobject]@{} }
if (-not $variableConfig.$Environment) {
    $variableConfig | Add-Member -NotePropertyName $Environment -NotePropertyValue ([pscustomobject]@{}) -Force
}
$variableConfig.$Environment | Add-Member -NotePropertyName "capacityId"   -NotePropertyValue $outputs.capacityId.value   -Force
$variableConfig.$Environment | Add-Member -NotePropertyName "capacityName" -NotePropertyValue $outputs.capacityName.value -Force
$variableConfig | ConvertTo-Json -Depth 3 | Set-Content $variableFile
Write-Host "config/variable.json updated for $Environment."
