
param(
    [string]$Environment = "DEV"
)

# ── Load workspace variables from config\variable.json ───────────────────────
$vars = Get-Content "config\variable.json" -Raw | ConvertFrom-Json
$envVars = $vars.$Environment

if (-not $envVars) {
    Write-Error "Environment '$Environment' not found in config\variable.json"
    exit 1
}

[System.Environment]::SetEnvironmentVariable("TARGET_ENVIRONMENT",  $Environment)
[System.Environment]::SetEnvironmentVariable("TARGET_WORKSPACE_ID", $envVars.workspaceId)
[System.Environment]::SetEnvironmentVariable("${Environment}_TENANT_ID",     $envVars.tenantId)
[System.Environment]::SetEnvironmentVariable("${Environment}_CLIENT_ID",     $envVars.clientId)
[System.Environment]::SetEnvironmentVariable("${Environment}_CLIENT_SECRET", $envVars.clientSecret)

# ── Run fabric-cicd CLI deployment ───────────────────────────────────────────
python ./deploy/deploy_workspace.py