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

# ── Auto-detect signed-in user ────────────────────────────────────────────────
$adUser = az ad signed-in-user show --output json | ConvertFrom-Json

# ── Auto-detect AAD admin for SQL Server if not set ──────────────────────────
if (-not $env:SQL_AAD_ADMIN_NAME -or -not $env:SQL_AAD_ADMIN_OBJECT_ID) {
    $env:SQL_AAD_ADMIN_NAME = $adUser.userPrincipalName
    $env:SQL_AAD_ADMIN_OBJECT_ID = $adUser.id
    Write-Host "  SQL AAD Admin: $($env:SQL_AAD_ADMIN_NAME) ($($env:SQL_AAD_ADMIN_OBJECT_ID))"
}

# ── Auto-detect capacity admin if not set ────────────────────────────────────
if (-not $env:FABRIC_CAPACITY_ADMIN_ID) {
    $env:FABRIC_CAPACITY_ADMIN_ID = $adUser.userPrincipalName
    Write-Host "  Capacity Admin: $($env:FABRIC_CAPACITY_ADMIN_ID)"
}

# ── Deploy Bicep template ─────────────────────────────────────────────────────
Write-Host "Deploying Bicep template '$TemplateFile' to '$ResourceGroup'..."
$adminArray = "[\""$($env:FABRIC_CAPACITY_ADMIN_ID)\""]"
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

# ── Write outputs to config/variable.json per environment ─────────────────────
$variableConfig = @{}
foreach ($env in @("DEV", "QA", "PROD")) {
    $variableConfig[$env] = @{
        capacityId      = $outputs.capacityId.value
        capacityName    = $outputs.capacityName.value
        sqlServerFqdn   = $outputs.sqlServerFqdn.value
        sqlDatabaseName = $outputs.sqlDatabaseName.value
    }
}

$variableConfig | ConvertTo-Json -Depth 3 | Set-Content "config/variable.json"
Write-Host "config/variable.json updated."
