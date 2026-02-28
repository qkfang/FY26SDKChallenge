# deploy.ps1 — Provision Azure resources via Bicep, then deploy Fabric workspace items.
#
# Usage:
#   .\deploy.ps1
#
# Requires: Azure CLI (az) logged in, Python 3.10+, and a .env file with FABRIC_* vars.

param(
    [string]$ResourceGroup = "rg-fabricsdk",
    [string]$Location = "eastus",
    # Placeholder GUIDs used in config/parameter.yml; override if your file uses different values.
    [string]$PlaceholderDevId  = "00000000-0000-0000-0000-000000000001",
    [string]$PlaceholderQaId   = "00000000-0000-0000-0000-000000000002",
    [string]$PlaceholderProdId = "00000000-0000-0000-0000-000000000003"
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
Write-Host "Ensuring resource group '$ResourceGroup' exists in '$Location'..."
az group create --name $ResourceGroup --location $Location --output none

# ── Deploy Bicep template ─────────────────────────────────────────────────────
Write-Host "Deploying Bicep template to '$ResourceGroup'..."
$deployOutput = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file "bicep/main.bicep" `
    --parameters "bicep/main.bicepparam" `
    --output json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Error "Bicep deployment failed."
    exit 1
}

# ── Extract resource IDs from deployment outputs ──────────────────────────────
$outputs = $deployOutput.properties.outputs

$devWorkspaceId  = $outputs.devWorkspaceId.value
$qaWorkspaceId   = $outputs.qaWorkspaceId.value
$prodWorkspaceId = $outputs.prodWorkspaceId.value

Write-Host "Bicep outputs:"
Write-Host "  capacityId       = $($outputs.capacityId.value)"
Write-Host "  devWorkspaceId   = $devWorkspaceId"
Write-Host "  qaWorkspaceId    = $qaWorkspaceId"
Write-Host "  prodWorkspaceId  = $prodWorkspaceId"

# ── Update config/parameter.yml with real workspace IDs ──────────────────────
if ($devWorkspaceId -and $qaWorkspaceId -and $prodWorkspaceId) {
    Write-Host "Updating config/parameter.yml with deployed workspace IDs..."
    $paramFile = "config/parameter.yml"
    $content = Get-Content $paramFile -Raw

    # Replace placeholder GUIDs with real workspace IDs
    $content = $content -replace $PlaceholderDevId, $devWorkspaceId
    $content = $content -replace $PlaceholderQaId, $qaWorkspaceId
    $content = $content -replace $PlaceholderProdId, $prodWorkspaceId

    Set-Content $paramFile $content
    Write-Host "parameter.yml updated."
}

# ── Set TARGET_WORKSPACE_ID for the Python deployer ───────────────────────────
$targetEnv = if ($env:TARGET_ENVIRONMENT) { $env:TARGET_ENVIRONMENT } else { "DEV" }
$targetWorkspaceId = switch ($targetEnv.ToUpper()) {
    "QA"   { $qaWorkspaceId }
    "PROD" { $prodWorkspaceId }
    default { $devWorkspaceId }
}

if ($targetWorkspaceId) {
    [System.Environment]::SetEnvironmentVariable("TARGET_WORKSPACE_ID", $targetWorkspaceId)
    Write-Host "TARGET_WORKSPACE_ID set to $targetWorkspaceId (env=$targetEnv)"
}

# ── Run Python workspace deployment ──────────────────────────────────────────
Write-Host "Running fabric-cicd workspace deployment..."
python deploy/deploy_workspace.py