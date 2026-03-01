
param(
    [string]$TargetEnvironment = ""
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

# ── Read workspace IDs from config/variable.json ─────────────────────────────
$variableFile = "config/variable.json"
if (-not (Test-Path $variableFile)) {
    Write-Error "Missing $variableFile. Run deploy.ps1 first."
    exit 1
}

$variables = Get-Content $variableFile -Raw | ConvertFrom-Json

$capacityName = $variables.DEV.capacityName
Write-Host "Fabric Capacity: $capacityName"

# ── Resolve capacity GUID from name via Fabric REST API ──────────────────────
$token = (az account get-access-token --resource https://api.fabric.microsoft.com --query accessToken -o tsv)
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

$allCapacities = (Invoke-RestMethod -Uri "https://api.fabric.microsoft.com/v1/capacities" -Headers $headers).value
$capacity = $allCapacities | Where-Object { $_.displayName -eq $capacityName }
if (-not $capacity) {
    Write-Error "Capacity '$capacityName' not found in Fabric."
    exit 1
}
$capacityId = $capacity.id
Write-Host "Fabric Capacity ID (GUID): $capacityId"

function New-FabricWorkspace {
    param([string]$Name, [string]$CapacityId)
    $existing = (Invoke-RestMethod -Uri "https://api.fabric.microsoft.com/v1/workspaces" -Headers $headers).value |
        Where-Object { $_.displayName -eq $Name }
    if ($existing) {
        Write-Host "Workspace '$Name' already exists (id=$($existing.id))."
        return $existing.id
    }
    $body = @{ displayName = $Name; capacityId = $CapacityId } | ConvertTo-Json
    $resp = Invoke-RestMethod -Method Post -Uri "https://api.fabric.microsoft.com/v1/workspaces" -Headers $headers -Body $body
    Write-Host "Created workspace '$Name' (id=$($resp.id)) with capacity '$CapacityId'."
    return $resp.id
}

$devWorkspaceName  = "fabric-workspace-dev"
$qaWorkspaceName   = "fabric-workspace-qa"
$prodWorkspaceName = "fabric-workspace-prod"

$devWorkspaceId  = New-FabricWorkspace -Name $devWorkspaceName  -CapacityId $capacityId
$qaWorkspaceId   = New-FabricWorkspace -Name $qaWorkspaceName   -CapacityId $capacityId
$prodWorkspaceId = New-FabricWorkspace -Name $prodWorkspaceName -CapacityId $capacityId

Write-Host "Workspace IDs:"
Write-Host "  DEV  = $devWorkspaceId"
Write-Host "  QA   = $qaWorkspaceId"
Write-Host "  PROD = $prodWorkspaceId"

# ── Update config/variable.json with workspace IDs ───────────────────────────
$variables.DEV  | Add-Member -NotePropertyName "workspaceId" -NotePropertyValue $devWorkspaceId  -Force
$variables.QA   | Add-Member -NotePropertyName "workspaceId" -NotePropertyValue $qaWorkspaceId   -Force
$variables.PROD | Add-Member -NotePropertyName "workspaceId" -NotePropertyValue $prodWorkspaceId -Force
$variables | ConvertTo-Json -Depth 3 | Set-Content $variableFile
Write-Host "config/variable.json updated with workspace IDs."

# ── Update config/parameter.yml with real workspace IDs ──────────────────────
$PlaceholderDevId  = "00000000-0000-0000-0000-000000000001"
$PlaceholderQaId   = "00000000-0000-0000-0000-000000000002"
$PlaceholderProdId = "00000000-0000-0000-0000-000000000003"

if ($devWorkspaceId -and $qaWorkspaceId -and $prodWorkspaceId) {
    Write-Host "Updating config/parameter.yml with deployed workspace IDs..."
    $paramFile = "config/parameter.yml"
    $content = Get-Content $paramFile -Raw

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

# ── Create Fabric SQL Database in DEV workspace ──────────────────────────────
$sqlDbDisplayName = "fabricdb"

$existingItems = (Invoke-RestMethod -Uri "https://api.fabric.microsoft.com/v1/workspaces/$devWorkspaceId/items" -Headers $headers).value
$existingSql = $existingItems | Where-Object { $_.displayName -eq $sqlDbDisplayName -and $_.type -eq "SQLDatabase" }

if ($existingSql) {
    Write-Host "SQL Database '$sqlDbDisplayName' already exists in DEV workspace (id=$($existingSql.id))."
} else {
    Write-Host "Creating Fabric SQL Database '$sqlDbDisplayName' in DEV workspace..."
    $sqlBody = @{
        displayName = $sqlDbDisplayName
        type = "SQLDatabase"
    } | ConvertTo-Json
    $response = Invoke-WebRequest -Method Post -Uri "https://api.fabric.microsoft.com/v1/workspaces/$devWorkspaceId/items" -Headers $headers -Body $sqlBody
    if ($response.StatusCode -in 200,201) {
        $item = $response.Content | ConvertFrom-Json
        Write-Host "Created Fabric SQL Database '$sqlDbDisplayName' (id=$($item.id))."
    } elseif ($response.StatusCode -eq 202) {
        Write-Host "SQL Database creation accepted (async). Waiting for provisioning..."
        $opUrl = $response.Headers["Location"]
        if ($opUrl) {
            for ($i = 0; $i -lt 30; $i++) {
                Start-Sleep -Seconds 5
                $opResp = Invoke-RestMethod -Uri $opUrl -Headers $headers -ErrorAction SilentlyContinue
                if ($opResp.status -eq "Succeeded") {
                    Write-Host "Fabric SQL Database '$sqlDbDisplayName' provisioned."
                    break
                }
                Write-Host "  Status: $($opResp.status)..."
            }
        }
    }
}