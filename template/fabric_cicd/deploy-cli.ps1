
param(
    [string]$Environment = "DEV"
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

$spObjectId    = "a6efe236-83c5-472b-a068-65006e369ad7"
$spDisplayName = "sp-demo-01"
$sqlDbDisplayName = "fabricdb"
$workspaceIds  = @{}

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
    Write-Host "Created workspace '$Name' (id=$($resp.id))."
    return $resp.id
}

function Deploy-FabricEnvironment {
    param([string]$EnvName)

    # ── Create workspace ──────────────────────────────────────────────────────
    $workspaceName = "fabric-workspace-$($EnvName.ToLower())"
    $workspaceId   = New-FabricWorkspace -Name $workspaceName -CapacityId $capacityId
    $script:workspaceIds[$EnvName] = $workspaceId

    # ── Update variable.json ──────────────────────────────────────────────────
    $vars = Get-Content $variableFile -Raw | ConvertFrom-Json
    $vars.$EnvName | Add-Member -NotePropertyName "workspaceId" -NotePropertyValue $workspaceId -Force
    $vars | ConvertTo-Json -Depth 3 | Set-Content $variableFile

    # ── Add service principal as Member ───────────────────────────────────────
    $spBody = @{ principal = @{ id = $spObjectId; type = "ServicePrincipal" }; role = "Member" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Method Post -Uri "https://api.fabric.microsoft.com/v1/workspaces/$workspaceId/roleAssignments" -Headers $headers -Body $spBody | Out-Null
        Write-Host "[$EnvName] SP '$spDisplayName' added to workspace."
    } catch {
        Write-Host "[$EnvName] SP role assignment: $($_.Exception.Message)"
    }

    # ── Create SQL Database (DEV only) ────────────────────────────────────────
    if ($EnvName -eq "DEV") {
        $existingSql = (Invoke-RestMethod -Uri "https://api.fabric.microsoft.com/v1/workspaces/$workspaceId/items" -Headers $headers).value |
            Where-Object { $_.displayName -eq $sqlDbDisplayName -and $_.type -eq "SQLDatabase" }

        if ($existingSql) {
            Write-Host "[$EnvName] SQL Database '$sqlDbDisplayName' already exists (id=$($existingSql.id))."
            $sqlDbId = $existingSql.id
        } else {
            $sqlBody = @{ displayName = $sqlDbDisplayName; type = "SQLDatabase" } | ConvertTo-Json
            $response = Invoke-WebRequest -Method Post -Uri "https://api.fabric.microsoft.com/v1/workspaces/$workspaceId/items" -Headers $headers -Body $sqlBody
            if ($response.StatusCode -in 200, 201) {
                $sqlDbId = ($response.Content | ConvertFrom-Json).id
                Write-Host "[$EnvName] Created SQL Database '$sqlDbDisplayName' (id=$sqlDbId)."
            } elseif ($response.StatusCode -eq 202) {
                Write-Host "[$EnvName] SQL Database creation accepted (async). Waiting..."
                $opUrl = $response.Headers["Location"]
                if ($opUrl) {
                    for ($i = 0; $i -lt 30; $i++) {
                        Start-Sleep -Seconds 5
                        $opResp = Invoke-RestMethod -Uri $opUrl -Headers $headers -ErrorAction SilentlyContinue
                        if ($opResp.status -eq "Succeeded") { Write-Host "[$EnvName] SQL Database provisioned."; break }
                        Write-Host "[$EnvName] Status: $($opResp.status)..."
                    }
                }
                $sqlDbId = ((Invoke-RestMethod -Uri "https://api.fabric.microsoft.com/v1/workspaces/$workspaceId/items" -Headers $headers).value |
                    Where-Object { $_.displayName -eq $sqlDbDisplayName -and $_.type -eq "SQLDatabase" }).id
            }
        }

        # Fetch SQL Database properties (server endpoint + database name) and write to variable.json
        if ($sqlDbId) {
            $sqlProps = $null
            for ($i = 0; $i -lt 12; $i++) {
                try {
                    $sqlProps = (Invoke-RestMethod -Uri "https://api.fabric.microsoft.com/v1/workspaces/$workspaceId/sqlDatabases/$sqlDbId" -Headers $headers).properties
                    if ($sqlProps.serverFqdn) { break }
                } catch {}
                Write-Host "[$EnvName] Waiting for SQL Database properties..."
                Start-Sleep -Seconds 5
            }

            $sqlServerEndpoint = $sqlProps.serverFqdn
            $sqlDatabaseName   = $sqlProps.databaseName

            $vars = Get-Content $variableFile -Raw | ConvertFrom-Json
            foreach ($e in @("DEV", "QA", "PROD")) {
                $vars.$e | Add-Member -NotePropertyName "sqlDatabaseId"     -NotePropertyValue $sqlDbId           -Force
                $vars.$e | Add-Member -NotePropertyName "sqlServerEndpoint" -NotePropertyValue $sqlServerEndpoint -Force
                $vars.$e | Add-Member -NotePropertyName "sqlDatabaseName"   -NotePropertyValue $sqlDatabaseName   -Force
            }
            $vars | ConvertTo-Json -Depth 3 | Set-Content $variableFile
            Write-Host "[$EnvName] variable.json updated: sqlDatabaseId=$sqlDbId  endpoint=$sqlServerEndpoint  db=$sqlDatabaseName"
        }
    }

    # ── Update config/parameter.yml with workspace ID ────────────────────────
    $envPlaceholders = @{
        "DEV"  = "00000000-0000-0000-0000-000000000001"
        "QA"   = "00000000-0000-0000-0000-000000000002"
        "PROD" = "00000000-0000-0000-0000-000000000003"
    }
    $paramFile = "config/parameter.yml"
    $content = Get-Content $paramFile -Raw
    $content = $content -replace $envPlaceholders[$EnvName], $workspaceId
    Set-Content $paramFile $content
    Write-Host "[$EnvName] parameter.yml updated with workspaceId=$workspaceId"

    # ── Set TARGET_WORKSPACE_ID for the Python deployer ──────────────────────
    [System.Environment]::SetEnvironmentVariable("TARGET_WORKSPACE_ID", $workspaceId)
    Write-Host "[$EnvName] TARGET_WORKSPACE_ID set to $workspaceId"
}

# ── Deploy environment ────────────────────────────────────────────────────────
Write-Host "=== Deploying $Environment ==="
Deploy-FabricEnvironment -EnvName $Environment