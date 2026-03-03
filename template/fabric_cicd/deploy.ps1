
param(
    [string]$Environment = "DEV",
    [switch]$ForceRepublish
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
[System.Environment]::SetEnvironmentVariable("FORCE_REPUBLISH", $ForceRepublish.IsPresent.ToString().ToLower())

# ── Run fabric-cicd CLI deployment ───────────────────────────────────────────
python ./deploy/deploy_workspace.py

# ── Deploy SQL schemas via sqlpackage ────────────────────────────────────────
$sqlEndpoint = $envVars.sqlServerEndpoint
$sqlDatabase = $envVars.sqlDatabaseName

if ($sqlEndpoint -and $sqlDatabase) {
    $sqlprojDir  = ".\workspace\fabricdb.SQLDatabase"
    $sqlprojFile = "$sqlprojDir\fabricdb.sqlproj"
    $dacpacPath  = "$sqlprojDir\bin\fabricdb.dacpac"

    Write-Host "Building SQL project..."
    dotnet build $sqlprojFile --output "$sqlprojDir\bin" --nologo -v quiet
    if ($LASTEXITCODE -ne 0) { Write-Error "SQL project build failed."; exit 1 }

    $connStr = "Server=$sqlEndpoint,1433;Initial Catalog=$sqlDatabase;" +
               "Authentication=Active Directory Service Principal;" +
               "User Id=$($envVars.clientId);Password=$($envVars.clientSecret)"

    # Ensure sqlpackage is available
    $sqlpkg = Get-Command sqlpackage -ErrorAction SilentlyContinue
    if (-not $sqlpkg) {
        Write-Host "sqlpackage not found, installing via dotnet global tool..."
        dotnet tool install -g microsoft.sqlpackage
        $env:PATH += ";$env:USERPROFILE\.dotnet\tools"
        $sqlpkg = Get-Command sqlpackage -ErrorAction SilentlyContinue
        if (-not $sqlpkg) { Write-Error "sqlpackage installation failed."; exit 1 }
    }

    Write-Host "Deploying SQL schemas to $sqlEndpoint / $sqlDatabase..."
    sqlpackage /Action:Publish /SourceFile:$dacpacPath /TargetConnectionString:$connStr
    if ($LASTEXITCODE -ne 0) { Write-Error "SQL schema deployment failed."; exit 1 }

    Write-Host "SQL schema deployment completed."
} else {
    Write-Host "Skipping SQL schema deployment (sqlServerEndpoint or sqlDatabaseName not set)."
}