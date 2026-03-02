
# ── Load .env variables ───────────────────────────────────────────────────────
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}

# ── Run fabric-cicd CLI deployment ───────────────────────────────────────────
python ./deploy/deploy_workspace.py