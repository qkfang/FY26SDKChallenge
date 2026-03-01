
# ── Load .env variables ───────────────────────────────────────────────────────
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

# ── Read variables from config/variable.json ──────────────────────────────────
$variableFile = "config/variable.json"
if (-not (Test-Path $variableFile)) {
    Write-Error "Missing $variableFile. Run deploy-bicep.ps1 first."
    exit 1
}
$variables = Get-Content $variableFile -Raw | ConvertFrom-Json

# ── Run fabric-cicd CLI deployment ───────────────────────────────────────────
.\deploy-cli.ps1